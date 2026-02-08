require('dotenv').config();
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });

async function listAllDatabases() {
    console.log('🔍 Scanning for ALL accessible databases...');
    let allDatabases = [];
    let cursor = undefined;

    try {
        while (true) {
            // Search for everything, manual filtering is safer with some client versions
            const response = await notion.search({
                query: undefined, // Empty query = match all
                start_cursor: cursor,
                page_size: 100,
            });

            // Filter for databases only
            const databases = response.results.filter(item => item.object === 'database');
            allDatabases.push(...databases);

            if (!response.has_more) break;
            cursor = response.next_cursor;
        }

        if (allDatabases.length === 0) {
            console.log('❌ No databases found! Ensure you have shared your databases with the "AntiGravity" integration.');
        } else {
            console.log(`✅ Found ${allDatabases.length} databases:\n`);
            allDatabases.forEach(db => {
                const title = db.title[0]?.plain_text || '[Untitled Database]';
                console.log(`📂 Name:   "${title}"`);
                console.log(`   🔑 ID:     ${db.id}`);
                console.log(`   🔗 URL:    ${db.url}`);
                console.log('   ---------------------------------------------------');
            });

            console.log('\n👉 Copy the "ID" of your Lessons/Sessions database and paste it into your .env file.');
        }

    } catch (error) {
        console.error('❌ Error during search:', error.message);
    }
}

listAllDatabases();
