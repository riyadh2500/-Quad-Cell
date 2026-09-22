import { useState, useEffect } from 'react';
import { agentService } from '../../services/agents.js';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Card from '../../components/ui/Card.jsx';

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return s + 's';
  if (s < 3600) return Math.floor(s / 60) + 'm';
  return Math.floor(s / 3600) + 'h';
}

export default function AgentDetail({ agentId, onBack }) {
  const [agent, setAgent] = useState(null);
  const load = () => agentService.getAgent(agentId).then(setAgent);
  useEffect(() => { load(); }, [agentId]);
  if (!agent) return <div style={{ padding: '2rem', color: 'var(--muted)' }}>Loading…</div>;
  const toggle = async () => { await agentService.toggleAgent(agentId); load(); };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem', maxWidth: 800 }}>
      <Button variant="ghost" size="sm" onClick={onBack}>← Back to Agents</Button>
      <Card style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'rgba(232,224,208,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>🤖</div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--cream)' }}>{agent.name}</h2>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Wallet: {agent.wallet}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Badge variant={agent.status === 'active' ? 'green' : 'outline'} dot>{agent.status}</Badge>
            <Button variant={agent.status === 'active' ? 'secondary' : 'green'} size="sm" onClick={toggle}>
              {agent.status === 'active' ? 'Pause Agent' : 'Resume Agent'}
            </Button>
          </div>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.6 }}>{agent.description}</p>
      </Card>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <Card style={{ padding: '1rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--cream)', marginBottom: '0.6rem' }}>Spending</div>
          {[['Limit', '$' + agent.spendingLimit], ['Spent (30d)', '$' + agent.spent30d], ['Remaining', '$' + (agent.spendingLimit - agent.spent30d)]].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--muted)' }}>{k}</span><span style={{ color: 'var(--cream)', fontWeight: 700 }}>{v}</span>
            </div>
          ))}
        </Card>
        <Card style={{ padding: '1rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--cream)', marginBottom: '0.6rem' }}>Triggers</div>
          {agent.triggers.map((t, i) => (
            <div key={i} style={{ fontSize: '0.78rem', background: 'rgba(232,224,208,0.05)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.4rem 0.6rem', marginBottom: '0.3rem' }}>
              <span style={{ color: 'var(--muted)' }}>{t.type}: </span><span style={{ color: 'var(--cream)' }}>{t.value}</span>
            </div>
          ))}
        </Card>
      </div>
      <Card style={{ padding: '1rem' }}>
        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--cream)', marginBottom: '0.75rem' }}>Action History ({agent.actions.length})</div>
        {agent.actions.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>No actions yet</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: 280, overflowY: 'auto' }}>
            {agent.actions.map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.45rem 0.6rem', background: 'rgba(232,224,208,0.03)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem' }}>
                <span style={{ color: a.status === 'success' ? 'var(--green)' : 'var(--red)', flexShrink: 0 }}>{a.status === 'success' ? '✓' : '✗'}</span>
                <span style={{ flex: 1, color: 'var(--text)' }}>{a.description}</span>
                <span style={{ color: 'var(--muted)', flexShrink: 0 }}>{timeAgo(a.time)} ago</span>
              </div>
            ))}
          </div>
        )}
      </Card>
      <Card style={{ padding: '1rem', background: 'rgba(232,224,208,0.03)' }}>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.2rem' }}>🛡️</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--cream)', marginBottom: '0.3rem' }}>Rialo Agentic Edge Harness</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.5 }}>This agent runs inside Rialo's confidential on-chain execution environment, protected from prompt injection and adversarial manipulation.</div>
            <a href="https://agents.rialo.io" target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--cream)', marginTop: '0.4rem', display: 'inline-block' }}>Learn more →</a>
          </div>
        </div>
      </Card>
    </div>
  );
}
