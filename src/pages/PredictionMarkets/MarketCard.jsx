import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';

const CAT_VARIANT = { crypto: 'blue', technology: 'cream', politics: 'yellow', sports: 'green' };

export default function MarketCard({ market, onClick, onTrade }) {
  const yes = (market.yesProb * 100).toFixed(1);
  const no = (100 - market.yesProb * 100).toFixed(1);
  const vol = market.volume >= 1e6 ? `$${(market.volume/1e6).toFixed(1)}M` : `$${(market.volume/1e3).toFixed(0)}K`;
  const daysLeft = Math.ceil((new Date(market.endDate) - Date.now()) / 86400000);

  return (
    <Card lift glow style={{ padding: '1.1rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.75rem' }} onClick={onClick}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
        <Badge variant={CAT_VARIANT[market.category] || 'outline'}>{market.category}</Badge>
        {market.resolved && <Badge variant="yellow">Resolved</Badge>}
      </div>
      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)', lineHeight: 1.4, minHeight: '2.5rem' }}>{market.question}</div>
      {/* Probability bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--cream)' }}>YES {yes}%</span>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--red)' }}>NO {no}%</span>
        </div>
        <div style={{ height: 5, borderRadius: 100, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${yes}%`, borderRadius: 100, background: 'linear-gradient(90deg, var(--cream-dim), var(--cream))', transition: 'width 0.5s ease' }} />
        </div>
      </div>
      {/* Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
          <span style={{ fontWeight: 700, color: 'var(--cream)' }}>{vol}</span> vol
          <span style={{ margin: '0 0.35rem', opacity: 0.4 }}>·</span>
          <span>{market.participants.toLocaleString()} traders</span>
        </div>
        <span style={{ fontSize: '0.68rem', color: 'var(--muted)' }}>{daysLeft > 0 ? `${daysLeft}d left` : 'Ended'}</span>
      </div>
      <Button variant="secondary" size="sm" onClick={e => { e.stopPropagation(); onTrade && onTrade(market); }}>Trade</Button>
    </Card>
  );
}
