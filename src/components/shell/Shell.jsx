import { Outlet, useLocation } from 'react-router-dom';
import TopBar from './TopBar.jsx';
import Sidebar from './Sidebar.jsx';
import BlobCanvas from '../ui/BlobCanvas.jsx';
import { useApp } from '../../context/AppContext.jsx';

// Pages that need full-height fixed layout (no scroll on main)
const FIXED_LAYOUT = ['/dex', '/payments'];

export default function Shell() {
  const { state }  = useApp();
  const location   = useLocation();
  const sw         = state.sidebarOpen ? 'var(--sidebar-w)' : 'var(--sidebar-sm)';
  const isFixed    = FIXED_LAYOUT.some(p => location.pathname === p || location.hash === `#${p}`);

  return (
    <div style={{ height: '100vh', overflow: 'hidden' }}>
      <BlobCanvas />
      <TopBar />
      <Sidebar />
      <main style={{
        position: 'fixed',
        top:      'var(--topbar-h)',
        left:     sw,
        right:    0,
        bottom:   0,
        zIndex:   1,
        transition: 'left 0.22s ease',
        overflowY: isFixed ? 'hidden' : 'auto',
        overflowX: 'hidden',
        display:   'flex',
        flexDirection: 'column',
      }}>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
