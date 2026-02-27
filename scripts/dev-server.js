const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
function parsePort() {
  const env = process.env.PORT && parseInt(process.env.PORT, 10);
  if (!isNaN(env) && env > 0) return env;
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--port' || a === '-p') {
      const v = parseInt(argv[i + 1], 10);
      if (!isNaN(v) && v > 0) return v;
    }
    const m = /^--port=(\d+)$/.exec(a);
    if (m) return parseInt(m[1], 10);
    if (/^\d+$/.test(a)) return parseInt(a, 10);
  }
  return 8080;
}
const port = parsePort();

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
};

function sendFile(res, fp) {
  fs.readFile(fp, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }
    const ext = path.extname(fp).toLowerCase();
    res.writeHead(200, {
      'Content-Type': mime[ext] || 'application/octet-stream',
    });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0] || '/');
  // 先頭のスラッシュを除去して相対化
  let relPath = reqPath.replace(/^[/\\]+/, '');
  if (relPath === '') relPath = 'index.html';
  // favicon.ico は存在しないため、favicon.svg にフォールバック
  if (relPath === 'favicon.ico') {
    relPath = 'favicon.svg';
  }
  const fp = path.resolve(root, relPath);
  if (!fp.startsWith(root)) {
    res.writeHead(400);
    res.end('Bad Request');
    return;
  }
  fs.stat(fp, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }
    sendFile(res, fp);
  });
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Dev server running: http://127.0.0.1:${port}`);
});
