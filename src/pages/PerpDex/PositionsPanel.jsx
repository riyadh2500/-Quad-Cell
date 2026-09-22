import { useState, useEffect } from 'react';
import { perpDexService } from '../../services/perpDex.js';
import Button from '../../components/ui/Button.jsx';
import Tabs from '../../components/ui/Tabs.jsx';

export default function PositionsPanel({ refreshSignal }) {
  const [tab, setTab] = useState('positions');
  const [positions, setPositions] = useState([]);
  const [closing, setClosing] = useState(null);

  const refresh = () => perpDexService.getUserPositions().then(setPositions);

  useEffect(() => { refresh(); }, [refreshSignal]);
  useEffect(() => {
    const t = setInterval(refresh, 2000);
    return () => clearInterval(t);
  }, []);

  async function close(id) {
    setClosing(id);
    await perpDexService.closePosition(id);
    refresh();
    setClosing(null);
  }

  return (
    <div style={{ borderTop: '1px solid var(--border)' }}>
      <div style={{ padding: '0.6rem 1rem', borderBottom: '1px solid var(--border)' }}>
        <Tabs tabs={[{value:'positions',label:`Positions (${positions.length})`},{value:'history',label:'History'}]} active={tab} onChange={setTab} />
      </div>
      {tab === 'positions' && (
        <div style={{ overflowX: 'auto' }}>
          {positions.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>No open positions</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ color: 'var(--muted)', fontWeight: 600 }}>
                  {['Pair','Side','Size','Entry','Mark','uPnL','Liq.',''].map(h => (
                    <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {positions.map(p => (
                  <tr key={p.id}>
                    <td style={{ padding: '0.5rem 0.75rem', color: 'var(--cream)', fontWeight: 700 }}>{p.pair}</td>
                    <td style={{ padding: '0.5rem 0.75rem', color: p.side==='long'?'var(--green)':'var(--red)', fontWeight: 700, textTransform: 'uppercase' }}>{p.side}</td>
                    <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text)' }}>{p.size.toFixed(4)}</td>
                    <td style={{ padding: '0.5rem 0.75rem', color: 'var(--muted)' }}>${p.entryPrice.toFixed(2)}</td>
                    <td style={{ padding: '0.5rem 0.75rem', color: 'var(--cream)' }}>${p.markPrice.toFixed(2)}</td>
                    <td style={{ padding: '0.5rem 0.75rem', color: p.unrealizedPnl>=0?'var(--green)':'var(--red)', fontWeight: 700 }}>
                      {p.unrealizedPnl>=0?'+':''}{p.unrealizedPnl.toFixed(2)}
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', color: 'var(--red)' }}>${p.liqPrice.toFixed(2)}</td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      <Button variant="ghost" size="sm" onClick={() => close(p.id)} disabled={closing===p.id}>
                        {closing===p.id?'…':'Close'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      {tab === 'history' && (
        <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>No order history yet</div>
      )}
    </div>
  );
}
