import { Outlet } from 'react-router-dom';
import TopBar from './TopBar.jsx';
import Sidebar from './Sidebar.jsx';
import BlobCanvas from '../ui/BlobCanvas.jsx';
import { useApp } from '../../context/AppContext.jsx';

export default function Shell() {
  const { state } = useApp();
  const sw = state.sidebarOpen ? 'var(--sidebar-w)' : 'var(--sidebar-sm)';

  return (
    <div style={{ height: '100vh', overflow: 'hidden' }}>
      <BlobCanvas />
      <TopBar />
      <Sidebar />
      <main style={{
        position: 'fixed',
        top: 'var(--topbar-h)',
        left: sw,
        right: 0,
        bottom: 0,
        overflowY: 'auto',
        zIndex: 1,
        transition: 'left 0.22s ease',
      }}>
        <Outlet />
      </main>
    </div>
  );
}
