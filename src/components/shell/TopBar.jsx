import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { useData } from '../../context/DataContext.jsx';
import { useWallet } from '../../hooks/useWallet.js';
import Button from '../ui/Button.jsx';
import WalletModal from '../wallet/WalletModal.jsx';
import WalletInfo from '../wallet/WalletInfo.jsx';

export default function TopBar() {
  const { state, dispatch } = useApp();
  const { blockTime, wsStatus } = useData();
  const { address, shortAddress, balance, chainId, chainInfo, status, error, hasWallet, connect, disconnect, switchChain, isConnected } = useWallet();
  const [showModal, setShowModal] = useState(false);

  // Close modal automatically once connected
  useEffect(() => {
    if (isConnected) setShowModal(false);
  }, [isConnected]);

  async function handleConnect() {
    await connect();
    // modal closes via the useEffect above when isConnected becomes true
  }

  return (
    <>
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 'var(--topbar-h)',
        zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 1.25rem 0 0.75rem',
        background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
      }}>
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
            style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '0.4rem', borderRadius: '6px', fontSize: '1.1rem', lineHeight: 1 }}
            aria-label="Toggle sidebar"
          >☰</button>
          <span style={{
            fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.03em',
            background: 'linear-gradient(135deg, #fff 0%, #d4d4d4 60%, #a8a8a8 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>Quad Cell</span>
        </div>

        {/* Center — network status */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: '100px', padding: '0.3rem 0.9rem',
          fontSize: '0.75rem', fontWeight: 600, color: 'var(--green)',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', animation: 'blink 1.5s infinite' }} />
          Rialo Mainnet
          <span style={{ color: 'var(--muted)', fontWeight: 400 }}>·</span>
          <span>{blockTime.toFixed(0)}ms</span>
          {wsStatus === 'connected' && (
            <span style={{ fontSize: '0.65rem', color: 'rgba(16,185,129,0.8)', marginLeft: '0.2rem' }}>● Live</span>
          )}
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {/* Notification bell */}
          <button
            style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem', padding: '0.4rem', borderRadius: '6px' }}
            aria-label="Notifications"
          >🔔</button>

          {/* Wallet */}
          {isConnected ? (
            <WalletInfo
              address={address}
              shortAddress={shortAddress}
              balance={balance}
              chainId={chainId}
              chainInfo={chainInfo}
              onDisconnect={disconnect}
              onSwitchChain={switchChain}
            />
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowModal(true)}
              disabled={status === 'connecting'}
            >
              {status === 'connecting' ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ animation: 'spin 0.8s linear infinite', display: 'inline-block' }}>⟳</span>
                  Connecting…
                </span>
              ) : 'Connect Wallet'}
            </Button>
          )}
        </div>
      </header>

      {/* Wallet modal */}
      {showModal && (
        <WalletModal
          onClose={() => setShowModal(false)}
          onConnect={handleConnect}
          status={status}
          error={error}
        />
      )}
    </>
  );
}
