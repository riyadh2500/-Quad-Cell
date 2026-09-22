import { useState } from 'react';
import { predictionMarketService } from '../../services/predictionMarket.js';
import { useWallet } from '../../hooks/useWallet.js';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';

const QUICK_AMOUNTS = [10, 50, 100, 500];

export default function TradePanel({ market, onClose, onSuccess }) {
  const { isConnected, shortAddress } = useWallet();
  const [side,    setSide]    = useState('YES');
  const [amount,  setAmount]  = useState('100');
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const [error,   setError]   = useState(null);

  const price    = side === 'YES' ? market.yesProb : (1 - market.yesProb);
  const amtNum   = parseFloat(amount) || 0;
  const shares   = amtNum > 0 ? (amtNum / price).toFixed(3) : '0';
  const payout   = amtNum > 0 ? (amtNum / price).toFixed(2) : '0';
  const profitIf = amtNum > 0 ? ((amtNum / price) - amtNum).toFixed(2) : '0';
  const roi      = amtNum > 0 ? (((1 / price) - 1) * 100).toFixed(1) : '0';

  async function handleTrade() {
    if (!isConnected) { setError('Please connect your wallet to trade.'); return; }
    if (amtNum <= 0)  { setError('Please enter a valid amount.'); return; }
    setError(null);
    setLoading(true);
    try {
      const res = await predictionMarketService.placeBet(market.id, side, amtNum);
      setResult(res);
      onSuccess && onSuccess(res);
    } catch (e) {
      setError(e.message || 'Transaction failed. Please try again.');
    }
    setLoading(false);
  }

  // ── Success state ──
  if (result?.success) {
    return (
      <div style={{ padding: '1.75rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--green-dim)', border: '2px solid var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>✓</div>
        <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--green)' }}>Bet Placed Successfully!</div>
        <div style={{ background: 'rgba(212,212,212,0.06)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.85rem 1.25rem', width: '100%', maxWidth: 300 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.82rem' }}>
            <span style={{ color: 'var(--muted)' }}>Side</span>
            <span style={{ fontWeight: 700, color: side === 'YES' ? 'var(--cream)' : 'var(--red)' }}>{side}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.82rem' }}>
            <span style={{ color: 'var(--muted)' }}>Amount</span>
            <span style={{ fontWeight: 700, color: 'var(--cream)' }}>${amtNum} USDC</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.82rem' }}>
            <span style={{ color: 'var(--muted)' }}>Shares</span>
            <span style={{ fontWeight: 700, color: 'var(--cream)' }}>{shares}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
            <span style={{ color: 'var(--muted)' }}>Tx Hash</span>
            <span style={{ fontWeight: 600, color: 'var(--muted)', fontFamily: 'monospace', fontSize: '0.72rem' }}>
              {result.txHash?.slice(0,10)}…
            </span>
          </div>
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
          If {side} resolves: <span style={{ color: 'var(--green)', fontWeight: 700 }}>+${profitIf} profit</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', width: '100%', maxWidth: 300 }}>
          <Button variant="secondary" size="sm" full onClick={onClose}>Close</Button>
          <Button variant="primary" size="sm" full onClick={() => { setResult(null); setAmount('100'); }}>Trade Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}>

      {/* Market title */}
      <div style={{ fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.5, paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
        {market.question}
      </div>

      {/* YES / NO toggle */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        {['YES', 'NO'].map(s => {
          const p = s === 'YES' ? market.yesProb : (1 - market.yesProb);
          const active = side === s;
          return (
            <button key={s} onClick={() => { setSide(s); setError(null); }} style={{
              padding: '0.75rem 0.5rem', borderRadius: 'var(--radius-sm)',
              border: `2px solid ${active ? (s === 'YES' ? 'rgba(212,212,212,0.5)' : 'rgba(248,113,113,0.5)') : 'var(--border)'}`,
              background: active ? (s === 'YES' ? 'rgba(212,212,212,0.1)' : 'var(--red-dim)') : 'rgba(0,0,0,0.3)',
              color: active ? (s === 'YES' ? 'var(--cream)' : 'var(--red)') : 'var(--muted)',
              cursor: 'pointer', transition: 'all 0.15s',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem',
            }}>
              <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{s}</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'inherit', opacity: 0.85 }}>
                {(p * 100).toFixed(1)}%
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--muted)' }}>
                ${(1 / p).toFixed(3)} / share
              </span>
            </button>
          );
        })}
      </div>

      {/* Quick amounts */}
      <div>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.5rem' }}>Quick Amount</div>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {QUICK_AMOUNTS.map(q => (
            <button key={q} onClick={() => setAmount(String(q))} style={{
              padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-sm)',
              background: amount === String(q) ? 'rgba(212,212,212,0.12)' : 'rgba(0,0,0,0.3)',
              border: `1px solid ${amount === String(q) ? 'rgba(212,212,212,0.3)' : 'var(--border)'}`,
              color: amount === String(q) ? 'var(--cream)' : 'var(--muted)',
              fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s',
            }}>
              ${q}
            </button>
          ))}
        </div>
      </div>

      {/* Amount input */}
      <Input
        label="Amount (USDC)"
        type="number"
        value={amount}
        onChange={e => { setAmount(e.target.value); setError(null); }}
        suffix="USDC"
        placeholder="Enter amount"
      />

      {/* Trade summary */}
      {amtNum > 0 && (
        <div style={{
          background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', padding: '0.85rem',
          display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem',
        }}>
          {[
            ['Avg Price', `$${price.toFixed(4)} / share`],
            ['Shares',    shares],
            ['Max Payout', `$${payout}`],
            ['Profit if ' + side, `+$${profitIf} (${roi}% ROI)`],
            ['Fee', '$0.00 (Rialo Cruise)'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--muted)' }}>{k}</span>
              <span style={{ fontWeight: 700, color: k.startsWith('Profit') ? 'var(--green)' : k === 'Fee' ? 'var(--green)' : 'var(--cream)' }}>{v}</span>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background: 'var(--red-dim)', border: '1px solid rgba(248,113,113,0.3)',
          borderRadius: 'var(--radius-sm)', padding: '0.6rem 0.85rem',
          fontSize: '0.8rem', color: 'var(--red)',
        }}>
          ⚠ {error}
        </div>
      )}

      {/* Wallet not connected warning */}
      {!isConnected && (
        <div style={{
          background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)',
          borderRadius: 'var(--radius-sm)', padding: '0.6rem 0.85rem',
          fontSize: '0.78rem', color: 'var(--yellow)',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          <span>🔗</span>
          Connect your wallet to place a bet
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Button variant="secondary" size="sm" onClick={onClose} full>Cancel</Button>
        <Button
          variant="primary" size="sm" full
          onClick={handleTrade}
          disabled={loading || amtNum <= 0}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ animation: 'spin 0.8s linear infinite', display: 'inline-block' }}>⟳</span>
              Placing Bet…
            </span>
          ) : `Buy ${side} — $${amtNum || 0}`}
        </Button>
      </div>
    </div>
  );
}
