import { useState, useRef, useEffect } from 'react';
import { aiPaymentService, detectAddress, detectAmount } from '../../services/aiPayments.js';
import { ensureSepoliaNetwork, transferUSDT } from '../../hooks/useToken.js';
import { useWallet } from '../../hooks/useWallet.js';
import WalletModal from '../../components/wallet/WalletModal.jsx';
import TxPreview from './TxPreview.jsx';
import TxTimeline from './TxTimeline.jsx';
import Button from '../../components/ui/Button.jsx';

const WELCOME = {
  id: 'w0', role: 'ai', time: Date.now(),
  text: "Hello! I'm your AI payment agent. Paste a wallet address (0x… or ENS) and I'll walk you through sending USDT to it — or just type a command like \"Send 100 USDT to alice.eth\".",
};

// flow states
const FLOW = {
  IDLE:       'idle',        // normal NL command mode
  NEED_AMOUNT:'need_amount', // got address, waiting for amount
  CONFIRM:    'confirm',     // showing TxPreview, waiting for confirm/cancel
  EXECUTING:  'executing',   // tx in flight
};

function shortAddr(addr) {
  if (!addr) return '';
  if (addr.endsWith('.eth')) return addr;
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}

export default function CommandConsole() {
  const [messages,      setMessages]      = useState([WELCOME]);
  const [input,         setInput]         = useState('');
  const [loading,       setLoading]       = useState(false);
  const [preview,       setPreview]       = useState(null);
  const [timelineActive,setTimelineActive] = useState(false);
  const [lastHash,      setLastHash]      = useState(null);

  // multi-step flow state
  const [flow,          setFlow]          = useState(FLOW.IDLE);
  const [pendingAddress,setPendingAddress] = useState(null);

  const { isConnected, address, shortAddress, balance, chainId, chainInfo, status, error, connect, disconnect, switchChain } = useWallet();
  const [showWalletModal, setShowWalletModal] = useState(false);

  // Close wallet modal once connected
  useEffect(() => {
    if (isConnected) setShowWalletModal(false);
  }, [isConnected]);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, preview]);

  function addMsg(role, text, extra = {}) {
    setMessages(m => [...m, { id: `m${Date.now() + Math.random()}`, role, text, time: Date.now(), ...extra }]);
  }

  function replaceLastAiMsg(text, extra = {}) {
    setMessages(m => {
      const c = [...m];
      for (let i = c.length - 1; i >= 0; i--) {
        if (c[i].role === 'ai') { c[i] = { ...c[i], text, ...extra }; break; }
      }
      return c;
    });
  }

  // ── cancel / reset flow ────────────────────────────────────────────────────
  function cancelFlow(silent = false) {
    setPreview(null);
    setPendingAddress(null);
    setFlow(FLOW.IDLE);
    if (!silent) addMsg('ai', 'Cancelled. What else can I help you with?');
  }

  // ── main send handler ──────────────────────────────────────────────────────
  async function send() {
    const txt = input.trim();
    if (!txt || loading) return;
    setInput('');
    inputRef.current?.focus();

    // ── STEP 1: address pasted ─────────────────────────────────────────────
    if (flow === FLOW.IDLE) {
      const addr = detectAddress(txt);
      if (addr) {
        addMsg('user', txt);
        setPendingAddress(addr);
        setFlow(FLOW.NEED_AMOUNT);
        addMsg('ai', `Got it — sending to ${shortAddr(addr)}.\n\nHow much USDT would you like to send?`, { highlight: true });
        return;
      }
    }

    // ── STEP 2: amount entered ─────────────────────────────────────────────
    if (flow === FLOW.NEED_AMOUNT) {
      const amount = detectAmount(txt);
      if (amount !== null && amount > 0) {
        addMsg('user', txt);
        setLoading(true);
        addMsg('ai', '⟳ Generating preview…');
        try {
          const prev = await aiPaymentService.previewFromAddressAmount(pendingAddress, amount);
          replaceLastAiMsg('Here\'s a preview of your transaction:');
          setPreview(prev);
          setFlow(FLOW.CONFIRM);
        } catch (e) {
          replaceLastAiMsg(`Couldn't build preview: ${e.message}`);
          setFlow(FLOW.IDLE);
          setPendingAddress(null);
        }
        setLoading(false);
        return;
      } else {
        // not a valid number — give a hint
        addMsg('user', txt);
        addMsg('ai', `That doesn't look like a valid amount. Please type a number, e.g. "250".`);
        return;
      }
    }

    // ── IDLE: normal NL command ────────────────────────────────────────────
    addMsg('user', txt);
    setLoading(true);
    try {
      addMsg('ai', '⟳ Parsing your request…');
      const parsed = await aiPaymentService.parseCommand(txt);
      replaceLastAiMsg('✓ Request parsed. Generating preview…');
      const prev = await aiPaymentService.previewTransaction(parsed);
      setPreview(prev);
      addMsg('ai', "Here's a preview of your transaction:");
      setFlow(FLOW.CONFIRM);
    } catch (e) {
      replaceLastAiMsg(`Sorry, I couldn't process that: ${e.message}`);
    }
    setLoading(false);
  }

  // ── confirm ────────────────────────────────────────────────────────────────
  async function confirm() {
    if (!preview) return;

    // Must have wallet connected
    if (!isConnected) {
      setShowWalletModal(true);
      return;
    }

    setLoading(true);
    setPreview(null);
    setFlow(FLOW.EXECUTING);
    setTimelineActive(true);
    addMsg('ai', 'Executing transaction via Rialo infrastructure…');

    try {
      // Step 1 — switch to Sepolia
      const switched = await ensureSepoliaNetwork();
      if (!switched) {
        setTimelineActive(false);
        addMsg('ai', '❌ Please switch to Ethereum Sepolia testnet to send USDT.');
        setFlow(FLOW.IDLE);
        setPendingAddress(null);
        setLoading(false);
        return;
      }

      // Step 2 — send real USDT on-chain (only for send type, not schedule/swap)
      let txHash = null;
      if (preview.type === 'send') {
        try {
          txHash = await transferUSDT(preview.to, preview.amount);
        } catch (txErr) {
          if (txErr.code === 4001) {
            // User rejected
            setTimelineActive(false);
            addMsg('ai', '❌ Transaction rejected. You cancelled the MetaMask request.');
            setFlow(FLOW.IDLE);
            setPendingAddress(null);
            setLoading(false);
            return;
          }
          // Other error — fall through in demo mode with a warning
          console.warn('on-chain tx failed, demo mode:', txErr.message);
        }
      }

      // Step 3 — record in service layer
      const res = await aiPaymentService.executeTransaction(preview);

      // Use the real hash if we got one
      if (txHash) res.tx.hash = txHash;

      setLastHash(res.tx.hash);
      setTimeout(() => {
        setTimelineActive(false);
        const hashLabel = txHash ? res.tx.hash : `${res.tx.hash} (demo)`;
        addMsg('ai', `✅ Transaction confirmed! Hash: ${hashLabel}`, { success: true });
        setFlow(FLOW.IDLE);
        setPendingAddress(null);
      }, 1500);

    } catch (e) {
      setTimelineActive(false);
      addMsg('ai', `❌ Transaction failed: ${e.message}`);
      setFlow(FLOW.IDLE);
      setPendingAddress(null);
    }

    setLoading(false);
  }

  // ── placeholder text per state ─────────────────────────────────────────────
  const placeholder =
    flow === FLOW.NEED_AMOUNT ? `Enter amount in USDT (e.g. 250)…` :
    flow === FLOW.CONFIRM     ? 'Confirm or cancel above…' :
    flow === FLOW.EXECUTING   ? 'Sending…' :
    'Paste wallet address or type a command…';

  const inputDisabled = loading || flow === FLOW.CONFIRM || flow === FLOW.EXECUTING;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', gap: '0.5rem', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end' }}>
            {msg.role === 'ai' && (
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, var(--cream-dim), var(--cream-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', flexShrink: 0 }}>🤖</div>
            )}
            <div style={{
              maxWidth: '78%', padding: '0.55rem 0.85rem', borderRadius: 'var(--radius)',
              background: msg.role === 'user'
                ? 'rgba(232,224,208,0.1)'
                : msg.highlight
                  ? 'rgba(16,185,129,0.07)'
                  : 'rgba(255,255,255,0.04)',
              border: `1px solid ${
                msg.role === 'user'
                  ? 'rgba(232,224,208,0.2)'
                  : msg.highlight
                    ? 'rgba(16,185,129,0.2)'
                    : 'var(--border)'
              }`,
              fontSize: '0.82rem', lineHeight: 1.6,
              color: msg.success ? 'var(--green)' : 'var(--text)',
              whiteSpace: 'pre-line',
            }}>
              {msg.text}
            </div>
          </div>
        ))}

        {/* Inline flow hint when waiting for amount */}
        {flow === FLOW.NEED_AMOUNT && pendingAddress && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', paddingLeft: 34 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)',
              borderRadius: 'var(--radius-sm)', padding: '0.4rem 0.85rem',
              fontSize: '0.75rem', color: 'var(--yellow)',
            }}>
              <span>Sending to:</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--cream)', wordBreak: 'break-all' }}>
                {pendingAddress}
              </span>
              <button onClick={() => cancelFlow()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '0.85rem', padding: 0, lineHeight: 1, marginLeft: 4 }} title="Cancel">✕</button>
            </div>
          </div>
        )}

        {preview && (
          <TxPreview preview={preview} onConfirm={confirm} onCancel={() => cancelFlow()} loading={loading} />
        )}
        {timelineActive && <TxTimeline active={timelineActive} txHash={lastHash} />}
        <div ref={bottomRef} />
      </div>

      {/* Wallet status banner */}
      {!isConnected ? (
        <div style={{
          margin: '0 1rem 0.5rem',
          background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)',
          borderRadius: 'var(--radius-sm)', padding: '0.6rem 0.85rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem',
          fontSize: '0.78rem',
        }}>
          <span style={{ color: 'var(--yellow)' }}>🔗 Connect your wallet to send USDT</span>
          <button
            onClick={() => setShowWalletModal(true)}
            disabled={status === 'connecting'}
            style={{
              background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.35)',
              borderRadius: 'var(--radius-sm)', padding: '0.3rem 0.85rem',
              color: 'var(--yellow)', fontSize: '0.75rem', fontWeight: 700,
              cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(251,191,36,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(251,191,36,0.15)'}
          >
            {status === 'connecting' ? '⟳ Connecting…' : 'Connect Wallet'}
          </button>
        </div>
      ) : (
        <div style={{
          margin: '0 1rem 0.5rem',
          background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)',
          borderRadius: 'var(--radius-sm)', padding: '0.45rem 0.85rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: '0.75rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
            <span style={{ fontFamily: 'monospace', color: 'var(--cream)', fontWeight: 600 }}>
              {shortAddress}
            </span>
            {balance && (
              <span style={{ color: 'var(--muted)' }}>· {balance} ETH</span>
            )}
          </div>
          <span style={{ color: 'var(--green)', fontWeight: 600 }}>Connected</span>
        </div>
      )}

      {/* Wallet modal */}
      {showWalletModal && (
        <WalletModal
          onClose={() => setShowWalletModal(false)}
          onConnect={connect}
          status={status}
          error={error}
        />
      )}
      {/* Input bar */}
      <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
        {flow === FLOW.NEED_AMOUNT && (
          <span style={{ fontSize: '0.72rem', color: 'var(--yellow)', whiteSpace: 'nowrap', fontWeight: 600 }}>
            USDT amount:
          </span>
        )}
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !inputDisabled && send()}
          placeholder={placeholder}
          disabled={inputDisabled}
          type={flow === FLOW.NEED_AMOUNT ? 'number' : 'text'}
          min={flow === FLOW.NEED_AMOUNT ? '0' : undefined}
          style={{
            flex: 1, background: 'rgba(0,0,0,0.45)',
            border: `1px solid ${flow === FLOW.NEED_AMOUNT ? 'rgba(251,191,36,0.35)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-sm)', padding: '0.6rem 1rem',
            color: 'var(--text)', fontSize: '0.88rem', fontFamily: 'inherit', outline: 'none',
            opacity: inputDisabled ? 0.5 : 1,
          }}
        />
        <Button variant="primary" size="sm" onClick={send} disabled={inputDisabled || !input.trim()}>
          {flow === FLOW.NEED_AMOUNT ? 'Next' : 'Send'}
        </Button>
      </div>
    </div>
  );
}
