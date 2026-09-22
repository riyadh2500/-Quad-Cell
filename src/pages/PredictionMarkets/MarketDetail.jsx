import { useState, useEffect, useRef } from 'react';
import { predictionMarketService } from '../../services/predictionMarket.js';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import TradePanel from './TradePanel.jsx';

const CAT_VARIANT = { crypto: 'blue', technology: 'cream', politics: 'yellow', sports: 'green' };

function ProbChart({ history, current }) {
  const canvasRef = useRef(null);
  const data = [...history, { t: Date.now(), p: current }];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width  = canvas.offsetWidth * window.devicePixelRatio;
    const H = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    const w = canvas.offsetWidth, h = canvas.offsetHeight;

    ctx.clearRect(0, 0, w, h);

    if (data.length < 2) return;

    const minP = 0, maxP = 1;
    const pad  = { top: 12, right: 12, bottom: 24, left: 36 };
    const cw   = w - pad.left - pad.right;
    const ch   = h - pad.top  - pad.bottom;

    const xScale = (i) => pad.left + (i / (data.length - 1)) * cw;
    const yScale = (p) => pad.top + ch - ((p - minP) / (maxP - minP)) * ch;

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    [0.25, 0.5, 0.75].forEach(p => {
      const y = yScale(p);
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + cw, y); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.font = '9px Inter, sans-serif';
      ctx.fillText(`${(p * 100).toFixed(0)}%`, 2, y + 3);
    });

    // Area fill
    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + ch);
    grad.addColorStop(0,   'rgba(212,212,212,0.2)');
    grad.addColorStop(1,   'rgba(212,212,212,0)');
    ctx.beginPath();
    ctx.moveTo(xScale(0), yScale(data[0].p));
    data.forEach((d, i) => ctx.lineTo(xScale(i), yScale(d.p)));
    ctx.lineTo(xScale(data.length - 1), pad.top + ch);
    ctx.lineTo(xScale(0), pad.top + ch);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.strokeStyle = '#d4d4d4';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap  = 'round';
    data.forEach((d, i) => {
      i === 0 ? ctx.moveTo(xScale(i), yScale(d.p)) : ctx.lineTo(xScale(i), yScale(d.p));
    });
    ctx.stroke();

    // Current dot
    const lx = xScale(data.length - 1);
    const ly = yScale(data[data.length - 1].p);
    ctx.beginPath();
    ctx.arc(lx, ly, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#d4d4d4';
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
}

function OrderBook({ market }) {
  const yes   = market.yesProb;
  const spread = 0.01;
  const asks  = Array.from({ length: 6 }, (_, i) => ({
    price: Math.min(0.99, yes + spread * (i + 1)),
    size:  Math.round(Math.random() * 500 + 50),
  }));
  const bids  = Array.from({ length: 6 }, (_, i) => ({
    price: Math.max(0.01, yes - spread * (i + 1)),
    size:  Math.round(Math.random() * 500 + 50),
  }));
  const maxSize = Math.max(...asks.map(a => a.size), ...bids.map(b => b.size));

  return (
    <div style={{ fontSize: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', fontWeight: 600, padding: '0 0.5rem 0.4rem', borderBottom: '1px solid var(--border)', marginBottom: '0.25rem' }}>
        <span>Price (USDC)</span><span>Size</span>
      </div>
      {/* Asks (NO side) */}
      {[...asks].reverse().map((a, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.18rem 0.5rem', position: 'relative' }}>
          <div style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: `${(a.size / maxSize) * 100}%`, background: 'rgba(248,113,113,0.08)' }} />
          <span style={{ color: 'var(--red)', fontWeight: 600, position: 'relative' }}>NO ${a.price.toFixed(3)}</span>
          <span style={{ color: 'var(--muted)', position: 'relative' }}>{a.size}</span>
        </div>
      ))}
      {/* Spread */}
      <div style={{ textAlign: 'center', padding: '0.3rem', background: 'rgba(212,212,212,0.05)', margin: '0.2rem 0', fontSize: '0.78rem', fontWeight: 800, color: 'var(--cream)' }}>
        YES {(yes * 100).toFixed(2)}%
      </div>
      {/* Bids (YES side) */}
      {bids.map((b, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.18rem 0.5rem', position: 'relative' }}>
          <div style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: `${(b.size / maxSize) * 100}%`, background: 'rgba(212,212,212,0.05)' }} />
          <span style={{ color: 'var(--cream)', fontWeight: 600, position: 'relative' }}>YES ${b.price.toFixed(3)}</span>
          <span style={{ color: 'var(--muted)', position: 'relative' }}>{b.size}</span>
        </div>
      ))}
    </div>
  );
}

