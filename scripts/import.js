#!/usr/bin/env node

/**
 * Import script for DWF Wushu Results
 *
 * Usage:
 *   node scripts/import.js <json-file> [api-url] [api-key]
 *
 * Example:
 *   node scripts/import.js sample-data.json
 *   node scripts/import.js data.json http://localhost:3000 your-api-key
 *   node scripts/import.js data.json https://your-app.vercel.app your-api-key
 */

const fs = require('fs');
const path = require('path');

async function importData(jsonFile, apiUrl, apiKey) {
  // Read the JSON file
  const filePath = path.resolve(process.cwd(), jsonFile);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Error: File not found: ${filePath}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  console.log(`📁 Importing data from: ${jsonFile}`);
  console.log(`🌐 API URL: ${apiUrl}`);
  console.log(`📊 Event: ${data.event?.name} (${data.event?.year})`);
  console.log(`👥 Athletes: ${data.athletes?.length || 0}`);
  console.log(`📋 Groups: ${data.groups?.length || 0}`);

  // Make the request
  try {
    const response = await fetch(`${apiUrl}/api/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(`❌ Import failed: ${error.error}`);
      if (error.details) {
        console.error(`Details: ${error.details}`);
      }
      process.exit(1);
    }

    const result = await response.json();
    console.log(`✅ ${result.message}`);
    console.log(`\n🎉 Success! View results at: ${apiUrl}/events/${data.event.year}/${data.event.slug.split('-').slice(1).join('-')}`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 1) {
  console.log(`
Usage: node scripts/import.js <json-file> [api-url] [api-key]

Arguments:
  json-file   Path to JSON file with event data (required)
  api-url     API base URL (default: http://localhost:3000)
  api-key     API key for authentication (default: from .env.local)

Examples:
  node scripts/import.js sample-data.json
  node scripts/import.js data.json http://localhost:3000 my-api-key
  node scripts/import.js data.json https://your-app.vercel.app my-api-key
  `);
  process.exit(1);
}

const jsonFile = args[0];
const apiUrl = args[1] || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const apiKey = args[2] || process.env.API_KEY || '';

if (!apiKey) {
  console.error('❌ Error: API_KEY not provided. Set it in .env.local or pass as argument.');
  process.exit(1);
}

importData(jsonFile, apiUrl, apiKey);
