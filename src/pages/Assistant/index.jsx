import { useState, useRef, useEffect, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════
//  MULTI-API DATA FETCHERS  (all free, no API key required)
// ═══════════════════════════════════════════════════════════════

const COINS = [
  { id: 'bitcoin',          sym: 'BTC'   },
  { id: 'ethereum',         sym: 'ETH'   },
  { id: 'solana',           sym: 'SOL'   },
  { id: 'binancecoin',      sym: 'BNB'   },
  { id: 'ripple',           sym: 'XRP'   },
  { id: 'dogecoin',         sym: 'DOGE'  },
  { id: 'cardano',          sym: 'ADA'   },
  { id: 'avalanche-2',      sym: 'AVAX'  },
  { id: 'matic-network',    sym: 'POL'   },
  { id: 'arbitrum',         sym: 'ARB'   },
  { id: 'tron',             sym: 'TRX'   },
  { id: 'chainlink',        sym: 'LINK'  },
  { id: 'polkadot',         sym: 'DOT'   },
  { id: 'uniswap',          sym: 'UNI'   },
  { id: 'litecoin',         sym: 'LTC'   },
  { id: 'tether',           sym: 'USDT'  },
  { id: 'usd-coin',         sym: 'USDC'  },
];

async function safeGet(url, timeout = 7000) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeout) });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

