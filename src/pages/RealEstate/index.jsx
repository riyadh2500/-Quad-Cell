import { useState, useRef, useEffect, useCallback } from 'react';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';

// ── Mock listings ─────────────────────────────────────────────────────────────
const LISTINGS = [
  { id: 'p1', title: 'Modern Downtown Penthouse', location: 'Dubai Marina, UAE', price: 4200000, rent: 28000, beds: 4, baths: 3, sqft: 3800, type: 'Penthouse', status: 'For Sale', roi: 8.2, img: '🏙', tags: ['Sea View', 'Smart Home', 'Pool'], tokenized: true },
  { id: 'p2', title: 'Palm Jumeirah Villa', location: 'Palm Jumeirah, Dubai', price: 12500000, rent: 85000, beds: 6, baths: 7, sqft: 9200, type: 'Villa', status: 'For Sale', roi: 7.1, img: '🌴', tags: ['Beachfront', 'Private Pool', 'Garden'], tokenized: true },
  { id: 'p3', title: 'Business Bay Studio', location: 'Business Bay, Dubai', price: 850000, rent: 7200, beds: 1, baths: 1, sqft: 620, type: 'Studio', status: 'For Rent', roi: 10.2, img: '🏢', tags: ['City View', 'Gym', 'Metro Access'], tokenized: false },
  { id: 'p4', title: 'JVC Family Apartment', location: 'Jumeirah Village Circle', price: 1100000, rent: 9500, beds: 3, baths: 2, sqft: 1450, type: 'Apartment', status: 'For Sale', roi: 9.5, img: '🏘', tags: ['Park View', 'Community Pool', 'Parking'], tokenized: true },
  { id: 'p5', title: 'DIFC Luxury Flat', location: 'DIFC, Dubai', price: 3100000, rent: 22000, beds: 2, baths: 2, sqft: 1800, type: 'Apartment', status: 'For Sale', roi: 8.8, img: '🏛', tags: ['Skyline View', 'Concierge', 'Gym'], tokenized: false },
  { id: 'p6', title: 'Mirdif Townhouse', location: 'Mirdif, Dubai', price: 1850000, rent: 13500, beds: 4, baths: 3, sqft: 2600, type: 'Townhouse', status: 'For Sale', roi: 8.0, img: '🏠', tags: ['Garden', 'School Nearby', 'Quiet Area'], tokenized: true },
  { id: 'p7', title: 'Downtown Studio Investment', location: 'Downtown Dubai', price: 1200000, rent: 10500, beds: 1, baths: 1, sqft: 750, type: 'Studio', status: 'For Sale', roi: 10.5, img: '🗼', tags: ['Burj View', 'High Floor', 'Furnished'], tokenized: true },
  { id: 'p8', title: 'Creek Harbour Apartment', location: 'Dubai Creek Harbour', price: 2200000, rent: 16000, beds: 3, baths: 2, sqft: 1900, type: 'Apartment', status: 'For Sale', roi: 8.7, img: '🌊', tags: ['Creek View', 'New Build', 'Smart Home'], tokenized: false },
];

const MARKET_STATS = [
  { label: 'Avg Price / sqft', value: '$1,240', change: '+4.2%', up: true },
  { label: 'Avg Rental Yield', value: '8.7%',  change: '+0.3%', up: true },
  { label: 'Transactions (30d)', value: '4,820', change: '+12%', up: true },
  { label: 'Price Index',        value: '142.3', change: '-0.8%', up: false },
];

// ── AI knowledge base ─────────────────────────────────────────────────────────
const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY;

