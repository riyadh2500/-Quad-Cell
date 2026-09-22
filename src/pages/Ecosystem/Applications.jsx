import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';

const APPS = [
  { name:'Quad Cell', desc:'Prediction markets, perpetual DEX, and AI payments unified on Rialo.', tags:['DeFi','AI','Payments'], icon:'◈', url:'#', live:true },
  { name:'Rialo Enterprise', desc:'Tokenization and digital asset solutions for regulated financial institutions.', tags:['Enterprise','RWA'], icon:'🏦', url:'https://enterprise.rialo.io', live:true },
  { name:'Agentic Edge Harness', desc:'Framework for deploying AI agents with confidential on-chain execution.', tags:['AI','Infrastructure'], icon:'🤖', url:'https://agents.rialo.io', live:true },
  { name:'Concurrency Visualizer', desc:"Interactive visualization of Rialo's hybrid concurrency control.", tags:['Dev Tools'], icon:'🔬', url:'https://concurrency-control.learn.rialo.io', live:true },
  { name:'Rialo Stream Dashboard', desc:'Real-time oracle dashboard showing price feeds across 200+ assets at 250ms intervals.', tags:['Oracle','DeFi'], icon:'📡', url:'#', live:false },
  { name:'IPC Explorer', desc:'On-chain identity and compliance explorer — verify encrypted identities without revealing data.', tags:['Privacy'], icon:'🛡️', url:'#', live:false },
];

export default function Applications() {
  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--cream)', letterSpacing: '-0.02em' }}>Applications</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.2rem' }}>Apps and tools built on Rialo infrastructure.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
        {APPS.map(app => (
          <Card key={app.name} lift glow style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', opacity: app.live ? 1 : 0.65 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'rgba(232,224,208,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>{app.icon}</div>
                <span style={{ fontWeight: 700, color: 'var(--cream)', fontSize: '0.9rem' }}>{app.name}</span>
              </div>
              {!app.live && <Badge variant="outline">Soon</Badge>}
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.5, flex: 1 }}>{app.desc}</p>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {app.tags.map(t => <Badge key={t} variant="outline">{t}</Badge>)}
            </div>
            {app.live
              ? <a href={app.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--cream)', fontWeight: 600 }}>Open app →</a>
              : <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Coming soon</span>}
          </Card>
        ))}
      </div>
    </div>
  );
}
