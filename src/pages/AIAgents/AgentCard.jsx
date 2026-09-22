import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return s + 's ago';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  return Math.floor(s / 3600) + 'h ago';
}

export default function AgentCard({ agent, onClick, onToggle }) {
  return (
    <Card lift glow style={{ padding: '1.1rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.75rem' }} onClick={onClick}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(232,224,208,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>🤖</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--cream)' }}>{agent.name}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Wallet: {agent.wallet}</div>
          </div>
        </div>
        <Badge variant={agent.status === 'active' ? 'green' : 'outline'} dot>{agent.status}</Badge>
      </div>
      <div style={{ fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.5 }}>{agent.description}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--muted)', borderTop: '1px solid var(--border)', paddingTop: '0.6rem' }}>
        <div style={{ marginBottom: '0.2rem' }}>
          <span style={{ color: 'var(--muted)' }}>Last: </span>
          <span style={{ color: 'var(--text)' }}>{agent.lastAction}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{timeAgo(agent.lastActionTime)}</span>
          <span>Limit: <span style={{ color: 'var(--cream)', fontWeight: 700 }}>${agent.spendingLimit}</span></span>
        </div>
      </div>
      <Button variant={agent.status === 'active' ? 'secondary' : 'green'} size="sm"
        onClick={e => { e.stopPropagation(); onToggle(agent.id); }}>
        {agent.status === 'active' ? 'Pause' : 'Resume'}
      </Button>
    </Card>
  );
}
