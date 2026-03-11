const { Client } = require('@notionhq/client');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const NOTION_API_KEY = process.env.NOTION_API_KEY;
    const ASSIGNMENTS_DB_ID = process.env.ASSIGNMENTS_DATABASE_ID || '2f96f602c1e18036b0f8cc5601dd7221';

    try {
        const { title, lessonId, instructions } = JSON.parse(event.body);

        if (!title || !lessonId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing title or lessonId' })
            };
        }

        const notion = new Client({ auth: NOTION_API_KEY });

        await notion.pages.create({
            parent: { database_id: ASSIGNMENTS_DB_ID },
            properties: {
                'Name': {
                    title: [{ text: { content: title } }]
                },
                'Assignment': {
                    rich_text: [{ text: { content: instructions || '' } }]
                },
                'Lesson': {
                    relation: [{ id: lessonId }]
                }
            }
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: 'Assignment created successfully in Notion!' })
        };
    } catch (error) {
        console.error('Create Assignment Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
