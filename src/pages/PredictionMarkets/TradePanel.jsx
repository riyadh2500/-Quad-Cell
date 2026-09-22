import { useState } from 'react';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { predictionMarketService } from '../../services/predictionMarket.js';

export default function TradePanel({ market, onClose, onSuccess }) {
  const [side, setSide] = useState('YES');
  const [amount, setAmount] = useState('100');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const price = side === 'YES' ? market.yesProb : (1 - market.yesProb);
  const shares = amount && !isNaN(amount) ? (parseFloat(amount) / price).toFixed(2) : '0';
  const potential = amount && !isNaN(amount) ? (parseFloat(shares)).toFixed(2) : '0';

  async function handleTrade() {
    setLoading(true);
    try {
      const res = await predictionMarketService.placeBet(market.id, side, parseFloat(amount));
      setResult(res);
      onSuccess && onSuccess(res);
    } catch (e) {
      setResult({ success: false, error: e.message });
    }
    setLoading(false);
  }

  if (result?.success) return (
    <div style={{ padding: '1.25rem', textAlign: 'center' }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
      <div style={{ fontWeight: 700, color: 'var(--green)', marginBottom: '0.25rem' }}>Bet Placed!</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Tx: {result.txHash}</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '1rem' }}>{shares} {side} shares purchased</div>
      <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
    </div>
  );

  return (
    <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--cream)' }}>Place a Bet</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.4 }}>{market.question}</div>
      {/* Side toggle */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        {['YES','NO'].map(s => (
          <button key={s} onClick={() => setSide(s)} style={{
            padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid',
            borderColor: side === s ? (s === 'YES' ? 'var(--cream)' : 'var(--red)') : 'var(--border)',
            background: side === s ? (s === 'YES' ? 'rgba(232,224,208,0.12)' : 'var(--red-dim)') : 'transparent',
            color: side === s ? (s === 'YES' ? 'var(--cream)' : 'var(--red)') : 'var(--muted)',
            fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
          }}>{s} {s === 'YES' ? `${(market.yesProb*100).toFixed(1)}%` : `${((1-market.yesProb)*100).toFixed(1)}%`}</button>
        ))}
      </div>
      <Input label="Amount (USDC)" type="number" value={amount} onChange={e => setAmount(e.target.value)} suffix="USDC" />
      <div style={{ background: 'rgba(232,224,208,0.04)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', fontSize: '0.8rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
          <span style={{ color: 'var(--muted)' }}>Shares</span><span style={{ color: 'var(--cream)', fontWeight: 600 }}>{shares}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
          <span style={{ color: 'var(--muted)' }}>Max payout</span><span style={{ color: 'var(--cream)', fontWeight: 600 }}>${potential}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--muted)' }}>Fee</span><span style={{ color: 'var(--green)', fontWeight: 600 }}>$0.00</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Button variant="secondary" size="sm" onClick={onClose} full>Cancel</Button>
        <Button variant="primary" size="sm" onClick={handleTrade} disabled={loading || !amount} full>
          {loading ? 'Submitting…' : `Buy ${side}`}
        </Button>
      </div>
    </div>
  );
}
