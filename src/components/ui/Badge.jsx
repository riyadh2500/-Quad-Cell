export default function Badge({ children, variant = 'cream', dot = false }) {
  return (
    <span className={`qc-badge qc-badge--${variant}`}>
      {dot && <span style={{ width:5,height:5,borderRadius:'50%',background:'currentColor',display:'inline-block' }} />}
      {children}
    </span>
  );
}
