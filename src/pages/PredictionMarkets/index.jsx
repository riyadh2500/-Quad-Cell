import { useState } from 'react';
import MarketList from './MarketList.jsx';
import MarketDetail from './MarketDetail.jsx';

export default function PredictionMarkets() {
  const [selected, setSelected] = useState(null);

  return (
    <div style={{ minHeight: '100%', padding: '1.5rem', boxSizing: 'border-box' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--cream)', letterSpacing: '-0.02em' }}>
          Prediction Markets
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.3rem' }}>
          Trade on real-world outcomes · Powered by Rialo Stream Oracle
        </p>
      </div>
      {selected ? (
        <MarketDetail marketId={selected.id} onBack={() => setSelected(null)} />
      ) : (
        <MarketList onSelect={setSelected} onTrade={() => {}} />
      )}
    </div>
  );
}
