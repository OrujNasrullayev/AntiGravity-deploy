const { Client } = require('@notionhq/client');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const NOTION_API_KEY = process.env.NOTION_API_KEY;
    const FEEDBACK_DB_ID = process.env.TEACHER_FEEDBACKS_DATABASE_ID || '31e6f602-c1e1-8082-9d4a-cbf875eaf5f0';

    try {
        const { studentId, groupId, teacherId, rate, likes, dislikes, feedbackText, milestone } = JSON.parse(event.body);

        if (!studentId || !teacherId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing required fields' })
            };
        }

        const notion = new Client({ auth: NOTION_API_KEY });

        const properties = {
            'Feedback': {
                title: [{ text: { content: feedbackText } }]
            },
            'Student': {
                relation: [{ id: studentId }]
            },
            'Teacher': {
                relation: [{ id: teacherId }]
            },
            'rate': {
                select: { name: String(rate) }
            }
        };

        if (groupId) {
            properties['Group'] = {
                relation: [{ id: groupId }]
            };
        }

        if (likes && likes.length > 0) {
            properties['Likes'] = {
                multi_select: likes.map(l => ({ name: l }))
            };
        }

        if (dislikes && dislikes.length > 0) {
            properties['Dislikes'] = {
                multi_select: dislikes.map(d => ({ name: d }))
            };
        }

        if (milestone) {
            properties['Milestone'] = {
                select: { name: milestone }
            };
        }

        await notion.pages.create({
            parent: { database_id: FEEDBACK_DB_ID },
            properties: properties
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: 'Feedback saved to Notion' })
        };
    } catch (error) {
        console.error('Save Teacher Feedback Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
