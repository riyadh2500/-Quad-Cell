import { useEffect, useState } from 'react';
import { perpDexService } from '../../services/perpDex.js';

export default function PairSelector({ selected, onChange }) {
  const [pairs, setPairs] = useState([]);

  useEffect(() => {
    const load = () => perpDexService.getPairs().then(setPairs);
    load();
    const t = setInterval(load, 1500);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ display: 'flex', gap: '0.2rem', overflowX: 'auto', padding: '0.1rem 0' }}>
      {pairs.map(p => {
        const active = p.symbol === selected;
        const up     = p.change24h >= 0;
        return (
          <button
            key={p.symbol}
            onClick={() => onChange(p.symbol)}
            style={{
              flexShrink: 0, padding: '0.45rem 0.9rem', borderRadius: '8px',
              background: active ? 'rgba(212,212,212,0.1)' : 'transparent',
              border: `1px solid ${active ? 'rgba(212,212,212,0.3)' : 'transparent'}`,
              cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.1rem',
              transition: 'all 0.12s',
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(212,212,212,0.05)'; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: active ? 'var(--cream)' : 'rgba(255,255,255,0.55)', letterSpacing: '0.01em' }}>
              {p.symbol}
            </span>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: active ? '#fff' : 'rgba(255,255,255,0.6)' }}>
                {p.price >= 1000
                  ? `$${p.price.toLocaleString('en', { maximumFractionDigits: 0 })}`
                  : p.price >= 1
                  ? `$${p.price.toFixed(2)}`
                  : `$${p.price.toFixed(4)}`}
              </span>
              <span style={{ fontSize: '0.65rem', fontWeight: 600, color: up ? 'var(--green)' : 'var(--red)' }}>
                {up ? '+' : ''}{p.change24h.toFixed(2)}%
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
