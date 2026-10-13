import Button from '../../components/ui/Button.jsx';

function shortAddr(addr) {
  if (!addr) return '';
  if (addr.endsWith('.eth')) return addr;
  return `${addr.slice(0, 10)}…${addr.slice(-8)}`;
}

function isHexAddr(addr) {
  return addr && addr.startsWith('0x') && addr.length === 42;
}

export default function TxPreview({ preview, onConfirm, onCancel, loading }) {
  const isFullAddr = isHexAddr(preview.to);

  return (
    <div style={{
      background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)',
      borderRadius: 'var(--radius)', padding: '1rem', margin: '0.5rem 0',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
        <div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--cream)' }}>
            {preview.amount} {preview.token}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.1rem' }}>
            {preview.type === 'schedule'
              ? `Recurring ${preview.frequency}`
              : preview.type === 'swap'
                ? `Swap ${preview.from} → ${preview.to}`
                : 'Direct transfer'}
          </div>
        </div>
        <span style={{
          background: 'var(--green-dim)', color: 'var(--green)',
          fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem',
          borderRadius: '100px', textTransform: 'uppercase', flexShrink: 0,
        }}>
          Ready
        </span>
      </div>

      {/* Recipient address block */}
      {preview.type !== 'swap' && preview.to && (
        <div style={{
          background: 'rgba(0,0,0,0.35)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', padding: '0.65rem 0.85rem',
          marginBottom: '0.75rem',
        }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.35rem' }}>
            Recipient
          </div>
          <div style={{
            fontFamily: isFullAddr ? 'monospace' : 'inherit',
            fontSize: isFullAddr ? '0.78rem' : '0.9rem',
            fontWeight: 700, color: 'var(--cream)',
            wordBreak: 'break-all', lineHeight: 1.5,
          }}>
            {preview.to}
          </div>
          {isFullAddr && (
            <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
              {shortAddr(preview.to)}
            </div>
          )}
        </div>
      )}

      {/* Details rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.85rem', fontSize: '0.78rem' }}>
        {[
          ['Amount',    `${preview.amount} ${preview.token}`],
          ['Route',     preview.route || 'Rialo Interop'],
          ['Fee',       '$0.00'],
          ['ETA',       `~${preview.eta || 50}ms`],
          ['IPC Check', preview.ipcVerified ? '✓ Passed' : 'Pending'],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--muted)' }}>{k}</span>
            <span style={{
              fontWeight: 600,
              color: k === 'Fee' || k === 'IPC Check' ? 'var(--green)' : 'var(--cream)',
            }}>
              {v}
            </span>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Button variant="secondary" size="sm" onClick={onCancel} full disabled={loading}>
          Cancel
        </Button>
        <Button variant="green" size="sm" onClick={onConfirm} disabled={loading} full>
          {loading ? 'Executing…' : `Confirm & Send ${preview.amount} ${preview.token}`}
        </Button>
      </div>
    </div>
  );
}
