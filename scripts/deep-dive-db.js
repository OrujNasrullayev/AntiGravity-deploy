require('dotenv').config();
const Notion = require('@notionhq/client');
console.log('Notion module structure:', Object.keys(Notion));
if (Notion.default) console.log('Notion.default structure:', Object.keys(Notion.default));

const Client = Notion.Client || (Notion.default ? Notion.default.Client : Notion);
console.log('Client is:', typeof Client);
const notion = new Client({ auth: process.env.NOTION_API_KEY });
console.log('notion instance structure:', Object.keys(notion));
const DB_ID = process.env.GROUPS_DATABASE_ID;

async function deepDive() {
    console.log(`🤿 Deep diving into Database: ${DB_ID}`);
    console.log('Notion keys:', Object.keys(notion));
    if (notion.databases) console.log('Notion.databases keys:', Object.keys(notion.databases));

    try {
        const response = await notion.databases.query({
            database_id: DB_ID,
            page_size: 1
        });

        if (response.results.length > 0) {
            const fs = require('fs');
            fs.writeFileSync('group_props_debug.json', JSON.stringify(response.results[0].properties, null, 2));
            console.log('✅ Wrote properties to group_props_debug.json');
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
