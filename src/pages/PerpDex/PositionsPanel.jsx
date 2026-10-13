import { useState, useEffect } from 'react';
import { perpDexService } from '../../services/perpDex.js';
import Button from '../../components/ui/Button.jsx';

const TABS = [
  { value: 'positions', label: 'Positions' },
  { value: 'history',   label: 'History'   },
];

function PnlCell({ val }) {
  const pos = val >= 0;
  return (
    <td style={{ padding: '0.5rem 0.65rem', fontWeight: 700, color: pos ? 'var(--green)' : 'var(--red)' }}>
      {pos ? '+' : ''}{val.toFixed(2)}
    </td>
  );
}

function fmtPrice(n) {
  return n >= 1000 ? n.toLocaleString('en', { maximumFractionDigits: 1 }) : n.toFixed(2);
}

export default function PositionsPanel({ refreshSignal }) {
  const [tab,       setTab]       = useState('positions');
  const [positions, setPositions] = useState([]);
  const [history,   setHistory]   = useState([]);
  const [closing,   setClosing]   = useState(null);

  const load = async () => {
    setPositions(await perpDexService.getUserPositions());
    setHistory(await perpDexService.getOrderHistory());
  };

  useEffect(() => { load(); }, [refreshSignal]);
  useEffect(() => {
    const t = setInterval(load, 1500);
    return () => clearInterval(t);
  }, []);

  async function closePos(id) {
    setClosing(id);
    try {
      await perpDexService.closePosition(id);
      await load();
    } catch {}
    setClosing(null);
  }

  const TH = ({ children, right }) => (
    <th style={{ padding: '0.45rem 0.65rem', textAlign: right ? 'right' : 'left', fontWeight: 600, color: 'var(--muted)', fontSize: '0.72rem', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
      {children}
    </th>
  );
  const TD = ({ children, mono, right, style: s }) => (
    <td style={{ padding: '0.45rem 0.65rem', color: 'var(--text)', fontSize: '0.78rem', textAlign: right ? 'right' : 'left', fontFamily: mono ? 'monospace' : 'inherit', ...s }}>
      {children}
    </td>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>

      {/* Tab bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.1rem', padding: '0.4rem 0.75rem', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)', flexShrink: 0 }}>
        {TABS.map(t => (
          <button key={t.value} onClick={() => setTab(t.value)} style={{
            padding: '0.3rem 0.85rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600,
            background: tab === t.value ? 'rgba(212,212,212,0.1)' : 'transparent',
            border: tab === t.value ? '1px solid rgba(212,212,212,0.22)' : '1px solid transparent',
            color: tab === t.value ? 'var(--cream)' : 'var(--muted)', cursor: 'pointer',
          }}>
            {t.label}
            {t.value === 'positions' && positions.length > 0 && (
              <span style={{ marginLeft: '0.4rem', background: 'rgba(212,212,212,0.15)', borderRadius: '100px', padding: '0.05rem 0.45rem', fontSize: '0.65rem' }}>
                {positions.length}
              </span>
            )}
          </button>
        ))}
        {/* Total P&L pill */}
        {tab === 'positions' && positions.length > 0 && (() => {
          const total = positions.reduce((s, p) => s + p.unrealizedPnl, 0);
          return (
            <div style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 700, color: total >= 0 ? 'var(--green)' : 'var(--red)' }}>
              Total P&L: {total >= 0 ? '+' : ''}{total.toFixed(2)} USDT
            </div>
          );
        })()}
      </div>

      {/* Content */}
      <div style={{ overflowX: 'auto' }}>

        {/* ── POSITIONS ── */}
        {tab === 'positions' && (
          positions.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.82rem' }}>
              No open positions. Use the Trade panel to open one.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr>
                  <TH>Pair</TH>
                  <TH>Side</TH>
                  <TH right>Size</TH>
                  <TH right>Leverage</TH>
                  <TH right>Entry</TH>
                  <TH right>Mark</TH>
                  <TH right>uPnL</TH>
                  <TH right>P&L %</TH>
                  <TH right>Liq.</TH>
                  <TH right>Collateral</TH>
                  <TH></TH>
                </tr>
              </thead>
              <tbody>
                {positions.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,212,212,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <TD style={{ fontWeight: 800, color: 'var(--cream)' }}>{p.pair}</TD>
                    <TD style={{ fontWeight: 800, color: p.side === 'long' ? 'var(--green)' : 'var(--red)', textTransform: 'uppercase' }}>{p.side}</TD>
                    <TD right mono>{p.size.toFixed(4)}</TD>
                    <TD right style={{ color: 'var(--cream)', fontWeight: 700 }}>{p.leverage}×</TD>
                    <TD right mono>${fmtPrice(p.entryPrice)}</TD>
                    <TD right mono style={{ color: 'var(--cream)' }}>${fmtPrice(p.markPrice)}</TD>
                    <PnlCell val={p.unrealizedPnl} />
                    <td style={{ padding: '0.45rem 0.65rem', fontWeight: 700, color: (p.pnlPct||0) >= 0 ? 'var(--green)' : 'var(--red)', fontSize: '0.78rem', textAlign: 'right' }}>
                      {(p.pnlPct||0) >= 0 ? '+' : ''}{(p.pnlPct||0).toFixed(2)}%
                    </td>
                    <TD right mono style={{ color: 'var(--red)' }}>${fmtPrice(p.liqPrice)}</TD>
                    <TD right style={{ color: 'var(--muted)' }}>{p.collateral} USDT</TD>
                    <td style={{ padding: '0.35rem 0.5rem' }}>
                      <button
                        onClick={() => closePos(p.id)}
                        disabled={closing === p.id}
                        style={{
                          padding: '0.28rem 0.75rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                          background: 'var(--red-dim)', border: '1px solid rgba(248,113,113,0.3)', color: 'var(--red)',
                          transition: 'all 0.12s', opacity: closing === p.id ? 0.5 : 1,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.25)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--red-dim)'; }}
                      >
                        {closing === p.id ? '…' : 'Close'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {/* ── HISTORY ── */}
        {tab === 'history' && (
          history.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.82rem' }}>
              No closed positions yet.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr>
                  <TH>Pair</TH>
                  <TH>Side</TH>
                  <TH right>Size</TH>
                  <TH right>Entry</TH>
                  <TH right>Close</TH>
                  <TH right>P&L</TH>
                  <TH right>Collateral</TH>
                  <TH right>Closed</TH>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <TD style={{ fontWeight: 800, color: 'var(--cream)' }}>{h.pair}</TD>
                    <TD style={{ fontWeight: 800, color: h.side === 'long' ? 'var(--green)' : 'var(--red)', textTransform: 'uppercase' }}>{h.side}</TD>
                    <TD right mono>{h.size.toFixed(4)}</TD>
                    <TD right mono>${fmtPrice(h.entryPrice)}</TD>
                    <TD right mono style={{ color: 'var(--cream)' }}>${fmtPrice(h.closePrice)}</TD>
                    <PnlCell val={h.pnl} />
                    <TD right style={{ color: 'var(--muted)' }}>{h.collateral} USDT</TD>
                    <TD right style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>
                      {new Date(h.closedAt).toLocaleTimeString()}
                    </TD>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>
    </div>
  );
}