const SYSTEM_PROMPT = `You are an expert AI Real Estate Assistant specializing in Dubai and UAE property markets. You help users find properties, understand market trends, calculate ROI, and make smart investment decisions.

You have access to these listings on the platform:
${LISTINGS.map(p => `- ${p.title} | ${p.location} | $${p.price.toLocaleString()} | ${p.beds}BR | ROI: ${p.roi}% | ${p.status} | ${p.tags.join(', ')}`).join('\n')}

Market data:
- Average price per sqft: $1,240 (+4.2% YoY)
- Average rental yield: 8.7%
- 30-day transactions: 4,820 (+12%)
- Top areas: Dubai Marina, Downtown, Palm Jumeirah, DIFC, Business Bay

You can:
- Recommend properties based on budget, preferences, family size
- Calculate ROI, mortgage payments, rental income
- Explain Dubai real estate laws (no property tax, freehold zones, Golden Visa)
- Compare areas and property types
- Explain tokenized real estate (fractional ownership via blockchain)
- Give investment advice for short-term vs long-term

Be concise, data-driven, and helpful. Use AED and USD. Format numbers clearly.`;

async function* streamGroq(messages) {
  const headers = { 'Content-Type': 'application/json' };
  if (GROQ_KEY) headers['Authorization'] = `Bearer ${GROQ_KEY}`;

  const res = await fetch('/api/groq', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: 'qwen/qwen3.8-27b',
      messages,
      stream: true,
      max_tokens: 600,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: `HTTP ${res.status}` } }));
    throw new Error(err.error?.message || err.error || `HTTP ${res.status}`);
  }

  const reader = res.body.getReader();
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
        const delta = JSON.parse(data).choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch { /* skip */ }
    }
  }
}

// ── Markdown renderer ─────────────────────────────────────────────────────────
function MsgContent({ text }) {
  return (
    <div style={{ fontSize: '0.83rem', lineHeight: 1.7, color: '#c9c9c9', wordBreak: 'break-word' }}>
      {text.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} style={{ height: '0.25rem' }} />;
        if (line.startsWith('### ')) return <div key={i} style={{ fontWeight: 700, color: '#e8e0d0', fontSize: '0.88rem', marginTop: '0.5rem' }}>{line.slice(4)}</div>;
        if (line.startsWith('## '))  return <div key={i} style={{ fontWeight: 800, color: '#e8e0d0', fontSize: '0.92rem', marginTop: '0.6rem' }}>{line.slice(3)}</div>;
        if (line.match(/^[-*] /)) return (
          <div key={i} style={{ display: 'flex', gap: '0.45rem', marginBottom: '0.1rem' }}>
            <span style={{ color: '#4b5563', flexShrink: 0 }}>•</span>
            <span><Inline text={line.slice(2)} /></span>
          </div>
        );
        if (line.match(/^\d+\. /)) return (
          <div key={i} style={{ display: 'flex', gap: '0.45rem', marginBottom: '0.1rem' }}>
            <span style={{ color: '#6b7280', flexShrink: 0, fontWeight: 600, fontSize: '0.78rem' }}>{line.match(/^(\d+)\./)[1]}.</span>
            <span><Inline text={line.replace(/^\d+\. /, '')} /></span>
          </div>
        );
        return <div key={i} style={{ marginBottom: '0.03rem' }}><Inline text={line} /></div>;
      })}
    </div>
  );
}
function Inline({ text }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**')) return <strong key={i} style={{ color: '#e8e0d0' }}>{p.slice(2, -2)}</strong>;
        if (p.startsWith('`')  && p.endsWith('`'))  return <code   key={i} style={{ fontFamily: 'monospace', fontSize: '0.76rem', background: 'rgba(255,255,255,0.08)', padding: '0.05rem 0.3rem', borderRadius: 3, color: '#86efac' }}>{p.slice(1, -1)}</code>;
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

// ── Property card ─────────────────────────────────────────────────────────────
function PropertyCard({ p, onAsk }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${hovered ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 14, overflow: 'hidden', transition: 'all 0.18s', cursor: 'default',
      }}
    >
      {/* Image area */}
      <div style={{ height: 100, background: 'linear-gradient(135deg, #1a1a2e, #16213e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', position: 'relative' }}>
        {p.img}
        <div style={{ position: 'absolute', top: 8, left: 10, display: 'flex', gap: 4 }}>
          <span style={{ background: p.status === 'For Sale' ? 'rgba(34,197,94,0.2)' : 'rgba(59,130,246,0.2)', border: `1px solid ${p.status === 'For Sale' ? 'rgba(34,197,94,0.4)' : 'rgba(59,130,246,0.4)'}`, color: p.status === 'For Sale' ? '#22c55e' : '#60a5fa', fontSize: '0.62rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 100 }}>{p.status}</span>
          {p.tokenized && <span style={{ background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.4)', color: '#c084fc', fontSize: '0.62rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 100 }}>⛓ Tokenized</span>}
        </div>
        <div style={{ position: 'absolute', top: 8, right: 10, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '0.2rem 0.5rem', fontSize: '0.68rem', color: '#22c55e', fontWeight: 700 }}>
          {p.roi}% ROI
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '0.85rem' }}>
        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#e8e0d0', marginBottom: '0.2rem', lineHeight: 1.3 }}>{p.title}</div>
        <div style={{ fontSize: '0.72rem', color: '#6b7280', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <span>📍</span>{p.location}
        </div>

        {/* Price */}
        <div style={{ fontWeight: 800, fontSize: '1rem', color: '#e8e0d0', marginBottom: '0.1rem' }}>
          ${p.price.toLocaleString()}
        </div>
        <div style={{ fontSize: '0.72rem', color: '#6b7280', marginBottom: '0.65rem' }}>
          ${Math.round(p.price / p.sqft).toLocaleString()} / sqft · ${p.rent.toLocaleString()}/mo rent
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '0.85rem', fontSize: '0.72rem', color: '#9ca3af', marginBottom: '0.65rem' }}>
          <span>🛏 {p.beds} bed</span>
          <span>🚿 {p.baths} bath</span>
          <span>📐 {p.sqft.toLocaleString()} sqft</span>
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          {p.tags.map(t => (
            <span key={t} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 100, padding: '0.1rem 0.5rem', fontSize: '0.65rem', color: '#6b7280' }}>{t}</span>
          ))}
        </div>

        {/* Action */}
        <button
          onClick={() => onAsk(`Tell me more about the ${p.title} in ${p.location}. What's the investment case?`)}
          style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '0.45rem', fontSize: '0.75rem', color: '#9ca3af', cursor: 'pointer', transition: 'all 0.12s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = '#e8e0d0'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#9ca3af'; }}
        >
          🧠 Ask AI about this property
        </button>
      </div>
    </div>
  );
}

