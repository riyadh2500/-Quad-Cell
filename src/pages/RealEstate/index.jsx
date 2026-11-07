import { useState, useRef, useEffect, useCallback } from 'react';

// ── Default listings (শুধুমাত্র খালি শুরু, user নিজে যোগ করবে) ──────────────
const DEFAULT_LISTINGS = [];

const MARKET_STATS = [
  { label: 'Avg Price / sqft', value: '$1,240', change: '+4.2%', up: true },
  { label: 'Avg Rental Yield', value: '8.7%',  change: '+0.3%', up: true },
  { label: 'Transactions (30d)', value: '4,820', change: '+12%', up: true },
  { label: 'Price Index',        value: '142.3', change: '-0.8%', up: false },
];

const TYPES = ['Villa','Penthouse','Apartment','Studio','Townhouse','Office','Shop','Warehouse'];
const STATUSES = ['For Sale','For Rent','Off Plan','Sold'];

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY;

function buildSystemPrompt(listings) {
  const listingText = listings.length > 0 
    ? listings.map(p => `- ${p.title} | ${p.location} | $${p.price.toLocaleString()} | ${p.beds}BR ${p.baths}BA | ${p.sqft}sqft | ROI: ${p.roi}% | ${p.status} | Tags: ${p.tags.join(', ')}`).join('\n')
    : 'No properties added yet. User can add properties to analyze and get recommendations.';

  return `You are an expert AI Real Estate Assistant specializing in Dubai and UAE property markets.

**Current listings on the platform:**
${listingText}

**Market Overview:**
- Average Price/sqft: $1,240 (+4.2% YoY)
- Average Rental Yield: 8.7%
- Monthly Transactions: 4,820 properties
- Popular Areas: Dubai Marina, Downtown Dubai, Palm Jumeirah, DIFC, Business Bay, JVC
- Investment Grade: AAA (Stable & Growing)

**Your Capabilities:**
1. Property Recommendations - Match buyers with ideal properties based on budget, lifestyle, and investment goals
2. ROI & Financial Analysis - Calculate returns, mortgage payments, rental yields, and break-even timelines
3. Legal & Regulatory Guidance - Explain Dubai real estate laws (freehold zones, no property tax, Golden Visa eligibility)
4. Area Comparisons - Compare neighborhoods for appreciation potential, amenities, and rental demand
5. Investment Strategies - Advise on short-term flips vs long-term rentals, off-plan vs ready properties
6. Tokenized Real Estate - Explain fractional blockchain ownership and its benefits

**Response Style:**
- Be concise and data-driven
- Use both AED and USD (1 USD ≈ 3.67 AED)
- Format numbers clearly with commas
- Provide specific examples from available listings when relevant
- Always mention risks alongside opportunities
- Include actionable next steps

**Dubai Real Estate Quick Facts:**
- No property tax or capital gains tax
- Foreign ownership in freehold areas
- Golden Visa available for properties ≥ AED 2M (~$545K)
- Average rental yield: 5-10% (varies by area)
- Strong rental demand from expat population
- Off-plan properties: 10-20% cheaper, higher risk

Answer questions professionally and help users make informed decisions.`;
}

