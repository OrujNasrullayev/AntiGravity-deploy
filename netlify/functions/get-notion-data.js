const { Client } = require('@notionhq/client');



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

exports.handler = async (event, context) => {
    console.log('🚀 Function get-notion-data: Fetching datasets...');

    if (!process.env.NOTION_API_KEY) {
        console.error('❌ NOTION_API_KEY is missing');
        return { statusCode: 500, body: JSON.stringify({ error: 'Missing Notion API Key' }) };
    }

    const notion = new Client({ auth: process.env.NOTION_API_KEY });

    // Inline database fetcher
    const queryDb = async (id, label) => {
        try {
            const cleanId = formatId(id);
            if (!cleanId) {
                console.warn(`⚠️ No ID provided for ${label}`);
                return [];
            }

            console.log(`📡 Querying ${label} (${cleanId})...`);

            // Safety check for notion instance
            if (!notion || !notion.databases || typeof notion.databases.query !== 'function') {
                throw new Error('Notion Client properly initialized check failed');
            }

            const response = await notion.databases.query({ database_id: cleanId });
            console.log(`✅ Fetched ${response.results.length} items for ${label}`);
            return response.results;
        } catch (err) {
            console.error(`❌ Error fetching ${label}:`, err.message);
            throw err; // Re-throw to be caught by the main try-catch
        }
    };

    // Database IDs from environment variables
    const DB_IDS = {
        STUDENTS: process.env.STUDENTS_DATABASE_ID,
        LESSONS: process.env.LESSONS_DATABASE_ID,
        GROUPS: process.env.GROUPS_DATABASE_ID,
        TEACHERS: process.env.TEACHERS_DATABASE_ID,
        SUBMISSIONS: process.env.SUBMISSIONS_DATABASE_ID,
        ASSIGNMENTS: process.env.ASSIGNMENTS_DATABASE_ID,
        FEEDBACKS: process.env.FEEDBACKS_DATABASE_ID || process.env.FEEDBACKS_DATABSE_ID,
        TEACHER_FEEDBACKS: process.env.TEACHER_FEEDBACKS_DATABASE_ID
    };

    try {
        // 1. Fetch all datasets in parallel with better error tracking
        console.log('📦 Starting parallel fetch of all databases...');
        const [
            studentPages,
            lessonPages,
            teacherPages,
            groupPages,
            submissionPages,
            assignmentPages,
            feedbackPages,
            teacherFeedbackPages
        ] = await Promise.all([
            queryDb(DB_IDS.STUDENTS, 'STUDENTS'),
            queryDb(DB_IDS.LESSONS, 'LESSONS'),
            queryDb(DB_IDS.TEACHERS, 'TEACHERS'),
            queryDb(DB_IDS.GROUPS, 'GROUPS'),
            queryDb(DB_IDS.SUBMISSIONS, 'SUBMISSIONS'),
            queryDb(DB_IDS.ASSIGNMENTS, 'ASSIGNMENTS'),
            queryDb(DB_IDS.FEEDBACKS, 'FEEDBACKS'),
            queryDb(DB_IDS.TEACHER_FEEDBACKS, 'TEACHER_FEEDBACKS')
        ]);

        // 2. Process Students
        const studentsMap = {};
        const studentsArray = studentPages.map(page => {
            const name = page.properties.Name.title[0]?.plain_text || 'Unknown';
            const avatar = page.properties['Profile Picture']?.files[0]?.file?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&length=2&bold=true`;

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
                studentId: (page.properties['Student ID']?.formula?.string ||
                    page.properties['Student ID']?.rich_text?.[0]?.plain_text ||
                    'S000').trim(),
                name: name,
                email: page.properties.Email?.email || null,
                password: (page.properties.Password?.rich_text?.[0]?.plain_text || '').trim(),
                attendanceRate: attendanceValue * 100,
                attendedLessons: attendedCount,
                totalLessons: totalCount,
                avatar: avatar,
                feedback: []
            };

            // Key by both dashed and non-dashed ID for safety
            studentsMap[page.id] = studentObj;
            studentsMap[page.id.replace(/-/g, '')] = studentObj;

            return studentObj;
        });

        // 3. Process Teachers
        const teachersMap = {};
        const teachersArray = teacherPages.map(page => {
            const name = page.properties.Name.title[0]?.plain_text || 'Unknown';
            const avatar = page.properties['Profile Picture']?.files[0]?.file?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&length=2&bold=true`;
            const teacherObj = {
                id: (page.properties['Teacher ID']?.formula?.string ||
                    page.properties['Teacher ID']?.rich_text?.[0]?.plain_text ||
                    'T000').trim(),
                pageId: page.id,
                name: name,
                email: page.properties.Email?.email || null,
                password: (page.properties.Password?.rich_text?.[0]?.plain_text || '').trim(),
                avatar: avatar
            };

            // Key by both dashed and non-dashed ID for safety
            teachersMap[page.id] = teacherObj;
            teachersMap[page.id.replace(/-/g, '')] = teacherObj;

            return teacherObj;
        });

        // 4. Process Groups
        const groupIdsMap = {};
        const groupsArray = groupPages.map(page => {
            const name = page.properties.Name.title[0]?.plain_text || 'Untitled Group';
            const notionType = page.properties.Type?.select?.name;
            const type = notionType === 'Group' ? 'group' : 
                         (notionType?.includes('Conversation') || name.includes('Conversation')) ? 'conversation' : 
                         'private';

            let humanId = page.properties['Group ID']?.formula?.string || 
                          page.properties['Group ID']?.rich_text?.[0]?.plain_text;

            if (!humanId && page.properties['ID']?.unique_id) {
                const prefix = page.properties['ID'].unique_id.prefix;
                const number = page.properties['ID'].unique_id.number;
                humanId = prefix ? `${prefix}${number}` : `${type === 'conversation' ? 'C' : (type === 'group' ? 'G' : 'P')}${String(number).padStart(3, '0')}`;
            }

            if (!humanId) {
                humanId = page.id.substring(0, 5);
            }

            groupIdsMap[page.id] = humanId;
            groupIdsMap[page.id.replace(/-/g, '')] = humanId;

            const studentRelation = page.properties.Students?.relation || [];
            const teacherRelation = page.properties.Teacher?.relation || page.properties.Teachers?.relation || [];

            // Robust teacher/student lookup
            const linkedTeacherPageId = teacherRelation[0]?.id;
            const teacherFromMap = teachersMap[linkedTeacherPageId];
            const finalTeacherId = teacherFromMap ? teacherFromMap.id : "T001";

            const linkedStudents = studentRelation
                .map(rel => studentsMap[rel.id])
                .filter(Boolean);

            return {
                id: humanId,
                pageId: page.id,
                name: name,
                type: type,
                color: type === 'conversation' ? "#ea580c" : (type === 'group' ? "#2563eb" : "#db2777"),
                students: linkedStudents,
                teacherId: finalTeacherId
            };
        });

        // 5. Process Lessons
        const lessonsArray = lessonPages.map(page => {
            const title = page.properties.Name.title[0]?.plain_text || 'Untitled';
            const startDate = page.properties.Date?.date?.start;
            const notionLessonType = page.properties.Lesson?.select?.name;
            const type = (notionLessonType?.includes('Group') || title.includes('(Group)')) ? 'group' :
                         (notionLessonType?.includes('Conversation') || title.includes('Conversation')) ? 'conversation' :
                         'private';

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
                color: type === 'conversation' ? "#ea580c" : (type === 'group' ? "#2563eb" : "#db2777"),
                isoDate: startDate,
                duration: page.properties.Duration?.number || page.properties.Minutes?.number || 60,
                students: studentRelation.map(rel => studentsMap[rel.id] || studentsMap[rel.id.replace(/-/g, '')]).filter(Boolean),
                absentStudents: (page.properties['Absent Students']?.relation || []).map(rel => studentsMap[rel.id] || studentsMap[rel.id.replace(/-/g, '')]).filter(Boolean),
                groupId: groupRelation[0] ? groupIdsMap[groupRelation[0].id] || groupIdsMap[groupRelation[0].id.replace(/-/g, '')] : null,
                homeworkIds: homeworkRelation.map(r => r.id)
            };
        }).filter(l => l.isoDate).sort((a, b) => new Date(a.isoDate) - new Date(b.isoDate));

        // 6. Process Feedbacks & Map to Students
        const feedbacksArray = feedbackPages.map(page => {
            const studentId = page.properties.Student?.relation[0]?.id;
            const fb = {
                id: page.id,
                studentId: studentId,
                groupId: page.properties.Group?.relation[0]?.id || null,
                milestone: page.properties.Milestone?.select?.name || null,
                lessonId: page.properties.Lesson?.relation[0]?.id || page.properties.Session?.relation[0]?.id || null,
                text: page.properties.Feedback?.title?.[0]?.plain_text || page.properties.Feedback?.rich_text?.[0]?.plain_text || "",
                teacherName: "Teacher",
                date: page.properties.Date?.date?.start || null
            };
            if (studentId && studentsMap[studentId]) {
                studentsMap[studentId].feedback.push(fb);
            }
            return fb;
        });
        
        const teacherFeedbacksArray = teacherFeedbackPages.map(page => {
            return {
                id: page.id,
                studentId: page.properties.Student?.relation[0]?.id,
                groupId: page.properties.Group?.relation[0]?.id || null,
                milestone: page.properties.Milestone?.select?.name || page.properties.Milestone?.rich_text?.[0]?.plain_text || null,
                rate: page.properties.rate?.select?.name || null,
                date: page.created_time
            };
        });

        // 7. Process Assignments & Submissions
        const assignmentsMap = {};
        const assignmentsArray = assignmentPages.map(page => {
            const lessonIds = (page.properties.Lesson?.relation || page.properties.Sessions?.relation || []).map(r => r.id);

            // Map lesson IDs to Group IDs
            const groupIds = lessonIds.map(lessonPageId => {
                const lesson = lessonPages.find(l => l.id === lessonPageId);
                const groupRelation = lesson?.properties?.Groups?.relation || [];
                return groupRelation[0] ? groupIdsMap[groupRelation[0].id] || groupIdsMap[groupRelation[0].id.replace(/-/g, '')] : null;
            }).filter(Boolean);

            const attachments = (page.properties.Uploads?.files || page.properties.Attachments?.files || []).map(f => ({
                name: f.name,
                url: f.type === 'external' ? f.external?.url : f.file?.url
            }));

            const assignmentObj = {
                id: page.id,
                title: page.properties.Name?.title[0]?.plain_text || 'Untitled Assignment',
                description: page.properties.Assignment?.rich_text?.[0]?.plain_text || page.properties.Description?.rich_text?.[0]?.plain_text || '',
                type: page.properties.Type?.select?.name || 'Reading',
                dueDate: page.properties['Due Date']?.date?.start || null,
                duration: page.properties.Duration?.number || 20,
                attachmentUrl: attachments.length > 0 ? attachments[0].url : null,
                attachments: attachments,
                lessonIds: lessonIds,
                groupIds: [...new Set(groupIds)] // Unique group IDs
            };
            assignmentsMap[page.id] = assignmentObj;
            return assignmentObj;
        });

        const submissionsArray = submissionPages.map(page => {
            const studentId = page.properties.Student?.relation[0]?.id;
            const student = studentId ? studentsMap[studentId] || studentsMap[studentId.replace(/-/g, '')] : null;
            const assignmentId = page.properties.Assignments?.relation[0]?.id;
            const assignment = assignmentId ? assignmentsMap[assignmentId] : null;

            return {
                id: page.id,
                name: page.properties.Name.title[0]?.plain_text || 'Untitled Submission',
                status: page.properties.Status?.status?.name || 'Not checked',
                studentId: studentId,
                studentName: student?.name || 'Unknown Student',
                assignmentId: assignmentId,
                groupIds: assignment?.groupIds || [],
                uploads: (page.properties.Uploads?.files || []).map(f => ({
                    name: f.name,
                    url: f.type === 'external' ? f.external?.url : f.file?.url
                })),
                submissionText: page.properties['Submission Text']?.rich_text?.[0]?.plain_text || '',
                completedDate: page.last_edited_time
            };
        });

        // 7. Custom Calculation for Student Attendance Stats (User Request)
        lessonsArray.forEach(lesson => {
            if (lesson.status === 'Completed' && lesson.students) {
                lesson.students.forEach(studentRef => {
                    const studentInMap = studentsMap[studentRef.id] || studentsMap[studentRef.pageId];
                    if (studentInMap) {
                        if (studentInMap.totalLessons_custom === undefined) {
                            studentInMap.totalLessons_custom = 0;
                            studentInMap.attendedLessons_custom = 0;
                        }

                        studentInMap.totalLessons_custom++;

                        const isAbsent = lesson.absentStudents && lesson.absentStudents.some(abs =>
                            (abs.id && studentInMap.id && String(abs.id).replace(/-/g, '').toLowerCase() === String(studentInMap.id).replace(/-/g, '').toLowerCase()) ||
                            (abs.pageId && studentInMap.pageId && String(abs.pageId).replace(/-/g, '').toLowerCase() === String(studentInMap.pageId).replace(/-/g, '').toLowerCase())
                        );

                        if (!isAbsent) {
                            studentInMap.attendedLessons_custom++;
                        }
                    }
                });
            }
        });

        // Finalize student stats
        studentsArray.forEach(student => {
            if (student.totalLessons_custom !== undefined) {
                student.totalLessons = student.totalLessons_custom;
                student.attendedLessons = student.attendedLessons_custom;
                student.attendanceRate = student.totalLessons > 0 ? (student.attendedLessons / student.totalLessons) * 100 : 0;
            } else {
                student.totalLessons = 0;
                student.attendedLessons = 0;
                student.attendanceRate = 0;
            }
        });

        // 8. Final Payload
        const payload = {
            students: studentsArray,
            groups: groupsArray,
            lessons: lessonsArray,
            teachers: teachersArray,
            submissions: submissionsArray,
            feedbacks: feedbacksArray,
            teacherFeedbacks: teacherFeedbacksArray,
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
