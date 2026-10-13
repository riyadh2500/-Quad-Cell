import { useEffect, useState, useRef } from 'react';
import { perpDexService } from '../../services/perpDex.js';

function fmtPrice(n) {
  if (n >= 1000) return n.toLocaleString('en', { maximumFractionDigits: 1 });
  if (n >= 1)    return n.toFixed(2);
  return n.toFixed(4);
}

export default function OrderBook({ pair, onPriceClick }) {
  const [book,   setBook]   = useState({ asks: [], bids: [], mid: 0 });
  const [spread, setSpread] = useState(0);
  const prevMid = useRef(0);
  const [flash,  setFlash]  = useState(null); // 'up' | 'down'

  useEffect(() => {
    const load = async () => {
      const b = await perpDexService.getOrderBook(pair);
      setBook(b);
      const newMid = b.mid || 0;
      if (prevMid.current > 0 && newMid !== prevMid.current) {
        setFlash(newMid > prevMid.current ? 'up' : 'down');
        setTimeout(() => setFlash(null), 400);
      }
      prevMid.current = newMid;
      if (b.asks.length && b.bids.length) {
        setSpread(Math.abs(b.asks[0].price - b.bids[0].price));
      }
    };
    load();
    const t = setInterval(load, 500);
    return () => clearInterval(t);
  }, [pair]);

  const allSizes = [...book.asks.map(a => a.size), ...book.bids.map(b => b.size)];
  const maxSize  = allSizes.length ? Math.max(...allSizes) : 1;
  const asks10   = [...book.asks].sort((a, b) => a.price - b.price).slice(0, 12).reverse();
  const bids10   = [...book.bids].sort((a, b) => b.price - a.price).slice(0, 12);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', fontSize: '0.73rem' }}>

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        padding: '0.4rem 0.75rem', color: 'var(--muted)', fontWeight: 600,
        borderBottom: '1px solid var(--border)', flexShrink: 0,
      }}>
        <span>Price (USDT)</span>
        <span>Size</span>
        <span>Total</span>
      </div>

      {/* Asks (sell orders) — red */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        {asks10.map((a, i) => {
          const total = asks10.slice(i).reduce((s, x) => s + x.size, 0);
          return (
            <div
              key={i}
              onClick={() => onPriceClick && onPriceClick(a.price)}
              style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0.75rem', position: 'relative', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: `${(a.size / maxSize) * 100}%`, background: 'rgba(248,113,113,0.08)' }} />
              <span style={{ color: 'var(--red)', fontWeight: 600, position: 'relative', fontFamily: 'monospace' }}>{fmtPrice(a.price)}</span>
              <span style={{ color: 'rgba(255,255,255,0.5)', position: 'relative' }}>{a.size.toFixed(3)}</span>
              <span style={{ color: 'rgba(255,255,255,0.3)', position: 'relative' }}>{total.toFixed(2)}</span>
            </div>
          );
        })}
      </div>

      {/* Mid price + spread */}
      <div style={{
        padding: '0.4rem 0.75rem', flexShrink: 0,
        background: 'rgba(0,0,0,0.4)',
        borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{
          fontWeight: 900, fontSize: '0.88rem', fontFamily: 'monospace',
          color: flash === 'up' ? 'var(--green)' : flash === 'down' ? 'var(--red)' : 'var(--cream)',
          transition: 'color 0.3s',
        }}>
          {fmtPrice(book.mid)}
        </span>
        <span style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>
          Spread {spread > 0 ? spread.toFixed(spread < 1 ? 4 : 1) : '—'}
        </span>
      </div>

      {/* Bids (buy orders) — cream/green */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {bids10.map((b, i) => {
          const total = bids10.slice(0, i + 1).reduce((s, x) => s + x.size, 0);
          return (
            <div
              key={i}
              onClick={() => onPriceClick && onPriceClick(b.price)}
              style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0.75rem', position: 'relative', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,212,212,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: `${(b.size / maxSize) * 100}%`, background: 'rgba(212,212,212,0.05)' }} />
              <span style={{ color: 'var(--cream)', fontWeight: 600, position: 'relative', fontFamily: 'monospace' }}>{fmtPrice(b.price)}</span>
              <span style={{ color: 'rgba(255,255,255,0.5)', position: 'relative' }}>{b.size.toFixed(3)}</span>
              <span style={{ color: 'rgba(255,255,255,0.3)', position: 'relative' }}>{total.toFixed(2)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
