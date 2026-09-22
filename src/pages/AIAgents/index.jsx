import { useState, useEffect } from 'react';
import { agentService } from '../../services/agents.js';
import AgentCard from './AgentCard.jsx';
import AgentDetail from './AgentDetail.jsx';
import Button from '../../components/ui/Button.jsx';

export default function AIAgents() {
  const [agents, setAgents] = useState([]);
  const [selected, setSelected] = useState(null);
  const load = () => agentService.getAgents().then(setAgents);
  useEffect(() => { load(); }, []);
  const toggle = async (id) => { await agentService.toggleAgent(id); load(); };

  return (
    <div style={{ padding: '1.5rem' }}>
      {selected ? (
        <AgentDetail agentId={selected} onBack={() => { setSelected(null); load(); }} />
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--cream)', letterSpacing: '-0.02em' }}>AI Agents</h1>
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.2rem' }}>Autonomous agents powered by Rialo Agentic Edge Harness</p>
            </div>
            <Button variant="primary" size="sm">+ New Agent</Button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {agents.map(a => <AgentCard key={a.id} agent={a} onClick={() => setSelected(a.id)} onToggle={toggle} />)}
          </div>
        </>
      )}
    </div>
  );
}
