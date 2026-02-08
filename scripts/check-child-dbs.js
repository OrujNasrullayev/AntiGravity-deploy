require('dotenv').config();
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const childIds = [
    '2f96f602c1e180838211000bf4120b06',
    '2f96f602c1e1804a-a2cc-000b89c218ea', // Note: ensure dashes are handled if needed, usually Notion client handles both
    '2f96f602c1e18000-8a94-000b78c262ae'
];

async function checkAccess() {
    console.log('🔍 Checking access to Child Data Source IDs...');

    for (let id of childIds) {
        // Clean ID just in case
        const cleanId = id.replace(/-/g, '');
        console.log(`\n👉 Checking ID: ${cleanId}`);

        try {
            const db = await notion.databases.retrieve({ database_id: cleanId });
            console.log(`   ✅ SUCCESS! Accessible Database found.`);
            console.log(`      Title: "${db.title[0]?.plain_text || 'Untitled'}"`);
            console.log(`      ID:    ${db.id}`);
            console.log(`   🚀 USE THIS ID IN YOUR .ENV FILE!`);
        } catch (error) {
            console.log(`   ❌ Access Denied / Not Found: ${error.message}`);
            if (error.code === 'object_not_found') {
                console.log(`      (The integration 'AntiGravity' is likely not invited to this specific source database)`);
            }
        }
    }
}

checkAccess();