function timeLeft(endDate) {
  const ms   = new Date(endDate) - Date.now();
  if (ms <= 0) return 'Ended';
  const days = Math.floor(ms / 86400000);
  const hrs  = Math.floor((ms % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hrs}h left`;
  return `${hrs}h left`;
}

export default function MarketDetail({ marketId, onBack, onPositionPlaced }) {
  const [market,  setMarket]  = useState(null);
  const [view,    setView]    = useState('trade'); // trade | book | details
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    predictionMarketService.getMarket(marketId).then(setMarket);
    const t = setInterval(() => predictionMarketService.getMarket(marketId).then(setMarket), 2500);
    return () => clearInterval(t);
  }, [marketId]);

  if (!market) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--muted)' }}>
        <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block', marginRight: '0.5rem' }}>⟳</span>
        Loading market…
      </div>
    );
  }

  const yes = (market.yesProb * 100).toFixed(1);
  const no  = (100 - market.yesProb * 100).toFixed(1);

  function handleSuccess(res) {
    setSuccess(true);
    onPositionPlaced && onPositionPlaced();
    setTimeout(() => setSuccess(false), 4000);
  }

  return (
    <div style={{ maxWidth: 1000 }}>
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={onBack} style={{ marginBottom: '1rem' }}>← Back</Button>

      {/* Header card */}
      <Card style={{ padding: '1.25rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.65rem', flexWrap: 'wrap' }}>
              <Badge variant={CAT_VARIANT[market.category] || 'outline'}>{market.category}</Badge>
              {market.resolved && <Badge variant="yellow">Resolved</Badge>}
              <span style={{ fontSize: '0.72rem', color: 'var(--muted)', alignSelf: 'center' }}>
                {timeLeft(market.endDate)}
              </span>
            </div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--cream)', lineHeight: 1.4, marginBottom: '0.5rem' }}>
              {market.question}
            </h2>
            <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.78rem', flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--muted)' }}>Volume: <span style={{ color: 'var(--cream)', fontWeight: 700 }}>${(market.volume / 1e6).toFixed(2)}M</span></span>
              <span style={{ color: 'var(--muted)' }}>Traders: <span style={{ color: 'var(--cream)', fontWeight: 700 }}>{market.participants.toLocaleString()}</span></span>
              <span style={{ color: 'var(--muted)' }}>Ends: <span style={{ color: 'var(--cream)', fontWeight: 700 }}>{market.endDate}</span></span>
            </div>
          </div>

          {/* Odds pills */}
          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
            <div style={{ padding: '0.6rem 1.1rem', background: 'rgba(212,212,212,0.08)', border: '1px solid rgba(212,212,212,0.2)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--cream)' }}>{yes}%</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>YES</div>
            </div>
            <div style={{ padding: '0.6rem 1.1rem', background: 'var(--red-dim)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--red)' }}>{no}%</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>NO</div>
            </div>
          </div>
        </div>

        {/* Probability bar */}
        <div style={{ marginTop: '1rem' }}>
          <div style={{ height: 8, borderRadius: 100, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${yes}%`, borderRadius: 100,
              background: 'linear-gradient(90deg, var(--cream-dim), var(--cream))',
              transition: 'width 0.6s ease',
            }} />
          </div>
        </div>
      </Card>

      {/* Main layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1rem', alignItems: 'start' }}>

        {/* Left — chart */}
        <Card style={{ padding: '1rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--cream)', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>Probability History (30d)</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--cream)' }}>
              Current: {yes}%
            </span>
          </div>
          <div style={{ height: 180 }}>
            <ProbChart history={market.history || []} current={market.yesProb} />
          </div>

          {/* View tabs for Order Book / Details */}
          <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '0.85rem' }}>
            <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.85rem' }}>
              {['book', 'details'].map(v => (
                <button key={v} onClick={() => setView(view === v ? 'trade' : v)} style={{
                  padding: '0.3rem 0.8rem', borderRadius: 'var(--radius-sm)',
                  background: view === v ? 'rgba(212,212,212,0.1)' : 'transparent',
                  border: `1px solid ${view === v ? 'rgba(212,212,212,0.25)' : 'var(--border)'}`,
                  color: view === v ? 'var(--cream)' : 'var(--muted)',
                  fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                }}>
                  {v === 'book' ? '📖 Order Book' : '📋 Details'}
                </button>
              ))}
            </div>

            {view === 'book' && <OrderBook market={market} />}
            {view === 'details' && (
              <div style={{ fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.7 }}>
                <p style={{ marginBottom: '0.75rem' }}>{market.description}</p>
                <div style={{ background: 'rgba(212,212,212,0.04)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', fontSize: '0.75rem' }}>
                  <div style={{ marginBottom: '0.3rem' }}>
                    <span style={{ color: 'var(--muted)' }}>Resolution source: </span>
                    <span style={{ color: 'var(--cream)', fontWeight: 600 }}>Rialo Stream Oracle</span>
                  </div>
                  <div style={{ marginBottom: '0.3rem' }}>
                    <span style={{ color: 'var(--muted)' }}>Created: </span>
                    <span style={{ color: 'var(--cream)', fontWeight: 600 }}>{market.created}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--muted)' }}>Market ID: </span>
                    <span style={{ color: 'var(--cream)', fontWeight: 600, fontFamily: 'monospace' }}>{market.id}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Right — Trade panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {success && (
            <div style={{
              background: 'var(--green-dim)', border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: 'var(--radius)', padding: '0.75rem 1rem',
              fontSize: '0.82rem', color: 'var(--green)', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              ✓ Bet placed! Check My Positions for updates.
            </div>
          )}
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '0.75rem 1.1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--cream)' }}>Place Bet</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--green)' }}>● Live odds</span>
            </div>
            <TradePanel
              market={market}
              onClose={onBack}
              onSuccess={handleSuccess}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
