import { useEffect, useState } from 'react';
import { perpDexService } from '../../services/perpDex.js';

export default function PairSelector({ selected, onChange }) {
  const [pairs, setPairs] = useState([]);
  useEffect(() => {
    perpDexService.getPairs().then(setPairs);
    const t = setInterval(() => perpDexService.getPairs().then(setPairs), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ display: 'flex', gap: '0.25rem', overflowX: 'auto', padding: '0 0 0.25rem' }}>
      {pairs.map(p => {
        const active = p.symbol === selected;
        const pos = p.change24h >= 0;
        return (
          <button key={p.symbol} onClick={() => onChange(p.symbol)} style={{
            flexShrink: 0, padding: '0.5rem 0.85rem', borderRadius: 'var(--radius-sm)',
            background: active ? 'rgba(232,224,208,0.1)' : 'transparent',
            border: active ? '1px solid rgba(232,224,208,0.25)' : '1px solid transparent',
            cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.1rem',
          }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: active ? 'var(--cream)' : 'var(--muted)' }}>{p.symbol}</span>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text)' }}>
                ${p.price >= 100 ? p.price.toLocaleString('en', {maximumFractionDigits:0}) : p.price.toFixed(4)}
              </span>
              <span style={{ fontSize: '0.68rem', color: pos ? 'var(--green)' : 'var(--red)' }}>
                {pos?'+':''}{p.change24h.toFixed(2)}%
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
