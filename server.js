// ============================================================
// 本地标注编辑服务
//   - 静态托管当前目录（http://127.0.0.1:8788）
//   - POST /api/save-annotations → 把标注数据写回 annotations.js
// 用法：双击 start.bat，或 `node server.js`
// ============================================================
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = 8788;
const TARGET = path.join(ROOT, 'annotations.js');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');

  // ---- 写回 annotations.js ----
  if (req.method === 'POST' && url.pathname === '/api/save-annotations') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const content = data && data.content;
        if (typeof content !== 'string' || content.indexOf('__pa_data') < 0) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: false, error: 'invalid content' }));
        }
        // 原子写：先写临时文件再改名，避免写一半损坏
        fs.writeFileSync(TARGET + '.tmp', content, 'utf8');
        fs.renameSync(TARGET + '.tmp', TARGET);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, file: 'annotations.js' }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: String(e && e.message || e) }));
      }
    });
    return;
  }

  // ---- 静态文件 ----
  let p = decodeURIComponent(url.pathname);
  if (p === '/') p = '/index.html';
  const file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end('forbidden'); }

  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('404 Not Found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    res.end(buf);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('标注编辑服务已启动：');
  console.log('  http://127.0.0.1:' + PORT + '/index.html');
  console.log('  编辑标注后点「保存 annotations.js」会直接写回项目目录。');
});
