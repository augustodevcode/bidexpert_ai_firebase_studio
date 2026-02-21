/**
 * Script para testar o POST do fix-coordinates no deploy Vercel.
 * Usa o Vercel MCP para bypass de deployment protection.
 */
const https = require('https');
const fs = require('fs');

const DEPLOY_URL = 'bidexpertaifirebasestudio-7e4izjbue-augustos-projects-d51a961f.vercel.app';
const SECRET = 'BIDEXPERT_FIX_COORDINATES_2025';

const postData = JSON.stringify({
  secret: SECRET,
  dryRun: true // Primeiro faz dry run para ver o que seria corrigido
});

const options = {
  hostname: DEPLOY_URL,
  port: 443,
  path: '/api/admin/fix-coordinates',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'x-fix-secret': SECRET,
    'Authorization': `Bearer ${SECRET}`
  }
};

console.log(`Testing POST fix-coordinates on ${DEPLOY_URL}...`);

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    fs.writeFileSync('fix_coord_post_result.txt', `STATUS: ${res.statusCode}\nBODY:\n${data}`);
    console.log('STATUS:', res.statusCode);
    try {
      const parsed = JSON.parse(data);
      console.log('SUCCESS:', parsed.success);
      console.log('MESSAGE:', parsed.message || 'N/A');
      if (parsed.summary) {
        console.log('SUMMARY:', JSON.stringify(parsed.summary, null, 2));
      }
    } catch {
      console.log('BODY (non-JSON):', data.substring(0, 300));
    }
    console.log('DONE');
  });
});

req.on('error', (e) => {
  console.log('ERROR:', e.message);
  fs.writeFileSync('fix_coord_post_result.txt', `ERROR: ${e.message}`);
});

req.write(postData);
req.end();
