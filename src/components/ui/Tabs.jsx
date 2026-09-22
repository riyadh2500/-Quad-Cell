export default function Tabs({ tabs, active, onChange, pill = false }) {
  return (
    <div className={`qc-tabs${pill ? ' qc-tabs--pill' : ''}`}>
      {tabs.map(tab => (
        <div
          key={tab.value || tab}
          className={`qc-tab${(tab.value||tab) === active ? ' qc-tab--active' : ''}`}
          onClick={() => onChange(tab.value || tab)}
        >
          {tab.icon && <span style={{marginRight:'0.3rem'}}>{tab.icon}</span>}
          {tab.label || tab}
        </div>
      ))}
    </div>
  );
}
