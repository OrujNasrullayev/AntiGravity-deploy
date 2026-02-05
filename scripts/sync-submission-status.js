const { Client } = require('@notionhq/client');

const NOTION_API_KEY = process.env.NOTION_API_KEY;

async function updateSubmissionStatus(submissionPageId, newStatus) {
    if (!NOTION_API_KEY) {
        console.error('Error: NOTION_API_KEY not found.');
        process.exit(1);
    }

    const notion = new Client({ auth: NOTION_API_KEY });

    try {
        console.log(`Updating submission ${submissionPageId} status to "${newStatus}"...`);

        await notion.pages.update({
            page_id: submissionPageId,
            properties: {
                'Status': {
                    status: { name: newStatus }
                }
            }
        });

        console.log('✅ Successfully updated submission status in Notion!');
    } catch (error) {
        console.error('❌ Error updating submission status:', error.message);
    }
}

const args = process.argv.slice(2);
if (args.length >= 2) {
    const [submissionPageId, newStatus] = args;
    updateSubmissionStatus(submissionPageId, newStatus);
} else {
    console.log('Usage: node scripts/sync-submission-status.js "submission_page_id" "Checked"');
}
