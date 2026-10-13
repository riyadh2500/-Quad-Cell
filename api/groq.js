// Vercel serverless function — proxies to Groq API
// Deploy: add GROQ_API_KEY to Vercel environment variables

export const config = { runtime: 'edge' };

export default async function handler(req) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin':  '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'GROQ_API_KEY not set in Vercel environment variables' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Forward to Groq
  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model:       body.model || 'qwen/qwen3.8-27b',
      messages:    body.messages,
      stream:      true,
      max_tokens:  body.max_tokens || 600,
      temperature: body.temperature || 0.7,
    }),
  });

  // Stream the response straight back
  return new Response(groqRes.body, {
    status:  groqRes.status,
    headers: {
      'Content-Type':                groqRes.headers.get('content-type') || 'text/event-stream',
      'Cache-Control':               'no-cache',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
