import { useState, useRef, useEffect, useCallback } from 'react';

// ── Quad Cell system prompt ───────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are the Quad Cell AI Assistant — a fast, intelligent assistant built into the Quad Cell DeFi platform. You run on Groq's LPU inference engine (Qwen 3.8 27B), giving you near-instant responses.

You can answer ANY question like a normal AI (coding, math, writing, science, history, etc.).
You also have deep knowledge of Quad Cell and its features.

═══ QUAD CELL PLATFORM KNOWLEDGE ═══

WHAT IS QUAD CELL:
Quad Cell is a full-stack DeFi terminal built on the Rialo infrastructure. It unifies perpetual futures trading, prediction markets, AI-powered payments, and autonomous trading agents into one dark, fast interface.

PERPETUAL DEX:
- Trade BTC-PERP, ETH-PERP, SOL-PERP, MATIC-PERP, ARB-PERP, BNB-PERP
- Leverage: 1×–20× using the slider in Order Entry
- Order types: Market (instant) and Limit (set your price)
- Sides: Long (profit if price rises) | Short (profit if price falls)
- Collateral: USDC
- Features: live order book, trades tape, candlestick/line chart, positions panel with unrealised P&L and Close button
- How to trade: Pair Selector → Long/Short → leverage slider → size → Open

PREDICTION MARKETS:
- Categories: Crypto, Technology, Politics, Sports
- YES/NO outcome betting with USDT on Ethereum Sepolia testnet
- Share price = current probability (e.g. YES at 68% costs $0.68/share)
- Payout = amount ÷ share_price USDT if your side resolves correctly
- Profit = (1/price − 1) × amount
- Resolution: Rialo Stream Oracle (tamper-proof on-chain)
- 30-day probability history chart per market
- My Positions tab shows all open bets

AI PAYMENT AGENT:
- Natural language: "Send 250 USDT to alice.eth" / "Schedule weekly 50 USDT to bob.eth"
- Or: paste a 0x address → agent asks amount → preview → MetaMask confirm
- Real ERC-20 USDT transfer on Sepolia. Zero fees via Rialo Cruise
- USDT contract: 0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0
- Supports: send, swap, schedule (daily/weekly/monthly)
- TX history + scheduled payments panel on the right

AI AGENTS (autonomous bots):
- DCA Bot Alpha: buys $50 BTC every Monday 9am UTC, limit $1,000
- Yield Optimizer: moves funds to highest APY protocol when differential >2%, limit $5,000
- Liquidation Guard: adds collateral when perp liquidation risk >80%, limit $2,000
- News Sentiment Trader: trades when sentiment score >0.75, limit $500
- Each has: spend limit, trigger conditions, action history log, pause/resume

RIALO INFRASTRUCTURE:
- Rialo Edge: sub-50ms routing, confidential on-chain execution, protects agents from prompt injection
- Rialo IPC: cross-chain messaging without bridges
- Rialo Stream: real-time oracle feeds (prices, events, news sentiment)
- Rialo Workflow: declarative multi-step DeFi automation (swap→deposit→stake atomically)
- Reactive Transactions: event-driven auto-execution on on-chain conditions
- Rialo Interop: zero-fee cross-chain asset movement (used by AI Payment Agent)

ECOSYSTEM:
- Playground: sandbox to test Rialo IPC, Stream, Workflow without real funds
- Developers: SDK docs, API refs, smart contract ABIs
- Applications: third-party DeFi apps with live TVL and user counts

WALLET:
- Supports MetaMask, Coinbase Wallet, any EIP-1193 browser extension
- Auto-switches to Ethereum Sepolia for USDT operations
- Connected pill: address avatar, ETH balance, USDT Sepolia balance, network switcher
- Sepolia ETH faucet: sepoliafaucet.com

FEES: All operations (trading, payments, agents) are $0.00 via Rialo infrastructure.

NAVIGATION (sidebar):
Overview | Prediction Markets | Perpetual DEX | AI Payments | AI Agents | AI Assistant | Reactive Txs | Rialo Stream | Rialo Edge | Privacy (IPC) | Automation | Playground | Applications | Developers

