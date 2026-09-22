import { useState } from 'react';
import { infraService } from '../../services/infrastructure.js';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';

export default function RialoEdge() {
  const [url, setUrl] = useState('https://api.coingecko.com/api/v3/ping');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const call = async () => { setLoading(true); const r = await infraService.simulateEdgeCall(url); setResult(r); setLoading(false); };

  return (
    <div style={{ padding: '1.5rem', maxWidth: 800 }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <span style={{ background: 'rgba(232,224,208,0.1)', color: 'var(--cream)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0.25rem 0.75rem', borderRadius: '100px', border: '1px solid rgba(232,224,208,0.2)' }}>Infrastructure</span>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--cream)', marginTop: '0.6rem', letterSpacing: '-0.02em' }}>Rialo Edge</h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginTop: '0.3rem' }}>Bidirectional Web2 interactivity without middleware — more than 100k concurrent web calls.</p>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[['100k+','Concurrent Calls'],['No middleware','Direct Web2'],['~$0','Per Call']].map(([v,l]) => (
          <Card key={l} style={{ padding: '0.75rem 1.1rem', textAlign: 'center', minWidth: 110 }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--cream)' }}>{v}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.15rem' }}>{l}</div>
          </Card>
        ))}
      </div>
      <Card style={{ padding: '1.25rem', marginBottom: '1rem' }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--cream)', marginBottom: '0.85rem' }}>Simulate Native Web Call</div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input value={url} onChange={e => setUrl(e.target.value)} style={{ flex: 1, background: 'rgba(0,0,0,0.45)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.6rem 0.9rem', color: 'var(--text)', fontSize: '0.82rem', fontFamily: 'monospace', outline: 'none' }} />
          <Button variant="primary" size="sm" onClick={call} disabled={loading}>{loading ? '…' : 'Call'}</Button>
        </div>
      </Card>
      {result && (
        <Card style={{ padding: '1.1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontWeight: 700, color: 'var(--cream)', fontSize: '0.88rem' }}>Response</span>
            <span style={{ color: 'var(--green)', fontSize: '0.82rem', fontWeight: 700 }}>{result.status} OK · {result.latency}ms</span>
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--cream)', background: 'rgba(0,0,0,0.4)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', wordBreak: 'break-all' }}>
            {result.body}
          </div>
        </Card>
      )}
    </div>
  );
}
