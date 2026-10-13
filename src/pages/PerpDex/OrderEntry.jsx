import { useState, useEffect } from 'react';
import { perpDexService } from '../../services/perpDex.js';
import { useWallet } from '../../hooks/useWallet.js';
import { useUSDTBalance } from '../../hooks/useUSDTBalance.js';
import { ensureSepoliaNetwork, transferUSDT } from '../../hooks/useToken.js';
import Button from '../../components/ui/Button.jsx';
import Tabs from '../../components/ui/Tabs.jsx';

const LEVERS      = [1, 2, 5, 10, 25, 50];
const QUICK_COL   = [50, 100, 500, 1000];
const DEX_ESCROW  = '0x000000000000000000000000000000000000dead';
const ORDER_TYPES = [{ value:'market', label:'Market' }, { value:'limit', label:'Limit' }, { value:'stop', label:'Stop' }];

export default function OrderEntry({ pair, onPositionOpened }) {
  const { isConnected } = useWallet();
  const { balance: usdtBal, onSepolia, refresh: refreshBal } = useUSDTBalance();

  const [side,       setSide]       = useState('long');
  const [orderType,  setOrderType]  = useState('market');
  const [collateral, setCollateral] = useState('100');
  const [leverage,   setLeverage]   = useState(10);
  const [loading,    setLoading]    = useState(false);
  const [step,       setStep]       = useState('');
  const [toast,      setToast]      = useState(null);
  const [livePrice,  setLivePrice]  = useState(0);

  // Keep price live-updating
  useEffect(() => {
    const tick = () => setLivePrice(perpDexService.getPrice(pair));
    tick();
    const t = setInterval(tick, 800);
    return () => clearInterval(t);
  }, [pair]);

  const colNum    = parseFloat(collateral) || 0;
  const posSize   = (colNum * leverage).toFixed(2);
  const liqMult   = side === 'long' ? (1 - 0.8 / leverage) : (1 + 0.8 / leverage);
  const liqPrice  = livePrice > 0 ? (livePrice * liqMult).toFixed(2) : '—';
  const hasEnough = usdtBal !== null && usdtBal >= colNum;
  const canSubmit = isConnected && colNum > 0 && (usdtBal === null || hasEnough) && !loading;

  function showToast(ok, msg) {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 5000);
  }

  async function submit() {
    if (!isConnected)  { showToast(false, '🔗 Connect your wallet first.'); return; }
    if (colNum <= 0)   { showToast(false, 'Enter a collateral amount.'); return; }
    if (!hasEnough && usdtBal !== null) {
      showToast(false, `Insufficient USDT — balance: ${usdtBal.toFixed(2)}`);
      return;
    }

    setLoading(true);
    setToast(null);

    try {
      // 1. Ensure Sepolia
      setStep('network');
      const ok = await ensureSepoliaNetwork();
      if (!ok) { showToast(false, 'Please switch to Ethereum Sepolia.'); setLoading(false); setStep(''); return; }

      // 2. On-chain USDT transfer
      setStep('tx');
      let txHash = null;
      try {
        txHash = await transferUSDT(DEX_ESCROW, colNum);
      } catch (e) {
        if (e.code === 4001) { showToast(false, 'Transaction rejected.'); setLoading(false); setStep(''); return; }
        // demo fallback — proceed without tx
        console.warn('TX skipped (demo):', e.message);
      }

      // 3. Record position
      setStep('record');
      const res = await perpDexService.openPosition({ pair, side, collateral: colNum, leverage, orderType, txHash });

      showToast(true, `✓ ${side.toUpperCase()} opened @ $${res.position.entryPrice.toFixed(2)} · ${colNum} USDT`);
      refreshBal();
      onPositionOpened && onPositionOpened(res.position);

    } catch (e) {
      showToast(false, e.message || 'Failed to open position.');
    }
    setLoading(false);
    setStep('');
  }

  const STEPS = [
    { id: 'network', label: 'Switching to Sepolia' },
    { id: 'tx',      label: 'Sending USDT collateral' },
    { id: 'record',  label: 'Confirming position' },
  ];
  const stepOrder = STEPS.map(s => s.id);

  return (
    <div style={{ padding: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', height: '100%', overflowY: 'auto' }}>

      {/* Balance strip */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0.45rem 0.75rem', borderRadius: '8px',
        background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)',
        fontSize: '0.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: onSepolia ? 'var(--green)' : 'var(--yellow)', flexShrink: 0, boxShadow: onSepolia ? '0 0 5px var(--green)' : 'none' }} />
          <span style={{ color: 'var(--muted)' }}>{onSepolia ? 'Sepolia' : 'Switch to Sepolia'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ color: 'var(--muted)' }}>USDT</span>
          <span style={{ fontWeight: 800, color: !isConnected ? 'var(--muted)' : hasEnough ? 'var(--cream)' : 'var(--red)' }}>
            {!isConnected ? '—' : usdtBal !== null ? usdtBal.toFixed(2) : '…'}
          </span>
        </div>
      </div>

      {/* Long / Short */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
        {['long', 'short'].map(s => (
          <button key={s} onClick={() => setSide(s)} style={{
            padding: '0.6rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.88rem',
            cursor: 'pointer', border: '1px solid',
            borderColor: side === s ? (s === 'long' ? 'rgba(16,185,129,0.5)' : 'rgba(248,113,113,0.5)') : 'var(--border)',
            background:  side === s ? (s === 'long' ? 'rgba(16,185,129,0.12)' : 'rgba(248,113,113,0.12)') : 'rgba(0,0,0,0.3)',
            color:       side === s ? (s === 'long' ? 'var(--green)' : 'var(--red)') : 'var(--muted)',
            transition: 'all 0.15s',
          }}>
            {s === 'long' ? '↑ LONG' : '↓ SHORT'}
          </button>
        ))}
      </div>

      {/* Order type */}
      <Tabs tabs={ORDER_TYPES} active={orderType} onChange={setOrderType} />

      {/* Leverage */}
      <div>
        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
          Leverage · <span style={{ color: 'var(--cream)' }}>{leverage}×</span>
        </div>
        <div style={{ display: 'flex', gap: '0.3rem' }}>
          {LEVERS.map(l => (
            <button key={l} onClick={() => setLeverage(l)} style={{
              flex: 1, padding: '0.3rem 0', borderRadius: '7px', fontSize: '0.75rem', fontWeight: 700,
              cursor: 'pointer', border: '1px solid',
              borderColor: leverage === l ? 'rgba(212,212,212,0.4)' : 'var(--border)',
              background:  leverage === l ? 'rgba(212,212,212,0.12)' : 'transparent',
              color:       leverage === l ? 'var(--cream)' : 'var(--muted)',
              transition: 'all 0.12s',
            }}>{l}×</button>
          ))}
        </div>
      </div>

      {/* Collateral input */}
      <div>
        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
          Collateral (USDT)
        </div>
        {/* Quick amounts */}
        <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.4rem' }}>
          {QUICK_COL.map(q => (
            <button key={q} onClick={() => setCollateral(String(q))} style={{
              flex: 1, padding: '0.25rem 0', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600,
              cursor: 'pointer', border: '1px solid',
              borderColor: collateral === String(q) ? 'rgba(212,212,212,0.3)' : 'var(--border)',
              background:  collateral === String(q) ? 'rgba(212,212,212,0.1)' : 'transparent',
              color:       collateral === String(q) ? 'var(--cream)' : 'var(--muted)',
              transition: 'all 0.12s',
            }}>${q}</button>
          ))}
        </div>
        <div style={{ position: 'relative' }}>
          <input
            type="number" value={collateral}
            onChange={e => setCollateral(e.target.value)}
            placeholder="Amount"
            style={{
              width: '100%', background: 'rgba(0,0,0,0.45)', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '0.65rem 3.5rem 0.65rem 0.9rem',
              color: 'var(--text)', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none',
              boxSizing: 'border-box', transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = 'rgba(212,212,212,0.35)'}
            onBlur={e  => e.target.style.borderColor = 'var(--border)'}
          />
          <span style={{ position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.78rem', color: 'var(--muted)', pointerEvents: 'none' }}>USDT</span>
        </div>
      </div>

      {/* Trade summary */}
      <div style={{
        background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)',
        borderRadius: '8px', padding: '0.7rem 0.85rem',
        display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.78rem',
      }}>
        {[
          ['Position Size',  `$${parseFloat(posSize).toLocaleString('en', { maximumFractionDigits: 2 })}`    ],
          ['Entry Price',    livePrice > 0 ? `$${livePrice.toLocaleString('en', { maximumFractionDigits: 2 })}` : '—'],
          ['Liq. Price',     `$${liqPrice}`,  'var(--red)'   ],
          ['Collateral',     `${colNum} USDT`, 'var(--cream)' ],
          ['Fees',           '~$0.00',         'var(--green)' ],
        ].map(([k, v, col]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--muted)' }}>{k}</span>
            <span style={{ fontWeight: 700, color: col || 'var(--cream)', fontFamily: ['Entry Price','Liq. Price'].includes(k) ? 'monospace' : 'inherit' }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Step progress */}
      {loading && step && (
        <div style={{ background: 'rgba(212,212,212,0.04)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.65rem 0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {STEPS.map(s => {
            const cur  = stepOrder.indexOf(step);
            const idx  = stepOrder.indexOf(s.id);
            const done = idx < cur, active = s.id === step;
            return (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.78rem', color: done ? 'var(--green)' : active ? 'var(--cream)' : 'var(--muted)' }}>
                <span style={{ width: 16, textAlign: 'center' }}>
                  {done ? '✓' : active ? <span style={{ display: 'inline-block', animation: 'spin 0.8s linear infinite' }}>⟳</span> : '○'}
                </span>
                {s.label}
              </div>
            );
          })}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          padding: '0.55rem 0.8rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, lineHeight: 1.5,
          background: toast.ok ? 'var(--green-dim)' : 'var(--red-dim)',
          border: `1px solid ${toast.ok ? 'rgba(16,185,129,0.3)' : 'rgba(248,113,113,0.3)'}`,
          color: toast.ok ? 'var(--green)' : 'var(--red)',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Warnings */}
      {!isConnected && (
        <div style={{ fontSize: '0.75rem', color: 'var(--yellow)', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.18)', borderRadius: '8px', padding: '0.5rem 0.75rem' }}>
          🔗 Connect your wallet to open positions
        </div>
      )}
      {isConnected && !onSepolia && (
        <div style={{ fontSize: '0.75rem', color: 'var(--yellow)', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.18)', borderRadius: '8px', padding: '0.5rem 0.75rem' }}>
          ⚠ Not on Sepolia — click below to switch automatically
        </div>
      )}

      {/* Submit */}
      <button
        onClick={submit}
        disabled={!canSubmit}
        style={{
          width: '100%', padding: '0.75rem', borderRadius: '10px', fontWeight: 800, fontSize: '0.9rem',
          cursor: canSubmit ? 'pointer' : 'not-allowed', border: 'none',
          background: loading ? 'rgba(212,212,212,0.15)' : side === 'long' ? 'linear-gradient(135deg, #059669, #10b981)' : 'linear-gradient(135deg, #dc2626, #f87171)',
          color: '#fff', opacity: canSubmit ? 1 : 0.45, transition: 'all 0.15s',
          boxShadow: canSubmit && !loading ? (side === 'long' ? '0 0 20px rgba(16,185,129,0.25)' : '0 0 20px rgba(248,113,113,0.25)') : 'none',
        }}
      >
        {loading
          ? <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', justifyContent: 'center' }}>
              <span style={{ display: 'inline-block', animation: 'spin 0.8s linear infinite' }}>⟳</span>
              {step === 'network' ? 'Switching network…' : step === 'tx' ? 'Sending USDT…' : 'Confirming…'}
            </span>
          : `Open ${side === 'long' ? '↑ LONG' : '↓ SHORT'} · ${colNum || 0} USDT`
        }
      </button>

    </div>
  );
}
