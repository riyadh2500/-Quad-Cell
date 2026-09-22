import { useData } from '../../context/DataContext.jsx';
import Card from '../../components/ui/Card.jsx';

function fmt(n) {
  if (n >= 1e9) return `$${(n/1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n/1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n/1e3).toFixed(1)}K`;
  return `$${n}`;
}

const CARDS = [
  { key: 'totalVolume24h', label: '24h Volume', icon: '💹', fmt: v => fmt(v), sub: 'Across all products', color: 'var(--cream)' },
  { key: 'openPositions',  label: 'Open Positions', icon: '📈', fmt: v => v.toLocaleString(), sub: 'Perp DEX positions', color: 'var(--blue)' },
  { key: 'activeMarkets',  label: 'Active Markets', icon: '🎯', fmt: v => v, sub: 'Prediction markets', color: '#a78bfa' },
  { key: 'aiPayments24h', label: 'AI Payments', icon: '🤖', fmt: v => v.toLocaleString(), sub: 'Transactions today', color: 'var(--green)' },
];

export default function SummaryCards({ blockTime, gasPrice }) {
  const { stats } = useData();

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.85rem' }}>
      {CARDS.map(c => (
        <Card key={c.key} glow style={{ padding: '1.1rem 1.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '1.2rem' }}>{c.icon}</span>
            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{c.label}</span>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: c.color, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            {c.fmt(stats[c.key])}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.25rem' }}>{c.sub}</div>
        </Card>
      ))}
      <Card glow style={{ padding: '1.1rem 1.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
          <span style={{ fontSize: '1.2rem' }}>⚡</span>
          <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Block Time</span>
        </div>
        <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--green)', letterSpacing: '-0.02em' }}>{blockTime.toFixed(1)}ms</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.25rem' }}>Rialo Consensus</div>
      </Card>
      <Card glow style={{ padding: '1.1rem 1.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
          <span style={{ fontSize: '1.2rem' }}>💸</span>
          <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Gas Fees</span>
        </div>
        <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--green)', letterSpacing: '-0.02em' }}>~$0.00</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.25rem' }}>Rialo Cruise</div>
      </Card>
    </div>
  );
}
