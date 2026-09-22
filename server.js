// Quad Cell - Standalone HTTP Server
// Run: node server.js
// Then open: http://localhost:4000

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, 'dist');
const PORT = 8080;

const MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.ico':  'image/x-icon',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
};

const server = http.createServer((req, res) => {
  // Strip query string
  let urlPath = req.url.split('?')[0];

  // SPA fallback — any path that doesn't have an extension serves index.html
  let filePath = path.join(DIST, urlPath);
  if (!path.extname(urlPath)) filePath = path.join(DIST, 'index.html');

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // Try index.html as fallback
      fs.readFile(path.join(DIST, 'index.html'), (err2, data2) => {
        if (err2) { res.writeHead(404); res.end('Not found'); return; }
        res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-cache' });
        res.end(data2);
      });
      return;
    }
    const ext = path.extname(filePath);
    const ct = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': ct, 'Cache-Control': ext === '.html' ? 'no-cache' : 'max-age=31536000' });
    res.end(data);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('');
  console.log('  ================================');
  console.log('   QUAD CELL is running!');
  console.log('   http://localhost:' + PORT);
  console.log('   Keep this window OPEN');
  console.log('  ================================');
  console.log('');
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.log('Port ' + PORT + ' is busy. Trying ' + (PORT+1) + '...');
    server.listen(PORT + 1, '127.0.0.1');
  }
});
