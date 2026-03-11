const { Client } = require('@notionhq/client');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const NOTION_API_KEY = process.env.NOTION_API_KEY;
    const FEEDBACK_DB_ID = '2fb6f602-c1e1-80ec-bd81-c585e22b691f';

    try {
        const { feedbackText, studentPageId, teacherPageId, lessonPageId } = JSON.parse(event.body);

        if (!feedbackText || !studentPageId || !lessonPageId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing required fields' })
            };
        }

        const notion = new Client({ auth: NOTION_API_KEY });

        await notion.pages.create({
            parent: { database_id: FEEDBACK_DB_ID },
            properties: {
                'Feedback': {
                    title: [{ text: { content: feedbackText } }]
                },
                'Student': {
                    relation: [{ id: studentPageId }]
                },
                'Teacher': {
                    relation: [{ id: teacherPageId }]
                },
                'Lesson': {
                    relation: [{ id: lessonPageId }]
                }
            }
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: 'Feedback saved to Notion' })
        };
    } catch (error) {
        console.error('Save Feedback Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
