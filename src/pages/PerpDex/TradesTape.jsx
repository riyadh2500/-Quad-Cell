import { useEffect, useState, useRef } from 'react';
import { perpDexService } from '../../services/perpDex.js';

function fmtPrice(n) {
  if (n >= 1000) return n.toLocaleString('en', { maximumFractionDigits: 1 });
  if (n >= 1)    return n.toFixed(2);
  return n.toFixed(4);
}

function fmtTime(ts) {
  const d = new Date(ts);
  return d.getHours().toString().padStart(2,'0') + ':'
       + d.getMinutes().toString().padStart(2,'0') + ':'
       + d.getSeconds().toString().padStart(2,'0');
}

export default function TradesTape({ pair }) {
  const [trades, setTrades]   = useState([]);
  const [newId,  setNewId]    = useState(null);
  const prevFirst = useRef(null);

  useEffect(() => {
    const load = async () => {
      const t = await perpDexService.getTrades(pair, 30);
      setTrades(t);
      if (t.length && t[0].id !== prevFirst.current) {
        setNewId(t[0].id);
        prevFirst.current = t[0].id;
        setTimeout(() => setNewId(null), 600);
      }
    };
    load();
    const interval = setInterval(load, 1200);
    return () => clearInterval(interval);
  }, [pair]);

  return (
    <div style={{ fontSize: '0.72rem' }}>
      {/* Header */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
        padding: '0.35rem 0.75rem', color: 'var(--muted)', fontWeight: 600,
        borderBottom: '1px solid var(--border)',
      }}>
        <span>Price</span><span style={{ textAlign: 'right' }}>Size</span><span style={{ textAlign: 'right' }}>Time</span>
      </div>

      <div style={{ maxHeight: 150, overflowY: 'auto' }}>
        {trades.map(tr => (
          <div
            key={tr.id}
            style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
              padding: '0.18rem 0.75rem',
              borderBottom: '1px solid rgba(255,255,255,0.025)',
              background: tr.id === newId
                ? (tr.side === 'buy' ? 'rgba(212,212,212,0.06)' : 'rgba(248,113,113,0.06)')
                : 'transparent',
              transition: 'background 0.4s',
            }}
          >
            <span style={{ color: tr.side === 'buy' ? 'var(--cream)' : 'var(--red)', fontWeight: 600, fontFamily: 'monospace' }}>
              {fmtPrice(tr.price)}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.45)', textAlign: 'right' }}>
              {tr.size.toFixed(3)}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.28)', textAlign: 'right' }}>
              {fmtTime(tr.time)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
