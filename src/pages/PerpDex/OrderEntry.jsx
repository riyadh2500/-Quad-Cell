import { useState } from 'react';
import { perpDexService } from '../../services/perpDex.js';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Tabs from '../../components/ui/Tabs.jsx';

const LEVERS = [1,2,5,10,25,50];

export default function OrderEntry({ pair, onPositionOpened }) {
  const [side, setSide] = useState('long');
  const [orderType, setOrderType] = useState('market');
  const [collateral, setCollateral] = useState('500');
  const [leverage, setLeverage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const price = perpDexService.getPrice(pair);
  const posSize = (parseFloat(collateral||0) * leverage).toFixed(2);
  const liqMult = side === 'long' ? (1 - 0.8/leverage) : (1 + 0.8/leverage);
  const liqPrice = (price * liqMult).toFixed(2);

  async function submit() {
    setLoading(true);
    try {
      const res = await perpDexService.openPosition({ pair, side, collateral: parseFloat(collateral), leverage, orderType });
      setToast({ ok: true, msg: `Position opened! Entry: $${res.position.entryPrice.toFixed(2)}` });
      onPositionOpened && onPositionOpened(res.position);
    } catch (e) {
      setToast({ ok: false, msg: e.message });
    }
    setLoading(false);
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <div style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Long/Short */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
        {['long','short'].map(s => (
          <button key={s} onClick={() => setSide(s)} style={{
            padding: '0.55rem', borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', border: '1px solid',
            borderColor: side===s ? (s==='long'?'var(--green)':'var(--red)') : 'var(--border)',
            background: side===s ? (s==='long'?'var(--green-dim)':'var(--red-dim)') : 'transparent',
            color: side===s ? (s==='long'?'var(--green)':'var(--red)') : 'var(--muted)',
          }}>{s.toUpperCase()}</button>
        ))}
      </div>
      {/* Order type */}
      <Tabs tabs={[{value:'market',label:'Market'},{value:'limit',label:'Limit'},{value:'stop',label:'Stop'}]} active={orderType} onChange={setOrderType} />
      {/* Leverage */}
      <div>
        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>Leverage</div>
        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
          {LEVERS.map(l => (
            <button key={l} onClick={() => setLeverage(l)} style={{
              padding: '0.28rem 0.55rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', border: '1px solid',
              borderColor: leverage===l ? 'rgba(232,224,208,0.35)' : 'var(--border)',
              background: leverage===l ? 'rgba(232,224,208,0.12)' : 'transparent',
              color: leverage===l ? 'var(--cream)' : 'var(--muted)',
            }}>{l}×</button>
          ))}
        </div>
      </div>
      <Input label="Collateral (USDC)" type="number" value={collateral} onChange={e=>setCollateral(e.target.value)} suffix="USDC" />
      {/* Computed */}
      <div style={{ background: 'rgba(232,224,208,0.04)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.65rem 0.8rem', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{color:'var(--muted)'}}>Position Size</span><span style={{color:'var(--cream)',fontWeight:700}}>${parseFloat(posSize).toLocaleString()}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{color:'var(--muted)'}}>Entry Price</span><span style={{color:'var(--cream)',fontWeight:700}}>${price.toFixed(2)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{color:'var(--muted)'}}>Liq. Price</span><span style={{color:'var(--red)',fontWeight:700}}>${liqPrice}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{color:'var(--muted)'}}>Fees</span><span style={{color:'var(--green)',fontWeight:700}}>~$0.00</span></div>
      </div>
      {toast && <div style={{ padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', background: toast.ok ? 'var(--green-dim)' : 'var(--red-dim)', color: toast.ok ? 'var(--green)' : 'var(--red)', fontSize: '0.78rem', fontWeight: 600 }}>{toast.msg}</div>}
      <Button variant={side==='long'?'green':'red'} full onClick={submit} disabled={loading||!collateral}>
        {loading ? 'Opening…' : `Open ${side.toUpperCase()}`}
      </Button>
    </div>
  );
}
