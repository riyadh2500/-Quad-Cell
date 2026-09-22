import { useState } from 'react';
import { predictionMarketService } from '../../services/predictionMarket.js';
import { useWallet } from '../../hooks/useWallet.js';
import { useUSDTBalance } from '../../hooks/useUSDTBalance.js';
import { ensureSepoliaNetwork, USDT_SEPOLIA, transferUSDT } from '../../hooks/useToken.js';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';

const QUICK_AMOUNTS = [10, 50, 100, 500];

// Simulated Quad Cell escrow address (replace with real contract)
const QUAD_CELL_ESCROW = '0x000000000000000000000000000000000000dead';

export default function TradePanel({ market, onClose, onSuccess }) {
  const { isConnected, address, chainId } = useWallet();
  const { balance: usdtBalance, onSepolia, refresh: refreshBalance } = useUSDTBalance();

  const [side,    setSide]    = useState('YES');
  const [amount,  setAmount]  = useState('100');
  const [loading, setLoading] = useState(false);
  const [step,    setStep]    = useState(''); // 'network' | 'approve' | 'tx' | ''
  const [result,  setResult]  = useState(null);
  const [error,   setError]   = useState(null);

  const price    = side === 'YES' ? market.yesProb : (1 - market.yesProb);
  const amtNum   = parseFloat(amount) || 0;
  const shares   = amtNum > 0 ? (amtNum / price).toFixed(3)                  : '0';
  const payout   = amtNum > 0 ? (amtNum / price).toFixed(2)                  : '0';
  const profitIf = amtNum > 0 ? ((amtNum / price) - amtNum).toFixed(2)        : '0';
  const roi      = amtNum > 0 ? (((1 / price) - 1) * 100).toFixed(1)          : '0';
  const hasEnough = usdtBalance !== null && usdtBalance >= amtNum;

  async function handleTrade() {
    if (!isConnected)    { setError('Connect your wallet first.'); return; }
    if (amtNum <= 0)     { setError('Enter a valid amount.'); return; }
    if (!hasEnough && usdtBalance !== null) {
      setError(`Insufficient USDT balance. You have ${usdtBalance?.toFixed(2) ?? '0'} USDT.`);
      return;
    }
    setError(null);
    setLoading(true);

    try {
      // Step 1 — ensure Sepolia network
      setStep('network');
      const switched = await ensureSepoliaNetwork();
      if (!switched) {
        setError('Please switch to Ethereum Sepolia testnet to trade.');
        setLoading(false); setStep('');
        return;
      }

      // Step 2 — send USDT transaction (approve + transfer to escrow)
      setStep('tx');
      let txHash;
      try {
        txHash = await transferUSDT(QUAD_CELL_ESCROW, amtNum);
      } catch (txErr) {
        if (txErr.code === 4001) {
          setError('Transaction rejected by user.');
        } else {
          // Fallback: proceed without on-chain tx (demo mode)
          console.warn('TX failed, running in demo mode:', txErr.message);
          txHash = null;
        }
      }

      // Step 3 — record bet in service layer
      setStep('approve');
      const res = await predictionMarketService.placeBet(market.id, side, amtNum);

      // Merge real txHash if we got one
      if (txHash) res.txHash = txHash;
      res.usdtUsed = amtNum;
      res.network  = 'Ethereum Sepolia';

      setResult(res);
      refreshBalance();
      onSuccess && onSuccess(res);

    } catch (e) {
      setError(e.message || 'Transaction failed. Please try again.');
    }
    setLoading(false);
    setStep('');
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (result?.success) {
    return (
      <div style={{ padding: '1.75rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--green-dim)', border: '2px solid var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>✓</div>
        <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--green)' }}>Bet Placed!</div>

        {/* Summary card */}
        <div style={{ background: 'rgba(212,212,212,0.05)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem 1.25rem', width: '100%', maxWidth: 300, fontSize: '0.82rem' }}>
          {[
            ['Side',     <span style={{ color: side==='YES'?'var(--cream)':'var(--red)', fontWeight:800 }}>{side}</span>],
            ['Amount',   `${amtNum} USDT`],
            ['Shares',   shares],
            ['Network',  'Ethereum Sepolia'],
            ['Token',    `USDT (${USDT_SEPOLIA.address.slice(0,8)}…)`],
            ['Tx Hash',  result.txHash ? result.txHash.slice(0,14)+'…' : 'Demo mode'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ color: 'var(--muted)' }}>{k}</span>
              <span style={{ fontWeight: 700, color: 'var(--cream)' }}>{v}</span>
            </div>
          ))}
        </div>

        {result.txHash && result.txHash.startsWith('0x') && result.txHash.length > 20 && (
          <a
            href={`${USDT_SEPOLIA.explorer}/tx/${result.txHash}`}
            target="_blank" rel="noreferrer"
            style={{ fontSize: '0.78rem', color: 'var(--cream)', textDecoration: 'underline' }}
          >
            View on Sepolia Explorer →
          </a>
        )}

        <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
          Potential profit: <span style={{ color: 'var(--green)', fontWeight: 700 }}>+${profitIf} USDT</span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', width: '100%', maxWidth: 300 }}>
          <Button variant="secondary" size="sm" full onClick={onClose}>Close</Button>
          <Button variant="primary"   size="sm" full onClick={() => { setResult(null); setAmount('100'); }}>Trade Again</Button>
        </div>
      </div>
    );
  }

  // ── Trade form ─────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}>

      {/* Market title */}
      <div style={{ fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.5, paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
        {market.question}
      </div>

      {/* Network + USDT balance banner */}
      <div style={{
        background: 'rgba(212,212,212,0.05)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)', padding: '0.6rem 0.85rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: onSepolia ? 'var(--green)' : 'var(--yellow)', display: 'inline-block' }} />
          <span style={{ color: 'var(--muted)' }}>
            {onSepolia ? 'Ethereum Sepolia' : 'Switch to Sepolia'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ color: 'var(--muted)' }}>Balance:</span>
          <span style={{ fontWeight: 800, color: usdtBalance !== null ? (hasEnough ? 'var(--cream)' : 'var(--red)') : 'var(--muted)' }}>
            {isConnected ? (usdtBalance !== null ? `${usdtBalance.toFixed(2)} USDT` : 'Loading…') : '—'}
          </span>
        </div>
      </div>

      {/* YES / NO toggle */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        {['YES', 'NO'].map(s => {
          const p      = s === 'YES' ? market.yesProb : (1 - market.yesProb);
          const active = side === s;
          return (
            <button key={s} onClick={() => { setSide(s); setError(null); }} style={{
              padding: '0.75rem 0.5rem', borderRadius: 'var(--radius-sm)',
              border: `2px solid ${active ? (s==='YES'?'rgba(212,212,212,0.5)':'rgba(248,113,113,0.5)') : 'var(--border)'}`,
              background: active ? (s==='YES'?'rgba(212,212,212,0.1)':'var(--red-dim)') : 'rgba(0,0,0,0.3)',
              color: active ? (s==='YES'?'var(--cream)':'var(--red)') : 'var(--muted)',
              cursor: 'pointer', transition: 'all 0.15s',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem',
            }}>
              <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{s}</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, opacity: 0.85 }}>{(p*100).toFixed(1)}%</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>${(1/p).toFixed(3)}/share</span>
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
              background: amount===String(q)?'rgba(212,212,212,0.12)':'rgba(0,0,0,0.3)',
              border: `1px solid ${amount===String(q)?'rgba(212,212,212,0.3)':'var(--border)'}`,
              color: amount===String(q)?'var(--cream)':'var(--muted)',
              fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s',
            }}>
              ${q}
            </button>
          ))}
        </div>
      </div>

      {/* Amount input */}
      <Input
        label="Amount (USDT)"
        type="number"
        value={amount}
        onChange={e => { setAmount(e.target.value); setError(null); }}
        suffix="USDT"
        placeholder="Enter amount"
      />

      {/* Trade summary */}
      {amtNum > 0 && (
        <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.85rem', fontSize: '0.8rem' }}>
          {[
            ['Token',         `USDT (Sepolia)`],
            ['Avg Price',     `$${price.toFixed(4)} / share`],
            ['Shares',        shares],
            ['Max Payout',    `$${payout} USDT`],
            [`Profit if ${side}`, `+$${profitIf} (${roi}% ROI)`],
            ['Fee',           '$0.00 (Rialo Cruise)'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <span style={{ color: 'var(--muted)' }}>{k}</span>
              <span style={{ fontWeight: 700, color: k.startsWith('Profit')||k==='Fee'?'var(--green)':k==='Token'?'var(--muted)':'var(--cream)' }}>{v}</span>
            </div>
          ))}
        </div>
      )}

      {/* Step indicator while loading */}
      {loading && step && (
        <div style={{ background: 'rgba(212,212,212,0.05)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {[
            { id: 'network',  label: 'Switching to Sepolia…' },
            { id: 'tx',       label: 'Sending USDT transaction…' },
            { id: 'approve',  label: 'Recording bet on-chain…' },
          ].map((s, i) => {
            const steps  = ['network','tx','approve'];
            const curIdx = steps.indexOf(step);
            const sIdx   = steps.indexOf(s.id);
            const done   = sIdx < curIdx;
            const active = s.id === step;
            return (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.78rem', color: done?'var(--green)':active?'var(--cream)':'var(--muted)' }}>
                <span style={{ fontSize: '0.85rem' }}>
                  {done ? '✓' : active ? <span style={{ animation: 'spin 0.8s linear infinite', display: 'inline-block' }}>⟳</span> : '○'}
                </span>
                {s.label}
              </div>
            );
          })}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 'var(--radius-sm)', padding: '0.6rem 0.85rem', fontSize: '0.8rem', color: 'var(--red)' }}>
          ⚠ {error}
        </div>
      )}

      {/* Wallet / network warnings */}
      {!isConnected && (
        <div style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 'var(--radius-sm)', padding: '0.6rem 0.85rem', fontSize: '0.78rem', color: 'var(--yellow)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🔗 Connect your wallet to place a bet
        </div>
      )}
      {isConnected && !onSepolia && (
        <div style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 'var(--radius-sm)', padding: '0.6rem 0.85rem', fontSize: '0.78rem', color: 'var(--yellow)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          ⚠ You are not on Sepolia. Click "Buy" to switch automatically.
        </div>
      )}

      {/* Token info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', color: 'var(--muted)', padding: '0.4rem 0' }}>
        <span style={{ background: 'rgba(212,212,212,0.08)', border: '1px solid var(--border)', borderRadius: '4px', padding: '0.15rem 0.45rem', fontFamily: 'monospace', fontSize: '0.68rem' }}>
          USDT
        </span>
        <span>{USDT_SEPOLIA.address.slice(0,10)}…{USDT_SEPOLIA.address.slice(-6)}</span>
        <a href={`${USDT_SEPOLIA.explorer}/token/${USDT_SEPOLIA.address}`} target="_blank" rel="noreferrer" style={{ color: 'var(--cream)', marginLeft: 'auto' }}>
          View token →
        </a>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Button variant="secondary" size="sm" onClick={onClose} full>Cancel</Button>
        <Button
          variant="primary" size="sm" full
          onClick={handleTrade}
          disabled={loading || amtNum <= 0 || (!hasEnough && usdtBalance !== null)}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}>
              <span style={{ animation: 'spin 0.8s linear infinite', display: 'inline-block' }}>⟳</span>
              {step === 'network' ? 'Switching…' : step === 'tx' ? 'Sending USDT…' : 'Confirming…'}
            </span>
          ) : `Buy ${side} — ${amtNum || 0} USDT`}
        </Button>
      </div>
    </div>
  );
}
