import { useState, useEffect, useCallback } from 'react';
import { perpDexService } from '../../services/perpDex.js';
import PairSelector from './PairSelector.jsx';
import OrderBook from './OrderBook.jsx';
import TradesTape from './TradesTape.jsx';
import OrderEntry from './OrderEntry.jsx';
import PositionsPanel from './PositionsPanel.jsx';
import CandlestickChart from '../../components/charts/CandlestickChart.jsx';

const TFS = [
  { value: '1m',  label: '1m'  },
  { value: '5m',  label: '5m'  },
  { value: '15m', label: '15m' },
  { value: '1h',  label: '1h'  },
  { value: '4h',  label: '4h'  },
  { value: '1d',  label: '1D'  },
];

const RIGHT_TABS = [
  { value: 'book',  label: 'Book'  },
  { value: 'trade', label: 'Trade' },
];

export default function PerpDex() {
  const [pair,       setPair]       = useState('BTC/USDT');
  const [tf,         setTf]         = useState('1h');
  const [candles,    setCandles]    = useState([]);
  const [candlesLoading, setCandlesLoading] = useState(true);
  const [rightTab,   setRightTab]   = useState('book');
  const [posRefresh, setPosRefresh] = useState(0);
  const [livePrice,  setLivePrice]  = useState(0);
  const [change24h,  setChange24h]  = useState(0);
  const [crosshair,  setCrosshair]  = useState(null);

  // ── Load full candle history when pair/tf changes ─────────────────────────
  useEffect(() => {
    setCandlesLoading(true);
    setCandles([]);
    perpDexService.getCandles(pair, tf, 200).then(c => {
      setCandles(c);
      setCandlesLoading(false);
    });
  }, [pair, tf]);

  // ── Live price tick + candle tail update ──────────────────────────────────
  useEffect(() => {
    const tick = async () => {
      const p = perpDexService.getPrice(pair);
      if (p > 0) setLivePrice(p);

      // Update last candle with live price
      setCandles(prev => {
        if (!prev.length) return prev;
        const last = { ...prev[prev.length - 1] };
        last.close = p > 0 ? p : last.close;
        last.high  = Math.max(last.high, last.close);
        last.low   = Math.min(last.low,  last.close);
        return [...prev.slice(0, -1), last];
      });
    };
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [pair]);

  // ── Fetch 24h change ──────────────────────────────────────────────────────
  useEffect(() => {
    const fetch = async () => {
      const pairs = await perpDexService.getPairs();
      const found = pairs.find(p => p.symbol === pair);
      if (found) {
        setLivePrice(found.price);
        setChange24h(found.change24h);
      }
    };
    fetch();
    const t = setInterval(fetch, 5000);
    return () => clearInterval(t);
  }, [pair]);

  const onPairChange = useCallback((sym) => {
    setPair(sym);
    setCandles([]);
    setLivePrice(0);
  }, []);

  const up = change24h >= 0;

  // ── Format price based on magnitude ──────────────────────────────────────
  const fmtPrice = (n) => {
    if (!n || n === 0) return '—';
    if (n >= 1000) return n.toLocaleString('en', { maximumFractionDigits: 1 });
    if (n >= 1)    return n.toFixed(2);
    return n.toFixed(4);
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      overflow: 'hidden', background: 'rgba(0,0,0,0.3)',
    }}>

      {/* ── TOP: pair selector ────────────────────────────────────────────── */}
      <div style={{
        padding: '0.4rem 1rem', borderBottom: '1px solid var(--border)',
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)', flexShrink: 0,
      }}>
        <PairSelector selected={pair} onChange={onPairChange} />
      </div>

      {/* ── HEADER ROW: price + stats + timeframe ────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap',
        padding: '0.45rem 1rem', borderBottom: '1px solid var(--border)',
        background: 'rgba(0,0,0,0.45)', flexShrink: 0,
      }}>
        {/* Pair + price */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
          <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--cream)' }}>{pair}</span>
          <span style={{ fontWeight: 900, fontSize: '1.25rem', color: '#fff', fontFamily: 'monospace', letterSpacing: '-0.02em' }}>
            {fmtPrice(livePrice)}
          </span>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: up ? 'var(--green)' : 'var(--red)' }}>
            {up ? '+' : ''}{change24h.toFixed(2)}%
          </span>
          {crosshair?.price && (
            <span style={{ fontSize: '0.78rem', color: 'var(--muted)', marginLeft: '0.5rem' }}>
              O:{fmtPrice(crosshair.price.open)} H:{fmtPrice(crosshair.price.high)} L:{fmtPrice(crosshair.price.low)} C:{fmtPrice(crosshair.price.close)}
            </span>
          )}
        </div>

        {/* Timeframe selector */}
        <div style={{ display: 'flex', gap: '0.15rem', marginLeft: 'auto', background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '3px' }}>
          {TFS.map(t => (
            <button key={t.value} onClick={() => setTf(t.value)} style={{
              padding: '0.28rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700,
              background: tf === t.value ? 'rgba(212,212,212,0.12)' : 'transparent',
              border: tf === t.value ? '1px solid rgba(212,212,212,0.25)' : '1px solid transparent',
              color: tf === t.value ? 'var(--cream)' : 'var(--muted)',
              cursor: 'pointer', transition: 'all 0.12s',
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* ── MAIN BODY: chart left, panel right ───────────────────────────── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 290px', overflow: 'hidden', minHeight: 0 }}>

        {/* LEFT: chart + trades tape */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0, borderRight: '1px solid var(--border)' }}>

          {/* Chart area */}
          <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
            {candlesLoading ? (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--muted)', fontSize: '0.85rem', gap: '0.5rem',
              }}>
                <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
                Loading {pair} {tf} chart…
              </div>
            ) : (
              <div style={{ width: '100%', height: '100%' }}>
                <CandlestickChart
                  data={candles}
                  height={undefined}
                  fillContainer
                  onCrosshair={setCrosshair}
                />
              </div>
            )}
          </div>

          {/* Trades tape */}
          <div style={{ flexShrink: 0, borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)' }}>
            <TradesTape pair={pair} />
          </div>
        </div>

        {/* RIGHT: order book / trade entry */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'rgba(0,0,0,0.35)' }}>

          {/* Tab bar */}
          <div style={{
            display: 'flex', gap: '0.15rem', padding: '0.4rem 0.5rem',
            borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.4)', flexShrink: 0,
          }}>
            {RIGHT_TABS.map(t => (
              <button key={t.value} onClick={() => setRightTab(t.value)} style={{
                flex: 1, padding: '0.35rem', borderRadius: '7px', fontSize: '0.8rem', fontWeight: 700,
                background: rightTab === t.value ? 'rgba(212,212,212,0.1)' : 'transparent',
                border: rightTab === t.value ? '1px solid rgba(212,212,212,0.22)' : '1px solid transparent',
                color: rightTab === t.value ? 'var(--cream)' : 'var(--muted)',
                cursor: 'pointer', transition: 'all 0.12s',
              }}>{t.label}</button>
            ))}
          </div>

          {/* Panel body */}
          <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
            {rightTab === 'book' ? (
              <OrderBook pair={pair} onPriceClick={() => setRightTab('trade')} />
            ) : (
              <div style={{ height: '100%', overflowY: 'auto' }}>
                <OrderEntry
                  pair={pair}
                  onPositionOpened={() => setPosRefresh(n => n + 1)}
                />
              </div>
            )}
          </div>

          {/* Trade button when on book tab */}
          {rightTab === 'book' && (
            <div style={{ padding: '0.5rem', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
              <button
                onClick={() => setRightTab('trade')}
                style={{
                  width: '100%', padding: '0.65rem', borderRadius: '10px',
                  background: 'var(--cream)', color: '#000',
                  fontWeight: 800, fontSize: '0.88rem', border: 'none', cursor: 'pointer',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Open Trade →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── POSITIONS PANEL ───────────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0, borderTop: '1px solid var(--border)',
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
        maxHeight: 220, overflow: 'auto',
      }}>
        <PositionsPanel refreshSignal={posRefresh} />
      </div>

    </div>
  );
}
