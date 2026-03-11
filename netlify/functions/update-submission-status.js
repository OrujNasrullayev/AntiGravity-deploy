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
            body: JSON.stringify({ error: 'NOTION_API_KEY not configured' }),
            headers: { 'Content-Type': 'application/json' }
        };
    }

    try {
        const { submissionId, status } = JSON.parse(event.body);

        if (!submissionId || !status) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing submissionId or status' }),
                headers: { 'Content-Type': 'application/json' }
            };
        }

        const notion = new Client({ auth: NOTION_API_KEY });

        console.log(`Updating submission ${submissionId} to status "${status}"...`);

        await notion.pages.update({
            page_id: submissionId,
            properties: {
                'Status': {
                    status: { name: status }
                }
            }
        });

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: `Submission status successfully updated to ${status}!`
            }),
            headers: { 'Content-Type': 'application/json' }
        };
    } catch (error) {
        console.error('Update Submission Error:', error);
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
