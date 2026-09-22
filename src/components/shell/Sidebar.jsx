import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';

const NAV = [
  { group: 'Main', items: [
    { label: 'Overview', icon: '◈', path: '/' },
  ]},
  { group: 'Products', items: [
    { label: 'Prediction Markets', icon: '🎯', path: '/markets' },
    { label: 'Perpetual DEX', icon: '📊', path: '/dex' },
    { label: 'AI Payments', icon: '💸', path: '/payments' },
  ]},
  { group: 'AI', items: [
    { label: 'AI Agents', icon: '🤖', path: '/agents' },
  ]},
  { group: 'Infrastructure', items: [
    { label: 'Reactive Txs', icon: '⚡', path: '/infra/reactive' },
    { label: 'Rialo Stream', icon: '📡', path: '/infra/stream' },
    { label: 'Rialo Edge', icon: '🌐', path: '/infra/edge' },
    { label: 'Privacy (IPC)', icon: '🛡️', path: '/infra/ipc' },
    { label: 'Automation', icon: '🔄', path: '/infra/workflow' },
  ]},
  { group: 'Ecosystem', items: [
    { label: 'Playground', icon: '🧪', path: '/ecosystem/playground' },
    { label: 'Applications', icon: '🗂️', path: '/ecosystem/apps' },
    { label: 'Developers', icon: '⌨️', path: '/ecosystem/developers' },
  ]},
];

export default function Sidebar() {
  const { state } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const open = state.sidebarOpen;

  const isActive = (path) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <>
      {/* Overlay on mobile */}
      {open && <div
        onClick={() => {}}
        style={{ display: 'none' }}
        className="sidebar-overlay"
      />}
      <nav style={{
        position: 'fixed', top: 'var(--topbar-h)', left: 0,
        height: 'calc(100vh - var(--topbar-h))',
        width: open ? 'var(--sidebar-w)' : 'var(--sidebar-sm)',
        background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(20px)',
        borderRight: '1px solid var(--border)',
        overflowY: 'auto', overflowX: 'hidden',
        transition: 'width 0.22s ease',
        zIndex: 150,
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: open ? '1rem 0.5rem' : '1rem 0.25rem', flex: 1 }}>
          {NAV.map(({ group, items }) => (
            <div key={group} style={{ marginBottom: '0.25rem' }}>
              {open && (
                <div style={{
                  fontSize: '0.65rem', fontWeight: 700, color: 'var(--muted)',
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  padding: '0.6rem 0.9rem 0.3rem',
                }}>
                  {group}
                </div>
              )}
              {items.map(item => {
                const active = isActive(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    title={!open ? item.label : undefined}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center',
                      gap: open ? '0.65rem' : '0',
                      padding: open ? '0.52rem 0.9rem' : '0.52rem',
                      justifyContent: open ? 'flex-start' : 'center',
                      background: active ? 'rgba(232,224,208,0.08)' : 'transparent',
                      border: 'none',
                      borderLeft: active ? '2px solid var(--cream)' : '2px solid transparent',
                      borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                      cursor: 'pointer',
                      color: active ? 'var(--cream)' : 'var(--muted)',
                      fontSize: '0.82rem', fontWeight: active ? 600 : 400,
                      transition: 'all 0.15s',
                      whiteSpace: 'nowrap', overflow: 'hidden',
                      marginBottom: '1px',
                    }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--text)'; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--muted)'; }}
                  >
                    <span style={{ fontSize: '0.95rem', flexShrink: 0 }}>{item.icon}</span>
                    {open && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        {open && (
          <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border)' }}>
            <a href="https://rialo.io/for-devs" target="_blank" rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--muted)', padding: '0.4rem 0.5rem', borderRadius: 'var(--radius-sm)' }}>
              <span>🔗</span> Rialo Docs
            </a>
          </div>
        )}
      </nav>
    </>
  );
}
