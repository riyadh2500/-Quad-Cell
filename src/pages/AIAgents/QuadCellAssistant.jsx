import { useState, useRef, useEffect } from 'react';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';

// ── Platform knowledge base ──────────────────────────────────────────────────
const KB = [
  // Overview
  { keys: ['what is quad cell', 'quad cell', 'about', 'platform', 'overview', 'introduction'],
    answer: `**Quad Cell** is an all-in-one DeFi terminal built on the Rialo infrastructure stack. It gives you:

• **Perp DEX** — Trade perpetual futures on BTC, ETH, SOL and more with leverage up to 20×
• **Prediction Markets** — Bet on real-world outcomes (crypto, tech, politics, sports) with USDT
• **AI Payment Agent** — Send, schedule, and swap tokens via natural language commands
• **AI Agents** — Autonomous bots that trade, optimise yield, guard positions, and more
• **Ecosystem** — Playground, developer tools, and third-party app integrations
• **Infrastructure** — Rialo Edge, IPC, Stream, Workflow, and Reactive Transactions

Everything runs with zero fees powered by Rialo Interop.` },

  // Perp DEX
  { keys: ['perp', 'dex', 'perpetual', 'futures', 'trade', 'leverage', 'long', 'short', 'order', 'position'],
    answer: `**Perp DEX** lets you trade perpetual futures:

• Pairs: BTC-PERP, ETH-PERP, SOL-PERP, MATIC-PERP, ARB-PERP, BNB-PERP
• Leverage: 1× – 20× (adjust with the slider in Order Entry)
• Order types: Market and Limit
• Sides: Long (betting price goes up) or Short (betting price goes down)
• Collateral token: USDC
• Live order book, trades tape, and candlestick/line chart
• Open positions shown in the Positions Panel with unrealised P&L

To open a trade: select a pair → choose Long/Short → set leverage & size → click Open Long/Short.` },

  // Prediction Markets
  { keys: ['prediction', 'market', 'bet', 'yes', 'no', 'outcome', 'resolve', 'oracle', 'probability'],
    answer: `**Prediction Markets** let you trade on real-world outcomes:

• Categories: Crypto, Technology, Politics, Sports
• Each market has a YES and NO side with live probability percentages
• You buy shares using USDT on Ethereum Sepolia testnet
• Payout: if your side resolves correctly you receive \`amount / price\` USDT back
• Resolution source: **Rialo Stream Oracle** — tamper-proof on-chain data feeds
• Order book visible on each market detail page
• Your open positions appear in **My Positions** tab
• Markets show 30-day probability history chart

To trade: click a market → choose YES or NO → enter USDT amount → Confirm & Send.` },

  // AI Payment Agent
  { keys: ['payment', 'send', 'transfer', 'usdt', 'usdc', 'ai payment', 'command', 'schedule', 'swap', 'agent payment'],
    answer: `**AI Payment Agent** lets you move tokens using natural language:

• Type commands like: *"Send 100 USDT to 0xAbc…"* or *"Schedule weekly 50 USDT to bob.eth"*
• Or paste a **wallet address (0x…)** directly — the agent will ask how much to send
• Token: USDT on Ethereum Sepolia testnet
• Network: auto-switches to Sepolia when you confirm
• Fees: **$0.00** via Rialo Cruise
• Supported actions: send, swap, schedule (daily / weekly / monthly)
• Transaction history and scheduled payments shown on the right panel
• Real MetaMask transaction fired on confirm — you'll see the popup

Steps: paste address → type amount → review preview → Confirm & Send.` },

  // AI Agents
  { keys: ['ai agent', 'bot', 'dca', 'yield', 'liquidation', 'sentiment', 'autonomous', 'automate', 'pause', 'resume'],
    answer: `**AI Agents** are autonomous bots running 24/7:

| Agent | What it does |
|---|---|
| **DCA Bot Alpha** | Buys $50 USDT of BTC every Monday at 9am UTC |
| **Yield Optimizer** | Moves funds to the highest APY protocol automatically |
| **Liquidation Guard** | Adds collateral when your perp liquidation risk > 80% |
| **News Sentiment Trader** | Trades on on-chain sentiment signals |
| **Quad Cell Assistant** | Answers any question about the platform (that's me!) |

Each agent has:
• A spending limit to cap risk
• Trigger conditions (schedule, price event, condition)
• Full action history log
• Pause / Resume control

Click any agent card to see details and history.` },

  // Infrastructure
  { keys: ['infrastructure', 'rialo', 'edge', 'ipc', 'stream', 'workflow', 'reactive', 'interop', 'tech', 'stack'],
    answer: `**Quad Cell Infrastructure** is powered by the Rialo stack:

• **Rialo Edge** — Sub-50ms transaction routing with confidential on-chain execution
• **Rialo IPC** (Inter-Protocol Communication) — Cross-chain message passing without bridges
• **Rialo Stream** — Real-time oracle feeds for prices, news, and on-chain events
• **Rialo Workflow** — Declarative multi-step automation for complex DeFi sequences
• **Reactive Transactions** — Event-driven transactions that trigger automatically on conditions
• **Rialo Interop** — Zero-fee cross-chain asset movement

The infrastructure section shows live status, latency metrics, and node health for each component.` },

  // Ecosystem
  { keys: ['ecosystem', 'playground', 'developer', 'app', 'application', 'integration', 'sdk', 'api'],
    answer: `**Ecosystem** section has three areas:

• **Applications** — Third-party DeFi apps integrated with Quad Cell infrastructure
• **Developers** — SDK docs, API references, and code examples for building on Rialo
• **Playground** — Interactive sandbox to test Rialo IPC calls, stream subscriptions, and workflow scripts without touching real funds

Great starting point if you're building on top of Quad Cell.` },

  // Wallet
  { keys: ['wallet', 'connect', 'metamask', 'sepolia', 'balance', 'disconnect', 'network', 'chain'],
    answer: `**Wallet connection** on Quad Cell:

• Click **Connect Wallet** in the top-right of any page
• Supports MetaMask, Coinbase Wallet, and any EIP-1193 browser wallet
• The app auto-switches to **Ethereum Sepolia testnet** when you send USDT or place a prediction market bet
• Once connected, the top bar shows your address, ETH balance, and network
• Click your address pill → dropdown shows USDT balance, network switcher, copy address, view on explorer, and disconnect
• Sepolia USDT contract: \`0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0\`` },

  // Navigation
  { keys: ['navigate', 'sidebar', 'menu', 'page', 'section', 'go to', 'where', 'find', 'how to open'],
    answer: `**Navigation** in Quad Cell:

The **left sidebar** has all main sections:
• 📊 Overview — dashboard with activity feed and infra status
• ⚡ Perp DEX — perpetual futures trading
• 🔮 Prediction Markets — outcome betting
• 💸 AI Payments — natural language payment agent
• 🤖 AI Agents — autonomous trading bots
• 🌐 Ecosystem — apps, devs, playground
• 🏗 Infrastructure — Rialo infra status

Click the **☰ hamburger** in the top-left to collapse/expand the sidebar.` },

  // Fees
  { keys: ['fee', 'cost', 'free', 'charge', 'gas', 'zero fee'],
    answer: `**Fees on Quad Cell:**

• Trading fees on Perp DEX: **$0.00** via Rialo Cruise
• Prediction market fees: **$0.00**
• AI Payment transfers: **$0.00** via Rialo Interop
• Gas: handled by Rialo Edge for most operations
• On Ethereum Sepolia (testnet): standard ETH gas applies for USDT transfers — get free Sepolia ETH from a faucet like sepoliafaucet.com` },

  // How to start
  { keys: ['start', 'begin', 'new', 'first time', 'getting started', 'how do i', 'help'],
    answer: `**Getting started with Quad Cell:**

1. Click **Connect Wallet** (top-right) and approve in MetaMask
2. Switch to **Ethereum Sepolia** testnet — the app will prompt you automatically
3. Get test ETH from a Sepolia faucet (sepoliafaucet.com) for gas
4. Get test USDT from the Sepolia USDT faucet or swap ETH
5. Explore the **Overview** page to see the live activity feed
6. Try the **Perp DEX** for a paper trade
7. Browse **Prediction Markets** and place a small bet
8. Use the **AI Payment Agent** — just type a command or paste an address

Ask me anything specific about any feature!` },
];