async function* streamGroq(messages) {
  const headers = { 'Content-Type': 'application/json' };
  if (GROQ_KEY) headers['Authorization'] = `Bearer ${GROQ_KEY}`;
  const res = await fetch('/api/groq', {
    method: 'POST', headers,
    body: JSON.stringify({ model: 'qwen/qwen3.8-27b', messages, stream: true, max_tokens: 600, temperature: 0.7 }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: `HTTP ${res.status}` } }));
    throw new Error(err.error?.message || `HTTP ${res.status}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n'); buf = lines.pop();
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') return;
      try { const d = JSON.parse(data).choices?.[0]?.delta?.content; if (d) yield d; } catch { }
    }
  }
}

// ── Markdown renderer ─────────────────────────────────────────────────────────
function MsgContent({ text }) {
  return (
    <div style={{ fontSize: '0.83rem', lineHeight: 1.7, color: '#c9c9c9', wordBreak: 'break-word' }}>
      {text.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} style={{ height: '0.25rem' }} />;
        if (line.startsWith('### ')) return <div key={i} style={{ fontWeight: 700, color: '#e8e0d0', fontSize: '0.88rem', marginTop: '0.5rem' }}>{line.slice(4)}</div>;
        if (line.startsWith('## '))  return <div key={i} style={{ fontWeight: 800, color: '#e8e0d0', fontSize: '0.92rem', marginTop: '0.6rem' }}>{line.slice(3)}</div>;
        if (line.match(/^[-*] /)) return <div key={i} style={{ display: 'flex', gap: '0.45rem', marginBottom: '0.1rem' }}><span style={{ color: '#4b5563', flexShrink: 0 }}>•</span><span><Inline text={line.slice(2)} /></span></div>;
        if (line.match(/^\d+\. /)) return <div key={i} style={{ display: 'flex', gap: '0.45rem', marginBottom: '0.1rem' }}><span style={{ color: '#6b7280', flexShrink: 0, fontWeight: 600, fontSize: '0.78rem' }}>{line.match(/^(\d+)\./)[1]}.</span><span><Inline text={line.replace(/^\d+\. /, '')} /></span></div>;
        return <div key={i} style={{ marginBottom: '0.03rem' }}><Inline text={line} /></div>;
      })}
    </div>
  );
}
function Inline({ text }) {
  return <>{text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i} style={{ color: '#e8e0d0' }}>{p.slice(2,-2)}</strong>;
    if (p.startsWith('`') && p.endsWith('`')) return <code key={i} style={{ fontFamily: 'monospace', fontSize: '0.76rem', background: 'rgba(255,255,255,0.08)', padding: '0.05rem 0.3rem', borderRadius: 3, color: '#86efac' }}>{p.slice(1,-1)}</code>;
    return <span key={i}>{p}</span>;
  })}</>;
}

// ── Add / Edit Property Modal ─────────────────────────────────────────────────
const EMPTY_FORM = { title: '', location: '', price: '', rent: '', beds: '1', baths: '1', sqft: '', type: 'Apartment', status: 'For Sale', roi: '', img: null, tags: '', tokenized: false };

function PropertyModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const isEdit = !!initial;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Convert uploaded file to base64 data URL
  function handleImageFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => set('img', e.target.result);
    reader.readAsDataURL(file);
  }

  function handleDrop(e) {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleImageFile(file);
  }

  function handleSave() {
    if (!form.title.trim() || !form.location.trim() || !form.price) return;
    onSave({
      ...form,
      id: initial?.id || `p${Date.now()}`,
      price: parseFloat(form.price) || 0,
      rent: parseFloat(form.rent) || 0,
      beds: parseInt(form.beds) || 1,
      baths: parseInt(form.baths) || 1,
      sqft: parseInt(form.sqft) || 0,
      roi: parseFloat(form.roi) || 0,
      tags: typeof form.tags === 'string' ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : form.tags,
    });
  }

  const inputStyle = { width: '100%', boxSizing: 'border-box', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '0.55rem 0.75rem', color: '#e5e7eb', fontSize: '0.82rem', fontFamily: 'inherit', outline: 'none' };
  const labelStyle = { fontSize: '0.68rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.3rem' };
  const rowStyle   = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}>

        {/* Header */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#111', zIndex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: '#e8e0d0' }}>{isEdit ? '✏️ Edit Property' : '➕ Add New Property'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '1.2rem', cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ padding: '1.25rem' }}>
          {/* Image upload */}
          <div style={{ marginBottom: '0.85rem' }}>
            <label style={labelStyle}>Property Photo</label>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => handleImageFile(e.target.files[0])} />

            {form.img ? (
              /* Preview */
              <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                <img src={form.img} alt="preview" style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(0,0,0,0.45)'}
                  onMouseLeave={e => e.currentTarget.style.background='rgba(0,0,0,0)'}>
                  <div style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: '0.4rem' }}>
                    <button onClick={() => fileInputRef.current?.click()} style={{ background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 7, padding: '0.3rem 0.7rem', color: '#e8e0d0', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}>
                      🔄 Change
                    </button>
                    <button onClick={() => set('img', null)} style={{ background: 'rgba(239,68,68,0.8)', border: 'none', borderRadius: 7, padding: '0.3rem 0.7rem', color: '#fff', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}>
                      🗑 Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Drop zone */
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                style={{ border: `2px dashed ${dragOver ? '#22c55e' : 'rgba(255,255,255,0.12)'}`, borderRadius: 10, padding: '1.75rem 1rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s', background: dragOver ? 'rgba(34,197,94,0.05)' : 'rgba(255,255,255,0.02)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📸</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#9ca3af', marginBottom: '0.25rem' }}>Click to upload or drag & drop</div>
                <div style={{ fontSize: '0.7rem', color: '#4b5563' }}>JPG, PNG, WEBP — any size</div>
              </div>
            )}
          </div>

          {/* Title */}
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={labelStyle}>Property Title *</label>
            <input style={inputStyle} value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Luxury Marina Apartment" />
          </div>

          {/* Location */}
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={labelStyle}>Location *</label>
            <input style={inputStyle} value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Dubai Marina, UAE" />
          </div>

          {/* Type & Status */}
          <div style={rowStyle}>
            <div>
              <label style={labelStyle}>Type</label>
              <select value={form.type} onChange={e => set('type', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Price & Rent */}
          <div style={rowStyle}>
            <div>
              <label style={labelStyle}>Price (USD) *</label>
              <input style={inputStyle} type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="e.g. 1500000" />
            </div>
            <div>
              <label style={labelStyle}>Monthly Rent (USD)</label>
              <input style={inputStyle} type="number" value={form.rent} onChange={e => set('rent', e.target.value)} placeholder="e.g. 12000" />
            </div>
          </div>

          {/* Beds, Baths, Sqft, ROI */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            {[['beds','Beds'],['baths','Baths'],['sqft','Sqft'],['roi','ROI %']].map(([k,l]) => (
              <div key={k}>
                <label style={labelStyle}>{l}</label>
                <input style={inputStyle} type="number" value={form[k]} onChange={e => set(k, e.target.value)} placeholder={k === 'roi' ? '8.5' : k === 'sqft' ? '1200' : '2'} />
              </div>
            ))}
          </div>

          {/* Tags */}
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={labelStyle}>Tags (comma separated)</label>
            <input style={inputStyle} value={typeof form.tags === 'string' ? form.tags : form.tags.join(', ')} onChange={e => set('tags', e.target.value)} placeholder="Sea View, Pool, Gym, Smart Home" />
          </div>

          {/* Tokenized toggle */}
          <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.85rem', background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.15)', borderRadius: 10 }}>
            <button onClick={() => set('tokenized', !form.tokenized)} style={{ width: 40, height: 22, borderRadius: 100, background: form.tokenized ? '#a855f7' : '#374151', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
              <span style={{ position: 'absolute', top: 3, left: form.tokenized ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
            </button>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#c084fc' }}>⛓ Tokenized Property</div>
              <div style={{ fontSize: '0.68rem', color: '#6b7280' }}>Enable fractional blockchain ownership</div>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button onClick={onClose} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '0.65rem', color: '#9ca3af', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={!form.title.trim() || !form.location.trim() || !form.price} style={{ flex: 2, background: !form.title.trim() || !form.location.trim() || !form.price ? '#1a2e1a' : '#22c55e', border: 'none', borderRadius: 10, padding: '0.65rem', color: !form.title.trim() || !form.location.trim() || !form.price ? '#374151' : '#000', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 700, transition: 'background 0.15s' }}>
              {isEdit ? '💾 Save Changes' : '➕ Add Property'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Property Detail Modal ─────────────────────────────────────────────────────
function PropertyDetail({ p, onClose, onEdit, onDelete, onAsk }) {
  const isPhoto = p.img && p.img.startsWith('data:');
  const annualRent = p.rent * 12;
  const grossYield = p.price ? ((annualRent / p.price) * 100).toFixed(2) : 0;
  const monthly20y = p.price ? ((p.price * 0.8 * 0.06 / 12) / (1 - Math.pow(1 + 0.06/12, -240))).toFixed(0) : 0;

  const statusColor = p.status === 'For Sale' ? '#22c55e' : p.status === 'For Rent' ? '#60a5fa' : p.status === 'Off Plan' ? '#fbbf24' : '#9ca3af';
  const statusBg    = p.status === 'For Sale' ? 'rgba(34,197,94,0.12)' : p.status === 'For Rent' ? 'rgba(59,130,246,0.12)' : p.status === 'Off Plan' ? 'rgba(251,191,36,0.12)' : 'rgba(107,114,128,0.12)';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, width: '100%', maxWidth: 620, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.85)' }}>

        {/* Hero image */}
        <div style={{ height: 220, background: 'linear-gradient(135deg, #1a1a2e, #16213e)', position: 'relative', overflow: 'hidden', borderRadius: '18px 18px 0 0' }}>
          {isPhoto
            ? <img src={p.img} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem' }}>{p.img || '🏠'}</div>
          }
          {/* Overlay gradient */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)' }} />
          {/* Badges */}
          <div style={{ position: 'absolute', top: 12, left: 14, display: 'flex', gap: 6 }}>
            <span style={{ background: statusBg, border: `1px solid ${statusColor}40`, color: statusColor, fontSize: '0.68rem', fontWeight: 700, padding: '0.2rem 0.65rem', borderRadius: 100 }}>{p.status}</span>
            {p.tokenized && <span style={{ background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.4)', color: '#c084fc', fontSize: '0.68rem', fontWeight: 700, padding: '0.2rem 0.65rem', borderRadius: 100 }}>⛓ Tokenized</span>}
          </div>
          {/* ROI badge */}
          <div style={{ position: 'absolute', top: 12, right: 14, background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 9, padding: '0.22rem 0.6rem', fontSize: '0.75rem', color: '#22c55e', fontWeight: 800 }}>
            {p.roi}% ROI
          </div>
          {/* Close btn */}
          <button onClick={onClose} style={{ position: 'absolute', bottom: 12, right: 14, background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50%', width: 32, height: 32, color: '#e8e0d0', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          {/* Price on image */}
          <div style={{ position: 'absolute', bottom: 14, left: 14 }}>
            <div style={{ fontWeight: 900, fontSize: '1.5rem', color: '#fff', lineHeight: 1 }}>${p.price.toLocaleString()}</div>
            {p.rent > 0 && <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.65)', marginTop: '0.15rem' }}>${p.rent.toLocaleString()}/mo rental income</div>}
          </div>
        </div>

        <div style={{ padding: '1.25rem' }}>
          {/* Title & location */}
          <div style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontWeight: 800, fontSize: '1.15rem', color: '#e8e0d0', margin: 0, lineHeight: 1.3 }}>{p.title}</h2>
            <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span>📍</span>{p.location}
            </div>
          </div>

          {/* Key stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
            {[
              { icon: '🛏', label: 'Beds',  value: p.beds },
              { icon: '🚿', label: 'Baths', value: p.baths },
              { icon: '📐', label: 'Sqft',  value: p.sqft ? p.sqft.toLocaleString() : '—' },
              { icon: '🏷', label: 'Type',  value: p.type },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '0.6rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.1rem' }}>{s.icon}</div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#e8e0d0', marginTop: '0.2rem' }}>{s.value}</div>
                <div style={{ fontSize: '0.62rem', color: '#4b5563', marginTop: '0.1rem' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Financial breakdown */}
          <div style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 12, padding: '0.9rem 1rem', marginBottom: '1rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#22c55e', marginBottom: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>📊 Financial Overview</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {[
                ['Purchase Price',    `$${p.price.toLocaleString()}`],
                ['Price / sqft',      p.sqft ? `$${Math.round(p.price/p.sqft).toLocaleString()}` : '—'],
                ['Monthly Rent',      p.rent ? `$${p.rent.toLocaleString()}` : '—'],
                ['Annual Rent',       annualRent ? `$${annualRent.toLocaleString()}` : '—'],
                ['Gross Yield',       `${grossYield}%`],
                ['ROI',               `${p.roi}%`],
                ['Est. Mortgage/mo',  `$${Number(monthly20y).toLocaleString()}`],
                ['Down Payment (20%)',`$${Math.round(p.price*0.2).toLocaleString()}`],
              ].map(([k,v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.3rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: '0.73rem', color: '#6b7280' }}>{k}</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#e8e0d0' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          {p.tags?.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.68rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>Features</div>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {p.tags.map(t => (
                  <span key={t} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 100, padding: '0.2rem 0.65rem', fontSize: '0.72rem', color: '#9ca3af' }}>✓ {t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => { onAsk(`Tell me everything about ${p.title} in ${p.location}. Price $${p.price.toLocaleString()}, ROI ${p.roi}%, ${p.beds}BR. Is it a good investment?`); onClose(); }}
              style={{ flex: 2, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: '0.65rem', color: '#22c55e', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(34,197,94,0.18)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(34,197,94,0.1)'}>
              🧠 Ask AI Advisor
            </button>
            <button onClick={() => { onClose(); onEdit(p); }}
              style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '0.65rem', color: '#9ca3af', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
              ✏️ Edit
            </button>
            <button onClick={() => { onClose(); onDelete(p.id); }}
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '0.65rem 0.85rem', color: '#f87171', fontSize: '0.82rem', cursor: 'pointer' }}>
              🗑
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Property card ─────────────────────────────────────────────────────────────
function PropertyCard({ p, onAsk, onEdit, onDelete, onDetail }) {
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => { setHovered(false); setMenuOpen(false); }}
      onClick={() => onDetail(p)}
      style={{ background: hovered ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)', border: `1px solid ${hovered ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 14, overflow: 'hidden', transition: 'all 0.18s', position: 'relative', cursor: 'pointer' }}>

      {/* Image area */}
      <div style={{ height: 96, background: 'linear-gradient(135deg, #1a1a2e, #16213e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.8rem', position: 'relative', overflow: 'hidden' }}>
        {p.img && p.img.startsWith('data:') ? (
          <img src={p.img} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <span style={{ fontSize: '2.8rem' }}>{p.img || '🏠'}</span>
        )}
        <div style={{ position: 'absolute', top: 7, left: 9, display: 'flex', gap: 4 }}>
          <span style={{ background: p.status === 'For Sale' ? 'rgba(34,197,94,0.2)' : p.status === 'For Rent' ? 'rgba(59,130,246,0.2)' : p.status === 'Off Plan' ? 'rgba(251,191,36,0.2)' : 'rgba(107,114,128,0.2)', border: `1px solid ${p.status === 'For Sale' ? 'rgba(34,197,94,0.4)' : p.status === 'For Rent' ? 'rgba(59,130,246,0.4)' : p.status === 'Off Plan' ? 'rgba(251,191,36,0.4)' : 'rgba(107,114,128,0.4)'}`, color: p.status === 'For Sale' ? '#22c55e' : p.status === 'For Rent' ? '#60a5fa' : p.status === 'Off Plan' ? '#fbbf24' : '#9ca3af', fontSize: '0.6rem', fontWeight: 700, padding: '0.12rem 0.45rem', borderRadius: 100 }}>{p.status}</span>
          {p.tokenized && <span style={{ background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.4)', color: '#c084fc', fontSize: '0.6rem', fontWeight: 700, padding: '0.12rem 0.45rem', borderRadius: 100 }}>⛓</span>}
        </div>
        <div style={{ position: 'absolute', top: 7, right: 9, display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '0.18rem 0.45rem', fontSize: '0.65rem', color: '#22c55e', fontWeight: 700 }}>{p.roi}% ROI</span>
          {/* ⋮ menu button */}
          <div style={{ position: 'relative' }}>
            <button onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }} style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#9ca3af', fontSize: '0.85rem' }}>⋮</button>
            {menuOpen && (
              <div style={{ position: 'absolute', top: 30, right: 0, background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, overflow: 'hidden', zIndex: 50, minWidth: 120, boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }}>
                <button onClick={e => { e.stopPropagation(); setMenuOpen(false); onEdit(p); }} style={{ width: '100%', padding: '0.55rem 0.85rem', background: 'none', border: 'none', color: '#e8e0d0', fontSize: '0.78rem', cursor: 'pointer', textAlign: 'left', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background='none'}>
                  ✏️ Edit
                </button>
                <button onClick={e => { e.stopPropagation(); setMenuOpen(false); onDelete(p.id); }} style={{ width: '100%', padding: '0.55rem 0.85rem', background: 'none', border: 'none', color: '#f87171', fontSize: '0.78rem', cursor: 'pointer', textAlign: 'left', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background='none'}>
                  🗑 Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '0.8rem' }}>
        <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#e8e0d0', marginBottom: '0.18rem', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
        <div style={{ fontSize: '0.7rem', color: '#6b7280', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span>📍</span><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.location}</span>
        </div>
        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#e8e0d0', marginBottom: '0.08rem' }}>${p.price.toLocaleString()}</div>
        <div style={{ fontSize: '0.7rem', color: '#6b7280', marginBottom: '0.55rem' }}>
          {p.sqft ? `$${Math.round(p.price / p.sqft).toLocaleString()}/sqft` : p.type} · {p.rent ? `$${p.rent.toLocaleString()}/mo` : '—'}
        </div>
        <div style={{ display: 'flex', gap: '0.7rem', fontSize: '0.7rem', color: '#9ca3af', marginBottom: '0.55rem' }}>
          <span>🛏 {p.beds}</span><span>🚿 {p.baths}</span>{p.sqft ? <span>📐 {p.sqft.toLocaleString()}</span> : null}
        </div>
        {p.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginBottom: '0.65rem' }}>
            {p.tags.slice(0,3).map(t => <span key={t} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 100, padding: '0.08rem 0.45rem', fontSize: '0.62rem', color: '#6b7280' }}>{t}</span>)}
            {p.tags.length > 3 && <span style={{ fontSize: '0.62rem', color: '#4b5563' }}>+{p.tags.length - 3}</span>}
          </div>
        )}
        <button onClick={() => onAsk(`Tell me more about the ${p.title} in ${p.location}. Price $${p.price.toLocaleString()}, ROI ${p.roi}%. What's the investment case?`)}
          style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, padding: '0.4rem', fontSize: '0.72rem', color: '#9ca3af', cursor: 'pointer', transition: 'all 0.12s' }}
          onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.08)'; e.currentTarget.style.color='#e8e0d0'; }}
          onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.color='#9ca3af'; }}>
          🧠 Ask AI
        </button>
      </div>
    </div>
  );
}

