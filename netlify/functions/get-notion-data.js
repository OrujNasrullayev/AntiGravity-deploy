const Notion = require('@notionhq/client');


/**
 * Ensures IDs are formatted as proper UUIDs with dashes
 */
function formatId(id) {
    if (!id) return id;
    const clean = id.split('?')[0].trim().replace(/-/g, '');
    if (clean.length === 32) {
        return `${clean.slice(0, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}-${clean.slice(16, 20)}-${clean.slice(20)}`;
    }
    return id;
}

/**
 * Fetch all pages from a Notion database with pagination
 */
async function fetchAllPages(notion, databaseId) {
    if (!notion || !notion.databases || !databaseId) {
        console.warn(`⚠️ Skipping fetch for DB ID: ${databaseId} (Notion client or databases API not available)`);
        return [];
    }

    const cleanId = formatId(databaseId);
    if (!cleanId) {
        console.warn(`⚠️ Skipping fetch: invalid or empty formatted databaseId`);
        return [];
    }
    let pages = [];
    let cursor = undefined;

    while (true) {
        const response = await notion.databases.query({
            database_id: cleanId,
            start_cursor: cursor
        });

        pages.push(...response.results);
        if (!response.has_more) break;
        cursor = response.next_cursor;
    }
    return pages;
}

