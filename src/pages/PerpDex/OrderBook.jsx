import { useEffect, useState } from 'react';
import { perpDexService } from '../../services/perpDex.js';

export default function OrderBook({ pair }) {
  const [book, setBook] = useState({ asks: [], bids: [], mid: 0 });
  useEffect(() => {
    const refresh = () => perpDexService.getOrderBook(pair).then(setBook);
    refresh();
    const t = setInterval(refresh, 600);
    return () => clearInterval(t);
  }, [pair]);

  const maxSize = Math.max(...book.asks.map(a=>a.size), ...book.bids.map(b=>b.size), 1);
  const fmt = (n) => n >= 100 ? n.toLocaleString('en',{maximumFractionDigits:1}) : n.toFixed(4);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.75rem', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0.6rem', color: 'var(--muted)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>
        <span>Price</span><span>Size</span>
      </div>
      {/* Asks */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {[...book.asks].reverse().slice(0,10).map((a,i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.22rem 0.6rem', position: 'relative', cursor: 'default' }}>
            <div style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: `${(a.size/maxSize)*100}%`, background: 'rgba(248,113,113,0.07)' }} />
            <span style={{ color: 'var(--red)', fontWeight: 600, position: 'relative' }}>{fmt(a.price)}</span>
            <span style={{ color: 'var(--muted)', position: 'relative' }}>{a.size.toFixed(3)}</span>
          </div>
        ))}
      </div>
      {/* Spread */}
      <div style={{ padding: '0.35rem 0.6rem', background: 'rgba(232,224,208,0.04)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', textAlign: 'center', fontWeight: 800, color: 'var(--cream)', fontSize: '0.82rem' }}>
        {fmt(book.mid)}
      </div>
      {/* Bids */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {book.bids.slice(0,10).map((b,i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.22rem 0.6rem', position: 'relative', cursor: 'default' }}>
            <div style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: `${(b.size/maxSize)*100}%`, background: 'rgba(232,224,208,0.05)' }} />
            <span style={{ color: 'var(--cream)', fontWeight: 600, position: 'relative' }}>{fmt(b.price)}</span>
            <span style={{ color: 'var(--muted)', position: 'relative' }}>{b.size.toFixed(3)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
