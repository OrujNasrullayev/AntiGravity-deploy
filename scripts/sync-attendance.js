const { Client } = require('@notionhq/client');

const NOTION_API_KEY = process.env.NOTION_API_KEY;

async function updateAttendance(lessonPageId, absentPageIds) {
    if (!NOTION_API_KEY) {
        console.error('Error: NOTION_API_KEY not found.');
        process.exit(1);
    }

    const notion = new Client({ auth: NOTION_API_KEY });
    const absentIds = absentPageIds ? absentPageIds.split(',').filter(id => id) : [];

    try {
        console.log(`Updating attendance for lesson ${lessonPageId}...`);
        console.log(`Marking ${absentIds.length} students as absent.`);

        await notion.pages.update({
            page_id: lessonPageId,
            properties: {
                'Absent students': {
                    relation: absentIds.map(id => ({ id }))
                },
                'Status': {
                    select: { name: 'Completed' }
                }
            }
        });

        console.log('✅ Successfully updated attendance in Notion!');
    } catch (error) {
        console.error('❌ Error updating attendance:', error.message);
    }
}

const args = process.argv.slice(2);
if (args.length >= 1) {
    const [lessonPageId, absentPageIds] = args;
    updateAttendance(lessonPageId, absentPageIds || '');
} else {
    console.log('Usage: node scripts/sync-attendance.js "lesson_page_id" "absent_student_page_id1,absent_student_page_id2,..."');
}
