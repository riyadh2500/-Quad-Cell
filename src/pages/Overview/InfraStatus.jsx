import { useData } from '../../context/DataContext.jsx';
import Card from '../../components/ui/Card.jsx';
import StatusDot from '../../components/ui/StatusDot.jsx';

const PRIMITIVES = [
  { key: 'executionEngine', label: 'Execution Engine', icon: '⚡' },
  { key: 'interop', label: 'Interop', icon: '🔗' },
  { key: 'ipc', label: 'IPC (Privacy)', icon: '🛡️' },
  { key: 'stream', label: 'Stream (Oracle)', icon: '📡' },
  { key: 'edge', label: 'Edge (Web2)', icon: '🌐' },
  { key: 'workflow', label: 'Workflow', icon: '🔄' },
  { key: 'cruise', label: 'Cruise (Gas)', icon: '💸' },
  { key: 'vm', label: 'VM (RISC-V)', icon: '🧠' },
  { key: 'readPath', label: 'Read Path', icon: '📂' },
  { key: 'omniAccount', label: 'Omni Account', icon: '🏦' },
];

export default function InfraStatus() {
  const { infraStatus } = useData();

  return (
    <Card style={{ padding: '1rem 1.2rem' }}>
      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--cream)', marginBottom: '0.9rem' }}>Infrastructure Status</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.5rem' }}>
        {PRIMITIVES.map(p => (
          <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.6rem', background: 'rgba(232,224,208,0.03)', borderRadius: '6px', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.85rem' }}>{p.icon}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.label}</span>
            <StatusDot status={infraStatus[p.key] || 'ok'} />
          </div>
        ))}
      </div>
    </Card>
  );
}
