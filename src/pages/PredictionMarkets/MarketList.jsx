import { useState, useEffect } from 'react';
import { predictionMarketService } from '../../services/predictionMarket.js';
import MarketCard from './MarketCard.jsx';
import Tabs from '../../components/ui/Tabs.jsx';

const CATS  = ['all','crypto','technology','politics','sports'];
const SORTS = [
  { value: 'volume',  label: 'Volume'      },
  { value: 'prob',    label: 'Probability' },
  { value: 'endDate', label: 'End Date'    },
];

export default function MarketList({ onSelect }) {
  const [markets, setMarkets] = useState([]);
  const [cat,     setCat]     = useState('all');
  const [sort,    setSort]    = useState('volume');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    predictionMarketService.getMarkets().then(m => { setMarkets(m); setLoading(false); });
    const t = setInterval(() => predictionMarketService.getMarkets().then(setMarkets), 4000);
    return () => clearInterval(t);
  }, []);

  const filtered = markets
    .filter(m => cat === 'all' || m.category === cat)
    .sort((a, b) => {
      if (sort === 'volume')  return b.volume  - a.volume;
      if (sort === 'prob')    return b.yesProb - a.yesProb;
      return new Date(a.endDate) - new Date(b.endDate);
    });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Filter + sort bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <Tabs
          tabs={CATS.map(c => ({ value: c, label: c === 'all' ? 'All' : c[0].toUpperCase() + c.slice(1) }))}
          active={cat} onChange={setCat} pill
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Sort by</span>
          <Tabs tabs={SORTS} active={sort} onChange={setSort} />
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.78rem', color: 'var(--muted)', padding: '0.5rem 0' }}>
        <span><span style={{ color: 'var(--cream)', fontWeight: 700 }}>{filtered.length}</span> markets</span>
        <span><span style={{ color: 'var(--cream)', fontWeight: 700 }}>
          ${(filtered.reduce((s, m) => s + m.volume, 0) / 1e6).toFixed(1)}M
        </span> total volume</span>
        <span><span style={{ color: 'var(--cream)', fontWeight: 700 }}>
          {filtered.reduce((s, m) => s + m.participants, 0).toLocaleString()}
        </span> traders</span>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.9rem' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 180, borderRadius: 'var(--radius)' }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.9rem' }}>
          {filtered.map(m => (
            <MarketCard key={m.id} market={m} onClick={() => onSelect(m)} />
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>
              No markets found in this category.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
