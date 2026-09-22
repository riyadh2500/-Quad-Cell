import { useState, useRef, useEffect } from 'react';

const CHAINS = {
  '0x1':    { name: 'Ethereum',  color: '#627EEA', explorer: 'https://etherscan.io' },
  '0x38':   { name: 'BNB Chain', color: '#F3BA2F', explorer: 'https://bscscan.com' },
  '0x89':   { name: 'Polygon',   color: '#8247E5', explorer: 'https://polygonscan.com' },
  '0xa4b1': { name: 'Arbitrum',  color: '#28A0F0', explorer: 'https://arbiscan.io' },
  '0xa':    { name: 'Optimism',  color: '#FF0420', explorer: 'https://optimistic.etherscan.io' },
  '0x2105': { name: 'Base',      color: '#0052FF', explorer: 'https://basescan.org' },
};

function Identicon({ address, size = 28 }) {
  // Simple deterministic color avatar from address
  const color1 = address ? '#' + address.slice(2, 8)  : '#d4d4d4';
  const color2 = address ? '#' + address.slice(-6)    : '#787878';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg, ${color1}, ${color2})`,
      border: '1px solid rgba(255,255,255,0.1)',
    }} />
  );
}

export default function WalletInfo({ address, shortAddress, balance, chainId, chainInfo, onDisconnect, onSwitchChain }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function copyAddress() {
    if (!address) return;
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  }

  const chainColor  = CHAINS[chainId]?.color || '#10b981';
  const explorerUrl = `${CHAINS[chainId]?.explorer || 'https://etherscan.io'}/address/${address}`;

  return (
    <div ref={ref} style={{ position: 'relative' }}>

      {/* ── Connected pill button ── */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.45rem',
          background: 'rgba(212,212,212,0.07)',
          border: '1px solid rgba(212,212,212,0.18)',
          borderRadius: '10px', padding: '0.38rem 0.85rem',
          cursor: 'pointer', transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(212,212,212,0.4)'; e.currentTarget.style.background = 'rgba(212,212,212,0.12)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(212,212,212,0.18)'; e.currentTarget.style.background = 'rgba(212,212,212,0.07)'; }}
      >
        {/* Chain dot */}
        <span style={{
          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
          background: chainColor, boxShadow: `0 0 6px ${chainColor}88`,
        }} />
        <Identicon address={address} size={20} />
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#d4d4d4', fontFamily: 'monospace' }}>
          {shortAddress}
        </span>
        {balance && (
          <>
            <span style={{ width: 1, height: 14, background: 'rgba(212,212,212,0.15)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.45)' }}>
              {balance} {chainInfo?.symbol || 'ETH'}
            </span>
          </>
        )}
        <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)' }}>▼</span>
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 10px)', right: 0,
          background: '#0d0d0d', border: '1px solid rgba(212,212,212,0.15)',
          borderRadius: '16px', padding: '0.9rem', minWidth: 280,
          boxShadow: '0 20px 60px rgba(0,0,0,0.65)', zIndex: 400,
          animation: 'fadeUp 0.15s ease forwards',
        }}>

          {/* Account section */}
          <div style={{ padding: '0.25rem 0.25rem 0.85rem', borderBottom: '1px solid rgba(212,212,212,0.08)', marginBottom: '0.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.65rem' }}>
              <Identicon address={address} size={38} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#d4d4d4', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {address?.slice(0, 10)}…{address?.slice(-8)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: chainColor, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>
                    {CHAINS[chainId]?.name || chainInfo?.name || 'Unknown Network'}
                  </span>
                </div>
              </div>
            </div>

            {/* Balance card */}
            {balance && (
              <div style={{
                background: 'rgba(212,212,212,0.05)', border: '1px solid rgba(212,212,212,0.08)',
                borderRadius: '10px', padding: '0.6rem 0.85rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Balance</span>
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#d4d4d4' }}>
                  {balance} {chainInfo?.symbol || 'ETH'}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', marginBottom: '0.6rem' }}>
            <MenuItem icon="📋" label={copied ? 'Copied!' : 'Copy Address'} onClick={copyAddress} color={copied ? '#10b981' : undefined} />
            <a href={explorerUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }} onClick={() => setOpen(false)}>
              <MenuItem icon="🔍" label="View on Explorer" />
            </a>
          </div>

          {/* Network switcher */}
          <div style={{ borderTop: '1px solid rgba(212,212,212,0.07)', paddingTop: '0.65rem', marginBottom: '0.6rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.45rem', paddingLeft: '0.25rem' }}>
              Switch Network
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem' }}>
              {Object.entries(CHAINS).map(([hex, chain]) => {
                const active = chainId === hex;
                return (
                  <button
                    key={hex}
                    onClick={() => { onSwitchChain(hex); setOpen(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      padding: '0.42rem 0.65rem', borderRadius: '8px', cursor: 'pointer',
                      background: active ? 'rgba(212,212,212,0.1)' : 'transparent',
                      border: active ? '1px solid rgba(212,212,212,0.2)' : '1px solid transparent',
                      color: active ? '#d4d4d4' : 'rgba(255,255,255,0.4)',
                      fontSize: '0.73rem', fontWeight: active ? 700 : 500,
                      transition: 'all 0.12s',
                    }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(212,212,212,0.06)'; e.currentTarget.style.color = '#fff'; }}}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: chain.color, flexShrink: 0 }} />
                    {chain.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Disconnect */}
          <div style={{ borderTop: '1px solid rgba(212,212,212,0.07)', paddingTop: '0.5rem' }}>
            <MenuItem
              icon="🔌"
              label="Disconnect"
              color="#f87171"
              hoverBg="rgba(248,113,113,0.08)"
              onClick={() => { onDisconnect(); setOpen(false); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon, label, onClick, color, hoverBg }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.6rem',
        padding: '0.52rem 0.65rem', borderRadius: '9px',
        color: color || 'rgba(255,255,255,0.6)',
        fontSize: '0.82rem', fontWeight: 500,
        cursor: 'pointer', transition: 'all 0.12s',
        background: 'transparent', border: 'none', width: '100%', textAlign: 'left',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = hoverBg || 'rgba(212,212,212,0.07)'; e.currentTarget.style.color = color || '#fff'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = color || 'rgba(255,255,255,0.6)'; }}
    >
      <span style={{ fontSize: '0.9rem' }}>{icon}</span>
      {label}
    </button>
  );
}
