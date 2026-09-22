import { useData } from '../../context/DataContext.jsx';
import SummaryCards from './SummaryCards.jsx';
import ActivityFeed from './ActivityFeed.jsx';
import InfraStatus from './InfraStatus.jsx';
import Card from '../../components/ui/Card.jsx';

export default function Overview() {
  const { prices, blockTime, gasPrice } = useData();

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--cream)', letterSpacing: '-0.02em' }}>Overview</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.2rem' }}>Live dashboard — Powered by Rialo Infrastructure</p>
      </div>

      {/* Live prices */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {Object.entries(prices).map(([sym, price]) => (
          <Card key={sym} style={{ padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)' }}>{sym}/USDC</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--cream)' }}>${price.toLocaleString('en-US', { maximumFractionDigits: sym === 'SOL' ? 2 : 0 })}</span>
          </Card>
        ))}
      </div>

      {/* Summary cards */}
      <SummaryCards blockTime={blockTime} gasPrice={gasPrice} />

      {/* Activity + Infrastructure */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'start' }}>
        <ActivityFeed />
        <InfraStatus />
      </div>

      {/* Rialo primitives quick nav */}
      <Card style={{ padding: '1rem 1.2rem' }}>
        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--cream)', marginBottom: '0.75rem' }}>Powered by Rialo</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {['⚡ Execution Engine','🔗 Interop','🛡️ IPC','📡 Stream','🌐 Edge','🔄 Workflow','💸 Cruise','🧠 VM (RISC-V)','📂 Read Path','🏦 Omni Account'].map(chip => (
            <span key={chip} style={{ background: 'rgba(232,224,208,0.05)', border: '1px solid var(--border)', borderRadius: '100px', padding: '0.3rem 0.85rem', fontSize: '0.75rem', fontWeight: 500, color: 'var(--muted)', cursor: 'default' }}>{chip}</span>
          ))}
        </div>
      </Card>
    </div>
  );
}
