export default function StatusDot({ status = 'ok', label, size = 7 }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:'0.4rem' }}>
      <span className={`status-dot status-dot--${status}`} style={{ width:size, height:size }} />
      {label && <span style={{ fontSize:'0.78rem', color: status==='ok' ? 'var(--green)' : status==='error' ? 'var(--red)' : 'var(--muted)' }}>{label}</span>}
    </span>
  );
}
