const { Client } = require('@notionhq/client');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const NOTION_API_KEY = process.env.NOTION_API_KEY;
    const SUBMISSIONS_DB_ID = '2fb6f602c1e1802b90f6e0cd421b14d7';

    try {
        const { assignmentId, studentPageId, submissionText, submissionId, studentName, assignmentTitle } = JSON.parse(event.body);

        if (!assignmentId || !studentPageId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing required fields' })
            };
        }

        const notion = new Client({ auth: NOTION_API_KEY });

        if (submissionId) {
            // Update existing submission
            await notion.pages.update({
                page_id: submissionId,
                properties: {
                    'Submission Text': {
                        rich_text: [{ text: { content: submissionText } }]
                    },
                    'Status': {
                        status: { name: 'Submitted' }
                    }
                }
            });
        } else {
            // Create new submission
            await notion.pages.create({
                parent: { database_id: SUBMISSIONS_DB_ID },
                properties: {
                    'Name': {
                        title: [{ text: { content: `${studentName || 'Student'} - ${assignmentTitle || 'Homework'}` } }]
                    },
                    'Assignments': {
                        relation: [{ id: assignmentId }]
                    },
                    'Student': {
                        relation: [{ id: studentPageId }]
                    },
                    'Submission Text': {
                        rich_text: [{ text: { content: submissionText } }]
                    },
                    'Status': {
                        status: { name: 'Submitted' }
                    }
                }
            });
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: 'Homework submitted successfully' })
        };
    } catch (error) {
        console.error('Submit Homework Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