// ── Simple local answer engine ───────────────────────────────────────────────
function findAnswer(query) {
  const q = query.toLowerCase();
  // Score each KB entry by how many keys match
  let best = null, bestScore = 0;
  for (const entry of KB) {
    let score = 0;
    for (const key of entry.keys) {
      if (q.includes(key)) score += key.split(' ').length; // longer matches score more
    }
    if (score > bestScore) { bestScore = score; best = entry; }
  }
  if (best && bestScore > 0) return best.answer;
  return `I don't have a specific answer for that yet. Try asking about:\n\n• Perp DEX trading\n• Prediction Markets\n• AI Payment Agent\n• AI Agents\n• Wallet connection\n• Infrastructure (Rialo Edge, IPC, Stream)\n• Ecosystem & Developer tools\n• Fees & getting started`;
}

// ── Render markdown-lite (bold + bullet + table) ─────────────────────────────
function MsgText({ text }) {
  const lines = text.split('\n');
  return (
    <div style={{ lineHeight: 1.65 }}>
      {lines.map((line, i) => {
        // Table row
        if (line.startsWith('|')) {
          const cells = line.split('|').filter(c => c.trim() && !c.match(/^[-\s]+$/));
          if (!cells.length) return null;
          const isHeader = lines[i + 1]?.startsWith('|---');
          return (
            <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.15rem', fontSize: '0.8rem' }}>
              {cells.map((c, j) => (
                <span key={j} style={{ flex: 1, color: isHeader ? 'var(--cream)' : 'var(--text)', fontWeight: isHeader ? 700 : 400, borderBottom: isHeader ? '1px solid var(--border)' : 'none', paddingBottom: isHeader ? '0.2rem' : 0 }}>
                  <InlineText text={c.trim()} />
                </span>
              ))}
            </div>
          );
        }
        // Separator row
        if (line.match(/^\|[-| ]+\|?$/)) return null;
        // Bullet
        if (line.startsWith('• ') || line.startsWith('* ')) {
          return <div key={i} style={{ paddingLeft: '0.75rem', marginBottom: '0.1rem', fontSize: '0.82rem', color: 'var(--text)' }}>{'• '}<InlineText text={line.slice(2)} /></div>;
        }
        // Heading (** at start of line)
        if (line.startsWith('**') && line.endsWith('**')) {
          return <div key={i} style={{ fontWeight: 800, color: 'var(--cream)', fontSize: '0.88rem', marginTop: i > 0 ? '0.5rem' : 0, marginBottom: '0.2rem' }}>{line.slice(2, -2)}</div>;
        }
        // Empty
        if (!line.trim()) return <div key={i} style={{ height: '0.3rem' }} />;
        // Normal
        return <div key={i} style={{ fontSize: '0.82rem', color: 'var(--text)', marginBottom: '0.05rem' }}><InlineText text={line} /></div>;
      })}
    </div>
  );
}

