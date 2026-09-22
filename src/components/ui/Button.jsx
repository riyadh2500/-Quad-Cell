export default function Button({ children, variant = 'primary', size, full, icon, disabled, onClick, type = 'button', className = '' }) {
  const cls = ['qc-btn', `qc-btn--${variant}`, size && `qc-btn--${size}`, full && 'qc-btn--full', className].filter(Boolean).join(' ');
  return (
    <button className={cls} disabled={disabled} onClick={onClick} type={type}>
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
}