// ── Quick questions ───────────────────────────────────────────────────────────
const QUICK = [
  'Best areas to invest in Dubai?',
  'Calculate ROI on $1M property',
  'Explain tokenized real estate',
  'Compare villa vs apartment investment',
  'Dubai Golden Visa via property?',
  'Best property for $500K budget?',
  'Short-term vs long-term rental?',
  'No property tax in Dubai?',
];

const WELCOME = {
  id: 'w0', role: 'ai', time: Date.now(),
  text: `Hi! I'm your **AI Real Estate Advisor** for Dubai & UAE markets.\n\nI can help you find properties, calculate returns, compare areas, and explain investment strategies.\n\nBrowse listings on the left or ask me anything below.`,
};

function msgTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function RealEstate() {
  const [messages,  setMessages]  = useState([WELCOME]);
  const [input,     setInput]     = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error,     setError]     = useState(null);
  const [filter,    setFilter]    = useState('All');
  const [sort,      setSort]      = useState('roi');
  const historyRef = useRef([]);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const ask = useCallback(async (overrideQ) => {
    const query = (overrideQ ?? input).trim();
    if (!query || streaming) return;
    setInput('');
    setError(null);
    inputRef.current?.focus();

    setMessages(m => [...m, { id: `u${Date.now()}`, role: 'user', text: query, time: Date.now() }]);
    historyRef.current.push({ role: 'user', content: query });

    const msgs = [{ role: 'system', content: SYSTEM_PROMPT }, ...historyRef.current.slice(-20)];
    const aiId = `a${Date.now()}`;
    setMessages(m => [...m, { id: aiId, role: 'ai', text: '', time: Date.now(), streaming: true }]);
    setStreaming(true);

    let fullText = '';
    try {
      for await (const chunk of streamGroq(msgs)) {
        fullText += chunk;
        setMessages(m => m.map(msg => msg.id === aiId ? { ...msg, text: fullText } : msg));
      }
      setMessages(m => m.map(msg => msg.id === aiId ? { ...msg, streaming: false } : msg));
      historyRef.current.push({ role: 'assistant', content: fullText });
    } catch (e) {
      setMessages(m => m.map(msg => msg.id === aiId ? { ...msg, text: '', streaming: false } : msg));
      setError(e.message.includes('429') ? 'Rate limit — wait ~20s and try again' : e.message);
      historyRef.current.pop();
    }
    setStreaming(false);
  }, [input, streaming]);

  const types = ['All', 'Villa', 'Penthouse', 'Apartment', 'Studio', 'Townhouse'];
  const filtered = LISTINGS
    .filter(p => filter === 'All' || p.type === filter)
    .sort((a, b) => sort === 'roi' ? b.roi - a.roi : sort === 'price_asc' ? a.price - b.price : b.price - a.price);

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: '#0a0a0a' }}>

      {/* ── Left: listings ── */}
      <div style={{ width: '55%', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '1rem 1.25rem 0.75rem', background: '#0f0f0f', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div>
              <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#e8e0d0', letterSpacing: '-0.02em' }}>AI Real Estate</h1>
              <p style={{ fontSize: '0.72rem', color: '#4b5563', marginTop: '0.15rem' }}>Dubai & UAE · {LISTINGS.length} properties · AI-powered search</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', color: '#22c55e', fontWeight: 600 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'blink 1.5s infinite' }} />
              Live Market
            </div>
          </div>

          {/* Market stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.85rem' }}>
            {MARKET_STATS.map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '0.5rem 0.65rem' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#e8e0d0' }}>{s.value}</div>
                <div style={{ fontSize: '0.62rem', color: '#4b5563', marginTop: '0.05rem' }}>{s.label}</div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: s.up ? '#22c55e' : '#ef4444', marginTop: '0.1rem' }}>{s.change}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '0.3rem', flex: 1, overflowX: 'auto' }}>
              {types.map(t => (
                <button key={t} onClick={() => setFilter(t)} style={{ background: filter === t ? 'rgba(255,255,255,0.1)' : 'transparent', border: `1px solid ${filter === t ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 100, padding: '0.2rem 0.7rem', fontSize: '0.7rem', color: filter === t ? '#e8e0d0' : '#6b7280', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.12s' }}>
                  {t}
                </button>
              ))}
            </div>
            <select value={sort} onChange={e => setSort(e.target.value)} style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '0.25rem 0.5rem', fontSize: '0.7rem', color: '#9ca3af', outline: 'none', cursor: 'pointer' }}>
              <option value="roi">Sort: Best ROI</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.85rem', alignContent: 'start', scrollbarWidth: 'thin', scrollbarColor: '#1f2937 transparent' }}>
          {filtered.map(p => <PropertyCard key={p.id} p={p} onAsk={q => { ask(q); }} />)}
        </div>
      </div>

      {/* ── Right: AI chat ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Chat header */}
        <div style={{ padding: '0.85rem 1.1rem', background: '#0f0f0f', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #1e293b, #0f172a)', border: '2px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>🏡</div>
            <span style={{ position: 'absolute', bottom: 1, right: 1, width: 8, height: 8, borderRadius: '50%', background: '#22c55e', border: '2px solid #0f0f0f' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#e8e0d0' }}>AI Property Advisor</div>
            <div style={{ fontSize: '0.68rem', color: streaming ? '#f59e0b' : '#22c55e', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: streaming ? '#f59e0b' : '#22c55e', display: 'inline-block' }} />
              {streaming ? 'Analyzing…' : 'Online · Dubai Market Expert'}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', scrollbarWidth: 'thin', scrollbarColor: '#1f2937 transparent' }}>
          {messages.map((msg, idx) => {
            const isUser   = msg.role === 'user';
            const prevRole = messages[idx - 1]?.role;
            const showMeta = !isUser && prevRole !== 'ai';
            return (
              <div key={msg.id} style={{ display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: '0.45rem', marginBottom: prevRole === msg.role ? '0.03rem' : '0.25rem' }}>
                {!isUser && (
                  <div style={{ width: 26, height: 26, flexShrink: 0 }}>
                    {showMeta && <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, #1e293b, #0f172a)', border: '1px solid rgba(255,255,255,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>🏡</div>}
                  </div>
                )}
                <div style={{ maxWidth: '82%', display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', gap: '0.08rem' }}>
                  {showMeta && !isUser && <div style={{ fontSize: '0.63rem', color: '#4b5563', paddingLeft: '0.1rem', display: 'flex', gap: '0.35rem' }}><span style={{ fontWeight: 600, color: '#6b7280' }}>AI Advisor</span><span>{msgTime(msg.time)}</span></div>}
                  {isUser && <div style={{ fontSize: '0.63rem', color: '#374151', paddingRight: '0.1rem' }}>{msgTime(msg.time)}</div>}
                  <div style={{ padding: '0.6rem 0.85rem', borderRadius: isUser ? '14px 14px 4px 14px' : '4px 14px 14px 14px', background: isUser ? 'linear-gradient(135deg, #14532d, #166534)' : '#181818', border: `1px solid ${isUser ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.07)'}`, boxShadow: '0 1px 4px rgba(0,0,0,0.4)', minWidth: 32 }}>
                    {isUser ? (
                      <span style={{ fontSize: '0.83rem', color: '#dcfce7', lineHeight: 1.65 }}>{msg.text}</span>
                    ) : msg.text ? (
                      <>
                        <MsgContent text={msg.text} />
                        {msg.streaming && <span style={{ display: 'inline-block', width: 2, height: '0.8em', background: '#6b7280', marginLeft: 2, verticalAlign: 'text-bottom', animation: 'blink 0.7s infinite' }} />}
                      </>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                        {[0,1,2].map(i => <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#374151', display: 'inline-block', animation: `blink 1.3s ${i*0.2}s infinite` }} />)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '0.55rem 0.8rem', fontSize: '0.77rem', color: '#fca5a5', display: 'flex', gap: '0.4rem' }}>
              <span>⚠</span><span>{error}</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick questions */}
        <div style={{ padding: '0.45rem 0.85rem', display: 'flex', gap: '0.35rem', overflowX: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', background: '#0d0d0d', flexShrink: 0, scrollbarWidth: 'none' }}>
          {QUICK.map(q => (
            <button key={q} onClick={() => ask(q)} disabled={streaming} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 100, padding: '0.22rem 0.7rem', fontSize: '0.68rem', color: '#6b7280', cursor: streaming ? 'default' : 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.12s', opacity: streaming ? 0.4 : 1 }}
              onMouseEnter={e => { if (!streaming) { e.currentTarget.style.color='#d1d5db'; e.currentTarget.style.borderColor='rgba(255,255,255,0.2)'; }}}
              onMouseLeave={e => { e.currentTarget.style.color='#6b7280'; e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'; }}
            >{q}</button>
          ))}
        </div>

        {/* Input */}
        <div style={{ padding: '0.75rem 0.85rem', background: '#0f0f0f', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '0.55rem', alignItems: 'center', flexShrink: 0 }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(); }}}
            placeholder="Ask about any property or Dubai market…"
            disabled={streaming}
            style={{ flex: 1, background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, padding: '0.62rem 0.9rem', color: '#e5e7eb', fontSize: '0.83rem', fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.15s', opacity: streaming ? 0.6 : 1 }}
            onFocus={e => e.target.style.borderColor = 'rgba(255,255,255,0.25)'}
            onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.09)'}
          />
          <button
            onClick={() => ask()}
            disabled={streaming || !input.trim()}
            style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, background: !streaming && input.trim() ? '#22c55e' : '#1a1a1a', border: '1px solid rgba(255,255,255,0.09)', cursor: !streaming && input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
          >
            {streaming
              ? <span style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid #374151', borderTopColor: '#9ca3af', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
              : <span style={{ color: input.trim() ? '#000' : '#4b5563', fontSize: '1rem', lineHeight: 1 }}>↑</span>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
