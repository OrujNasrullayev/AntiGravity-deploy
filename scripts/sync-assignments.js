const fs = require('fs');
const path = require('path');
const { Client } = require('@notionhq/client');

// You must set this in your environment
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const ASSIGNMENTS_DB_ID = '2f96f602-c1e1-8036-b0f8-cc5601dd7221';

// We simulate a queue. In a real browser app, this would come from an API.
// Since we are using localStorage in the browser, we'll ask the user to provide the JSON
// OR we can create a small helper that reads a temporary file if we had one.
// For this local setup, let's make it accept a single assignment via CLI arguments 
// as a more reliable way to finalize from the browser's "queued" state.

async function createAssignment(data) {
    if (!NOTION_API_KEY) {
        console.error('Error: NOTION_API_KEY not found.');
        process.exit(1);
    }

    const notion = new Client({ auth: NOTION_API_KEY });

    try {
        console.log(`Creating assignment: ${data.title}...`);

        await notion.pages.create({
            parent: { database_id: ASSIGNMENTS_DB_ID },
            properties: {
                'Name': {
                    title: [{ text: { content: data.title } }]
                },
                'Assignment': {
                    rich_text: [{ text: { content: data.instructions || '' } }]
                },
                'Lesson': {
                    relation: [{ id: data.lessonId }]
                }
                // Uploads property is for files, usually handled via URL or uploaded separately.
                // For now we leave it empty as handled via rich_text instructions.
            }
        });

        console.log('✅ Successfully created assignment in Notion!');
    } catch (error) {
        console.error('❌ Error creating assignment:', error.message);
    }
}

// Check for command line arguments (title, lessonId, instructions)
const args = process.argv.slice(2);
if (args.length >= 2) {
    const [title, lessonId, instructions] = args;
    createAssignment({ title, lessonId, instructions });
} else {
    console.log('Usage: node scripts/sync-assignments.js "Task Title" "lesson_page_id" "Instructions"');
    console.log('\nTip: The teacher portal provides this command automatically after submission.');
}