exports.handler = async (event, context) => {
    // This looks at every possible place the Client could be hiding
    const Client = Notion.Client || (Notion.default ? Notion.default.Client : Notion);
    const notion = new Client({ auth: process.env.NOTION_API_KEY });

    // DEBUG LOG: Let's see what 'notion' actually looks like in the logs
    console.log("Notion object keys:", Object.keys(notion));

    // Database IDs from environment variables
    const DB_IDS = {
        STUDENTS: process.env.STUDENTS_DATABASE_ID,
        LESSONS: process.env.LESSONS_DATABASE_ID,
        GROUPS: process.env.GROUPS_DATABASE_ID,
        TEACHERS: process.env.TEACHERS_DATABASE_ID,
        SUBMISSIONS: process.env.SUBMISSIONS_DATABASE_ID,
        ASSIGNMENTS: process.env.ASSIGNMENTS_DATABASE_ID,
        FEEDBACKS: process.env.FEEDBACKS_DATABASE_ID || process.env.FEEDBACKS_DATABASE_ID
    };

    try {
        console.log('📡 Fetching data from Notion...');

        // 1. Fetch all datasets in parallel
        const [
            studentPages,
            lessonPages,
            teacherPages,
            groupPages,
            submissionPages,
            assignmentPages,
            feedbackPages
        ] = await Promise.all([
            fetchAllPages(notion, DB_IDS.STUDENTS),
            fetchAllPages(notion, DB_IDS.LESSONS),
            fetchAllPages(notion, DB_IDS.TEACHERS),
            fetchAllPages(notion, DB_IDS.GROUPS),
            fetchAllPages(notion, DB_IDS.SUBMISSIONS),
            fetchAllPages(notion, DB_IDS.ASSIGNMENTS),
            fetchAllPages(notion, DB_IDS.FEEDBACKS)
        ]);

        // 2. Process Students
        const studentsMap = {};
        const studentsArray = studentPages.map(page => {
            const name = page.properties.Name.title[0]?.plain_text || 'Unknown';
            const avatar = page.properties['Profile Picture']?.files[0]?.file?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;

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

            const studentObj = {
                id: page.id,
                pageId: page.id,
                studentId: page.properties['Student ID']?.formula?.string || 'S000',
                name: name,
                email: page.properties.Email?.email || null,
                password: page.properties.Password?.rich_text?.[0]?.plain_text || null,
                attendanceRate: attendanceValue * 100,
                attendedLessons: attendedCount,
                totalLessons: totalCount,
                avatar: avatar,
                feedback: []
            };
            studentsMap[page.id] = studentObj;
            return studentObj;
        });

        // 3. Process Teachers
        const teachersMap = {};
        const teachersArray = teacherPages.map(page => {
            const name = page.properties.Name.title[0]?.plain_text || 'Unknown';
            const avatar = page.properties['Profile Picture']?.files[0]?.file?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
            const teacherObj = {
                id: page.properties['Teacher ID']?.formula?.string || 'T000',
                pageId: page.id,
                name: name,
                email: page.properties.Email?.email || null,
                password: page.properties.Password?.rich_text?.[0]?.plain_text || null,
                avatar: avatar
            };
            teachersMap[page.id] = teacherObj;
            return teacherObj;
        });

        // 4. Process Groups
        const groupIdsMap = {};
        const groupsArray = groupPages.map(page => {
            const name = page.properties.Name.title[0]?.plain_text || 'Untitled Group';
            const type = name.includes('Conversation') ? 'conversation' : 'private';

            let humanId = page.id.substring(0, 5);
            if (page.properties['ID']?.unique_id) {
                const prefix = page.properties['ID'].unique_id.prefix;
                const number = page.properties['ID'].unique_id.number;
                humanId = prefix ? `${prefix}${number}` : `${type === 'conversation' ? 'C' : 'P'}${String(number).padStart(3, '0')}`;
            } else if (page.properties['Group ID']?.formula?.string) {
                humanId = page.properties['Group ID'].formula.string;
            }

            groupIdsMap[page.id] = humanId;
            const studentRelation = page.properties.Students?.relation || [];
            const teacherRelation = page.properties.Teacher?.relation || page.properties.Teachers?.relation || [];

            return {
                id: humanId,
                pageId: page.id,
                name: name,
                type: type,
                color: type === 'conversation' ? "#ea580c" : "#db2777",
                students: studentRelation.map(rel => studentsMap[rel.id]).filter(Boolean),
                teacherId: teachersMap[teacherRelation[0]?.id]?.id || "T001"
            };
        });

        // 5. Process Lessons
        const lessonsArray = lessonPages.map(page => {
            const title = page.properties.Name.title[0]?.plain_text || 'Untitled';
            const startDate = page.properties.Date?.date?.start;
            const type = title.includes('Conversation') ? 'conversation' : 'private';

            const studentRelation = page.properties.Students?.relation || [];
            const teacherRelation = page.properties.Teacher?.relation || page.properties.Teachers?.relation || [];
            const homeworkRelation = page.properties.Homework?.relation || [];
            const groupRelation = page.properties.Groups?.relation || [];

            return {
                title: title,
                pageId: page.id,
                id: page.properties['Lesson ID']?.formula?.string || page.id.substring(0, 8),
                type: type,
                status: page.properties.Status?.status?.name || 'Scheduled',
                teacher: teachersMap[teacherRelation[0]?.id]?.name || "Oruj Nasrullayev",
                teacherId: teachersMap[teacherRelation[0]?.id]?.id || "T001",
                color: type === 'conversation' ? "#ea580c" : "#db2777",
                isoDate: startDate,
                duration: type === 'conversation' ? 60 : 90,
                students: studentRelation.map(rel => studentsMap[rel.id]).filter(Boolean),
                groupId: groupRelation[0] ? groupIdsMap[groupRelation[0].id] : null,
                homeworkIds: homeworkRelation.map(r => r.id)
            };
        }).filter(l => l.isoDate).sort((a, b) => new Date(a.isoDate) - new Date(b.isoDate));

        // 6. Process Feedbacks & Map to Students
        const feedbacksArray = feedbackPages.map(page => {
            const studentId = page.properties.Student?.relation[0]?.id;
            const fb = {
                id: page.id,
                studentId: studentId,
                lessonId: page.properties.Session?.relation[0]?.id || null,
                text: page.properties.Feedback?.rich_text?.[0]?.plain_text || "",
                teacherName: "Teacher",
                date: page.properties.Date?.date?.start || null
            };
            if (studentId && studentsMap[studentId]) {
                studentsMap[studentId].feedback.push(fb);
            }
            return fb;
        });

        // 7. Process Assignments & Submissions
        const assignmentsArray = assignmentPages.map(page => ({
            id: page.id,
            title: page.properties.Name?.title[0]?.plain_text || 'Untitled Assignment',
            description: page.properties.Description?.rich_text?.[0]?.plain_text || '',
            type: page.properties.Type?.select?.name || 'Reading',
            dueDate: page.properties['Due Date']?.date?.start || null,
            duration: page.properties.Duration?.number || 20,
            attachmentUrl: page.properties.Attachments?.files[0]?.file?.url || null,
            lessonIds: page.properties.Sessions?.relation?.map(r => r.id) || []
        }));

        const submissionsArray = submissionPages.map(page => {
            const studentId = page.properties.Student?.relation[0]?.id;
            return {
                id: page.id,
                name: page.properties.Name.title[0]?.plain_text || 'Untitled Submission',
                status: page.properties.Status?.status?.name || 'Not checked',
                studentId: studentId,
                studentName: studentsMap[studentId]?.name || 'Unknown Student',
                assignmentId: page.properties.Assignments?.relation[0]?.id,
                uploads: page.properties.Uploads?.files || []
            };
        });

        // 8. Final Payload
        const payload = {
            students: studentsArray,
            groups: groupsArray,
            lessons: lessonsArray,
            teachers: teachersArray,
            submissions: submissionsArray,
            feedbacks: feedbacksArray,
            assignments: assignmentsArray,
            updatedAt: new Date().toISOString()
        };

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "public, max-age=60" // Cache for 1 minute
            },
            body: JSON.stringify(payload)
        };

    } catch (error) {
        console.error('❌ Error fetching data:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
