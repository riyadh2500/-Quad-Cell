import { useData } from '../../context/DataContext.jsx';
import Card from '../../components/ui/Card.jsx';

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  return `${Math.floor(s/3600)}h ago`;
}

export default function ActivityFeed() {
  const { activity } = useData();

  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '0.9rem 1.1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--cream)' }}>Recent Activity</span>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', animation: 'blink 1.5s infinite' }} />
      </div>
      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        {activity.slice(0, 15).map(a => (
          <div key={a.id} style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.65rem 1.1rem', borderBottom: '1px solid rgba(232,224,208,0.05)',
            transition: 'background 0.15s',
          }}>
            <span style={{ fontSize: '1rem', flexShrink: 0 }}>{a.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.text}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '0.1rem' }}>{timeAgo(a.time)}</div>
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--cream)', flexShrink: 0 }}>{a.amount}</div>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
          </div>
        ))}
      </div>
    </Card>
  );
}
