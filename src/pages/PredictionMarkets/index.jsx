import { useState, useEffect } from 'react';
import { predictionMarketService } from '../../services/predictionMarket.js';
import MarketList from './MarketList.jsx';
import MarketDetail from './MarketDetail.jsx';
import MyPositions from './MyPositions.jsx';
import Tabs from '../../components/ui/Tabs.jsx';

const PAGE_TABS = [
  { value: 'markets', label: '📊 Markets' },
  { value: 'positions', label: '💼 My Positions' },
];

export default function PredictionMarkets() {
  const [selected,  setSelected]  = useState(null);
  const [pageTab,   setPageTab]   = useState('markets');
  const [posCount,  setPosCount]  = useState(0);

  // Keep position count updated for badge
  useEffect(() => {
    const refresh = () =>
      predictionMarketService.getUserPositions().then(p => setPosCount(p.length));
    refresh();
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, []);

  const tabs = PAGE_TABS.map(t =>
    t.value === 'positions' && posCount > 0
      ? { ...t, label: `💼 My Positions (${posCount})` }
      : t
  );

  return (
    <div style={{ minHeight: '100%', boxSizing: 'border-box' }}>
      {/* Page header */}
      <div style={{
        padding: '1.25rem 1.5rem 0',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--cream)', letterSpacing: '-0.02em' }}>
              Prediction Markets
            </h1>
            <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
              Trade on real-world outcomes · Powered by Rialo Stream Oracle
            </p>
          </div>
          {/* Live indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: 'var(--green)', fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', animation: 'blink 1.5s infinite' }} />
            Live
          </div>
        </div>

        {!selected && (
          <Tabs tabs={tabs} active={pageTab} onChange={v => { setPageTab(v); setSelected(null); }} />
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '1.25rem 1.5rem' }}>
        {selected ? (
          <MarketDetail
            marketId={selected.id}
            onBack={() => setSelected(null)}
            onPositionPlaced={() => setPosCount(n => n + 1)}
          />
        ) : pageTab === 'markets' ? (
          <MarketList onSelect={setSelected} />
        ) : (
          <MyPositions onViewMarket={(m) => { setSelected(m); setPageTab('markets'); }} />
        )}
      </div>
    </div>
  );
}
