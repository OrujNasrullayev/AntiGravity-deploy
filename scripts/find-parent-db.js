require('dotenv').config();
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const TARGET_PAGE_ID = '2f96f602c1e180fda61de6d31ea1ff95';

async function findParentDatabase() {
    console.log(`🔍 Inspecting Page: ${TARGET_PAGE_ID}`);
    try {
        const page = await notion.pages.retrieve({ page_id: TARGET_PAGE_ID });

        if (page.parent.type === 'database_id') {
            console.log(`\n✅ FOUND REAL SOURCE DATABASE ID!`);
            console.log(`📂 Database ID: ${page.parent.database_id}`);
            console.log(`👉 Please update your .env file with this ID.`);
        } else {
            console.log('❌ The parent of this page is NOT a database. It is:', page.parent.type);
            console.log(JSON.stringify(page.parent, null, 2));
        }
    } catch (e) {
        console.error('❌ Error retrieving page:', e.message);
    }
}

findParentDatabase();
