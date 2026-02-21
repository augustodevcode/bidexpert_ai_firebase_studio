const https = require('https');
const fs = require('fs');

const url = new URL('https://bidexpertaifirebasestudio-a5hq9liet-augustos-projects-d51a961f.vercel.app/api/admin/fix-coordinates');

const postData = JSON.stringify({
  secret: 'BIDEXPERT_FIX_COORDINATES_2025'
});

const options = {
  hostname: url.hostname,
  port: 443,
  path: url.pathname + url.search,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'x-fix-secret': 'BIDEXPERT_FIX_COORDINATES_2025',
    'Authorization': 'Bearer BIDEXPERT_FIX_COORDINATES_2025'
  }
};

console.log('Testing POST fix-coordinates on production...');

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    fs.writeFileSync('fix_coord_post_result.txt', \STATUS:  + "" + \nBODY:\n + "" + \);
    console.log('STATUS:', res.statusCode);
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
    } catch {
      console.log('RAW:', data.substring(0, 500));
    }
  });
});

req.on('error', (e) => console.log('ERROR:', e.message));
req.write(postData);
req.end();
