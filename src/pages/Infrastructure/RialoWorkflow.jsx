import { useState } from 'react';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';

const NODE_TYPES = [
  { type:'trigger',   label:'⏰ Schedule',  color:'#a78bfa', bg:'rgba(167,139,250,0.12)' },
  { type:'condition', label:'❓ Condition', color:'var(--yellow)', bg:'rgba(251,191,36,0.1)' },
  { type:'action',    label:'⚡ Action',    color:'var(--green)', bg:'var(--green-dim)' },
  { type:'delay',     label:'⏳ Delay',     color:'var(--blue)',  bg:'var(--blue-dim)' },
];
const INIT = [
  { id:'n1', type:'trigger',   label:'⏰ Schedule',  value:'Every day at 09:00 UTC' },
  { id:'n2', type:'condition', label:'❓ Condition', value:'ETH price > $3,000' },
  { id:'n3', type:'action',    label:'⚡ Action',    value:'Swap 10 USDC → ETH' },
];

export default function RialoWorkflow() {
  const [nodes, setNodes] = useState(INIT);
  const [deployed, setDeployed] = useState(false);
  const add = (type) => { const t=NODE_TYPES.find(n=>n.type===type); setNodes(n=>[...n,{id:'n'+Date.now(),type,label:t.label,value:'Configure…'}]); setDeployed(false); };
  const remove = (id) => { setNodes(n=>n.filter(x=>x.id!==id)); setDeployed(false); };

  return (
    <div style={{ padding: '1.5rem', maxWidth: 800 }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <span style={{ background: 'rgba(232,224,208,0.1)', color: 'var(--cream)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0.25rem 0.75rem', borderRadius: '100px', border: '1px solid rgba(232,224,208,0.2)' }}>Infrastructure</span>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--cream)', marginTop: '0.6rem', letterSpacing: '-0.02em' }}>Rialo Workflow</h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginTop: '0.3rem' }}>Native automation and autonomous complex workflows to mimic real-world logic.</p>
      </div>
      <Card style={{ padding: '1.25rem', marginBottom: '1rem' }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--cream)', marginBottom: '0.85rem' }}>Add Node</div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {NODE_TYPES.map(nt => (
            <button key={nt.type} onClick={() => add(nt.type)} style={{ padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-sm)', background: nt.bg, border: '1px solid '+nt.color+'44', color: nt.color, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>{nt.label}</button>
          ))}
        </div>
      </Card>
      <Card style={{ padding: '1.1rem' }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--cream)', marginBottom: '1rem' }}>Workflow Builder</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {nodes.map((node, i) => {
            const nt = NODE_TYPES.find(n=>n.type===node.type);
            return (
              <div key={node.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.75rem', background: nt?.bg||'var(--surface-2)', borderRadius: 'var(--radius-sm)', border: '1px solid '+(nt?.color||'var(--border)')+'44' }}>
                  <span style={{ fontSize: '0.85rem', flexShrink: 0, minWidth: 90 }}>{node.label}</span>
                  <input defaultValue={node.value} style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-sm)', padding: '0.3rem 0.6rem', color: 'var(--text)', fontSize: '0.78rem', fontFamily: 'inherit', outline: 'none' }} />
                  <button onClick={() => remove(node.id)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.9rem', padding: '0.2rem', flexShrink: 0 }}>✕</button>
                </div>
                {i < nodes.length-1 && <div style={{ width:2, height:14, background:'var(--border)', margin:'0 auto' }} />}
              </div>
            );
          })}
        </div>
        {nodes.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <Button variant="green" full onClick={() => setDeployed(true)}>{deployed ? '✓ Workflow Deployed' : 'Deploy Workflow'}</Button>
            {deployed && <div style={{ marginTop: '0.6rem', fontSize: '0.78rem', color: 'var(--green)', textAlign: 'center' }}>Running on Rialo Workflow engine · ~$0 gas</div>}
          </div>
        )}
      </Card>
    </div>
  );
}
