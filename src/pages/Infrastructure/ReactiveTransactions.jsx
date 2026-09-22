import { useState } from 'react';
import { infraService } from '../../services/infrastructure.js';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Card from '../../components/ui/Card.jsx';

export default function ReactiveTransactions() {
  const [condition, setCondition] = useState('BTC price > $100,000');
  const [action, setAction] = useState('Buy 0.01 BTC');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function execute() {
    setLoading(true);
    const res = await infraService.executeConditionalTx(condition, action);
    setResult(res);
    setLoading(false);
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: 800 }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <span style={{ background: 'rgba(232,224,208,0.1)', color: 'var(--cream)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0.25rem 0.75rem', borderRadius: '100px', border: '1px solid rgba(232,224,208,0.2)' }}>Infrastructure</span>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--cream)', marginTop: '0.6rem', letterSpacing: '-0.02em' }}>Reactive Transactions</h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginTop: '0.3rem' }}>Conditional transactions via Rialo Execution Engine — nanosecond latency from trigger to confirmation.</p>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[['0.000001s','Reaction Time'],['50ms','Block Time'],['~$0','Execution Fee']].map(([v,l]) => (
          <Card key={l} style={{ padding: '0.75rem 1.1rem', textAlign: 'center', minWidth: 110 }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--cream)' }}>{v}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.15rem' }}>{l}</div>
          </Card>
        ))}
      </div>
      <Card style={{ padding: '1.25rem', marginBottom: '1rem' }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--cream)', marginBottom: '1rem' }}>Build a Conditional Transaction</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <Input label="Trigger Condition" value={condition} onChange={e => setCondition(e.target.value)} placeholder="e.g. BTC price > $100,000" />
          <Input label="Action to Execute" value={action} onChange={e => setAction(e.target.value)} placeholder="e.g. Buy 0.01 BTC" />
          <Button variant="primary" onClick={execute} disabled={loading}>{loading ? 'Executing…' : 'Simulate Execution'}</Button>
        </div>
      </Card>
      {result && (
        <Card style={{ padding: '1.1rem', background: 'var(--green-dim)', border: '1px solid rgba(16,185,129,0.25)' }}>
          <div style={{ fontWeight: 700, color: 'var(--green)', marginBottom: '0.5rem' }}>✓ Execution Complete</div>
          <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {[['Condition',result.condition],['Action',result.action],['Latency',result.latencyMs.toFixed(3)+'ms ('+result.latencyNs.toFixed(0)+'ns)'],['Tx Hash',result.txHash]].map(([k,v]) => (
              <div key={k} style={{ display: 'flex', gap: '0.5rem' }}>
                <span style={{ color: 'var(--muted)', minWidth: 80, flexShrink: 0 }}>{k}:</span>
                <span style={{ color: 'var(--text)', fontFamily: k==='Tx Hash'?'monospace':'inherit', wordBreak:'break-all' }}>{v}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
