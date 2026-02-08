require('dotenv').config();
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DB_ID = '2ff6f602c1e1804d8b57d96741933b67';

async function deepDive() {
    console.log(`🤿 Deep diving into Database: ${DB_ID}`);

    try {
        // 1. Retrieve Database Metadata
        console.log('1️⃣  Retrieving Database Metadata...');
        const db = await notion.databases.retrieve({ database_id: DB_ID });
        console.log('   ✅ Type:', db.object);
        console.log('   ✅ Title:', db.title[0]?.plain_text);
        console.log('   ✅ Parent:', JSON.stringify(db.parent));

        if (db.parent.type === 'page_id') {
            console.log('   ⚠️  This database lives inside a Page.');
        }

        // 2. Try Query with strict page filter
        console.log('\n2️⃣  Attempting filtered Query (filter: {object: "page"})...');
        try {
            const response = await notion.databases.query({
                database_id: DB_ID,
                filter: {
                    property: 'object',
                    value: 'page' // Try this unlikely filter just in case
                },
                page_size: 1
            });
            console.log(`   ✅ Query Success! Found ${response.results.length} pages.`);
        } catch (e) {
            console.log('   ❌ Filtered Query Failed:', e.message);
        }

        // 3. Try to find the SOURCE if this is a view
        if (db.source) {
            console.log('\n3️⃣  Checking Source (if this is a view)...');
            console.log('   Found Source:', JSON.stringify(db.source));
        }

    } catch (e) {
        console.error('❌ FATAL ERROR:', e.message);
        if (e.message.includes('multiple data sources')) {
            console.log('💡 DIAGNOSIS: This ID is definitely for a "Linked View" via the API.');
            console.log('   There is no automatic way to get the parent ID from this error.');
            console.log('   You MUST open the original database in the browser.');
        }
    }
}

deepDive();
