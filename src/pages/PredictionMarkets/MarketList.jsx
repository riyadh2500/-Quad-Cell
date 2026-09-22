import { useState, useEffect } from 'react';
import { predictionMarketService } from '../../services/predictionMarket.js';
import MarketCard from './MarketCard.jsx';
import Tabs from '../../components/ui/Tabs.jsx';

const CATS = ['all','crypto','technology','politics','sports'];
const SORTS = [{ value:'volume', label:'Volume' }, { value:'prob', label:'Probability' }, { value:'endDate', label:'End Date' }];

export default function MarketList({ onSelect, onTrade }) {
  const [markets, setMarkets] = useState([]);
  const [cat, setCat] = useState('all');
  const [sort, setSort] = useState('volume');

  useEffect(() => {
    predictionMarketService.getMarkets().then(setMarkets);
    const t = setInterval(() => predictionMarketService.getMarkets().then(setMarkets), 5000);
    return () => clearInterval(t);
  }, []);

  const filtered = markets
    .filter(m => cat === 'all' || m.category === cat)
    .sort((a,b) => {
      if (sort === 'volume') return b.volume - a.volume;
      if (sort === 'prob') return b.yesProb - a.yesProb;
      return new Date(a.endDate) - new Date(b.endDate);
    });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <Tabs tabs={CATS.map(c => ({ value: c, label: c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1) }))} active={cat} onChange={setCat} pill />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Sort:</span>
          <Tabs tabs={SORTS} active={sort} onChange={setSort} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.9rem' }}>
        {filtered.map(m => <MarketCard key={m.id} market={m} onClick={() => onSelect(m)} onTrade={() => onTrade(m)} />)}
      </div>
    </div>
  );
}
