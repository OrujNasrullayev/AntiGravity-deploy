const dotenv = require('dotenv');
const result = dotenv.config();
if (result.error) { throw result.error; }
console.log('Loaded Keys:', Object.keys(result.parsed));
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const fs = require('fs');
const path = require('path');
// You need to install the Notion client: npm install @notionhq/client
// And run with: NOTION_API_KEY=your_key node scripts/update-data.js
const { Client } = require('@notionhq/client');

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const STUDENTS_DB_ID = process.env.STUDENTS_DATABASE_ID;
const LESSONS_DB_ID = process.env.LESSONS_DATABASE_ID;
const GROUPS_DB_ID = process.env.GROUPS_DATABASE_ID;
const TEACHERS_DB_ID = process.env.TEACHERS_DATABASE_ID;
const SUBMISSIONS_DB_ID = process.env.SUBMISSIONS_DATABASE_ID;
const ASSIGNMENTS_DB_ID = process.env.ASSIGNMENTS_DATABASE_ID;
const FEEDBACK_DB_ID = process.env.FEEDBACKS_DATABSE_ID; // Note: typo 'DATABSE' from .env

if (!NOTION_API_KEY) {
    console.error('Please provide NOTION_API_KEY as an environment variable.');
    console.log('Usage: NOTION_API_KEY=secret_... node scripts/update-data.js');
    process.exit(1);
}

const notion = new Client({ auth: NOTION_API_KEY });

// Helper to ensure IDs are formatted as proper UUIDs with dashes
function formatId(id) {
    if (!id) return id;
    const clean = id.split('?')[0].trim().replace(/-/g, '');
    if (clean.length === 32) {
        return `${clean.slice(0, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}-${clean.slice(16, 20)}-${clean.slice(20)}`;
    }
    return id; // Return original if not 32 chars (might already be formatted or invalid)
}

