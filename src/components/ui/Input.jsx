export default function Input({ label, value, onChange, placeholder, type = 'text', size, className = '', suffix, prefix, ...rest }) {
  return (
    <div className={`qc-input-group ${className}`}>
      {label && <label className="qc-input-label">{label}</label>}
      <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
        {prefix && <span style={{ position:'absolute', left:'0.9rem', color:'var(--muted)', fontSize:'0.85rem', pointerEvents:'none' }}>{prefix}</span>}
        <input
          className={`qc-input${size ? ` qc-input--${size}` : ''}`}
          style={prefix ? { paddingLeft:'2.2rem' } : suffix ? { paddingRight:'3rem' } : {}}
          type={type} value={value} onChange={onChange} placeholder={placeholder} {...rest}
        />
        {suffix && <span style={{ position:'absolute', right:'0.9rem', color:'var(--muted)', fontSize:'0.82rem', pointerEvents:'none' }}>{suffix}</span>}
      </div>
    </div>
  );
}
