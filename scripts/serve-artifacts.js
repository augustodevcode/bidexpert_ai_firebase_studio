const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(process.cwd(), 'test-results/pregao-video/artifacts');

const contentTypeByExt = {
  '.webm': 'video/webm',
  '.json': 'application/json; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.zip': 'application/zip',
};

http
  .createServer((req, res) => {
    const requestedPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const safePath = requestedPath === '/' ? '/' : requestedPath.replace(/\.\./g, '');
    let filePath = path.join(root, safePath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      const files = fs.readdirSync(filePath);
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end(files.join('\n'));
      return;
    }

    if (!fs.existsSync(filePath)) {
      res.statusCode = 404;
      res.end('not found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.setHeader('Content-Type', contentTypeByExt[ext] || 'application/octet-stream');
    fs.createReadStream(filePath).pipe(res);
  })
  .listen(9340, '127.0.0.1', () => {
    console.log('static-server-9340-ready');
  });
