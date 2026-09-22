export default function Card({ children, className = '', glow = false, lift = false, style, onClick }) {
  const cls = ['qc-card', glow && 'qc-card--glow', lift && 'qc-card--lift', className].filter(Boolean).join(' ');
  return <div className={cls} style={style} onClick={onClick}>{children}</div>;
}
