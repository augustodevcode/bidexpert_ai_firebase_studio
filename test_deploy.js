const https = require('https');
const fs = require('fs');

const url = 'https://bidexpertaifirebasestudio-7e4izjbue-augustos-projects-d51a961f.vercel.app/api/admin/fix-coordinates';

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    fs.writeFileSync('deploy_test_result.txt', `STATUS: ${res.statusCode}\nHEADERS: ${JSON.stringify(res.headers, null, 2)}\nBODY:\n${data}`);
    console.log('STATUS:', res.statusCode);
    console.log('DONE');
  });
}).on('error', (e) => {
  fs.writeFileSync('deploy_test_result.txt', `ERROR: ${e.message}`);
  console.log('ERROR:', e.message);
});
