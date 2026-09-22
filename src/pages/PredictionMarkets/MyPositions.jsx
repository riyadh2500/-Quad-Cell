import { useState, useEffect } from 'react';
import { predictionMarketService } from '../../services/predictionMarket.js';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';

function PnlBadge({ pnl }) {
  const pos = pnl >= 0;
  return (
    <span style={{
      fontWeight: 800, fontSize: '0.82rem',
      color: pos ? 'var(--green)' : 'var(--red)',
    }}>
      {pos ? '+' : ''}{pnl.toFixed(2)}
    </span>
  );
}

export default function MyPositions({ onViewMarket }) {
  const [positions, setPositions] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [claiming,  setClaiming]  = useState(null);
  const [toast,     setToast]     = useState(null);

  const load = () =>
    predictionMarketService.getUserPositions().then(p => { setPositions(p); setLoading(false); });

  useEffect(() => {
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, []);

  async function claim(marketId) {
    setClaiming(marketId);
    try {
      const res = await predictionMarketService.claimPayout(marketId);
      setToast({ ok: true, msg: `Claimed $${res.amount.toFixed(2)} USDC!` });
      load();
    } catch (e) {
      setToast({ ok: false, msg: e.message });
    }
    setClaiming(null);
    setTimeout(() => setToast(null), 3000);
  }

  const totalInvested = positions.reduce((s, p) => s + p.amount, 0);
  const totalPnl      = positions.reduce((s, p) => s + (p.pnl || 0), 0);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton" style={{ height: 96, borderRadius: 'var(--radius)' }} />
        ))}
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '4rem 2rem', gap: '1rem', textAlign: 'center',
      }}>
        <div style={{ fontSize: '3rem' }}>📭</div>
        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--cream)' }}>No positions yet</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--muted)', maxWidth: 320 }}>
          Browse the markets and place your first bet to see your positions here.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          background: toast.ok ? 'var(--green-dim)' : 'var(--red-dim)',
          border: `1px solid ${toast.ok ? 'rgba(16,185,129,0.3)' : 'rgba(248,113,113,0.3)'}`,
          borderRadius: 'var(--radius-sm)', padding: '0.65rem 1rem',
          fontSize: '0.82rem', fontWeight: 700,
          color: toast.ok ? 'var(--green)' : 'var(--red)',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          {toast.ok ? '✓' : '⚠'} {toast.msg}
        </div>
      )}

      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
        {[
          { label: 'Positions',    value: positions.length, color: 'var(--cream)' },
          { label: 'Invested',     value: `$${totalInvested.toFixed(2)}`, color: 'var(--cream)' },
          { label: 'Unrealized P&L', value: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}`, color: totalPnl >= 0 ? 'var(--green)' : 'var(--red)' },
        ].map(s => (
          <Card key={s.label} style={{ padding: '0.85rem 1rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.3rem' }}>{s.label}</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: s.color }}>{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Positions list */}
      {positions.map(pos => {
        const currentProb = pos.currentProb || pos.avgPrice;
        const pnlPct      = pos.amount > 0 ? ((pos.pnl / pos.amount) * 100).toFixed(1) : '0';
        const side        = pos.side;
        const currentVal  = side === 'YES'
          ? pos.shares * currentProb
          : pos.shares * (1 - currentProb);

        return (
          <Card key={pos.id} style={{ padding: '1.1rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--cream)', lineHeight: 1.4, marginBottom: '0.4rem' }}>
                  {pos.market}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <Badge variant={side === 'YES' ? 'cream' : 'red'}>{side}</Badge>
                  <span style={{ fontSize: '0.72rem', color: 'var(--muted)', alignSelf: 'center' }}>
                    {pos.shares.toFixed(3)} shares @ ${pos.avgPrice.toFixed(3)}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                <Button
                  variant="ghost" size="sm"
                  onClick={() => onViewMarket && onViewMarket({ id: pos.marketId })}
                >
                  View →
                </Button>
              </div>
            </div>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.75rem' }}>
              {[
                { label: 'Invested',       value: `$${pos.amount.toFixed(2)}`,     color: 'var(--cream)' },
                { label: 'Current Value',  value: `$${currentVal.toFixed(2)}`,     color: 'var(--cream)' },
                { label: 'Unrealized P&L', value: <PnlBadge pnl={pos.pnl || 0} />, color: null },
                { label: 'ROI',            value: `${pos.pnl >= 0 ? '+' : ''}${pnlPct}%`, color: (pos.pnl || 0) >= 0 ? 'var(--green)' : 'var(--red)' },
                { label: 'Current Odds',   value: `${(currentProb * 100).toFixed(1)}%`, color: 'var(--cream)' },
              ].map(s => (
                <div key={s.label} style={{ background: 'rgba(212,212,212,0.04)', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.65rem' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>{s.label}</div>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: s.color || 'inherit' }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Probability bar */}
            <div style={{ marginTop: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.72rem' }}>
                <span style={{ color: 'var(--cream)' }}>YES {(currentProb * 100).toFixed(1)}%</span>
                <span style={{ color: 'var(--red)' }}>NO {((1 - currentProb) * 100).toFixed(1)}%</span>
              </div>
              <div style={{ height: 5, borderRadius: 100, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${(currentProb * 100).toFixed(1)}%`,
                  background: 'linear-gradient(90deg, var(--cream-dim), var(--cream))',
                  borderRadius: 100, transition: 'width 0.5s ease',
                }} />
              </div>
            </div>

            {/* Claim button if resolved */}
            {pos.resolved && (
              <Button
                variant="green" size="sm" full
                style={{ marginTop: '0.85rem' }}
                onClick={() => claim(pos.marketId)}
                disabled={claiming === pos.marketId}
              >
                {claiming === pos.marketId ? '⟳ Claiming…' : '🎉 Claim Payout'}
              </Button>
            )}
          </Card>
        );
      })}
    </div>
  );
}
