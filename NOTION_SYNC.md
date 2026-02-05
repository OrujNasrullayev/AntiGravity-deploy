# Notion Data Sync for Teacher Calendar

This document explains how to keep your teacher calendar website synchronized with your Notion database.

## 🎯 Overview

The calendar website displays lessons and student information. This data comes from your Notion databases:
- **Students Database** (`2f96f602-c1e1-8070-b48b-df74a6ae967e`)
- **Sessions Database** (`2f96f602-c1e1-8006-82fd-ed6c255509bc`)

## 📊 What Data is Synced

The automation script fetches and syncs:
- ✅ **Student Names** - Real names from your Students database
- ✅ **Student Avatars** - Auto-generated from student names
- ✅ **Lesson Times** - Actual start times from the Date field
- ✅ **Lesson Durations** - Calculated from start/end times (or defaults: 90min for private, 60min for conversation)
- ✅ **Student Enrollments** - Which students are in which lessons
- ✅ **Lesson Types** - Private lessons vs Conversation Clubs

## 🚀 How to Update the Website

### Option 1: Manual Update (Before Each Deploy)

1. **Install dependencies** (first time only):
   ```bash
   npm install @notionhq/client
   ```

2. **Get your Notion API Key**:
   - Go to https://www.notion.so/my-integrations
   - Create a new integration or use an existing one
   - Copy the "Internal Integration Token"
   - Share your Students and Sessions databases with this integration

3. **Run the update script**:
   ```bash
   NOTION_API_KEY=secret_your_key_here node scripts/update-data.js
   ```
   
   On Windows PowerShell:
   ```powershell
   $env:NOTION_API_KEY="secret_your_key_here"; node scripts/update-data.js
   ```

4. **Deploy your site** as usual

### Option 2: Automatic Update (Recommended for Production)

Set up your deployment platform to run the script automatically:

#### For Vercel:
1. Add `NOTION_API_KEY` to your environment variables in Vercel dashboard
2. Update your `package.json` to add a build script:
   ```json
   {
     "scripts": {
       "build": "node scripts/update-data.js"
     }
   }
   ```
3. Vercel will run this before each deployment

#### For Netlify:
1. Add `NOTION_API_KEY` to your environment variables in Netlify dashboard
2. Update your `netlify.toml`:
   ```toml
   [build]
     command = "node scripts/update-data.js"
   ```

#### For GitHub Pages:
1. Add `NOTION_API_KEY` as a repository secret
2. Create a GitHub Action workflow (`.github/workflows/deploy.yml`):
   ```yaml
   name: Deploy
   on: [push]
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         - uses: actions/setup-node@v2
         - run: npm install @notionhq/client
         - run: node scripts/update-data.js
           env:
             NOTION_API_KEY: ${{ secrets.NOTION_API_KEY }}
         - name: Deploy to GitHub Pages
           # ... your deployment steps
   ```

## 📝 How It Works

1. **Script runs** (`scripts/update-data.js`)
2. **Fetches all students** from your Notion Students database
3. **Fetches all lessons** from your Notion Sessions database
4. **Links students to lessons** based on the Students relation field
5. **Extracts lesson times** from the Date property
6. **Overwrites** `assets/js/lessons.js` with fresh data
7. **Website uses** the updated data automatically

## 🔄 Making Changes in Notion

After you make changes in Notion (add students, change lesson times, etc.):

1. **Manual Setup**: Run the update script again, then redeploy
2. **Automatic Setup**: Just redeploy your site (or push to GitHub)

The website will automatically reflect your Notion changes!

## 🛠️ Troubleshooting

**Script fails with "Please provide NOTION_API_KEY"**
- Make sure you've set the environment variable correctly
- Check that your API key starts with `secret_`

**No lessons appear on the calendar**
- Check that your lessons have valid dates in Notion
- Verify the database IDs in `scripts/update-data.js` match your Notion databases

**Student names don't appear**
- Ensure your Students database has a "Name" title property
- Check that lessons have the "Students" relation field filled

## 📁 Files Modified by the Script

- `assets/js/lessons.js` - This file is **auto-generated**. Don't edit it manually!

## 🎨 Customization

To change which data is synced, edit `scripts/update-data.js`:
- Line 44: Avatar generation (currently using ui-avatars.com)
- Line 73-83: Lesson data mapping
- Line 78: Teacher name (currently hardcoded)
