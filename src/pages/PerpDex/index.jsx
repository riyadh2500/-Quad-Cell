import { useState, useEffect } from 'react';
import { perpDexService } from '../../services/perpDex.js';
import PairSelector from './PairSelector.jsx';
import OrderBook from './OrderBook.jsx';
import TradesTape from './TradesTape.jsx';
import OrderEntry from './OrderEntry.jsx';
import PositionsPanel from './PositionsPanel.jsx';
import CandlestickChart from '../../components/charts/CandlestickChart.jsx';
import Tabs from '../../components/ui/Tabs.jsx';

const TFS = ['1m','5m','15m','1h','4h','1d'];

export default function PerpDex() {
  const [pair, setPair] = useState('BTC/USDC');
  const [tf, setTf] = useState('1h');
  const [candles, setCandles] = useState([]);
  const [rightTab, setRightTab] = useState('book');
  const [posRefresh, setPosRefresh] = useState(0);
  const [price, setPrice] = useState(0);

  useEffect(() => {
    perpDexService.getCandles(pair, tf).then(setCandles);
  }, [pair, tf]);

  useEffect(() => {
    const t = setInterval(() => {
      setPrice(perpDexService.getPrice(pair));
      perpDexService.getCandles(pair, tf, 1).then(c => {
        if (c.length) setCandles(prev => {
          if (!prev.length) return c;
          const last = prev[prev.length - 1];
          if (last && last.time === c[0].time) return [...prev.slice(0, -1), c[0]];
          return [...prev.slice(-199), c[0]];
        });
      });
    }, 2000);
    return () => clearInterval(t);
  }, [pair, tf]);

  useEffect(() => { setPrice(perpDexService.getPrice(pair)); }, [pair]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'rgba(0,0,0,0.45)' }}>

      {/* Pair selector bar */}
      <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--border)', flexShrink: 0, background: 'rgba(0,0,0,0.6)' }}>
        <PairSelector selected={pair} onChange={p => { setPair(p); setCandles([]); }} />
      </div>

      {/* Header row */}
      <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1.5rem', flexShrink: 0, background: 'rgba(0,0,0,0.5)' }}>
        <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--cream)' }}>{pair}</span>
        <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#fff' }}>
          ${price > 0 ? price.toLocaleString('en', { maximumFractionDigits: 2 }) : '—'}
        </span>
        <Tabs tabs={TFS} active={tf} onChange={setTf} />
      </div>

      {/* Main grid */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 280px', overflow: 'hidden', minHeight: 0 }}>

        {/* Left: chart + trades */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          <div style={{ flex: 1, padding: '0.5rem', minHeight: 0 }}>
            <CandlestickChart data={candles} height={320} />
          </div>
          <div style={{ flexShrink: 0, borderTop: '1px solid var(--border)', maxHeight: 160, overflowY: 'auto' }}>
            <TradesTape pair={pair} />
          </div>
        </div>

        {/* Right: orderbook / order entry */}
        <div style={{ borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'rgba(0,0,0,0.5)' }}>
          <div style={{ padding: '0.4rem 0.5rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <Tabs
              tabs={[{ value: 'book', label: 'Order Book' }, { value: 'order', label: 'Trade' }]}
              active={rightTab}
              onChange={setRightTab}
            />
          </div>
          <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
            {rightTab === 'book'
              ? <OrderBook pair={pair} />
              : <div style={{ overflowY: 'auto', height: '100%' }}><OrderEntry pair={pair} onPositionOpened={() => setPosRefresh(n => n + 1)} /></div>
            }
          </div>
          {rightTab === 'book' && (
            <div style={{ padding: '0.5rem', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
              <button
                onClick={() => setRightTab('order')}
                style={{ width: '100%', padding: '0.6rem', background: 'var(--cream)', color: '#000', fontWeight: 700, fontSize: '0.85rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer' }}
              >
                Open Trade
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Positions panel */}
      <div style={{ flexShrink: 0, maxHeight: 200, overflow: 'auto', borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.6)' }}>
        <PositionsPanel refreshSignal={posRefresh} />
      </div>
    </div>
  );
}
