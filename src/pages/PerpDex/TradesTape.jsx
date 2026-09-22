import { useEffect, useState } from 'react';
import { perpDexService } from '../../services/perpDex.js';

export default function TradesTape({ pair }) {
  const [trades, setTrades] = useState([]);
  useEffect(() => {
    const refresh = () => perpDexService.getTrades(pair).then(t => setTrades(t.slice(0,15)));
    refresh();
    const t = setInterval(refresh, 1500);
    return () => clearInterval(t);
  }, [pair]);

  return (
    <div style={{ fontSize: '0.73rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0.6rem', color: 'var(--muted)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>
        <span>Price</span><span>Size</span><span>Time</span>
      </div>
      <div style={{ maxHeight: 200, overflowY: 'auto' }}>
        {trades.map(tr => {
          const ago = Math.floor((Date.now()-tr.time)/1000);
          return (
            <div key={tr.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.22rem 0.6rem', borderBottom: '1px solid rgba(232,224,208,0.03)' }}>
              <span style={{ color: tr.side==='buy'?'var(--cream)':'var(--red)', fontWeight: 600 }}>
                {tr.price >= 100 ? tr.price.toLocaleString('en',{maximumFractionDigits:1}) : tr.price.toFixed(4)}
              </span>
              <span style={{ color: 'var(--muted)' }}>{tr.size.toFixed(3)}</span>
              <span style={{ color: 'var(--muted)' }}>{ago}s</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
