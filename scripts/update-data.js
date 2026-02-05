const fs = require('fs');
const path = require('path');
// You need to install the Notion client: npm install @notionhq/client
// And run with: NOTION_API_KEY=your_key node scripts/update-data.js
const { Client } = require('@notionhq/client');

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const STUDENTS_DB_ID = '2f96f602-c1e1-8070-b48b-df74a6ae967e';
const SESSIONS_DB_ID = '2f96f602-c1e1-8006-82fd-ed6c255509bc';
const GROUPS_DB_ID = '2fb6f602c1e180b9a25ee8f0de16e118';

if (!NOTION_API_KEY) {
    console.error('Please provide NOTION_API_KEY as an environment variable.');
    console.log('Usage: NOTION_API_KEY=secret_... node scripts/update-data.js');
    process.exit(1);
}

const notion = new Client({ auth: NOTION_API_KEY });

async function fetchAllPages(databaseId) {
    let pages = [];
    let cursor = undefined;
    while (true) {
        const response = await notion.request({
            path: `databases/${databaseId}/query`,
            method: 'POST',
            body: {
                start_cursor: cursor,
            },
        });
        pages.push(...response.results);
        if (!response.has_more) break;
        cursor = response.next_cursor;
    }
    return pages;
}

async function main() {
    console.log('Fetching Lessons...');
    const lessonPages = await fetchAllPages(SESSIONS_DB_ID);

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
            id: humanId,        // DISPLAY: Friendly ID (e.g., CC001)
            pageId: page.id,    // API: REAL Notion UUID for automated marking
            title: title,
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
    const TEACHERS_DB_ID = '2f96f602-c1e1-800b-b6c9-f84975c0a1cc';
    const teacherPages = await fetchAllPages(TEACHERS_DB_ID);
    const teachersArray = teacherPages.map(page => ({
        id: page.properties['Teacher ID']?.formula?.string || 'T000',
        pageId: page.id,
        name: page.properties.Name.title[0]?.plain_text || 'Unknown'
    }));

    console.log(`Fetched ${teachersArray.length} teachers.`);

    console.log('Fetching Submissions...');
    const SUBMISSIONS_DB_ID = '2fb6f602-c1e1-802b-90f6-e0cd421b14d7';
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