// ── Quick questions ───────────────────────────────────────────────────────────
const QUICK = [
  'Best areas for investment in Dubai?',
  'How to get Golden Visa through property?',
  'Calculate mortgage for $1M property',
  'Explain tokenized real estate',
  'Villa vs Apartment: Which is better?',
  'Best property under $500K budget?',
  'Off-plan vs Ready property pros/cons?',
  'Rental yield expectations in Dubai?',
];

const WELCOME = { id: 'w0', role: 'ai', time: Date.now(), text: `👋 **Welcome to Quad Cell Real Estate AI!**

I'm your personal real estate advisor powered by AI, specializing in Dubai and UAE property markets.

**I can help you:**
- 🏠 Find the perfect property based on your budget and preferences
- 📊 Calculate ROI, mortgage payments, and rental yields
- 🌍 Compare areas and neighborhoods for investment potential
- 💰 Explain Dubai's real estate laws and Golden Visa benefits
- ⛓ Understand tokenized real estate and fractional ownership

**Get started:**
Start by adding a property using the **➕ Add Property** button, or ask me anything about Dubai real estate below!

Try asking: *"What are the best areas to invest in Dubai?"* or *"Explain Golden Visa via property purchase"*` };

function msgTime(ts) { return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }

function loadListings() {
  try {
    const saved = localStorage.getItem('qc_re_listings');
    return saved ? JSON.parse(saved) : DEFAULT_LISTINGS;
  } catch { return DEFAULT_LISTINGS; }
}
function saveListings(list) {
  try { localStorage.setItem('qc_re_listings', JSON.stringify(list)); } catch { }
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function RealEstate() {
  const [listings,   setListingsState] = useState(loadListings);
  const [messages,   setMessages]  = useState([WELCOME]);
  const [input,      setInput]     = useState('');
  const [streaming,  setStreaming] = useState(false);
  const [error,      setError]     = useState(null);
  const [filter,     setFilter]    = useState('All');
  const [sort,       setSort]      = useState('roi');
  const [showModal,  setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [detailTarget, setDetailTarget] = useState(null); // null = add, object = edit
  const [search,     setSearch]    = useState('');
  const historyRef = useRef([]);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  // persist listings
  function setListings(fn) {
    setListingsState(prev => {
      const next = typeof fn === 'function' ? fn(prev) : fn;
      saveListings(next);
      return next;
    });
  }

  // Clear localStorage on first load (run once)
  useEffect(() => {
    localStorage.removeItem('qc_re_listings');
    setListingsState([]);
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  function handleSave(p) {
    if (editTarget) {
      setListings(list => list.map(x => x.id === p.id ? p : x));
    } else {
      setListings(list => [p, ...list]);
    }
    setShowModal(false);
    setEditTarget(null);
  }

  function handleDelete(id) {
    if (window.confirm('Delete this property?')) {
      setListings(list => list.filter(x => x.id !== id));
    }
  }

  function openEdit(p) {
    setEditTarget({ ...p, tags: p.tags.join(', ') });
    setShowModal(true);
  }

  const ask = useCallback(async (overrideQ) => {
    const query = (overrideQ ?? input).trim();
    if (!query || streaming) return;
    setInput(''); setError(null);
    inputRef.current?.focus();
    setMessages(m => [...m, { id: `u${Date.now()}`, role: 'user', text: query, time: Date.now() }]);
    historyRef.current.push({ role: 'user', content: query });
    const msgs = [{ role: 'system', content: buildSystemPrompt(listings) }, ...historyRef.current.slice(-20)];
    const aiId = `a${Date.now()}`;
    setMessages(m => [...m, { id: aiId, role: 'ai', text: '', time: Date.now(), streaming: true }]);
    setStreaming(true);
    let fullText = '';
    try {
      for await (const chunk of streamGroq(msgs)) {
        fullText += chunk;
        setMessages(m => m.map(msg => msg.id === aiId ? { ...msg, text: fullText } : msg));
      }
      setMessages(m => m.map(msg => msg.id === aiId ? { ...msg, streaming: false } : msg));
      historyRef.current.push({ role: 'assistant', content: fullText });
    } catch (e) {
      setMessages(m => m.map(msg => msg.id === aiId ? { ...msg, text: '', streaming: false } : msg));
      setError(e.message.includes('429') ? 'Rate limit — wait ~20s and try again' : e.message);
      historyRef.current.pop();
    }
    setStreaming(false);
  }, [input, streaming, listings]);

  const types = ['All', ...TYPES];
  const filtered = listings
    .filter(p => (filter === 'All' || p.type === filter) && (!search || p.title.toLowerCase().includes(search.toLowerCase()) || p.location.toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => sort === 'roi' ? b.roi - a.roi : sort === 'price_asc' ? a.price - b.price : b.price - a.price);

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: '#0a0a0a' }}>

      {/* ── Left: listings ── */}
      <div style={{ width: '57%', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '0.85rem 1.1rem 0.7rem', background: '#0f0f0f', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
            <div>
              <h1 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#e8e0d0', letterSpacing: '-0.02em' }}>AI Real Estate</h1>
              <p style={{ fontSize: '0.68rem', color: '#4b5563', marginTop: '0.1rem' }}>Dubai & UAE · {listings.length} properties</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: '#22c55e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />Live
              </div>
              {/* ➕ Add button */}
              <button onClick={() => { setEditTarget(null); setShowModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, padding: '0.4rem 0.85rem', fontSize: '0.75rem', color: '#22c55e', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(34,197,94,0.18)'; }}
                onMouseLeave={e => { e.currentTarget.style.background='rgba(34,197,94,0.1)'; }}>
                ➕ Add Property
              </button>
            </div>
          </div>

          {/* Market stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem', marginBottom: '0.7rem' }}>
            {MARKET_STATS.map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 9, padding: '0.45rem 0.6rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#e8e0d0' }}>{s.value}</div>
                <div style={{ fontSize: '0.58rem', color: '#4b5563', marginTop: '0.04rem' }}>{s.label}</div>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, color: s.up ? '#22c55e' : '#ef4444', marginTop: '0.08rem' }}>{s.change}</div>
              </div>
            ))}
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: '0.6rem' }}>
            <span style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: '#4b5563' }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title or location…"
              style={{ width: '100%', boxSizing: 'border-box', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '0.45rem 0.75rem 0.45rem 2rem', color: '#e5e7eb', fontSize: '0.78rem', fontFamily: 'inherit', outline: 'none' }} />
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.25rem', flex: 1, overflowX: 'auto', scrollbarWidth: 'none' }}>
              {types.map(t => (
                <button key={t} onClick={() => setFilter(t)} style={{ background: filter === t ? 'rgba(255,255,255,0.1)' : 'transparent', border: `1px solid ${filter === t ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 100, padding: '0.18rem 0.65rem', fontSize: '0.68rem', color: filter === t ? '#e8e0d0' : '#6b7280', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.12s' }}>{t}</button>
              ))}
            </div>
            <select value={sort} onChange={e => setSort(e.target.value)} style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '0.22rem 0.45rem', fontSize: '0.68rem', color: '#9ca3af', outline: 'none', cursor: 'pointer', flexShrink: 0 }}>
              <option value="roi">Best ROI</option>
              <option value="price_asc">Price ↑</option>
              <option value="price_desc">Price ↓</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.85rem 1.1rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', alignContent: 'start', scrollbarWidth: 'thin', scrollbarColor: '#1f2937 transparent' }}>
          {filtered.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem 1rem', color: '#4b5563' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏠</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.35rem' }}>No properties found</div>
              <div style={{ fontSize: '0.75rem' }}>Try a different filter or <button onClick={() => { setEditTarget(null); setShowModal(true); }} style={{ background: 'none', border: 'none', color: '#22c55e', cursor: 'pointer', fontSize: '0.75rem', padding: 0, fontWeight: 600 }}>add a new property</button></div>
            </div>
          ) : (
            filtered.map(p => <PropertyCard key={p.id} p={p} onAsk={q => ask(q)} onEdit={openEdit} onDelete={handleDelete} onDetail={setDetailTarget} />)
          )}
        </div>
      </div>

      {/* ── Right: AI chat ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Chat header */}
        <div style={{ padding: '0.8rem 1.1rem', background: '#0f0f0f', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #1e293b, #0f172a)', border: '2px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🏡</div>
            <span style={{ position: 'absolute', bottom: 1, right: 1, width: 8, height: 8, borderRadius: '50%', background: '#22c55e', border: '2px solid #0f0f0f' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#e8e0d0' }}>AI Property Advisor</div>
            <div style={{ fontSize: '0.67rem', color: streaming ? '#f59e0b' : '#22c55e', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: streaming ? '#f59e0b' : '#22c55e', display: 'inline-block' }} />
              {streaming ? 'Analyzing…' : 'Online · Dubai Market Expert'}
            </div>
          </div>
          <button onClick={() => { setMessages([WELCOME]); historyRef.current = []; }} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '0.25rem 0.6rem', fontSize: '0.68rem', color: '#6b7280', cursor: 'pointer' }}
            title="Clear chat">🗑 Clear</button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', scrollbarWidth: 'thin', scrollbarColor: '#1f2937 transparent' }}>
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            const prevRole = messages[idx-1]?.role;
            const showMeta = !isUser && prevRole !== 'ai';
            return (
              <div key={msg.id} style={{ display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: '0.45rem', marginBottom: prevRole === msg.role ? '0.03rem' : '0.25rem' }}>
                {!isUser && <div style={{ width: 26, height: 26, flexShrink: 0 }}>{showMeta && <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, #1e293b, #0f172a)', border: '1px solid rgba(255,255,255,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem' }}>🏡</div>}</div>}
                <div style={{ maxWidth: '82%', display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', gap: '0.08rem' }}>
                  {showMeta && !isUser && <div style={{ fontSize: '0.62rem', color: '#4b5563', paddingLeft: '0.1rem', display: 'flex', gap: '0.35rem' }}><span style={{ fontWeight: 600, color: '#6b7280' }}>AI Advisor</span><span>{msgTime(msg.time)}</span></div>}
                  {isUser && <div style={{ fontSize: '0.62rem', color: '#374151', paddingRight: '0.1rem' }}>{msgTime(msg.time)}</div>}
                  <div style={{ padding: '0.6rem 0.85rem', borderRadius: isUser ? '14px 14px 4px 14px' : '4px 14px 14px 14px', background: isUser ? 'linear-gradient(135deg, #14532d, #166534)' : '#181818', border: `1px solid ${isUser ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.07)'}`, boxShadow: '0 1px 4px rgba(0,0,0,0.4)', minWidth: 32 }}>
                    {isUser ? <span style={{ fontSize: '0.83rem', color: '#dcfce7', lineHeight: 1.65 }}>{msg.text}</span>
                      : msg.text ? <><MsgContent text={msg.text} />{msg.streaming && <span style={{ display: 'inline-block', width: 2, height: '0.8em', background: '#6b7280', marginLeft: 2, verticalAlign: 'text-bottom', animation: 'blink 0.7s infinite' }} />}</>
                      : <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>{[0,1,2].map(i => <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#374151', display: 'inline-block', animation: `blink 1.3s ${i*0.2}s infinite` }} />)}</div>}
                  </div>
                </div>
              </div>
            );
          })}
          {error && <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '0.55rem 0.8rem', fontSize: '0.77rem', color: '#fca5a5', display: 'flex', gap: '0.4rem' }}><span>⚠</span><span>{error}</span></div>}
          <div ref={bottomRef} />
        </div>

        {/* Quick questions */}
        <div style={{ padding: '0.4rem 0.85rem', display: 'flex', gap: '0.3rem', overflowX: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', background: '#0d0d0d', flexShrink: 0, scrollbarWidth: 'none' }}>
          {QUICK.map(q => (
            <button key={q} onClick={() => ask(q)} disabled={streaming} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 100, padding: '0.2rem 0.65rem', fontSize: '0.67rem', color: '#6b7280', cursor: streaming ? 'default' : 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.12s', opacity: streaming ? 0.4 : 1 }}
              onMouseEnter={e => { if (!streaming) { e.currentTarget.style.color='#d1d5db'; e.currentTarget.style.borderColor='rgba(255,255,255,0.2)'; }}}
              onMouseLeave={e => { e.currentTarget.style.color='#6b7280'; e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'; }}
            >{q}</button>
          ))}
        </div>

        {/* Input */}
        <div style={{ padding: '0.7rem 0.85rem', background: '#0f0f0f', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
          <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(); }}} placeholder="Ask about any property or Dubai market…" disabled={streaming}
            style={{ flex: 1, background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, padding: '0.6rem 0.85rem', color: '#e5e7eb', fontSize: '0.82rem', fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.15s', opacity: streaming ? 0.6 : 1 }}
            onFocus={e => e.target.style.borderColor='rgba(255,255,255,0.25)'}
            onBlur={e  => e.target.style.borderColor='rgba(255,255,255,0.09)'}
          />
          <button onClick={() => ask()} disabled={streaming || !input.trim()} style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: !streaming && input.trim() ? '#22c55e' : '#1a1a1a', border: '1px solid rgba(255,255,255,0.09)', cursor: !streaming && input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}>
            {streaming ? <span style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid #374151', borderTopColor: '#9ca3af', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> : <span style={{ color: input.trim() ? '#000' : '#4b5563', fontSize: '1rem', lineHeight: 1 }}>↑</span>}
          </button>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <PropertyModal
          initial={editTarget}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
        />
      )}

      {/* Detail Modal */}
      {detailTarget && (
        <PropertyDetail
          p={detailTarget}
          onClose={() => setDetailTarget(null)}
          onEdit={p => { setDetailTarget(null); openEdit(p); }}
          onDelete={id => { setDetailTarget(null); handleDelete(id); }}
          onAsk={ask}
        />
      )}
    </div>
  );
}
