import { useState, useEffect } from 'react';
import { infraService } from '../../services/infrastructure.js';
import Card from '../../components/ui/Card.jsx';

export default function RialoStream() {
  const [data, setData] = useState(infraService.getStreamPrices());
  const [count, setCount] = useState(0);
  useEffect(() => {
    const t = setInterval(() => { setData(infraService.getStreamPrices()); setCount(n=>n+1); }, 250);
    return () => clearInterval(t);
  }, []);
  const { prices } = data;

  return (
    <div style={{ padding: '1.5rem', maxWidth: 800 }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <span style={{ background: 'rgba(232,224,208,0.1)', color: 'var(--cream)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0.25rem 0.75rem', borderRadius: '100px', border: '1px solid rgba(232,224,208,0.2)' }}>Infrastructure</span>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--cream)', marginTop: '0.6rem', letterSpacing: '-0.02em' }}>Rialo Stream</h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginTop: '0.3rem' }}>Native data feeds for DeFi and RWAs — more than 40× faster than top oracles.</p>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[['250ms','Update Interval'],['40×+','Faster than Chainlink'],['~$0','Fee per Update']].map(([v,l]) => (
          <Card key={l} style={{ padding: '0.75rem 1.1rem', textAlign: 'center', minWidth: 120 }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--cream)' }}>{v}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.15rem' }}>{l}</div>
          </Card>
        ))}
      </div>
      <Card style={{ padding: '1.1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--cream)' }}>Live Price Feed</div>
          <span style={{ fontSize: '0.72rem', color: 'var(--green)', fontWeight: 600 }}>● {count} updates</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem' }}>
          {Object.entries(prices).map(([sym, price]) => (
            <div key={sym} style={{ padding: '0.85rem', background: 'rgba(232,224,208,0.04)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '0.3rem' }}>{sym}/USD</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--cream)' }}>
                ${sym==='SOL' ? price.toFixed(2) : price.toLocaleString('en',{maximumFractionDigits:0})}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--green)', marginTop: '0.2rem' }}>● live · 250ms</div>
            </div>
          ))}
        </div>
      </Card>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <Card style={{ padding: '1rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--cream)', marginBottom: '0.5rem' }}>Rialo Stream</div>
          <div style={{ height: 8, borderRadius: 4, background: 'rgba(232,224,208,0.1)', overflow: 'hidden', marginBottom: '0.3rem' }}>
            <div style={{ height: '100%', width: '2.5%', background: 'var(--cream)', borderRadius: 4 }} />
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--cream)', fontWeight: 700 }}>250ms</div>
        </Card>
        <Card style={{ padding: '1rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Chainlink (comparison)</div>
          <div style={{ height: 8, borderRadius: 4, background: 'rgba(232,224,208,0.1)', overflow: 'hidden', marginBottom: '0.3rem' }}>
            <div style={{ height: '100%', width: '100%', background: 'rgba(232,224,208,0.2)', borderRadius: 4 }} />
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 700 }}>~10,000ms</div>
        </Card>
      </div>
    </div>
  );
}
