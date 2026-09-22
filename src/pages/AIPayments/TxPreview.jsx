import Button from '../../components/ui/Button.jsx';

export default function TxPreview({ preview, onConfirm, onCancel, loading }) {
  return (
    <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius)', padding: '1rem', margin: '0.5rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--cream)' }}>
            {preview.amount} {preview.token}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.15rem' }}>
            {preview.type === 'schedule' ? `Recurring ${preview.frequency}` : preview.type === 'swap' ? `Swap ${preview.from} → ${preview.to}` : `→ ${preview.to}`}
          </div>
        </div>
        <span style={{ background: 'var(--green-dim)', color: 'var(--green)', fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '100px', textTransform: 'uppercase' }}>Ready</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.85rem', fontSize: '0.78rem' }}>
        {[
          ['Route', preview.route || 'Rialo Interop'],
          ['Fee', '$0.00'],
          ['ETA', `~${preview.eta || 50}ms`],
          ['IPC Check', preview.ipcVerified ? '✓ Passed' : 'Pending'],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--muted)' }}>{k}</span>
            <span style={{ fontWeight: 600, color: k === 'Fee' ? 'var(--green)' : k === 'IPC Check' ? 'var(--green)' : 'var(--cream)' }}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Button variant="secondary" size="sm" onClick={onCancel} full>Cancel</Button>
        <Button variant="green" size="sm" onClick={onConfirm} disabled={loading} full>
          {loading ? 'Executing…' : 'Confirm & Send'}
        </Button>
      </div>
    </div>
  );
}