async function fetchAllPages(databaseId) {
    if (!databaseId) {
        console.error('❌ Error: databaseId is undefined!');
        return [];
    }

    // Ensure ID has dashes for proper UUID format
    const cleanId = formatId(databaseId);
    console.log(`📡 Fetching from Database ID: ${cleanId}`);

    let pages = [];
    let cursor = undefined;
    while (true) {
        try {
            const url = `https://api.notion.com/v1/databases/${cleanId}/query`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${NOTION_API_KEY}`,
                    'Notion-Version': '2022-06-28',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    start_cursor: cursor
                })
            });

            const data = await response.json();

            if (!response.ok) {
                // Specific handling for "Multiple Data Sources" error (Common with Linked Views)
                if (data.message && data.message.includes('multiple data sources')) {
                    console.error(`❌ Error Description: This Database ID points to a Linked View or Collection View, which the API cannot read directly.`);
                    console.error(`👉 SOLUTION: Please verify your .env file. You must use the ID of the ORIGINAL source database, not a view.`);
                } else {
                    console.error(`❌ API Error for ${cleanId}:`, data.message || response.statusText);
                }
                break;
            }

            pages.push(...data.results);
            if (!data.has_more) break;
            cursor = data.next_cursor;
        } catch (error) {
            console.error(`❌ Network Error for database ${cleanId}:`, error.message);
            break;
        }
    }
    return pages;
}

async function main() {
    try {
        console.log('🔍 Testing Notion connection...');
        const me = await notion.users.me();
        console.log(`✅ Connected as: ${me.name || 'Integration'}`);
    } catch (e) {
        console.error('❌ Authentication failed! Check your NOTION_API_KEY in .env');
        console.error('Error:', e.message);
        return;
    }

    console.log('Fetching Lessons...');
    const lessonPages = await fetchAllPages(LESSONS_DB_ID);

    if (lessonPages.length > 0) {
        console.log('✅ Found lessons. Inspecting properties of the first lesson:');
        const props = lessonPages[0].properties;
        console.log('Keys:', Object.keys(props));
        // Optional: print specific ones to verify structure
        // console.log(JSON.stringify(props, null, 2));
    } else {
        console.log('⚠️ No lessons found! This might mean the database is empty or the ID is for a view, not the DB.');
        try {
            // Debug the database schema itself
            const cleanId = formatId(LESSONS_DB_ID).trim().replace(/-/g, '');
            const dbRef = await notion.databases.retrieve({ database_id: cleanId });
            console.log(`🔍 Database Schema for "${dbRef.title[0]?.plain_text}":`);
            console.log('Property Names:', Object.keys(dbRef.properties));
        } catch (e) { /* ignore */ }
    }

    console.log('Fetching Students...');
    const studentPages = await fetchAllPages(STUDENTS_DB_ID);

    const studentsMap = {};
    const studentsArray = studentPages.map(page => {
        const name = page.properties.Name.title[0]?.plain_text || 'Unknown';
        const rawId = page.id;
        const avatar = page.properties['Profile Picture']?.files[0]?.file?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;

        // Robust extraction from Notion properties
        // Priority: 'Attendance rate' (standard) or 'Rate of Attendance' (user mentioned)
        const attendanceValue = (page.properties['Attendance rate']?.formula?.number ??
            page.properties['Rate of Attendance']?.formula?.number) || 0;
        const attendedClassesStr = page.properties['Attended Classes']?.formula?.string || "";

        let attendedCount = 0;
        let totalCount = 0;

        if (attendedClassesStr && attendedClassesStr.includes('/')) {
            const parts = attendedClassesStr.split('/');
            attendedCount = parseInt(parts[0]) || 0;
            totalCount = parseInt(parts[1]) || 0;
        }

        console.log(`- Student: ${name} | Attendance: ${Math.round(attendanceValue * 100)}% | Classes: ${attendedCount}/${totalCount}`);

        const studentObj = {
            id: page.id,         // INTERNAL: Strict Notion UUID for operations
            pageId: page.id,     // API: Used for Relation and Page updates
            studentId: page.properties['Student ID']?.formula?.string || 'S000', // DISPLAY: Friendly ID
            name: name,
            email: page.properties.Email?.email || null,
            attendanceRate: attendanceValue * 100,
            attendedLessons: attendedCount,
            totalLessons: totalCount,
            avatar: avatar
        };
        // Explicitly map by UUID for relation lookup
        studentsMap[page.id] = studentObj;
        return studentObj;
    });

    console.log(`✅ Success: Fetched ${studentsArray.length} students with verified Notion UUIDs.`);

    const lessonsArray = lessonPages.map(page => {
        const title = page.properties.Name.title[0]?.plain_text || 'Untitled';
        const dateObj = page.properties.Date?.date;
        const startDate = dateObj?.start;
        const endDate = dateObj?.end;

        const type = title.includes('Conversation') ? 'conversation' : 'private';
        const humanId = page.properties['Lesson ID']?.formula?.string || page.id.substring(0, 8);
        const status = page.properties.Status?.status?.name || 'Scheduled';

        let duration = type === 'conversation' ? 60 : 90;
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            duration = Math.round((end - start) / (1000 * 60));
        }

        const studentRelation = page.properties.Students?.relation || [];
        const enrolledStudents = studentRelation
            .map(rel => studentsMap[rel.id])
            .filter(s => s !== undefined);

        return {
            title: title,
            pageId: page.id,    // STRICT: This matches the 'data-page-id' in your HTML
            id: humanId,        // DISPLAY: Friendly ID (e.g., CC001)
            type: type,
            status: status,
            studentCount: enrolledStudents.length,
            teacher: "Oruj Nasrullayev",
            color: type === 'conversation' ? "#ea580c" : "#db2777",
            isoDate: startDate,
            duration: duration,
            students: enrolledStudents,
            rawGroupId: page.properties.Groups?.relation[0]?.id,
        };
    })
        .filter(lesson => lesson.isoDate)
        .sort((a, b) => new Date(a.isoDate) - new Date(b.isoDate));

    console.log(`Fetched ${lessonsArray.length} lessons.`);

    console.log('Fetching Groups...');
    const groupPages = await fetchAllPages(GROUPS_DB_ID);
    const groupIdsMap = {};

    const groupsArray = groupPages.map(page => {
        const name = page.properties.Name.title[0]?.plain_text || 'Untitled Group';
        const type = name.includes('Conversation') ? 'conversation' : 'private';
        const levelMatch = name.match(/(Beginner|Intermediate|Advanced)/i);
        const level = levelMatch ? levelMatch[0] : 'General';
        const humanId = page.properties['ID']?.unique_id?.prefix
            ? `${page.properties['ID'].unique_id.prefix}${page.properties['ID'].unique_id.number}`
            : page.id.substring(0, 5);

        groupIdsMap[page.id] = humanId;

        const studentRelation = page.properties.Students?.relation || [];
        const groupStudents = studentRelation
            .map(rel => studentsMap[rel.id])
            .filter(s => s !== undefined);

        return {
            id: humanId,
            pageId: page.id,
            name: name,
            type: type,
            level: level,
            color: type === 'conversation' ? "#ea580c" : "#db2777",
            studentCount: groupStudents.length,
            students: groupStudents
        };
    });

    lessonsArray.forEach(lesson => {
        if (lesson.rawGroupId) {
            lesson.groupId = groupIdsMap[lesson.rawGroupId] || lesson.rawGroupId;
            delete lesson.rawGroupId;
        }
    });

    console.log(`Fetched ${groupsArray.length} groups.`);

    console.log('Fetching Teachers...');
    const teacherPages = await fetchAllPages(TEACHERS_DB_ID);
    const teachersArray = teacherPages.map(page => ({
        id: page.properties['Teacher ID']?.formula?.string || 'T000',
        pageId: page.id,
        name: page.properties.Name.title[0]?.plain_text || 'Unknown'
    }));

    console.log(`Fetched ${teachersArray.length} teachers.`);

    console.log('Fetching Submissions...');
    const submissionPages = await fetchAllPages(SUBMISSIONS_DB_ID);
    const submissionsArray = submissionPages.map(page => {
        const studentId = page.properties.Student?.relation[0]?.id;
        const assignmentId = page.properties.Assignments?.relation[0]?.id;
        return {
            id: page.id,
            name: page.properties.Name.title[0]?.plain_text || 'Untitled Submission',
            status: page.properties.Status?.status?.name || 'Not checked',
            studentId: studentId,
            studentName: studentsMap[studentId]?.name || 'Unknown Student',
            assignmentId: assignmentId,
            uploads: page.properties.Uploads?.files || []
        };
    });
    console.log(`Fetched ${submissionsArray.length} submissions.`);

    // Generate output file content
    const fileContent = `/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * Generated by scripts/update-data.js
 * Last Updated: ${new Date().toISOString()}
 */

const NOTION_STUDENTS = ${JSON.stringify(studentsArray, null, 4)};

const NOTION_GROUPS = ${JSON.stringify(groupsArray, null, 4)};

const NOTION_LESSONS = ${JSON.stringify(lessonsArray, null, 4)};

const NOTION_TEACHERS = ${JSON.stringify(teachersArray, null, 4)};

const NOTION_SUBMISSIONS = ${JSON.stringify(submissionsArray, null, 4)};
`;

    const outputPath = path.join(__dirname, '../assets/js/lessons.js');
    fs.writeFileSync(outputPath, fileContent);
    console.log(`Successfully updated ${outputPath}`);
}

main().catch(console.error);