// 1. CoinGecko — prices, 24h change, market cap
async function fetchPrices() {
  const ids = COINS.map(c => c.id).join(',');
  const data = await safeGet(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`
  );
  if (!data) return null;
  return COINS.map(c => {
    const d = data[c.id];
    return d ? {
      sym:       c.sym,
      price:     d.usd,
      change24h: d.usd_24h_change?.toFixed(2),
      mcap:      d.usd_market_cap,
      vol24h:    d.usd_24h_vol,
    } : null;
  }).filter(Boolean);
}

// 2. CoinGecko — global market overview
async function fetchGlobalMarket() {
  const data = await safeGet('https://api.coingecko.com/api/v3/global');
  if (!data?.data) return null;
  const g = data.data;
  return {
    totalMcap:    g.total_market_cap?.usd,
    totalVol24h:  g.total_volume?.usd,
    btcDominance: g.market_cap_percentage?.btc?.toFixed(1),
    ethDominance: g.market_cap_percentage?.eth?.toFixed(1),
    activeCrypto: g.active_cryptocurrencies,
    mcapChange24h: g.market_cap_change_percentage_24h_usd?.toFixed(2),
  };
}

// 3. Alternative.me — Fear & Greed Index
async function fetchFearGreed() {
  const data = await safeGet('https://api.alternative.me/fng/?limit=2');
  if (!data?.data) return null;
  const today     = data.data[0];
  const yesterday = data.data[1];
  return {
    value:           today.value,
    label:           today.value_classification,
    yesterday:       yesterday?.value,
    yesterdayLabel:  yesterday?.value_classification,
  };
}

// 4. CoinGecko — Trending coins (top searches)
async function fetchTrending() {
  const data = await safeGet('https://api.coingecko.com/api/v3/search/trending');
  if (!data?.coins) return null;
  return data.coins.slice(0, 7).map(c => ({
    name:  c.item.name,
    sym:   c.item.symbol,
    rank:  c.item.market_cap_rank,
    thumb: c.item.small,
  }));
}

// 5. CoinGecko — Top gainers & losers (from top-200 by mcap)
async function fetchGainersLosers() {
  const data = await safeGet(
    'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&price_change_percentage=24h'
  );
  if (!Array.isArray(data)) return null;
  const sorted = [...data].sort((a, b) =>
    (b.price_change_percentage_24h ?? -999) - (a.price_change_percentage_24h ?? -999)
  );
  const gainers = sorted.slice(0, 5).map(c => ({ sym: c.symbol.toUpperCase(), change: c.price_change_percentage_24h?.toFixed(2) }));
  const losers  = sorted.slice(-5).reverse().map(c => ({ sym: c.symbol.toUpperCase(), change: c.price_change_percentage_24h?.toFixed(2) }));
  return { gainers, losers };
}

// 6. DeFiLlama — Total DeFi TVL
async function fetchDeFiTVL() {
  const data = await safeGet('https://api.llama.fi/v2/globalCharts');
  if (!Array.isArray(data) || data.length === 0) return null;
  const latest = data[data.length - 1];
  const prev   = data[data.length - 2];
  return {
    tvl:    latest?.totalLiquidityUSD,
    change: prev ? (((latest.totalLiquidityUSD - prev.totalLiquidityUSD) / prev.totalLiquidityUSD) * 100).toFixed(2) : null,
  };
}

// 7. DeFiLlama — Top protocols by TVL
async function fetchTopProtocols() {
  const data = await safeGet('https://api.llama.fi/protocols');
  if (!Array.isArray(data)) return null;
  return data.slice(0, 8).map(p => ({
    name:  p.name,
    tvl:   p.tvl,
    chain: p.chain,
  }));
}

// 8. Blockchain fees — Etherscan-compatible endpoint (public)
async function fetchGasPrices() {
  // Using Owlracle free gas endpoint
  const data = await safeGet('https://api.owlracle.info/v4/eth/gas?apikey=&eip1559=true', 5000);
  if (!data?.speeds) return null;
  return {
    slow:    data.speeds[0]?.maxFeePerGas?.toFixed(0),
    normal:  data.speeds[1]?.maxFeePerGas?.toFixed(0),
    fast:    data.speeds[2]?.maxFeePerGas?.toFixed(0),
    instant: data.speeds[3]?.maxFeePerGas?.toFixed(0),
  };
}

// 9. ExchangeRate API — USD vs major fiat currencies
async function fetchForexRates() {
  const data = await safeGet('https://open.er-api.com/v6/latest/USD');
  if (!data?.rates) return null;
  const keep = ['EUR','GBP','JPY','CNY','AED','INR','KRW','BRL','CAD','AUD'];
  return keep.map(c => ({ currency: c, rate: data.rates[c]?.toFixed(4) })).filter(r => r.rate);
}

// 10. CoinGecko — Exchange volumes
async function fetchTopExchanges() {
  const data = await safeGet('https://api.coingecko.com/api/v3/exchanges?per_page=5');
  if (!Array.isArray(data)) return null;
  return data.map(e => ({
    name:    e.name,
    vol24h:  e.trade_volume_24h_btc_normalized?.toFixed(0),
    country: e.country,
  }));
}

// ── Master fetch: run all in parallel ────────────────────────────────────────
async function fetchAllData() {
  const [prices, global, fearGreed, trending, gainersLosers, defiTvl, topProtocols, gas, forex, exchanges] = await Promise.all([
    fetchPrices(),
    fetchGlobalMarket(),
    fetchFearGreed(),
    fetchTrending(),
    fetchGainersLosers(),
    fetchDeFiTVL(),
    fetchTopProtocols(),
    fetchGasPrices(),
    fetchForexRates(),
    fetchTopExchanges(),
  ]);
  return { prices, global, fearGreed, trending, gainersLosers, defiTvl, topProtocols, gas, forex, exchanges };
}

// ── Format helpers ────────────────────────────────────────────────────────────
function fmt(n, dec = 2) {
  if (!n) return '—';
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
function fmtB(n) {
  if (!n) return '—';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toFixed(0)}`;
}

// ── Build dynamic system prompt ───────────────────────────────────────────────
function buildSystemPrompt(data) {
  const { prices, global, fearGreed, trending, gainersLosers, defiTvl, topProtocols, gas, forex, exchanges } = data || {};
  const now = new Date();
  const timeStr = now.toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  });

  let prompt = `You are the Quad Cell AI Assistant — a fast, intelligent assistant built into the Quad Cell DeFi platform.

CURRENT DATE & TIME: ${timeStr}
IMPORTANT: You have real-time market data injected below. NEVER say you lack access to live data. Always quote actual figures from this data.

`;

  // Prices
  if (prices?.length) {
    prompt += `═══ LIVE CRYPTO PRICES (updated ${now.toLocaleTimeString()}) ═══\n`;
    prices.forEach(p => {
      const priceStr = p.price > 1
        ? `$${Number(p.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : `$${Number(p.price).toFixed(6)}`;
      const chg = p.change24h ? ` (${Number(p.change24h) >= 0 ? '+' : ''}${p.change24h}% 24h)` : '';
      const mc = p.mcap ? ` | MCap: ${fmtB(p.mcap)}` : '';
      prompt += `${p.sym}: ${priceStr}${chg}${mc}\n`;
    });
    prompt += '\n';
  }

  // Global market
  if (global) {
    prompt += `═══ GLOBAL CRYPTO MARKET ═══\n`;
    prompt += `Total Market Cap: ${fmtB(global.totalMcap)} (${global.mcapChange24h >= 0 ? '+' : ''}${global.mcapChange24h}% 24h)\n`;
    prompt += `24h Volume: ${fmtB(global.totalVol24h)}\n`;
    prompt += `BTC Dominance: ${global.btcDominance}% | ETH Dominance: ${global.ethDominance}%\n`;
    prompt += `Active Cryptocurrencies: ${global.activeCrypto?.toLocaleString()}\n\n`;
  }

  // Fear & Greed
  if (fearGreed) {
    prompt += `═══ FEAR & GREED INDEX ═══\n`;
    prompt += `Today: ${fearGreed.value}/100 — ${fearGreed.label}\n`;
    if (fearGreed.yesterday) prompt += `Yesterday: ${fearGreed.yesterday}/100 — ${fearGreed.yesterdayLabel}\n`;
    prompt += `(0-25=Extreme Fear, 26-46=Fear, 47-54=Neutral, 55-75=Greed, 76-100=Extreme Greed)\n\n`;
  }

  // Gainers & Losers
  if (gainersLosers) {
    prompt += `═══ TOP GAINERS & LOSERS (24h, Top 100 by MCap) ═══\n`;
    prompt += `Gainers: ${gainersLosers.gainers?.map(c => `${c.sym} +${c.change}%`).join(', ')}\n`;
    prompt += `Losers:  ${gainersLosers.losers?.map(c => `${c.sym} ${c.change}%`).join(', ')}\n\n`;
  }

  // Trending
  if (trending?.length) {
    prompt += `═══ TRENDING COINS (most searched on CoinGecko) ═══\n`;
    prompt += trending.map(t => `${t.sym} (${t.name})${t.rank ? ` #${t.rank}` : ''}`).join(', ') + '\n\n';
  }

  // DeFi TVL
  if (defiTvl) {
    prompt += `═══ DEFI TOTAL VALUE LOCKED (DeFiLlama) ═══\n`;
    prompt += `Total DeFi TVL: ${fmtB(defiTvl.tvl)}${defiTvl.change ? ` (${defiTvl.change >= 0 ? '+' : ''}${defiTvl.change}% 24h)` : ''}\n\n`;
  }

  if (topProtocols?.length) {
    prompt += `Top DeFi Protocols by TVL: ${topProtocols.map(p => `${p.name} (${fmtB(p.tvl)})`).join(', ')}\n\n`;
  }

  // Gas
  if (gas) {
    prompt += `═══ ETHEREUM GAS PRICES (Gwei) ═══\n`;
    prompt += `Slow: ${gas.slow} | Normal: ${gas.normal} | Fast: ${gas.fast} | Instant: ${gas.instant}\n\n`;
  }

  // Forex
  if (forex?.length) {
    prompt += `═══ USD EXCHANGE RATES ═══\n`;
    prompt += forex.map(f => `1 USD = ${f.rate} ${f.currency}`).join(' | ') + '\n\n';
  }

  // Exchanges
  if (exchanges?.length) {
    prompt += `═══ TOP CRYPTO EXCHANGES (24h BTC volume normalized) ═══\n`;
    prompt += exchanges.map(e => `${e.name}: ${e.vol24h} BTC${e.country ? ` (${e.country})` : ''}`).join(', ') + '\n\n';
  }

  prompt += `═══ QUAD CELL PLATFORM KNOWLEDGE ═══

WHAT IS QUAD CELL:
Quad Cell is a full-stack DeFi terminal. It unifies perpetual futures trading, prediction markets, AI-powered payments, and real estate into one dark, fast interface.

PERPETUAL DEX: Trade BTC/ETH/SOL/POL/ARB/BNB-PERP with 1×–20× leverage. Market & Limit orders. Long/Short. Collateral: USDC.

PREDICTION MARKETS: YES/NO betting with USDT on Ethereum Sepolia. Categories: Crypto, Tech, Politics, Sports.

AI PAYMENTS: Natural language USDT transfers. "Send 250 USDT to alice.eth". Supports send, swap, schedule.

AI REAL ESTATE: Dubai & UAE property listings. Filter by type. ROI calculator, mortgage calculator, AI property advisor.

WALLET: MetaMask / Coinbase Wallet / any EIP-1193 extension. Ethereum Sepolia. Zero fees.

Be concise, data-driven, and direct. Use markdown. Always cite actual numbers from the data above.`;

  return prompt;
}

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY;

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

function MsgContent({ text }) {
  const parts = text.split(/(```[\s\S]*?```)/g);
  return (
    <div style={{ fontSize: '0.85rem', lineHeight: 1.75, color: '#c9c9c9', wordBreak: 'break-word' }}>
      {parts.map((part, pi) => {
        if (part.startsWith('```')) {
          const inner = part.slice(3, -3);
          const nl = inner.indexOf('\n');
          const lang = nl > -1 ? inner.slice(0, nl).trim() : '';
          const code = nl > -1 ? inner.slice(nl + 1) : inner;
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
              {cells.map((c, j) => <span key={j} style={{ flex: 1, color: isHeader ? '#e8e0d0' : '#c9c9c9', fontWeight: isHeader ? 700 : 400 }}><Inline text={c.trim()} /></span>)}
            </div>
          );
        }
        if (line.startsWith('### ')) return <div key={i} style={{ fontWeight: 700, fontSize: '0.9rem', color: '#e8e0d0', marginTop: '0.65rem', marginBottom: '0.15rem' }}><Inline text={line.slice(4)} /></div>;
        if (line.startsWith('## '))  return <div key={i} style={{ fontWeight: 800, fontSize: '0.95rem', color: '#e8e0d0', marginTop: '0.75rem', marginBottom: '0.2rem' }}><Inline text={line.slice(3)} /></div>;
        if (line.startsWith('# '))   return <div key={i} style={{ fontWeight: 800, fontSize: '1rem', color: '#e8e0d0', marginTop: '0.85rem', marginBottom: '0.25rem' }}><Inline text={line.slice(2)} /></div>;
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

const QUICK = [
  'crypto price',
  'Fear & Greed index?',
  'Top gainers today?',
  'ETH gas price now?',
  'Total DeFi TVL?',
  'BTC dominance?',
  'Trending coins?',
  'Top DeFi protocols?',
  'USD to AED rate?',
  'What is Quad Cell?',
  'How to trade perps?',
  'Dubai property ROI?',
];

function msgTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const WELCOME = {
  id: 'w0', role: 'ai', time: Date.now(),
  text: "Hey! I'm the **Quad Cell AI Assistant** — powered by Groq's ultra-fast LPU.\n\nI can help with **anything**: Quad Cell features, DeFi concepts, crypto, coding, math, or general questions.\n\nWhat would you like to know?",
};

export default function AssistantPage() {
  const [messages,  setMessages]  = useState([WELCOME]);
  const [input,     setInput]     = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error,     setError]     = useState(null);
  const [liveData,  setLiveData]  = useState({});        // all API data
  const [dataAge,   setDataAge]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const historyRef = useRef([]);

  // Fetch ALL data on mount + every 90 seconds
  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchAllData();
      setLiveData(data);
      setDataAge(Date.now());
      setLoading(false);
    }
    load();
    const interval = setInterval(load, 90_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const ask = useCallback(async (overrideQ) => {
    const query = (overrideQ ?? input).trim();
    if (!query || streaming) return;
    setInput('');
    setError(null);
    inputRef.current?.focus();

    setMessages(m => [...m, { id: `u${Date.now()}`, role: 'user', text: query, time: Date.now() }]);
    historyRef.current.push({ role: 'user', content: query });

    const msgs = [{ role: 'system', content: buildSystemPrompt(liveData) }, ...historyRef.current.slice(-24)];
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
      setError(
        e.message.includes('429') || e.message.includes('Rate limit')
          ? 'Rate limit hit — wait ~20 seconds and try again'
          : e.message.includes('401') ? 'Invalid API key — check VITE_GROQ_API_KEY in .env'
          : e.message
      );
      historyRef.current.pop();
    }
    setStreaming(false);
  }, [input, streaming, liveData]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0a0a0a', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.75rem 1.25rem', background: '#0f0f0f', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, #1e293b, #0f172a)', border: '2px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem' }}>🧠</div>
          <span style={{ position: 'absolute', bottom: 1, right: 1, width: 9, height: 9, borderRadius: '50%', background: '#22c55e', border: '2px solid #0f0f0f' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#e8e0d0' }}>Quad Cell Assistant</div>
          <div style={{ fontSize: '0.7rem', color: streaming ? '#f59e0b' : '#22c55e', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: streaming ? '#f59e0b' : '#22c55e', display: 'inline-block' }} />
            {streaming ? 'Thinking…' : 'Online · Ask me anything'}
          </div>
        </div>
        <div style={{ fontSize: '0.68rem', color: '#374151', fontFamily: 'monospace', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* Live data status pill */}
          <span style={{
            background: liveData.prices ? 'rgba(34,197,94,0.1)' : loading ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${liveData.prices ? 'rgba(34,197,94,0.3)' : loading ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: liveData.prices ? '#22c55e' : loading ? '#f59e0b' : '#f87171',
            borderRadius: 100, padding: '0.18rem 0.6rem', fontSize: '0.65rem', fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '0.3rem'
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block', animation: liveData.prices ? 'blink 2s infinite' : 'none' }} />
            {loading ? 'Fetching data…' : liveData.prices ? `Live · ${new Date(dataAge).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Offline'}
          </span>
          <span style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, padding: '0.15rem 0.45rem' }}>Qwen 27B</span>
          <span style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, padding: '0.15rem 0.45rem' }}>Groq LPU</span>
        </div>
      </div>

      {/* ── Live data ticker strip ── */}
      <div style={{ background: '#080808', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0', overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 0 }}>

        {/* Row 1: Prices */}
        {liveData.prices && (
          <div style={{ display: 'flex', gap: '0', padding: '0.22rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.04)', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {liveData.prices.map(p => {
              const up = Number(p.change24h) >= 0;
              return (
                <div key={p.sym} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0, padding: '0 0.75rem', borderRight: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: '0.64rem', fontWeight: 700, color: '#6b7280', fontFamily: 'monospace' }}>{p.sym}</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#e8e0d0', fontFamily: 'monospace' }}>
                    {p.price > 1
                      ? `$${Number(p.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : `$${Number(p.price).toFixed(4)}`}
                  </span>
                  {p.change24h && (
                    <span style={{ fontSize: '0.6rem', fontWeight: 700, color: up ? '#22c55e' : '#ef4444' }}>
                      {up ? '▲' : '▼'}{Math.abs(p.change24h)}%
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Row 2: Market stats + Fear & Greed + DeFi TVL */}
        <div style={{ display: 'flex', gap: '1rem', padding: '0.22rem 1.25rem', overflowX: 'auto', scrollbarWidth: 'none', alignItems: 'center' }}>
          {liveData.global && (
            <>
              <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '0.6rem', color: '#4b5563' }}>MCap</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#9ca3af', fontFamily: 'monospace' }}>{fmtB(liveData.global.totalMcap)}</span>
                <span style={{ fontSize: '0.6rem', fontWeight: 700, color: Number(liveData.global.mcapChange24h) >= 0 ? '#22c55e' : '#ef4444' }}>
                  {Number(liveData.global.mcapChange24h) >= 0 ? '▲' : '▼'}{Math.abs(liveData.global.mcapChange24h)}%
                </span>
              </div>
              <span style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
              <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
                <span style={{ fontSize: '0.6rem', color: '#4b5563' }}>BTC.D</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#f59e0b', fontFamily: 'monospace' }}>{liveData.global.btcDominance}%</span>
              </div>
              <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
                <span style={{ fontSize: '0.6rem', color: '#4b5563' }}>Vol</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#9ca3af', fontFamily: 'monospace' }}>{fmtB(liveData.global.totalVol24h)}</span>
              </div>
            </>
          )}
          {liveData.fearGreed && (
            <>
              <span style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
              <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '0.6rem', color: '#4b5563' }}>F&G</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, fontFamily: 'monospace',
                  color: liveData.fearGreed.value >= 75 ? '#22c55e' : liveData.fearGreed.value >= 55 ? '#86efac' : liveData.fearGreed.value >= 47 ? '#fbbf24' : liveData.fearGreed.value >= 26 ? '#f97316' : '#ef4444'
                }}>
                  {liveData.fearGreed.value} · {liveData.fearGreed.label}
                </span>
              </div>
            </>
          )}
          {liveData.defiTvl && (
            <>
              <span style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
              <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
                <span style={{ fontSize: '0.6rem', color: '#4b5563' }}>DeFi TVL</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#60a5fa', fontFamily: 'monospace' }}>{fmtB(liveData.defiTvl.tvl)}</span>
              </div>
            </>
          )}
          {liveData.gas?.fast && (
            <>
              <span style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
              <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
                <span style={{ fontSize: '0.6rem', color: '#4b5563' }}>Gas</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#a78bfa', fontFamily: 'monospace' }}>{liveData.gas.fast} Gwei</span>
              </div>
            </>
          )}
          {liveData.gainersLosers?.gainers?.length > 0 && (
            <>
              <span style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
              <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
                <span style={{ fontSize: '0.6rem', color: '#4b5563' }}>🔥</span>
                <span style={{ fontSize: '0.6rem', color: '#22c55e', fontFamily: 'monospace' }}>
                  {liveData.gainersLosers.gainers.slice(0,3).map(g => `${g.sym} +${g.change}%`).join(' · ')}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', scrollbarWidth: 'thin', scrollbarColor: '#1f2937 transparent' }}>
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
            <div key={msg.id} style={{ display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: '0.5rem', marginBottom: prevRole === msg.role ? '0.04rem' : '0.3rem' }}>
              {!isUser && (
                <div style={{ width: 28, height: 28, flexShrink: 0 }}>
                  {showMeta && <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #1e293b, #0f172a)', border: '1px solid rgba(255,255,255,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>🧠</div>}
                </div>
              )}
              <div style={{ maxWidth: '76%', display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', gap: '0.1rem' }}>
                {showMeta && !isUser && <div style={{ fontSize: '0.65rem', color: '#4b5563', paddingLeft: '0.1rem', display: 'flex', gap: '0.4rem' }}><span style={{ fontWeight: 600, color: '#6b7280' }}>Quad Cell AI</span><span>{msgTime(msg.time)}</span></div>}
                {isUser && <div style={{ fontSize: '0.65rem', color: '#374151', paddingRight: '0.1rem' }}>{msgTime(msg.time)}</div>}
                <div style={{ padding: '0.65rem 0.9rem', borderRadius: isUser ? '16px 16px 4px 16px' : '4px 16px 16px 16px', background: isUser ? 'linear-gradient(135deg, #14532d, #166534)' : '#181818', border: `1px solid ${isUser ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.07)'}`, boxShadow: '0 1px 4px rgba(0,0,0,0.5)', minWidth: 36 }}>
                  {isUser ? (
                    <span style={{ fontSize: '0.85rem', color: '#dcfce7', lineHeight: 1.65 }}>{msg.text}</span>
                  ) : msg.text ? (
                    <>
                      <MsgContent text={msg.text} />
                      {msg.streaming && <span style={{ display: 'inline-block', width: 2, height: '0.85em', background: '#6b7280', marginLeft: 2, verticalAlign: 'text-bottom', animation: 'blink 0.7s infinite' }} />}
                    </>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.28rem', alignItems: 'center', padding: '0.1rem 0' }}>
                      {[0,1,2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#374151', display: 'inline-block', animation: `blink 1.3s ${i*0.2}s infinite` }} />)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '0.6rem 0.9rem', fontSize: '0.79rem', color: '#fca5a5', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <span style={{ flexShrink: 0 }}>⚠</span><span>{error}</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick questions */}
      <div style={{ padding: '0.5rem 1.25rem', display: 'flex', gap: '0.38rem', overflowX: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', background: '#0d0d0d', flexShrink: 0, scrollbarWidth: 'none' }}>
        {QUICK.map(q => (
          <button key={q} onClick={() => ask(q)} disabled={streaming} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '100px', padding: '0.24rem 0.76rem', fontSize: '0.7rem', color: '#6b7280', cursor: streaming ? 'default' : 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.12s', opacity: streaming ? 0.4 : 1 }}
            onMouseEnter={e => { if (!streaming) { e.currentTarget.style.color='#d1d5db'; e.currentTarget.style.borderColor='rgba(255,255,255,0.22)'; }}}
            onMouseLeave={e => { e.currentTarget.style.color='#6b7280'; e.currentTarget.style.borderColor='rgba(255,255,255,0.09)'; }}
          >{q}</button>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: '0.8rem 1.25rem', background: '#0f0f0f', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: '0.6rem', alignItems: 'center', flexShrink: 0 }}>
        <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(); }}} placeholder="Ask anything…" disabled={streaming}
          style={{ flex: 1, background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '0.7rem 1rem', color: '#e5e7eb', fontSize: '0.88rem', fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.15s', opacity: streaming ? 0.6 : 1 }}
          onFocus={e => e.target.style.borderColor = 'rgba(255,255,255,0.28)'}
          onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
        />
        <button onClick={() => ask()} disabled={streaming || !input.trim()}
          style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: !streaming && input.trim() ? '#22c55e' : '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', cursor: !streaming && input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}>
          {streaming
            ? <span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid #374151', borderTopColor: '#9ca3af', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
            : <span style={{ color: input.trim() ? '#000' : '#4b5563', fontSize: '1.05rem', lineHeight: 1 }}>↑</span>
          }
        </button>
      </div>
    </div>
  );
}
