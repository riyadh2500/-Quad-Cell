import Badge from '../../components/ui/Badge.jsx';
import Card from '../../components/ui/Card.jsx';

const CAT_VARIANT = { crypto:'blue', technology:'cream', politics:'yellow', sports:'green' };

function fmtVol(v) {
  if (v >= 1e6) return `$${(v/1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v/1e3).toFixed(0)}K`;
  return `$${v}`;
}

export default function MarketCard({ market, onClick }) {
  const yes      = (market.yesProb * 100).toFixed(1);
  const no       = (100 - market.yesProb * 100).toFixed(1);
  const daysLeft = Math.ceil((new Date(market.endDate) - Date.now()) / 86400000);

  return (
    <Card
      lift glow
      style={{ padding: '1.1rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}
      onClick={onClick}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
        <Badge variant={CAT_VARIANT[market.category] || 'outline'}>{market.category}</Badge>
        <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
          {market.resolved && <Badge variant="yellow">Resolved</Badge>}
          {daysLeft <= 7 && daysLeft > 0 && <Badge variant="red">Ending soon</Badge>}
          {daysLeft <= 0 && <Badge variant="outline">Ended</Badge>}
        </div>
      </div>

      {/* Question */}
      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)', lineHeight: 1.45, minHeight: '2.6rem' }}>
        {market.question}
      </div>

      {/* Probability bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--cream)' }}>YES {yes}%</span>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--red)' }}>NO {no}%</span>
        </div>
        <div style={{ height: 6, borderRadius: 100, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', position: 'relative' }}>
          <div style={{
            height: '100%', width: `${yes}%`, borderRadius: 100,
            background: 'linear-gradient(90deg, var(--cream-dim), var(--cream))',
            transition: 'width 0.6s ease',
          }} />
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem' }}>
        <div style={{ color: 'var(--muted)' }}>
          <span style={{ fontWeight: 700, color: 'var(--cream)' }}>{fmtVol(market.volume)}</span>
          {' vol · '}
          <span style={{ fontWeight: 700, color: 'var(--cream)' }}>{market.participants.toLocaleString()}</span>
          {' traders'}
        </div>
        <span style={{ color: daysLeft <= 7 ? 'var(--red)' : 'var(--muted)' }}>
          {daysLeft > 0 ? `${daysLeft}d left` : 'Ended'}
        </span>
      </div>

      {/* Trade button */}
      <button
        onClick={e => { e.stopPropagation(); onClick(); }}
        style={{
          width: '100%', padding: '0.55rem',
          background: 'linear-gradient(135deg, rgba(212,212,212,0.12), rgba(212,212,212,0.06))',
          border: '1px solid rgba(212,212,212,0.2)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--cream)', fontWeight: 700, fontSize: '0.82rem',
          cursor: 'pointer', transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,212,212,0.18)'; e.currentTarget.style.borderColor = 'rgba(212,212,212,0.35)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(212,212,212,0.12), rgba(212,212,212,0.06))'; e.currentTarget.style.borderColor = 'rgba(212,212,212,0.2)'; }}
      >
        Trade →
      </button>
    </Card>
  );
}
