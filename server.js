// Quad Cell - Standalone HTTP Server
// Run: node server.js
// Then open: http://localhost:4000

import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, 'dist');
const PORT = 8080;

// Load .env manually (no dotenv dep needed)
function loadEnv() {
  try {
    const raw = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  } catch { /* no .env file */ }
}
loadEnv();

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

// ── /api/chat proxy — keeps the OpenAI key server-side ──────────────────────
function handleChat(req, res) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your-openai-api-key-here') {
    res.writeHead(503, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ error: 'OPENAI_API_KEY not configured in .env' }));
    return;
  }

  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    let payload;
    try { payload = JSON.parse(body); } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid JSON' }));
      return;
    }

    const openAIBody = JSON.stringify({
      model: payload.model || 'gpt-4o-mini',
      messages: payload.messages,
      stream: true,
      max_tokens: 1024,
      temperature: 0.7,
    });

    const options = {
      hostname: 'api.openai.com',
      path:     '/v1/chat/completions',
      method:   'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(openAIBody),
      },
    };

    res.writeHead(200, {
      'Content-Type':                'text/event-stream',
      'Cache-Control':               'no-cache',
      'Connection':                  'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    const proxyReq = https.request(options, proxyRes => {
      proxyRes.on('data', chunk => res.write(chunk));
      proxyRes.on('end', () => res.end());
    });

    proxyReq.on('error', err => {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    });

    proxyReq.write(openAIBody);
    proxyReq.end();
  });
}

// ── /api/groq — Groq streaming proxy (llama-3.3-70b-versatile) ──────────────
function handleGroq(req, res) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    res.writeHead(503, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ error: 'GROQ_API_KEY not configured in .env' }));
    return;
  }

  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    let payload;
    try { payload = JSON.parse(body); } catch {
      res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ error: 'Invalid JSON' }));
      return;
    }

    const groqBody = JSON.stringify({
      model:       payload.model || 'llama-3.3-70b-versatile',
      messages:    payload.messages,
      stream:      true,
      max_tokens:  2048,
      temperature: 0.7,
    });

    const options = {
      hostname: 'api.groq.com',
      path:     '/openai/v1/chat/completions',
      method:   'POST',
      headers: {
        'Content-Type':   'application/json',
        'Authorization':  `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(groqBody),
      },
    };

    res.writeHead(200, {
      'Content-Type':                'text/event-stream',
      'Cache-Control':               'no-cache',
      'Connection':                  'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    const proxyReq = https.request(options, proxyRes => {
      proxyRes.on('data', chunk => res.write(chunk));
      proxyRes.on('end',  ()    => res.end());
    });

    proxyReq.on('error', err => {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    });

    proxyReq.write(groqBody);
    proxyReq.end();
  });
}

const server = http.createServer((req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS' });
    res.end();
    return;
  }

  // AI chat proxy
  if (req.method === 'POST' && req.url === '/api/chat') {
    handleChat(req, res);
    return;
  }

  // Groq AI proxy
  if (req.method === 'POST' && req.url === '/api/groq') {
    handleGroq(req, res);
    return;
  }

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
