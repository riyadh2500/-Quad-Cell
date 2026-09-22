import { useState, useEffect } from 'react';
import { predictionMarketService } from '../../services/predictionMarket.js';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import TradePanel from './TradePanel.jsx';

export default function MarketDetail({ marketId, onBack }) {
  const [market, setMarket] = useState(null);
  const [trading, setTrading] = useState(false);

  useEffect(() => {
    predictionMarketService.getMarket(marketId).then(setMarket);
    const t = setInterval(() => {
      predictionMarketService.getMarket(marketId).then(setMarket);
    }, 3000);
    return () => clearInterval(t);
  }, [marketId]);

  if (!market) return <div style={{ padding: '2rem', color: 'var(--muted)' }}>Loading…</div>;

  const yes = (market.yesProb * 100).toFixed(1);
  const no = (100 - market.yesProb * 100).toFixed(1);

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem', maxWidth: 800 }}>
      <Button variant="ghost" size="sm" onClick={onBack}>← Back to Markets</Button>
      <Card style={{ padding: '1.25rem' }}>
        <Badge variant="blue" style={{ marginBottom: '0.75rem' }}>{market.category}</Badge>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--cream)', marginBottom: '0.75rem', lineHeight: 1.4 }}>{market.question}</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '1rem' }}>{market.description}</p>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.8rem' }}>
          <div><span style={{ color: 'var(--muted)' }}>Volume: </span><span style={{ color: 'var(--cream)', fontWeight: 700 }}>${(market.volume/1e6).toFixed(2)}M</span></div>
          <div><span style={{ color: 'var(--muted)' }}>Traders: </span><span style={{ color: 'var(--cream)', fontWeight: 700 }}>{market.participants.toLocaleString()}</span></div>
          <div><span style={{ color: 'var(--muted)' }}>Ends: </span><span style={{ color: 'var(--cream)', fontWeight: 700 }}>{market.endDate}</span></div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem' }}>
        <Card style={{ padding: '1.1rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--cream)', marginBottom: '0.75rem' }}>Current Odds</div>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ flex: 1, padding: '0.75rem', background: 'rgba(232,224,208,0.06)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--cream)' }}>{yes}%</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>YES</div>
            </div>
            <div style={{ flex: 1, padding: '0.75rem', background: 'var(--red-dim)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--red)' }}>{no}%</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>NO</div>
            </div>
          </div>
          <div style={{ height: 8, borderRadius: 100, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${yes}%`, borderRadius: 100, background: 'linear-gradient(90deg, var(--cream-dim), var(--cream))', transition: 'width 0.5s' }} />
          </div>
        </Card>
        {!trading && (
          <Card style={{ padding: '1.1rem', display: 'flex', alignItems: 'center' }}>
            <Button variant="primary" onClick={() => setTrading(true)}>Trade Now</Button>
          </Card>
        )}
      </div>

      {trading && (
        <Card style={{ padding: 0 }}>
          <TradePanel market={market} onClose={() => setTrading(false)} onSuccess={() => setTimeout(() => setTrading(false), 1500)} />
        </Card>
      )}
    </div>
  );
}
