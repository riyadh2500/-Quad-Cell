import Card from '../../components/ui/Card.jsx';

const LINKS = [
  { label:'Developer Portal', url:'https://rialo.io/for-devs', desc:'Architecture overview, primitives, and getting started' },
  { label:'Agentic Harness', url:'https://agents.rialo.io', desc:'AI agent framework with confidential on-chain execution' },
  { label:'Enterprise Docs', url:'https://enterprise.rialo.io', desc:'Institutional features, RWA tokenization, and compliance' },
  { label:'Concurrency Demo', url:'https://concurrency-control.learn.rialo.io', desc:"Visualize Rialo's hybrid concurrency control" },
];

const SNIPPETS = [
  { title:'Initialize Rialo Client', code:`import { RialoClient } from '@rialo/sdk';\n\nconst client = new RialoClient({\n  network: 'mainnet',\n  cruise:  true,    // zero gas fees\n});` },
  { title:'Subscribe to Price Stream', code:`const stream = client.stream();\n// 250ms updates — 40x faster than Chainlink\nstream.subscribe(['BTC','ETH','SOL'], (tick) => {\n  console.log(tick.symbol, tick.price);\n});` },
  { title:'Reactive Transaction', code:`await client.workflow.addConditional({\n  when: 'BTC.price > 100000',\n  then: () => client.dex.buy('BTC', 0.01),\n  maxLatency: 'nanosecond',\n  gas: 'cruise',\n});` },
  { title:'AI Payment (Natural Language)', code:`const agent = client.agent();\nawait agent.pay({\n  command: 'Send 100 USDC to alice.eth',\n  route:   'rialo-interop',\n  privacy: 'ipc',\n});` },
];

export default function Developers() {
  return (
    <div style={{ padding: '1.5rem', maxWidth: 900 }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--cream)', letterSpacing: '-0.02em' }}>Developers</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.2rem' }}>Resources, docs, and code snippets for building on Rialo.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.75rem' }}>
        {LINKS.map(l => (
          <a key={l.label} href={l.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
            <Card lift style={{ padding: '1rem', height: '100%', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <div style={{ fontWeight: 700, color: 'var(--cream)', fontSize: '0.85rem' }}>{l.label} →</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', lineHeight: 1.5 }}>{l.desc}</div>
            </Card>
          </a>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {SNIPPETS.map(s => (
          <Card key={s.title} style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--border)', fontSize: '0.78rem', fontWeight: 600, color: 'var(--cream)', background: 'rgba(0,0,0,0.3)' }}>{s.title}</div>
            <pre style={{ margin: 0, padding: '0.85rem 1rem', fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--cream)', background: 'rgba(0,0,0,0.5)', overflowX: 'auto', lineHeight: 1.6 }}>{s.code}</pre>
          </Card>
        ))}
      </div>
    </div>
  );
}
