import { useState, useEffect } from 'react';
import { aiPaymentService } from '../../services/aiPayments.js';
import Badge from '../../components/ui/Badge.jsx';

function timeAgo(ts) {
  const s = Math.floor((Date.now()-ts)/1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  return `${Math.floor(s/3600)}h ago`;
}

const STATUS_VARIANT = { confirmed: 'green', pending: 'yellow', failed: 'red' };

export default function TxHistory() {
  const [history, setHistory] = useState([]);
  useEffect(() => {
    aiPaymentService.getHistory().then(setHistory);
    const t = setInterval(() => aiPaymentService.getHistory().then(setHistory), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div>
      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--cream)', marginBottom: '0.75rem' }}>Transaction History</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {history.map(tx => (
          <div key={tx.id} style={{ background: 'rgba(232,224,208,0.03)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.7rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--cream)' }}>{tx.amount} {tx.token}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>→ {tx.to}</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{timeAgo(tx.time)} · {tx.route}</div>
            </div>
            <Badge variant={STATUS_VARIANT[tx.status] || 'outline'}>{tx.status}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
