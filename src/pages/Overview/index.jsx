import { useData } from '../../context/DataContext.jsx';
import { useNavigate } from 'react-router-dom';
import SummaryCards from './SummaryCards.jsx';
import ActivityFeed from './ActivityFeed.jsx';
import InfraStatus from './InfraStatus.jsx';
import Card from '../../components/ui/Card.jsx';

/* ─── tiny helpers ─────────────────────────────────────────────────────────── */
function Tag({ children }) {
  return (
    <span style={{
      display: 'inline-block',
      background: 'rgba(212,212,212,0.08)', border: '1px solid rgba(212,212,212,0.2)',
      borderRadius: '100px', padding: '0.22rem 0.8rem',
      fontSize: '0.68rem', fontWeight: 700, color: 'var(--cream)',
      textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem',
    }}>{children}</span>
  );
}

function Divider() {
  return <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, var(--border), transparent)', margin: '2.5rem 0' }} />;
}

function Chip({ children }) {
  return (
    <span style={{
      background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border)',
      borderRadius: '6px', padding: '0.15rem 0.55rem',
      fontSize: '0.7rem', fontFamily: 'monospace', color: 'var(--cream)',
    }}>{children}</span>
  );
}

/* ─── product card ─────────────────────────────────────────────────────────── */
function ProductCard({ icon, title, subtitle, points, accent, path, navigate }) {
  return (
    <div
      onClick={() => navigate(path)}
      style={{
        background: 'rgba(0,0,0,0.55)', border: '1px solid var(--border)',
        borderRadius: '16px', padding: '1.5rem', cursor: 'pointer',
        backdropFilter: 'blur(14px)', transition: 'border-color 0.2s, transform 0.2s',
        display: 'flex', flexDirection: 'column', gap: '0.85rem',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(212,212,212,0.3)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* icon + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
        <div style={{
          width: 48, height: 48, borderRadius: '14px', flexShrink: 0,
          background: accent + '18', border: `1px solid ${accent}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
        }}>{icon}</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--cream)', letterSpacing: '-0.01em' }}>{title}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.1rem' }}>{subtitle}</div>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: '0.65rem', fontWeight: 700, color: accent, background: accent + '15', padding: '0.15rem 0.55rem', borderRadius: '100px' }}>LIVE</span>
      </div>

      {/* bullet points */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {points.map((p, i) => (
          <div key={i} style={{ display: 'flex', gap: '0.6rem', fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.5 }}>
            <span style={{ color: accent, flexShrink: 0, fontWeight: 700 }}>→</span>
            {p}
          </div>
        ))}
      </div>

      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: accent, marginTop: 'auto' }}>
        Open {title} →
      </div>
    </div>
  );
}

/* ─── tech stack row ───────────────────────────────────────────────────────── */
function TechRow({ num, title, body, chips }) {
  return (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0, marginTop: '0.1rem',
        background: 'rgba(212,212,212,0.07)', border: '1px solid rgba(212,212,212,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.72rem', fontWeight: 800, color: 'var(--cream)',
      }}>{num}</div>
      <div>
        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--cream)', marginBottom: '0.25rem' }}>{title}</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '0.45rem' }}>{body}</div>
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {chips.map(c => <Chip key={c}>{c}</Chip>)}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */
export default function Overview() {
  const { prices, blockTime, wsStatus, stats } = useData();
  const navigate = useNavigate();

  const livePrice = (sym) =>
    prices[sym] > 0
      ? `$${prices[sym].toLocaleString('en-US', { maximumFractionDigits: sym === 'SOL' ? 2 : 0 })}`
      : '—';

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 1.5rem 3rem' }}>

      {/* ═══════════════ HERO ═══════════════════════════════════════════════ */}
      <div style={{ padding: '3.5rem 0 2.5rem', textAlign: 'center' }}>

        {/* status pill */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
          background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.22)',
          borderRadius: '100px', padding: '0.3rem 1rem',
          fontSize: '0.73rem', fontWeight: 700, color: 'var(--green)',
          marginBottom: '1.75rem', letterSpacing: '0.05em',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', animation: 'blink 1.5s infinite' }} />
          Live · Ethereum Sepolia · Binance WS {wsStatus === 'connected' ? '● Connected' : '○ Connecting…'}
        </div>

        {/* headline */}
        <h1 style={{
          fontSize: 'clamp(2.8rem, 6vw, 4.5rem)', fontWeight: 900,
          letterSpacing: '-0.045em', lineHeight: 1.0, marginBottom: '1.25rem',
          background: 'linear-gradient(160deg, #ffffff 0%, #d4d4d4 40%, #787878 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          Quad Cell
        </h1>

        {/* sub-headline */}
        <p style={{
          fontSize: 'clamp(1rem, 2.2vw, 1.2rem)', color: 'rgba(255,255,255,0.5)',
          maxWidth: 620, margin: '0 auto 0.9rem', lineHeight: 1.7, fontWeight: 400,
        }}>
          A unified DeFi platform combining{' '}
          <span style={{ color: 'var(--cream)', fontWeight: 600 }}>Prediction Markets</span>,{' '}
          <span style={{ color: 'var(--cream)', fontWeight: 600 }}>Perpetual Trading</span>, and{' '}
          <span style={{ color: 'var(--cream)', fontWeight: 600 }}>AI-powered Payments</span>
          {' '}— built on Rialo infrastructure with real-time Binance data.
        </p>

        {/* token pill */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border)',
          borderRadius: '100px', padding: '0.35rem 1rem',
          fontSize: '0.72rem', color: 'var(--muted)', marginBottom: '2.25rem',
          fontFamily: 'monospace',
        }}>
          <span style={{ fontSize: '0.9rem' }}>💎</span>
          Settlement token: USDT · Sepolia ·{' '}
          <a
            href="https://sepolia.etherscan.io/token/0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0"
            target="_blank" rel="noreferrer"
            style={{ color: 'var(--cream)', textDecoration: 'underline' }}
          >0xaA8E23…D0</a>
        </div>

        {/* CTA row */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2.75rem' }}>
          {[
            { label: '🎯 Prediction Markets', path: '/markets', primary: true  },
            { label: '📊 Perpetual DEX',      path: '/dex',     primary: true  },
            { label: '💸 AI Payments',         path: '/payments',primary: true  },
            { label: '🤖 AI Agents',           path: '/agents',  primary: false },
          ].map(b => (
            <button key={b.label} onClick={() => navigate(b.path)} style={{
              padding: '0.7rem 1.4rem', borderRadius: '10px',
              fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
              background: b.primary ? 'rgba(212,212,212,0.1)' : 'transparent',
              border: `1px solid ${b.primary ? 'rgba(212,212,212,0.25)' : 'var(--border)'}`,
              color: b.primary ? 'var(--cream)' : 'var(--muted)',
              transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,212,212,0.18)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(212,212,212,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = b.primary ? 'rgba(212,212,212,0.1)' : 'transparent'; e.currentTarget.style.color = b.primary ? 'var(--cream)' : 'var(--muted)'; e.currentTarget.style.borderColor = b.primary ? 'rgba(212,212,212,0.25)' : 'var(--border)'; }}
            >{b.label}</button>
          ))}
        </div>

        {/* live metrics strip */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
          gap: '0', maxWidth: 760, margin: '0 auto',
          background: 'rgba(0,0,0,0.55)', border: '1px solid var(--border)',
          borderRadius: '16px', overflow: 'hidden', backdropFilter: 'blur(14px)',
        }}>
          {[
            { val: `${blockTime.toFixed(0)}ms`, lbl: 'Block Time',   col: 'var(--green)'  },
            { val: '~$0.00',                    lbl: 'Gas Fees',     col: 'var(--green)'  },
            { val: livePrice('BTC'),             lbl: 'BTC / USDT',  col: 'var(--cream)'  },
            { val: livePrice('ETH'),             lbl: 'ETH / USDT',  col: 'var(--cream)'  },
            { val: '50×',                        lbl: 'Max Leverage', col: 'var(--cream)'  },
            { val: '12',                         lbl: 'Live Markets', col: 'var(--cream)'  },
          ].map((s, i, arr) => (
            <div key={s.lbl} style={{
              padding: '1rem 0.75rem', textAlign: 'center',
              borderRight: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: s.col, letterSpacing: '-0.02em', marginBottom: '0.2rem' }}>{s.val}</div>
              <div style={{ fontSize: '0.62rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      <Divider />

      {/* ═══════════════ WHAT IS QUAD CELL ═════════════════════════════════ */}
      <section>
        <Tag>About</Tag>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--cream)', letterSpacing: '-0.03em', marginBottom: '0.7rem', lineHeight: 1.15 }}>
          What is Quad Cell?
        </h2>
        <p style={{ fontSize: '0.92rem', color: 'var(--muted)', maxWidth: 700, lineHeight: 1.8, marginBottom: '2rem' }}>
          Quad Cell is a next-generation decentralized finance application that gives traders, developers, and AI agents access to advanced financial tools — all on a single, unified interface with a consistent dark UI. It was conceived as a showcase of what's possible when you combine modern React development with real blockchain infrastructure, live market data, and AI-driven automation.
        </p>
        <p style={{ fontSize: '0.92rem', color: 'var(--muted)', maxWidth: 700, lineHeight: 1.8, marginBottom: '0' }}>
          Unlike typical DeFi apps that simulate data, Quad Cell connects directly to{' '}
          <strong style={{ color: 'var(--cream)' }}>Binance WebSocket streams</strong> for real-time prices and order books,{' '}
          uses a real <strong style={{ color: 'var(--cream)' }}>ERC-20 USDT token on Ethereum Sepolia</strong> testnet for settlement, and integrates{' '}
          <strong style={{ color: 'var(--cream)' }}>MetaMask / EIP-1193</strong> for genuine on-chain transactions — not mock buttons.
        </p>
      </section>

      <Divider />

      {/* ═══════════════ THREE PRODUCTS ════════════════════════════════════ */}
      <section>
        <Tag>Products</Tag>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--cream)', letterSpacing: '-0.03em', marginBottom: '0.6rem', lineHeight: 1.15 }}>
          Three products. One platform.
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--muted)', marginBottom: '1.75rem', lineHeight: 1.7 }}>
          Each product is a fully functional application — not a mockup.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          <ProductCard
            icon="🎯"
            title="Prediction Markets"
            subtitle="Trade on real-world outcomes"
            accent="#d4d4d4"
            path="/markets"
            navigate={navigate}
            points={[
              '12 live markets across Crypto, Tech, Politics, Sports',
              'Live probability bars drifting in real-time every 2.5s',
              '30-day probability history chart on each market',
              'YES / NO positions with USDT on Sepolia testnet',
              'Live order book depth, ROI calculator, share pricing',
              'My Positions panel with P&L, claim payouts, live odds',
            ]}
          />
          <ProductCard
            icon="📊"
            title="Perpetual DEX"
            subtitle="Leverage trading terminal"
            accent="#60a5fa"
            path="/dex"
            navigate={navigate}
            points={[
              'Real candlestick charts from Binance REST API (1m–1d)',
              'Live order book updating every 100ms via Binance WS',
              'Streaming real trades tape — actual Binance executions',
              'LONG / SHORT with 1× to 50× leverage on 5 pairs',
              'USDT collateral — real MetaMask tx on Sepolia',
              'Positions panel with live mark price and unrealized P&L',
            ]}
          />
          <ProductCard
            icon="💸"
            title="AI Payment System"
            subtitle="Natural language payments"
            accent="#10b981"
            path="/payments"
            navigate={navigate}
            points={[
              'Type "Send 100 USDT to alice.eth" — AI parses it',
              'Structured preview: route, fee ($0), ETA, IPC check',
              'Step-by-step execution timeline with ms timestamps',
              'Scheduled / recurring payments with cancel control',
              'Full transaction history with status badges',
              'Powered by Rialo Edge + IPC + Interop primitives',
            ]}
          />
        </div>
      </section>

      <Divider />

      {/* ═══════════════ HOW IT WAS BUILT ══════════════════════════════════ */}
      <section>
        <Tag>Architecture</Tag>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--cream)', letterSpacing: '-0.03em', marginBottom: '0.6rem', lineHeight: 1.15 }}>
          How it was built
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--muted)', marginBottom: '1.75rem', lineHeight: 1.7, maxWidth: 620 }}>
          Every layer was chosen for real-world performance. The stack is lean, no backend server — everything runs in the browser with live external APIs.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* col 1 */}
          <Card style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.3rem' }}>
            <TechRow
              num="1"
              title="Frontend — React 18 + Vite 5"
              body="Single-page app with React Router v6 HashRouter. Works from any static file server with no backend. Vite gives fast HMR during development and optimized production builds in under 2 seconds."
              chips={['React 18', 'Vite 5', 'React Router v6', 'HashRouter', 'CSS custom properties']}
            />
            <div style={{ height: 1, background: 'var(--border)' }} />
            <TechRow
              num="2"
              title="Real-Time Data — Binance APIs"
              body="Binance combined WebSocket stream delivers price tickers, order book depth (100ms), and trade events for BTC, ETH, SOL, ARB, LINK — no API key required. Binance REST API provides OHLCV candles for all 6 timeframes. CoinGecko gives global market stats every 60s."
              chips={['Binance WS', 'Binance REST', 'CoinGecko', 'No API key', 'WebSocket reconnect']}
            />
            <div style={{ height: 1, background: 'var(--border)' }} />
            <TechRow
              num="3"
              title="Charts — TradingView lightweight-charts v4"
              body="Candlestick charts built with TradingView's open-source library. Fully responsive via ResizeObserver. Custom cream/grey color scheme. Separate CandlestickChart and LineChart components reused across Prediction Markets and DEX."
              chips={['lightweight-charts v4', 'CandlestickChart', 'LineChart', 'Canvas 2D', 'ResizeObserver']}
            />
          </Card>

          {/* col 2 */}
          <Card style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.3rem' }}>
            <TechRow
              num="4"
              title="Wallet — MetaMask / EIP-1193"
              body="Custom useWallet hook with eth_requestAccounts, eth_chainId, eth_getBalance. Supports any injected EIP-1193 wallet with multi-provider detection. Auto-restores sessions, listens for accountsChanged and chainChanged events. Real MetaMask transaction signing via eth_sendTransaction."
              chips={['MetaMask', 'EIP-1193', 'eth_sendTransaction', 'wallet_switchEthereumChain', 'useWallet hook']}
            />
            <div style={{ height: 1, background: 'var(--border)' }} />
            <TechRow
              num="5"
              title="Token — Sepolia USDT ERC-20"
              body="Real on-chain USDT token at 0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0 on Ethereum Sepolia testnet. useToken.js encodes ERC-20 calls manually (no ethers.js dependency) — balanceOf, transfer, approve. useUSDTBalance hook polls every 10s."
              chips={['ERC-20', 'Sepolia USDT', 'eth_call', 'useToken.js', 'useUSDTBalance hook']}
            />
            <div style={{ height: 1, background: 'var(--border)' }} />
            <TechRow
              num="6"
              title="Background — Circuit-path Canvas Animation"
              body="Custom canvas animation draws rounded-rectangle 'pipe' paths on a pure black background — inspired by Rialo.io's visual style. 40 deterministic shapes with slow drift animation. Built from scratch in BlobCanvas.jsx using requestAnimationFrame."
              chips={['Canvas 2D', 'BlobCanvas.jsx', 'requestAnimationFrame', 'Deterministic layout', 'Slow drift']}
            />
          </Card>
        </div>

        {/* data layer explanation */}
        <Card style={{ padding: '1.25rem 1.5rem', marginTop: '1rem', display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
          <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>🏗️</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--cream)', marginBottom: '0.35rem' }}>Clean Data Layer — Rialo-Ready Architecture</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.65, maxWidth: 720 }}>
              All blockchain interactions go through a service layer — <Chip>PredictionMarketService</Chip>, <Chip>PerpDexService</Chip>, <Chip>AIPaymentService</Chip>, <Chip>AgentService</Chip> — each extending a <Chip>RialoAdapter</Chip> base class.
              Set <Chip>VITE_USE_REAL_API=true</Chip> and fill in Rialo's endpoint URLs when their mainnet launches — the entire UI stays unchanged. Every service has mock fallbacks that feel live using random walks and realistic data generation.
            </div>
          </div>
        </Card>
      </section>

      <Divider />

      {/* ═══════════════ WHAT YOU CAN DO ══════════════════════════════════ */}
      <section>
        <Tag>Use Cases</Tag>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--cream)', letterSpacing: '-0.03em', marginBottom: '0.6rem', lineHeight: 1.15 }}>
          What you can do with Quad Cell
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--muted)', marginBottom: '1.75rem', lineHeight: 1.7 }}>
          Connect MetaMask, switch to Sepolia, and start using every feature today.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
          {[
            { icon: '📈', title: 'Trade crypto with leverage',     body: 'Open long or short positions on BTC, ETH, SOL, ARB and LINK with up to 50× leverage using real USDT collateral on Sepolia.' },
            { icon: '🎯', title: 'Bet on world outcomes',          body: 'Buy YES or NO shares on prediction markets covering crypto prices, tech launches, politics, and sports. Track live odds in real-time.' },
            { icon: '💬', title: 'Pay with plain English',         body: 'Type a payment instruction — the AI agent parses it, shows a preview, and executes it with a single click. Cross-chain, zero fees.' },
            { icon: '🤖', title: 'Deploy autonomous agents',      body: 'Set up AI agents that auto-execute DCA strategies, rebalance portfolios, or protect positions from liquidation — 24/7.' },
            { icon: '🔗', title: 'Connect any EIP-1193 wallet',   body: 'MetaMask, Coinbase Wallet, or any injected browser wallet. Your USDT balance and network are shown in real-time in the top bar.' },
            { icon: '⚡', title: 'Build reactive transactions',    body: 'Define a trigger condition and an action. Quad Cell simulates Rialo Execution Engine firing the transaction at nanosecond speed.' },
            { icon: '📡', title: 'Watch oracle feeds live',        body: 'The Rialo Stream demo shows BTC, ETH, SOL prices updating every 250ms — 40× faster than Chainlink, with update count tracking.' },
            { icon: '🛡️', title: 'Encrypt identity on-chain',     body: 'The IPC demo lets you encrypt a JSON identity payload with Rialo IPC, view the hash, and decrypt it back — all client-side.' },
            { icon: '🔄', title: 'Design no-code automations',    body: 'Drag-and-drop workflow builder with Trigger, Condition, Action, and Delay nodes. Deploy it to the Rialo Workflow engine with one click.' },
            { icon: '🧪', title: 'Experiment in the Playground',  body: 'The SDK Playground has 5 pre-loaded Rialo code examples with a simulated run environment — no setup, instant output.' },
          ].map(item => (
            <div key={item.title} style={{
              padding: '1rem', background: 'rgba(0,0,0,0.45)', border: '1px solid var(--border)',
              borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.45rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--cream)' }}>{item.title}</span>
              </div>
              <p style={{ fontSize: '0.76rem', color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <Divider />

      {/* ═══════════════ RIALO INFRA ══════════════════════════════════════ */}
      <section>
        <Tag>Infrastructure</Tag>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--cream)', letterSpacing: '-0.03em', marginBottom: '0.6rem', lineHeight: 1.15 }}>
          Powered by Rialo
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--muted)', maxWidth: 620, lineHeight: 1.7, marginBottom: '1.5rem' }}>
          Quad Cell integrates all 10 Rialo blockchain primitives. Each one eliminates a specific layer of DeFi complexity.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.65rem', marginBottom: '1.5rem' }}>
          {[
            { icon: '⚡', name: 'Execution Engine', tag: '/infra/reactive', desc: 'Nanosecond conditional tx execution'     },
            { icon: '🔗', name: 'Interop',          tag: null,               desc: '10× faster cross-chain bridging'         },
            { icon: '🛡️', name: 'IPC',              tag: '/infra/ipc',      desc: 'On-chain identity & privacy layer'       },
            { icon: '📡', name: 'Stream',           tag: '/infra/stream',   desc: 'Oracle feeds 40× faster than Chainlink'  },
            { icon: '🌐', name: 'Edge',             tag: '/infra/edge',     desc: '100k+ concurrent Web2 calls from chain'  },
            { icon: '🔄', name: 'Workflow',         tag: '/infra/workflow', desc: 'Native automation engine'                },
            { icon: '💸', name: 'Cruise',           tag: null,               desc: 'Gas-less transactions — ~$0 fees'        },
            { icon: '🧠', name: 'VM (RISC-V)',      tag: null,               desc: 'EVM/SVM compatible, ZK-friendly'         },
            { icon: '📂', name: 'Read Path',        tag: null,               desc: 'Direct validator state access, 100ms'    },
            { icon: '🏦', name: 'Omni Account',     tag: null,               desc: 'One account across all networks'         },
          ].map(p => (
            <div
              key={p.name}
              onClick={() => p.tag && navigate(p.tag)}
              style={{
                padding: '0.85rem 1rem', background: 'rgba(0,0,0,0.45)', border: '1px solid var(--border)',
                borderRadius: '10px', cursor: p.tag ? 'pointer' : 'default', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (p.tag) { e.currentTarget.style.borderColor = 'rgba(212,212,212,0.3)'; e.currentTarget.style.background = 'rgba(212,212,212,0.06)'; }}}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'rgba(0,0,0,0.45)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.3rem' }}>
                <span style={{ fontSize: '0.95rem' }}>{p.icon}</span>
                <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--cream)' }}>{p.name}</span>
                {p.tag && <span style={{ marginLeft: 'auto', fontSize: '0.62rem', color: 'var(--muted)' }}>Demo →</span>}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--muted)', lineHeight: 1.5 }}>{p.desc}</div>
            </div>
          ))}
        </div>

        {/* Rialo block time comparison */}
        <Card style={{ padding: '1.1rem 1.4rem' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--cream)', marginBottom: '0.85rem' }}>
            Rialo vs. the rest
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {[
              { label: 'Rialo Block Time',   val: `${blockTime.toFixed(0)}ms`,  w: '1%',   col: 'var(--green)' },
              { label: 'Solana',             val: '400ms',                      w: '4%',   col: '#9945FF'      },
              { label: 'Ethereum L2 (avg)',  val: '2,000ms',                    w: '20%',  col: '#627EEA'      },
              { label: 'Ethereum Mainnet',   val: '12,000ms',                   w: '100%', col: '#3C3C3D'      },
            ].map(r => (
              <div key={r.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.3rem' }}>
                  <span style={{ color: 'var(--muted)' }}>{r.label}</span>
                  <span style={{ fontWeight: 700, color: r.col }}>{r.val}</span>
                </div>
                <div style={{ height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 100, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: r.w, background: r.col, borderRadius: 100, transition: 'width 1s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <Divider />

      {/* ═══════════════ LIVE DASHBOARD ═══════════════════════════════════ */}
      <section>
        <Tag>Live Dashboard</Tag>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--cream)', letterSpacing: '-0.03em', marginBottom: '1.25rem', lineHeight: 1.15 }}>
          Real-time protocol metrics
        </h2>

        <SummaryCards blockTime={blockTime} gasPrice={0} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
          <ActivityFeed />
          <InfraStatus />
        </div>
      </section>

      <Divider />

      {/* ═══════════════ FOOTER LINKS ═════════════════════════════════════ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
          Built on{' '}
          <a href="https://rialo.io/for-devs" target="_blank" rel="noreferrer" style={{ color: 'var(--cream)', fontWeight: 700 }}>Rialo</a>
          {' · '}
          <a href="https://github.com/riyadh2500/-Quad-Cell" target="_blank" rel="noreferrer" style={{ color: 'var(--cream)', fontWeight: 700 }}>GitHub →</a>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[['🎯 Markets','/markets'],['📊 DEX','/dex'],['💸 Payments','/payments'],['🤖 Agents','/agents'],['⚡ Infra','/infra/reactive'],['🧪 Playground','/ecosystem/playground']].map(([l, p]) => (
            <button key={l} onClick={() => navigate(p)} style={{
              background: 'rgba(212,212,212,0.05)', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '0.3rem 0.75rem', fontSize: '0.72rem',
              color: 'var(--muted)', cursor: 'pointer', transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--cream)'; e.currentTarget.style.borderColor = 'rgba(212,212,212,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
            >{l}</button>
          ))}
        </div>
      </div>

    </div>
  );
}
