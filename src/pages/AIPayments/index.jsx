import CommandConsole from './CommandConsole.jsx';
import TxHistory from './TxHistory.jsx';
import ScheduledPayments from './ScheduledPayments.jsx';

export default function AIPayments() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', height: '100%', overflow: 'hidden' }}>
      {/* Left: chat */}
      <div style={{ borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'rgba(0,0,0,0.45)' }}>
        <div style={{ padding: '1rem 1.5rem 0.75rem', borderBottom: '1px solid var(--border)', flexShrink: 0, background: 'rgba(0,0,0,0.6)' }}>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--cream)', letterSpacing: '-0.02em' }}>
            AI Payment Agent
          </h1>
          <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.15rem' }}>
            Powered by Rialo Edge · IPC · Interop · Zero fees
          </p>
        </div>
        <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
          <CommandConsole />
        </div>
      </div>

      {/* Right: history + scheduled */}
      <div style={{ overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'rgba(0,0,0,0.4)' }}>
        <TxHistory />
        <div style={{ height: 1, background: 'var(--border)', flexShrink: 0 }} />
        <ScheduledPayments />
      </div>
    </div>
  );
}
