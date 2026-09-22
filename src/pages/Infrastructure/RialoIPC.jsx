import { useState } from 'react';
import { infraService } from '../../services/infrastructure.js';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';

export default function RialoIPC() {
  const [payload, setPayload] = useState('{"name":"Alice","wallet":"0x1234...","kyc":"verified"}');
  const [encrypted, setEncrypted] = useState(null);
  const [decrypted, setDecrypted] = useState(null);

  function encrypt() {
    try { setEncrypted(infraService.encryptIPC(JSON.parse(payload))); }
    catch { setEncrypted(infraService.encryptIPC({ raw: payload })); }
    setDecrypted(null);
  }
  function decrypt() { if (encrypted) setDecrypted(infraService.decryptIPC(encrypted.encrypted)); }

  return (
    <div style={{ padding: '1.5rem', maxWidth: 800 }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <span style={{ background: 'rgba(232,224,208,0.1)', color: 'var(--cream)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0.25rem 0.75rem', borderRadius: '100px', border: '1px solid rgba(232,224,208,0.2)' }}>Infrastructure</span>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--cream)', marginTop: '0.6rem', letterSpacing: '-0.02em' }}>Rialo IPC</h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginTop: '0.3rem' }}>Identity, Privacy and Compliance as first-class capabilities — encrypted on-chain.</p>
      </div>
      <Card style={{ padding: '1.25rem', marginBottom: '1rem' }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--cream)', marginBottom: '0.75rem' }}>Identity Payload</div>
        <textarea value={payload} onChange={e => setPayload(e.target.value)} rows={3} style={{ width: '100%', background: 'rgba(0,0,0,0.45)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.6rem 0.9rem', color: 'var(--cream)', fontSize: '0.8rem', fontFamily: 'monospace', outline: 'none', resize: 'vertical', marginBottom: '0.75rem', boxSizing: 'border-box' }} />
        <Button variant="primary" size="sm" onClick={encrypt}>Encrypt with Rialo IPC</Button>
      </Card>
      {encrypted && (
        <Card style={{ padding: '1.1rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <span style={{ fontWeight: 700, color: 'var(--cream)', fontSize: '0.85rem' }}>🔒 Encrypted</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{encrypted.algorithm}</span>
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--muted)', background: 'rgba(0,0,0,0.4)', padding: '0.6rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.6rem', wordBreak: 'break-all' }}>{encrypted.encrypted.slice(0,80)}…</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: '0.6rem' }}>Hash: <span style={{ color: 'var(--cream)', fontFamily: 'monospace' }}>{encrypted.hash}</span></div>
          <Button variant="secondary" size="sm" onClick={decrypt}>Decrypt</Button>
        </Card>
      )}
      {decrypted && (
        <Card style={{ padding: '1.1rem', background: 'var(--green-dim)', border: '1px solid rgba(16,185,129,0.25)' }}>
          <div style={{ fontWeight: 700, color: 'var(--green)', marginBottom: '0.5rem' }}>🔓 Decrypted</div>
          <pre style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text)', margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(decrypted, null, 2)}</pre>
        </Card>
      )}
    </div>
  );
}
