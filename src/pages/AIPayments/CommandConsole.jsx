import { useState, useRef, useEffect } from 'react';
import { aiPaymentService } from '../../services/aiPayments.js';
import TxPreview from './TxPreview.jsx';
import TxTimeline from './TxTimeline.jsx';
import Button from '../../components/ui/Button.jsx';

const SUGGESTIONS = [
  'Send 100 USDC to alice.eth',
  'Schedule weekly 50 USDC to bob.eth',
  'Swap 0.1 ETH to USDC and send to vault.eth',
  'Send 500 USDC to dao.eth',
];

const WELCOME = { id: 'w0', role: 'ai', text: "Hello! I'm your AI payment agent powered by Rialo Edge + IPC. Tell me what you'd like to do — I can send, swap, or schedule payments across any chain with zero fees.", time: Date.now() };

export default function CommandConsole() {
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [timelineActive, setTimelineActive] = useState(false);
  const [lastHash, setLastHash] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  function addMsg(role, text, extra = {}) {
    setMessages(m => [...m, { id: `m${Date.now()}`, role, text, time: Date.now(), ...extra }]);
  }

  async function send() {
    const txt = input.trim();
    if (!txt || loading) return;
    setInput('');
    addMsg('user', txt);
    setLoading(true);

    try {
      addMsg('ai', '⟳ Parsing your request…');
      const parsed = await aiPaymentService.parseCommand(txt);
      setMessages(m => { const c = [...m]; c[c.length-1] = { ...c[c.length-1], text: '✓ Request parsed. Generating preview…' }; return c; });
      const prev = await aiPaymentService.previewTransaction(parsed);
      setPreview(prev);
      addMsg('ai', 'Here\'s a preview of your transaction:');
    } catch (e) {
      addMsg('ai', `Sorry, I couldn't process that: ${e.message}`);
    }
    setLoading(false);
  }

  async function confirm() {
    if (!preview) return;
    setLoading(true);
    setPreview(null);
    setTimelineActive(true);
    addMsg('ai', 'Executing transaction via Rialo infrastructure…');
    try {
      const res = await aiPaymentService.executeTransaction(preview);
      setLastHash(res.tx.hash);
      setTimeout(() => {
        setTimelineActive(false);
        addMsg('ai', `✅ Transaction confirmed! Hash: ${res.tx.hash}`, { success: true });
      }, 1500);
    } catch (e) {
      setTimelineActive(false);
      addMsg('ai', `❌ Transaction failed: ${e.message}`);
    }
    setLoading(false);
  }

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
              background: msg.role === 'user' ? 'rgba(232,224,208,0.1)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${msg.role === 'user' ? 'rgba(232,224,208,0.2)' : 'var(--border)'}`,
              fontSize: '0.82rem', lineHeight: 1.5, color: msg.success ? 'var(--green)' : 'var(--text)',
            }}>
              {msg.text}
            </div>
          </div>
        ))}
        {preview && (
          <TxPreview preview={preview} onConfirm={confirm} onCancel={() => setPreview(null)} loading={loading} />
        )}
        {timelineActive && <TxTimeline active={timelineActive} txHash={lastHash} />}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      <div style={{ padding: '0 1rem 0.5rem', display: 'flex', gap: '0.4rem', overflowX: 'auto', flexWrap: 'wrap' }}>
        {SUGGESTIONS.map(s => (
          <button key={s} onClick={() => setInput(s)} style={{ background: 'rgba(232,224,208,0.05)', border: '1px solid var(--border)', borderRadius: '100px', padding: '0.25rem 0.75rem', fontSize: '0.72rem', color: 'var(--muted)', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.6rem' }}>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Type a payment command…"
          disabled={loading}
          style={{ flex: 1, background: 'rgba(0,0,0,0.45)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.6rem 1rem', color: 'var(--text)', fontSize: '0.88rem', fontFamily: 'inherit', outline: 'none' }}
        />
        <Button variant="primary" size="sm" onClick={send} disabled={loading || !input.trim()}>Send</Button>
      </div>
    </div>
  );
}