═══ BEHAVIOUR RULES ═══
- Answer general questions fully — you are a capable general-purpose AI
- For Quad Cell questions, give detailed accurate answers using the knowledge above
- When users ask about crypto prices or market data, note that real-time data is fetched and shown in the platform
- Be concise but thorough. Use markdown formatting (bold, lists, code blocks) when it helps
- Never refuse reasonable questions. Be friendly and direct.`;

// ── Real-time data fetcher (CoinGecko free API) ───────────────────────────────
async function fetchCryptoPrices() {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,matic-network,arbitrum&vs_currencies=usd&include_24hr_change=true',
      { signal: AbortSignal.timeout(4000) }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

function priceContext(prices) {
  if (!prices) return '';
  const fmt = (id, name) => {
    const d = prices[id];
    if (!d) return '';
    const chg = d.usd_24h_change?.toFixed(2);
    const sign = chg >= 0 ? '+' : '';
    return `${name}: $${d.usd.toLocaleString()} (${sign}${chg}% 24h)`;
  };
  const lines = [
    fmt('bitcoin', 'BTC'),
    fmt('ethereum', 'ETH'),
    fmt('solana', 'SOL'),
    fmt('matic-network', 'MATIC'),
  ].filter(Boolean);
  if (!lines.length) return '';
  return `\n\n[Live prices as of this message]\n${lines.join('\n')}`;
}

// ── Groq SSE streaming ────────────────────────────────────────────────────────
// Calls /api/groq — in dev Vite proxies it to api.groq.com, in prod server.js handles it.
const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY;

async function* streamGroq(messages, retries = 1) {
  const headers = { 'Content-Type': 'application/json' };
  if (GROQ_KEY) headers['Authorization'] = `Bearer ${GROQ_KEY}`;

  const res = await fetch('/api/groq', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model:       'qwen/qwen3.8-27b',
      messages,
      stream:      true,
      max_tokens:  600,
      temperature: 0.7,
    }),
  });

  // Rate limit — wait and retry once
  if (res.status === 429 && retries > 0) {
    const retry = parseInt(res.headers.get('retry-after') || '20', 10);
    await new Promise(r => setTimeout(r, (retry + 1) * 1000));
    yield* streamGroq(messages, retries - 1);
    return;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: `HTTP ${res.status}` } }));
    throw new Error(err.error?.message || err.error || `Server error ${res.status}`);
  }

  const reader  = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop();
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') return;
      try {
        const json  = JSON.parse(data);
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch { /* skip malformed */ }
    }
  }
}

// ── Markdown renderer ─────────────────────────────────────────────────────────
function MsgContent({ text }) {
  const parts = text.split(/(```[\s\S]*?```)/g);
  return (
    <div style={{ fontSize: '0.85rem', lineHeight: 1.75, color: '#c9c9c9', wordBreak: 'break-word' }}>
      {parts.map((part, pi) => {
        if (part.startsWith('```')) {
          const inner = part.slice(3, -3);
          const nl    = inner.indexOf('\n');
          const lang  = nl > -1 ? inner.slice(0, nl).trim() : '';
          const code  = nl > -1 ? inner.slice(nl + 1) : inner;
          return (
            <div key={pi} style={{ margin: '0.5rem 0', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
              {lang && <div style={{ background: '#222', padding: '0.2rem 0.75rem', fontSize: '0.68rem', color: '#6b7280', borderBottom: '1px solid rgba(255,255,255,0.07)', fontFamily: 'monospace' }}>{lang}</div>}
              <pre style={{ margin: 0, padding: '0.75rem', background: '#141414', overflowX: 'auto', fontSize: '0.78rem', color: '#86efac', fontFamily: '"SF Mono","Fira Code",monospace', lineHeight: 1.6 }}>
                <code>{code}</code>
              </pre>
            </div>
          );
        }
        return <InlineBlock key={pi} text={part} />;
      })}
    </div>
  );
}

