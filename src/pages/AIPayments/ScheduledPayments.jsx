import { useState, useEffect } from 'react';
import { aiPaymentService } from '../../services/aiPayments.js';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';

export default function ScheduledPayments() {
  const [scheduled, setScheduled] = useState([]);
  const [cancelling, setCancelling] = useState(null);

  const load = () => aiPaymentService.getScheduled().then(setScheduled);
  useEffect(() => { load(); }, []);

  async function cancel(id) {
    setCancelling(id);
    await aiPaymentService.cancelScheduled(id);
    load();
    setCancelling(null);
  }

  return (
    <div>
      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--cream)', marginBottom: '0.75rem' }}>Scheduled Payments</div>
      {scheduled.length === 0 ? (
        <div style={{ fontSize: '0.82rem', color: 'var(--muted)', textAlign: 'center', padding: '1rem' }}>No scheduled payments</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {scheduled.map(s => (
            <div key={s.id} style={{ background: 'rgba(232,224,208,0.03)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.7rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--cream)', marginBottom: '0.2rem' }}>{s.amount} {s.token} → {s.to}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                  {s.frequency} · Next: {new Date(s.nextRun).toLocaleDateString()}
                </div>
              </div>
              <Badge variant="green">{s.status}</Badge>
              <Button variant="ghost" size="sm" onClick={() => cancel(s.id)} disabled={cancelling === s.id}>
                {cancelling === s.id ? '…' : 'Cancel'}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
