const { Client } = require('@notionhq/client');

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
            headers: { 'Content-Type': 'application/json' }
        };
    }

    const NOTION_API_KEY = process.env.NOTION_API_KEY;
    if (!NOTION_API_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'NOTION_API_KEY not configured in Netlify' }),
            headers: { 'Content-Type': 'application/json' }
        };
    }

    try {
        const body = JSON.parse(event.body);
        const { lessonPageId, absentPageIds } = body;

        if (!lessonPageId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing lessonPageId' }),
                headers: { 'Content-Type': 'application/json' }
            };
        }

        const notion = new Client({ auth: NOTION_API_KEY });

        // Handle both array and comma-separated string for flexibility
        const absentIds = Array.isArray(absentPageIds)
            ? absentPageIds
            : (absentPageIds ? absentPageIds.split(',').filter(id => id) : []);

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

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: 'Attendance successfully synchronized with Notion!'
            }),
            headers: { 'Content-Type': 'application/json' }
        };
    } catch (error) {
        console.error('Netlify Function Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                error: error.message
            }),
            headers: { 'Content-Type': 'application/json' }
        };
    }
};
