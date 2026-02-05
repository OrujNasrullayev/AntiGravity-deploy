const { Client } = require('@notionhq/client');

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const FEEDBACK_DB_ID = '2fb6f602-c1e1-80ec-bd81-c585e22b691f';

async function createFeedback(data) {
    if (!NOTION_API_KEY) {
        console.error('Error: NOTION_API_KEY not found.');
        process.exit(1);
    }

    const notion = new Client({ auth: NOTION_API_KEY });

    try {
        console.log(`Sending feedback for student ID ${data.studentPageId} on lesson ${data.lessonPageId}...`);

        await notion.pages.create({
            parent: { database_id: FEEDBACK_DB_ID },
            properties: {
                'Feedback': {
                    title: [{ text: { content: data.feedbackText } }]
                },
                'Student': {
                    relation: [{ id: data.studentPageId }]
                },
                'Teacher': {
                    relation: [{ id: data.teacherPageId }]
                },
                'Lesson': {
                    relation: [{ id: data.lessonPageId }]
                }
            }
        });

        console.log('✅ Successfully posted feedback to Notion!');
    } catch (error) {
        console.error('❌ Error posting feedback:', error.message);
    }
}

const args = process.argv.slice(2);
if (args.length >= 4) {
    const [feedbackText, studentPageId, teacherPageId, lessonPageId] = args;
    createFeedback({ feedbackText, studentPageId, teacherPageId, lessonPageId });
} else {
    console.log('Usage: node scripts/sync-feedback.js "Feedback Text" "student_page_id" "teacher_page_id" "lesson_page_id"');
}
