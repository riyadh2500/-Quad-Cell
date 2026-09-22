import { useState } from 'react';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';

const EXAMPLES = {
  'Send Payment': `// Rialo AI Payment\nconst agent = new RialoAgent();\nconst result = await agent.pay({\n  command: "Send 100 USDC to alice.eth",\n  route:   "rialo-interop",\n  gas:     "cruise",\n});\nconsole.log(result.txHash, result.latencyMs);`,
  'Open Position': `// Rialo Perpetual DEX\nconst dex = new RialoDex();\nconst pos = await dex.openPosition({\n  pair:       "BTC/USDC",\n  side:       "long",\n  collateral: 500,\n  leverage:   10,\n});\nconsole.log(pos.entryPrice, pos.liqPrice);`,
  'Conditional Tx': `// Rialo Reactive Transaction\nconst workflow = new RialoWorkflow();\nawait workflow.addConditional({\n  trigger: "BTC.price > 100000",\n  action:  async () => dex.buy("BTC", 0.01),\n  latency: "nanosecond",\n  gas:     "cruise",\n});`,
  'Stream Oracle': `// Rialo Stream — 40x faster than Chainlink\nconst stream = new RialoStream();\nstream.subscribe(["BTC","ETH","SOL"], (update) => {\n  // Fires every 250ms\n  console.log(update.symbol, update.price);\n});`,
};

export default function Playground() {
  const [selected, setSelected] = useState('Send Payment');
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);

  async function run() {
    setRunning(true); setOutput('');
    const lines = [
      '> Connecting to Rialo Testnet…',
      '> ✓ Connected — block time 50ms',
      '> Executing script…',
      '> ✓ Success — txHash: 0x'+Math.random().toString(16).slice(2,18),
      '> ✓ Latency: '+(Math.random()*40+10).toFixed(1)+'ms',
      '> Fee: $0.00  (Rialo Cruise)',
    ];
    for (const line of lines) {
      await new Promise(r => setTimeout(r, 220));
      setOutput(o => o+line+'\n');
    }
    setRunning(false);
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1000 }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--cream)', letterSpacing: '-0.02em' }}>Playground</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.2rem' }}>Experiment with Rialo SDK examples — no setup required.</p>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {Object.keys(EXAMPLES).map(k => (
          <button key={k} onClick={() => { setSelected(k); setOutput(''); }} style={{ padding: '0.4rem 0.9rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: selected===k?'rgba(232,224,208,0.1)':'transparent', border: '1px solid '+(selected===k?'rgba(232,224,208,0.25)':'var(--border)'), color: selected===k?'var(--cream)':'var(--muted)', fontSize: '0.82rem', fontWeight: 600 }}>{k}</button>
        ))}
      </div>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>rialo-sdk · JavaScript · Testnet</span>
          <Button variant="green" size="sm" onClick={run} disabled={running}>{running ? '⟳ Running…' : '▶ Run'}</Button>
        </div>
        <pre style={{ margin: 0, padding: '1rem', fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--cream)', background: 'rgba(0,0,0,0.5)', overflowX: 'auto', lineHeight: 1.7, minHeight: 160 }}>{EXAMPLES[selected]}</pre>
        {output && (
          <>
            <div style={{ height: 1, background: 'var(--border)' }} />
            <pre style={{ margin: 0, padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--green)', background: 'rgba(0,0,0,0.6)', whiteSpace: 'pre-wrap' }}>{output}</pre>
          </>
        )}
      </Card>
    </div>
  );
}