function InlineBlock({ text }) {
  return (
    <>
      {text.split('\n').map((line, i) => {
        if (line.match(/^\|[-| ]+\|?$/)) return null;
        if (line.startsWith('|')) {
          const cells = line.split('|').filter(c => c.trim());
          const isHeader = text.split('\n')[i + 1]?.match(/^\|[-| ]+\|?$/);
          return (
            <div key={i} style={{ display: 'flex', gap: '1rem', padding: '0.22rem 0', borderBottom: isHeader ? '1px solid rgba(255,255,255,0.12)' : 'none' }}>
              {cells.map((c, j) => (
                <span key={j} style={{ flex: 1, color: isHeader ? '#e8e0d0' : '#c9c9c9', fontWeight: isHeader ? 700 : 400 }}>
                  <Inline text={c.trim()} />
                </span>
              ))}
            </div>
          );
        }
        if (line.startsWith('### ')) return <div key={i} style={{ fontWeight: 700, fontSize: '0.9rem',  color: '#e8e0d0', marginTop: '0.65rem', marginBottom: '0.15rem' }}><Inline text={line.slice(4)} /></div>;
        if (line.startsWith('## '))  return <div key={i} style={{ fontWeight: 800, fontSize: '0.95rem', color: '#e8e0d0', marginTop: '0.75rem', marginBottom: '0.2rem'  }}><Inline text={line.slice(3)} /></div>;
        if (line.startsWith('# '))   return <div key={i} style={{ fontWeight: 800, fontSize: '1rem',    color: '#e8e0d0', marginTop: '0.85rem', marginBottom: '0.25rem' }}><Inline text={line.slice(2)} /></div>;
        if (line.match(/^[-*] /)) return (
          <div key={i} style={{ display: 'flex', gap: '0.5rem', paddingLeft: '0.25rem', marginBottom: '0.1rem' }}>
            <span style={{ color: '#4b5563', flexShrink: 0, marginTop: '0.05rem' }}>•</span>
            <span><Inline text={line.slice(2)} /></span>
          </div>
        );
        if (line.match(/^\d+\. /)) return (
          <div key={i} style={{ display: 'flex', gap: '0.5rem', paddingLeft: '0.25rem', marginBottom: '0.1rem' }}>
            <span style={{ color: '#6b7280', flexShrink: 0, fontWeight: 600, fontSize: '0.8rem', minWidth: 16 }}>{line.match(/^(\d+)\./)[1]}.</span>
            <span><Inline text={line.replace(/^\d+\. /, '')} /></span>
          </div>
        );
        if (line.startsWith('**') && line.endsWith('**') && !line.slice(2, -2).includes('**'))
          return <div key={i} style={{ fontWeight: 700, color: '#e8e0d0', marginTop: '0.4rem', marginBottom: '0.1rem', fontSize: '0.88rem' }}>{line.slice(2, -2)}</div>;
        if (!line.trim()) return <div key={i} style={{ height: '0.3rem' }} />;
        return <div key={i} style={{ marginBottom: '0.03rem' }}><Inline text={line} /></div>;
      })}
    </>
  );
}

function Inline({ text }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g).map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**')) return <strong key={i} style={{ color: '#e8e0d0', fontWeight: 700 }}>{p.slice(2, -2)}</strong>;
        if (p.startsWith('*')  && p.endsWith('*'))  return <em      key={i} style={{ color: '#d1d5db', fontStyle: 'italic' }}>{p.slice(1, -1)}</em>;
        if (p.startsWith('`')  && p.endsWith('`'))  return <code    key={i} style={{ fontFamily: '"SF Mono","Fira Code",monospace', fontSize: '0.78rem', background: 'rgba(255,255,255,0.08)', padding: '0.1rem 0.35rem', borderRadius: 4, color: '#86efac' }}>{p.slice(1, -1)}</code>;
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

// ── Quick questions ───────────────────────────────────────────────────────────
const QUICK = [
  'What is Quad Cell?',
  'How do I trade on the Perp DEX?',
  'How do Prediction Markets work?',
  'How do I send USDT?',
  'What AI agents are available?',
  'Tell me about Rialo infrastructure',
  'What is the current BTC price?',
  'Explain DeFi in simple terms',
  'What is a perpetual future?',
  'How do I get started?',
];

function msgTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const WELCOME = {
  id: 'w0', role: 'ai', time: Date.now(),
  text: "Hey! I'm the **Quad Cell AI Assistant** — powered by Groq's ultra-fast LPU.\n\nI can help with **anything**: Quad Cell features, DeFi concepts, crypto prices, coding, math, or general questions.\n\nWhat would you like to know?",
};

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AssistantPage() {
  const [messages,  setMessages]  = useState([WELCOME]);
  const [input,     setInput]     = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error,     setError]     = useState(null);
  const [prices,    setPrices]    = useState(null);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const historyRef = useRef([]); // conversation turns

  // Fetch live prices on mount + every 30s
  useEffect(() => {
    fetchCryptoPrices().then(setPrices);
    const t = setInterval(() => fetchCryptoPrices().then(setPrices), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const ask = useCallback(async (overrideQ) => {
    const query = (overrideQ ?? input).trim();
    if (!query || streaming) return;
    setInput('');
    setError(null);
    inputRef.current?.focus();

    // user message
    setMessages(m => [...m, { id: `u${Date.now()}`, role: 'user', text: query, time: Date.now() }]);

    // Build price context if user asks about prices
    const priceKeywords = ['price', 'btc', 'eth', 'bitcoin', 'ethereum', 'solana', 'sol', 'matic', 'crypto', 'market'];
    const wantsPrices = priceKeywords.some(k => query.toLowerCase().includes(k));
    const systemContent = SYSTEM_PROMPT + (wantsPrices ? priceContext(prices) : '');

    historyRef.current.push({ role: 'user', content: query });
    const openAIMessages = [
      { role: 'system', content: systemContent },
      ...historyRef.current.slice(-24),
    ];

    // placeholder AI bubble
    const aiId = `a${Date.now()}`;
    setMessages(m => [...m, { id: aiId, role: 'ai', text: '', time: Date.now(), streaming: true }]);
    setStreaming(true);

    let fullText = '';
    try {
      for await (const chunk of streamGroq(openAIMessages)) {
        fullText += chunk;
        const snap = fullText;
        setMessages(m => m.map(msg => msg.id === aiId ? { ...msg, text: snap } : msg));
      }
      setMessages(m => m.map(msg => msg.id === aiId ? { ...msg, streaming: false } : msg));
      historyRef.current.push({ role: 'assistant', content: fullText });
    } catch (e) {
      setMessages(m => m.map(msg => msg.id === aiId ? { ...msg, text: '', streaming: false } : msg));
      setError(e.message);
      historyRef.current.pop();
    }
    setStreaming(false);
  }, [input, streaming, prices]);

  // Live price ticker
  const tickerBTC  = prices?.bitcoin;
  const tickerETH  = prices?.ethereum;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0a0a0a', overflow: 'hidden' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.75rem 1.25rem', background: '#0f0f0f', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        {/* Avatar */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, #1e293b, #0f172a)', border: '2px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem' }}>🧠</div>
          <span style={{ position: 'absolute', bottom: 1, right: 1, width: 9, height: 9, borderRadius: '50%', background: '#22c55e', border: '2px solid #0f0f0f' }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#e8e0d0' }}>Quad Cell Assistant</div>
          <div style={{ fontSize: '0.7rem', color: streaming ? '#f59e0b' : '#22c55e', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: streaming ? '#f59e0b' : '#22c55e', display: 'inline-block' }} />
            {streaming ? 'Thinking…' : 'Online · Groq LPU · Ultra-fast'}
          </div>
        </div>

        {/* Live price ticker */}
        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.7rem' }}>
          {tickerBTC && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#9ca3af', fontWeight: 600 }}>BTC</div>
              <div style={{ color: tickerBTC.usd_24h_change >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700, fontFamily: 'monospace' }}>
                ${tickerBTC.usd.toLocaleString()}
              </div>
            </div>
          )}
          {tickerETH && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#9ca3af', fontWeight: 600 }}>ETH</div>
              <div style={{ color: tickerETH.usd_24h_change >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700, fontFamily: 'monospace' }}>
                ${tickerETH.usd.toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Messages ── */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '1rem 1.25rem 0.5rem',
        display: 'flex', flexDirection: 'column', gap: '0.35rem',
        scrollbarWidth: 'thin', scrollbarColor: '#1f2937 transparent',
      }}>
        {/* Date divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
          <span style={{ fontSize: '0.63rem', color: '#374151', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Today</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
        </div>

        {messages.map((msg, idx) => {
          const isUser   = msg.role === 'user';
          const prevRole = messages[idx - 1]?.role;
          const showMeta = !isUser && prevRole !== 'ai';

          return (
            <div key={msg.id} style={{
              display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row',
              alignItems: 'flex-end', gap: '0.5rem',
              marginBottom: prevRole === msg.role ? '0.04rem' : '0.3rem',
            }}>
              {/* AI avatar */}
              {!isUser && (
                <div style={{ width: 28, height: 28, flexShrink: 0 }}>
                  {showMeta && (
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #1e293b, #0f172a)', border: '1px solid rgba(255,255,255,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>🧠</div>
                  )}
                </div>
              )}

              <div style={{ maxWidth: '76%', display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', gap: '0.1rem' }}>
                {showMeta && !isUser && (
                  <div style={{ fontSize: '0.65rem', color: '#4b5563', paddingLeft: '0.1rem', display: 'flex', gap: '0.4rem' }}>
                    <span style={{ fontWeight: 600, color: '#6b7280' }}>Quad Cell AI</span>
                    <span>{msgTime(msg.time)}</span>
                  </div>
                )}
                {isUser && (
                  <div style={{ fontSize: '0.65rem', color: '#374151', paddingRight: '0.1rem' }}>{msgTime(msg.time)}</div>
                )}

                {/* Bubble */}
                <div style={{
                  padding: '0.65rem 0.9rem',
                  borderRadius: isUser ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
                  background: isUser ? 'linear-gradient(135deg, #14532d, #166534)' : '#181818',
                  border: `1px solid ${isUser ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.07)'}`,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
                  minWidth: 36,
                }}>
                  {isUser ? (
                    <span style={{ fontSize: '0.85rem', color: '#dcfce7', lineHeight: 1.65 }}>{msg.text}</span>
                  ) : msg.text ? (
                    <>
                      <MsgContent text={msg.text} />
                      {msg.streaming && (
                        <span style={{ display: 'inline-block', width: 2, height: '0.85em', background: '#6b7280', marginLeft: 2, verticalAlign: 'text-bottom', animation: 'blink 0.7s infinite' }} />
                      )}
                    </>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.28rem', alignItems: 'center', padding: '0.1rem 0' }}>
                      {[0,1,2].map(i => (
                        <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#374151', display: 'inline-block', animation: `blink 1.3s ${i*0.2}s infinite` }} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Error */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '0.6rem 0.9rem', fontSize: '0.79rem', color: '#fca5a5', display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginTop: '0.25rem' }}>
            <span style={{ flexShrink: 0 }}>⚠</span>
            <span>{
              error.includes('401') || error.includes('api_key') ? 'Invalid Groq API key — check VITE_GROQ_API_KEY in .env and restart Vite' :
              error.includes('429') || error.includes('Rate limit') ? 'Rate limit hit — wait ~20 seconds and try again, or upgrade at console.groq.com/settings/billing' :
              error
            }</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Quick questions ── */}
      <div style={{ padding: '0.5rem 1.25rem', display: 'flex', gap: '0.38rem', overflowX: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', background: '#0d0d0d', flexShrink: 0, scrollbarWidth: 'none' }}>
        {QUICK.map(q => (
          <button key={q} onClick={() => ask(q)} disabled={streaming} style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: '100px', padding: '0.24rem 0.76rem',
            fontSize: '0.7rem', color: '#6b7280',
            cursor: streaming ? 'default' : 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
            transition: 'all 0.12s', opacity: streaming ? 0.4 : 1,
          }}
            onMouseEnter={e => { if (!streaming) { e.currentTarget.style.color='#d1d5db'; e.currentTarget.style.borderColor='rgba(255,255,255,0.22)'; }}}
            onMouseLeave={e => { e.currentTarget.style.color='#6b7280'; e.currentTarget.style.borderColor='rgba(255,255,255,0.09)'; }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* ── Input bar ── */}
      <div style={{ padding: '0.8rem 1.25rem', background: '#0f0f0f', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: '0.6rem', alignItems: 'center', flexShrink: 0 }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(); }}}
          placeholder="Ask anything…"
          disabled={streaming}
          style={{
            flex: 1, background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, padding: '0.7rem 1rem',
            color: '#e5e7eb', fontSize: '0.88rem', fontFamily: 'inherit', outline: 'none',
            transition: 'border-color 0.15s', opacity: streaming ? 0.6 : 1,
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(255,255,255,0.28)'}
          onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
        />
        <button
          onClick={() => ask()}
          disabled={streaming || !input.trim()}
          style={{
            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
            background: !streaming && input.trim() ? '#22c55e' : '#1a1a1a',
            border: '1px solid rgba(255,255,255,0.1)',
            cursor: !streaming && input.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s',
          }}
        >
          {streaming
            ? <span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid #374151', borderTopColor: '#9ca3af', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
            : <span style={{ color: input.trim() ? '#000' : '#4b5563', fontSize: '1.05rem', lineHeight: 1 }}>↑</span>
          }
        </button>
      </div>
    </div>
  );
}
