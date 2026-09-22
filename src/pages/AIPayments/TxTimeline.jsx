import { useState, useEffect } from 'react';

const STEPS = [
  { id: 1, label: 'Parsing command', ms: 12 },
  { id: 2, label: 'Routing via Rialo Interop', ms: 23 },
  { id: 3, label: 'Compliance check (Rialo IPC)', ms: 8 },
  { id: 4, label: 'Executing on-chain', ms: 45 },
  { id: 5, label: 'Confirmation', ms: 3 },
];

export default function TxTimeline({ active, txHash }) {
  const [done, setDone] = useState([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!active) return;
    setDone([]); setCurrent(0);
    let i = 0;
    const next = () => {
      if (i >= STEPS.length) return;
      setCurrent(i);
      setTimeout(() => { setDone(d => [...d, i]); i++; setTimeout(next, STEPS[i]?.ms || 0); }, STEPS[i].ms * 10);
    };
    next();
  }, [active]);

  if (!active && done.length === 0) return null;

  return (
    <div style={{ background: 'rgba(232,224,208,0.03)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.85rem', margin: '0.5rem 0' }}>
      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--cream)', marginBottom: '0.65rem' }}>Transaction Timeline</div>
      {STEPS.map((s, i) => {
        const isDone = done.includes(i);
        const isActive = current === i && active;
        return (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.45rem' }}>
            <div style={{
              width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.65rem', fontWeight: 700,
              background: isDone ? 'var(--green)' : isActive ? 'rgba(232,224,208,0.15)' : 'rgba(255,255,255,0.05)',
              border: isActive ? '1px solid rgba(232,224,208,0.3)' : isDone ? 'none' : '1px solid var(--border)',
              color: isDone ? '#fff' : 'var(--muted)',
            }}>
              {isDone ? '✓' : isActive ? <span style={{ animation: 'spin 0.8s linear infinite', display: 'inline-block' }}>⟳</span> : i + 1}
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.78rem', color: isDone ? 'var(--text)' : isActive ? 'var(--cream)' : 'var(--muted)' }}>{s.label}</span>
            </div>
            {isDone && <span style={{ fontSize: '0.7rem', color: 'var(--green)', fontWeight: 700 }}>{s.ms}ms</span>}
          </div>
        );
      })}
      {done.length === STEPS.length && txHash && (
        <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'var(--green-dim)', borderRadius: 'var(--radius-sm)', fontSize: '0.72rem', color: 'var(--green)', fontWeight: 600 }}>
          ✓ Confirmed · {txHash}
        </div>
      )}
    </div>
  );
}
