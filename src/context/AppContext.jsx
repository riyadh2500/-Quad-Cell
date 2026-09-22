import { createContext, useContext, useReducer } from 'react';

const AppContext = createContext(null);

const init = {
  sidebarOpen: true,
  walletConnected: false,
  walletAddress: null,
  notifications: [],
};

function reducer(state, action) {
  switch (action.type) {
    case 'TOGGLE_SIDEBAR': return { ...state, sidebarOpen: !state.sidebarOpen };
    case 'SET_SIDEBAR': return { ...state, sidebarOpen: action.open };
    case 'CONNECT_WALLET': return { ...state, walletConnected: true, walletAddress: action.address };
    case 'DISCONNECT_WALLET': return { ...state, walletConnected: false, walletAddress: null };
    case 'ADD_NOTIFICATION': return { ...state, notifications: [action.notification, ...state.notifications].slice(0, 20) };
    case 'CLEAR_NOTIFICATIONS': return { ...state, notifications: [] };
    default: return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, init);
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
