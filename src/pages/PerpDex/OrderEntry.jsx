import { useState } from 'react';
import { perpDexService } from '../../services/perpDex.js';
import { useWallet } from '../../hooks/useWallet.js';
import { useUSDTBalance } from '../../hooks/useUSDTBalance.js';
import { ensureSepoliaNetwork, USDT_SEPOLIA, transferUSDT } from '../../hooks/useToken.js';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Tabs from '../../components/ui/Tabs.jsx';

const LEVERS = [1, 2, 5, 10, 25, 50];
// Quad Cell DEX contract (Sepolia) — replace with real deployed contract
const DEX_CONTRACT = '0x000000000000000000000000000000000000dead';

export default function OrderEntry({ pair, onPositionOpened }) {
  const { isConnected } = useWallet();
  const { balance: usdtBalance, onSepolia, refresh: refreshBalance } = useUSDTBalance();

  const [side,       setSide]       = useState('long');
  const [orderType,  setOrderType]  = useState('market');
  const [collateral, setCollateral] = useState('500');
  const [leverage,   setLeverage]   = useState(10);
  const [loading,    setLoading]    = useState(false);
  const [step,       setStep]       = useState('');
  const [toast,      setToast]      = useState(null);

  const price    = perpDexService.getPrice(pair);
  const colNum   = parseFloat(collateral) || 0;
  const posSize  = (colNum * leverage).toFixed(2);
  const liqMult  = side === 'long' ? (1 - 0.8 / leverage) : (1 + 0.8 / leverage);
  const liqPrice = (price * liqMult).toFixed(2);
  const hasEnough = usdtBalance !== null && usdtBalance >= colNum;

  async function submit() {
    if (!isConnected) { setToast({ ok: false, msg: 'Connect your wallet first.' }); return; }
    if (colNum <= 0)  { setToast({ ok: false, msg: 'Enter a valid collateral amount.' }); return; }
    if (!hasEnough && usdtBalance !== null) {
      setToast({ ok: false, msg: `Insufficient USDT. Balance: ${usdtBalance?.toFixed(2)} USDT` });
      return;
    }

    setLoading(true);
    setToast(null);

    try {
      // 1. Switch to Sepolia
      setStep('network');
      const switched = await ensureSepoliaNetwork();
      if (!switched) {
        setToast({ ok: false, msg: 'Switch to Ethereum Sepolia to trade.' });
        setLoading(false); setStep(''); return;
      }

      // 2. Send USDT collateral on-chain
      setStep('tx');
      let txHash;
      try {
        txHash = await transferUSDT(DEX_CONTRACT, colNum);
      } catch (txErr) {
        if (txErr.code === 4001) {
          setToast({ ok: false, msg: 'Transaction rejected.' });
          setLoading(false); setStep(''); return;
        }
        // Demo fallback
        txHash = null;
        console.warn('TX skipped (demo):', txErr.message);
      }

      // 3. Record position in service
      setStep('record');
      const res = await perpDexService.openPosition({ pair, side, collateral: colNum, leverage, orderType });
      if (txHash) res.txHash = txHash;

      setToast({ ok: true, msg: `✓ ${side.toUpperCase()} opened! Entry $${res.position.entryPrice.toFixed(2)} · ${colNum} USDT collateral` });
      refreshBalance();
      onPositionOpened && onPositionOpened(res.position);

    } catch (e) {
      setToast({ ok: false, msg: e.message || 'Failed to open position.' });
    }

    setLoading(false);
    setStep('');
    setTimeout(() => setToast(null), 5000);
  }

  return (
    <div style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

      {/* USDT balance banner */}
      <div style={{
        background: 'rgba(212,212,212,0.05)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)', padding: '0.45rem 0.75rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: onSepolia ? 'var(--green)' : 'var(--yellow)', flexShrink: 0 }} />
          <span style={{ color: 'var(--muted)' }}>Sepolia USDT</span>
        </div>
        <span style={{ fontWeight: 800, color: isConnected ? (hasEnough ? 'var(--cream)' : 'var(--red)') : 'var(--muted)' }}>
          {isConnected ? (usdtBalance !== null ? `${usdtBalance.toFixed(2)} USDT` : '…') : 'Not connected'}
        </span>
      </div>

      {/* Long / Short */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
        {['long', 'short'].map(s => (
          <button key={s} onClick={() => setSide(s)} style={{
            padding: '0.55rem', borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', border: '1px solid',
            borderColor: side === s ? (s === 'long' ? 'var(--green)' : 'var(--red)') : 'var(--border)',
            background:  side === s ? (s === 'long' ? 'var(--green-dim)' : 'var(--red-dim)') : 'transparent',
            color:       side === s ? (s === 'long' ? 'var(--green)' : 'var(--red)') : 'var(--muted)',
          }}>{s.toUpperCase()}</button>
        ))}
      </div>

      {/* Order type */}
      <Tabs tabs={[{ value:'market', label:'Market' }, { value:'limit', label:'Limit' }, { value:'stop', label:'Stop' }]} active={orderType} onChange={setOrderType} />

      {/* Leverage */}
      <div>
        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>Leverage</div>
        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
          {LEVERS.map(l => (
            <button key={l} onClick={() => setLeverage(l)} style={{
              padding: '0.28rem 0.55rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', border: '1px solid',
              borderColor: leverage === l ? 'rgba(212,212,212,0.35)' : 'var(--border)',
              background:  leverage === l ? 'rgba(212,212,212,0.12)' : 'transparent',
              color:       leverage === l ? 'var(--cream)' : 'var(--muted)',
            }}>{l}×</button>
          ))}
        </div>
      </div>

      {/* Collateral */}
      <Input label="Collateral (USDT)" type="number" value={collateral} onChange={e => setCollateral(e.target.value)} suffix="USDT" />

      {/* Computed stats */}
      <div style={{ background: 'rgba(212,212,212,0.04)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.65rem 0.8rem', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        {[
          ['Position Size', `$${parseFloat(posSize).toLocaleString()}`],
          ['Entry Price',   `$${price.toFixed(2)}`],
          ['Liq. Price',    `$${liqPrice}`, 'var(--red)'],
          ['Token',         `USDT · Sepolia`],
          ['Fees',          '~$0.00', 'var(--green)'],
        ].map(([k, v, col]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--muted)' }}>{k}</span>
            <span style={{ color: col || 'var(--cream)', fontWeight: 700 }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Step progress while submitting */}
      {loading && step && (
        <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', background: 'rgba(212,212,212,0.04)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.65rem 0.8rem' }}>
          {[['network','Switching to Sepolia…'],['tx','Sending USDT collateral…'],['record','Recording position…']].map(([id, label], i) => {
            const order  = ['network','tx','record'];
            const curIdx = order.indexOf(step);
            const thisIdx = order.indexOf(id);
            const done   = thisIdx < curIdx;
            const active = id === step;
            return (
              <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: done ? 'var(--green)' : active ? 'var(--cream)' : 'var(--muted)' }}>
                <span>{done ? '✓' : active ? <span style={{ animation: 'spin 0.8s linear infinite', display: 'inline-block' }}>⟳</span> : '○'}</span>
                {label}
              </div>
            );
          })}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ padding: '0.55rem 0.75rem', borderRadius: 'var(--radius-sm)', background: toast.ok ? 'var(--green-dim)' : 'var(--red-dim)', color: toast.ok ? 'var(--green)' : 'var(--red)', fontSize: '0.78rem', fontWeight: 600 }}>
          {toast.msg}
        </div>
      )}

      {/* Wallet / network warnings */}
      {!isConnected && (
        <div style={{ fontSize: '0.75rem', color: 'var(--yellow)', background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.75rem' }}>
          🔗 Connect your wallet to trade
        </div>
      )}

      {/* Submit */}
      <Button
        variant={side === 'long' ? 'green' : 'red'} full
        onClick={submit}
        disabled={loading || !collateral || (!hasEnough && usdtBalance !== null)}
      >
        {loading
          ? <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}>
              <span style={{ animation: 'spin 0.8s linear infinite', display: 'inline-block' }}>⟳</span>
              {step === 'network' ? 'Switching…' : step === 'tx' ? 'Sending USDT…' : 'Confirming…'}
            </span>
          : `Open ${side.toUpperCase()} · ${colNum} USDT`
        }
      </Button>
    </div>
  );
}