function InlineText({ text }) {
  // Handle **bold** and `code`
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**')) return <strong key={i} style={{ color: 'var(--cream)', fontWeight: 700 }}>{p.slice(2, -2)}</strong>;
        if (p.startsWith('`') && p.endsWith('`')) return <code key={i} style={{ fontFamily: 'monospace', fontSize: '0.78rem', background: 'rgba(212,212,212,0.08)', padding: '0.05rem 0.3rem', borderRadius: 3, color: 'var(--cream)' }}>{p.slice(1, -1)}</code>;
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

// ── Suggested quick questions ─────────────────────────────────────────────────
const QUICK_Q = [
  'What is Quad Cell?',
  'How do I trade on the Perp DEX?',
  'How do Prediction Markets work?',
  'How do I send USDT?',
  'What AI agents are available?',
  'What is Rialo infrastructure?',
  'Are there any fees?',
  'How do I get started?',
];

const WELCOME_MSG = {
  id: 'w0', role: 'ai', time: Date.now(),
  text: `Hi! I'm the **Quad Cell Assistant** — I know everything about this platform.\n\nAsk me about trading, payments, agents, infrastructure, fees, or anything else. You can also tap a quick question below.`,
};

// ── Main component ────────────────────────────────────────────────────────────
export default function QuadCellAssistant({ onBack }) {
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const bottomRef               = useRef(null);
  const inputRef                = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  function addMsg(role, text) {
    setMessages(m => [...m, { id: `m${Date.now() + Math.random()}`, role, text, time: Date.now() }]);
  }

  async function ask(q) {
    const query = (q || input).trim();
    if (!query || loading) return;
    setInput('');
    inputRef.current?.focus();
    addMsg('user', query);
    setLoading(true);
    // Small delay to feel natural
    await new Promise(r => setTimeout(r, 320 + Math.random() * 280));
    addMsg('ai', findAnswer(query));
    setLoading(false);
  }

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 780, height: '100%', boxSizing: 'border-box' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
        <Button variant="ghost" size="sm" onClick={onBack}>← Back</Button>
        <div style={{ width: 38, height: 38, borderRadius: '10px', background: 'linear-gradient(135deg, rgba(212,212,212,0.15), rgba(212,212,212,0.05))', border: '1px solid rgba(212,212,212,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>🧠</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--cream)' }}>Quad Cell Assistant</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
            Always active · Full platform knowledge
          </div>
        </div>
      </div>

      {/* Chat area */}
      <Card style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {messages.map(msg => (
            <div key={msg.id} style={{ display: 'flex', gap: '0.5rem', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end' }}>
              {msg.role === 'ai' && (
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(212,212,212,0.2), rgba(212,212,212,0.06))', border: '1px solid rgba(212,212,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0 }}>🧠</div>
              )}
              <div style={{
                maxWidth: '82%', padding: '0.65rem 0.9rem', borderRadius: msg.role === 'user' ? 'var(--radius) var(--radius) 4px var(--radius)' : 'var(--radius) var(--radius) var(--radius) 4px',
                background: msg.role === 'user' ? 'rgba(232,224,208,0.1)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${msg.role === 'user' ? 'rgba(232,224,208,0.2)' : 'var(--border)'}`,
              }}>
                <MsgText text={msg.text} />
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(212,212,212,0.2), rgba(212,212,212,0.06))', border: '1px solid rgba(212,212,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>🧠</div>
              <div style={{ padding: '0.65rem 0.9rem', borderRadius: 'var(--radius) var(--radius) var(--radius) 4px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--muted)', display: 'inline-block', animation: `blink 1.2s ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Quick questions */}
        <div style={{ padding: '0.5rem 1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.4rem', overflowX: 'auto', flexShrink: 0 }}>
          {QUICK_Q.map(q => (
            <button key={q} onClick={() => ask(q)} disabled={loading} style={{
              background: 'rgba(212,212,212,0.05)', border: '1px solid var(--border)',
              borderRadius: '100px', padding: '0.22rem 0.7rem',
              fontSize: '0.7rem', color: 'var(--muted)', cursor: 'pointer',
              whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.12s',
              opacity: loading ? 0.5 : 1,
            }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--cream)'; e.currentTarget.style.borderColor = 'rgba(212,212,212,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.6rem', flexShrink: 0 }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && ask()}
            placeholder="Ask anything about Quad Cell…"
            disabled={loading}
            style={{
              flex: 1, background: 'rgba(0,0,0,0.45)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
              padding: '0.6rem 1rem', color: 'var(--text)',
              fontSize: '0.88rem', fontFamily: 'inherit', outline: 'none',
              opacity: loading ? 0.6 : 1,
            }}
          />
          <Button variant="primary" size="sm" onClick={() => ask()} disabled={loading || !input.trim()}>
            Ask
          </Button>
        </div>
      </Card>

      {/* Info footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.72rem', color: 'var(--muted)', flexShrink: 0 }}>
        <span style={{ background: 'rgba(212,212,212,0.07)', border: '1px solid var(--border)', borderRadius: 4, padding: '0.1rem 0.45rem', fontFamily: 'monospace' }}>Built-in</span>
        No wallet required · No spend limit · Powered by Rialo Agentic Edge Harness
      </div>
    </div>
  );
}
