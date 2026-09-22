import { useEffect } from 'react';

const WALLETS = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: '🦊',
    description: 'Connect using MetaMask browser extension',
    check: () => typeof window !== 'undefined' && (window.ethereum?.isMetaMask || window.ethereum?.providers?.some(p => p.isMetaMask)),
    downloadUrl: 'https://metamask.io/download/',
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    icon: '🔵',
    description: 'Connect using Coinbase Wallet',
    check: () => typeof window !== 'undefined' && window.ethereum?.isCoinbaseWallet,
    downloadUrl: 'https://www.coinbase.com/wallet',
  },
  {
    id: 'injected',
    name: 'Browser Wallet',
    icon: '🌐',
    description: 'Any EIP-1193 compatible wallet',
    check: () => typeof window !== 'undefined' && !!window.ethereum,
    downloadUrl: null,
  },
];

const ERROR_MESSAGES = {
  no_wallet: '⚠ No wallet detected. Install MetaMask to continue.',
  rejected:  '⚠ Request rejected. Please approve the connection in your wallet.',
  pending:   '⚠ Request already pending. Check your wallet extension.',
  failed:    '⚠ Connection failed. Please try again.',
};

export default function WalletModal({ onClose, onConnect, status, error }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const isConnecting = status === 'connecting';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0d0d0d',
          border: '1px solid rgba(212,212,212,0.15)',
          borderRadius: '20px', padding: '2rem',
          width: '100%', maxWidth: 420,
          boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
          animation: 'fadeUp 0.2s ease forwards',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
              Connect Wallet
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.38)' }}>
              Connect your wallet to start trading on Quad Cell
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.07)', border: 'none',
              color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
              width: 32, height: 32, borderRadius: '8px',
              fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(248,113,113,0.08)',
            border: '1px solid rgba(248,113,113,0.2)',
            borderRadius: '10px', padding: '0.7rem 1rem',
            marginBottom: '1.1rem', fontSize: '0.82rem', color: '#f87171',
            lineHeight: 1.5,
          }}>
            {ERROR_MESSAGES[error] || ERROR_MESSAGES.failed}
          </div>
        )}

        {/* Wallet list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
          {WALLETS.map((wallet) => {
            const available = wallet.check();
            return (
              <WalletRow
                key={wallet.id}
                wallet={wallet}
                available={available}
                isConnecting={isConnecting}
                onConnect={onConnect}
              />
            );
          })}
        </div>

        {/* No wallet CTA */}
        {!WALLETS.some(w => w.check()) && (
          <div style={{
            background: 'rgba(212,212,212,0.04)',
            border: '1px solid rgba(212,212,212,0.1)',
            borderRadius: '12px', padding: '1rem',
            textAlign: 'center', marginBottom: '1.25rem',
          }}>
            <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>🦊</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#d4d4d4', marginBottom: '0.3rem' }}>
              No wallet detected
            </div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginBottom: '0.75rem' }}>
              Install MetaMask to connect to Quad Cell
            </div>
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-block', padding: '0.5rem 1.25rem',
                background: '#d4d4d4', color: '#000',
                borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Install MetaMask
            </a>
          </div>
        )}

        {/* Footer */}
        <div style={{
          borderTop: '1px solid rgba(212,212,212,0.07)',
          paddingTop: '1rem', fontSize: '0.72rem',
          color: 'rgba(255,255,255,0.25)', textAlign: 'center', lineHeight: 1.6,
        }}>
          By connecting you agree to our{' '}
          <a href="#" style={{ color: 'rgba(212,212,212,0.5)', textDecoration: 'underline' }}>Terms</a>
          {' & '}
          <a href="#" style={{ color: 'rgba(212,212,212,0.5)', textDecoration: 'underline' }}>Privacy Policy</a>
        </div>
      </div>
    </div>
  );
}

function WalletRow({ wallet, available, isConnecting, onConnect }) {
  const handleClick = () => {
    if (available) onConnect();
    else if (wallet.downloadUrl) window.open(wallet.downloadUrl, '_blank');
  };

  return (
    <button
      disabled={isConnecting}
      onClick={handleClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.9rem',
        padding: '0.85rem 1rem', borderRadius: '12px', cursor: 'pointer',
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${available ? 'rgba(212,212,212,0.15)' : 'rgba(212,212,212,0.07)'}`,
        width: '100%', textAlign: 'left',
        opacity: isConnecting ? 0.65 : 1,
        transition: 'background 0.15s, border-color 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(212,212,212,0.07)';
        e.currentTarget.style.borderColor = 'rgba(212,212,212,0.25)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
        e.currentTarget.style.borderColor = available ? 'rgba(212,212,212,0.15)' : 'rgba(212,212,212,0.07)';
      }}
    >
      {/* Icon */}
      <div style={{
        width: 46, height: 46, borderRadius: '12px',
        background: 'rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.6rem', flexShrink: 0,
      }}>
        {wallet.icon}
      </div>

      {/* Label */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: available ? '#fff' : 'rgba(255,255,255,0.4)' }}>
            {wallet.name}
          </span>
          {available && (
            <span style={{
              fontSize: '0.62rem', fontWeight: 700, color: '#10b981',
              background: 'rgba(16,185,129,0.12)', padding: '0.1rem 0.5rem',
              borderRadius: '100px', letterSpacing: '0.04em',
            }}>
              DETECTED
            </span>
          )}
        </div>
        <div style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.3)' }}>
          {available ? wallet.description : 'Not installed — click to install'}
        </div>
      </div>

      {/* Right arrow / spinner */}
      <div style={{ flexShrink: 0, color: 'rgba(255,255,255,0.25)', fontSize: '0.9rem' }}>
        {isConnecting && available
          ? <span style={{ display: 'inline-block', animation: 'spin 0.8s linear infinite' }}>⟳</span>
          : '→'
        }
      </div>
    </button>
  );
}
