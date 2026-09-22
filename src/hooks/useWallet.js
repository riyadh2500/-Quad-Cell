// Real wallet connection — MetaMask / EIP-1193
import { useState, useEffect, useCallback, useRef } from 'react';

const CHAINS = {
  '0x1':    { name: 'Ethereum',     symbol: 'ETH',  explorer: 'https://etherscan.io' },
  '0x38':   { name: 'BNB Chain',    symbol: 'BNB',  explorer: 'https://bscscan.com' },
  '0x89':   { name: 'Polygon',      symbol: 'MATIC',explorer: 'https://polygonscan.com' },
  '0xa4b1': { name: 'Arbitrum',     symbol: 'ETH',  explorer: 'https://arbiscan.io' },
  '0xa':    { name: 'Optimism',     symbol: 'ETH',  explorer: 'https://optimistic.etherscan.io' },
  '0x2105': { name: 'Base',         symbol: 'ETH',  explorer: 'https://basescan.org' },
};

function shortAddr(addr) {
  if (!addr) return '';
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

// Get the best available EIP-1193 provider
function getEthProvider() {
  if (typeof window === 'undefined' || !window.ethereum) return null;
  // Multiple wallets injected — prefer MetaMask
  if (window.ethereum.providers?.length) {
    return (
      window.ethereum.providers.find(p => p.isMetaMask) ||
      window.ethereum.providers[0]
    );
  }
  return window.ethereum;
}

export function useWallet() {
  const [address,  setAddress]  = useState(null);
  const [chainId,  setChainId]  = useState(null);
  const [balance,  setBalance]  = useState(null);
  const [status,   setStatus]   = useState('idle'); // idle | connecting | connected | error
  const [error,    setError]    = useState(null);

  // Keep a stable ref to the current address for use inside event listeners
  const addressRef = useRef(address);
  addressRef.current = address;

  // ── Fetch native balance ──────────────────────────────────────────────────
  const fetchBalance = useCallback(async (addr) => {
    const prov = getEthProvider();
    if (!addr || !prov) return;
    try {
      const raw = await prov.request({
        method: 'eth_getBalance',
        params: [addr, 'latest'],
      });
      setBalance(parseFloat(parseInt(raw, 16) / 1e18).toFixed(4));
    } catch {
      setBalance(null);
    }
  }, []);

  // ── Bootstrap on mount — restore previous session ────────────────────────
  useEffect(() => {
    const prov = getEthProvider();
    if (!prov) return;

    // Silently check already-approved accounts (no popup)
    prov.request({ method: 'eth_accounts' })
      .then(accounts => {
        if (accounts.length) {
          setAddress(accounts[0]);
          setStatus('connected');
          fetchBalance(accounts[0]);
        }
      })
      .catch(() => {});

    prov.request({ method: 'eth_chainId' })
      .then(id => setChainId(id))
      .catch(() => {});

    // ── Event listeners ───────────────────────────────────────────────────
    const onAccountsChanged = (accounts) => {
      if (!accounts.length) {
        setAddress(null); setBalance(null); setStatus('idle');
      } else {
        setAddress(accounts[0]); setStatus('connected');
        fetchBalance(accounts[0]);
      }
    };

    const onChainChanged = (id) => {
      setChainId(id);
      // Re-fetch balance on chain switch
      if (addressRef.current) fetchBalance(addressRef.current);
    };

    const onDisconnect = () => {
      setAddress(null); setBalance(null);
      setChainId(null); setStatus('idle');
    };

    prov.on('accountsChanged', onAccountsChanged);
    prov.on('chainChanged',    onChainChanged);
    prov.on('disconnect',      onDisconnect);

    return () => {
      prov.removeListener('accountsChanged', onAccountsChanged);
      prov.removeListener('chainChanged',    onChainChanged);
      prov.removeListener('disconnect',      onDisconnect);
    };
  }, [fetchBalance]);

  // ── Connect ───────────────────────────────────────────────────────────────
  const connect = useCallback(async () => {
    const prov = getEthProvider();

    if (!prov) {
      setError('no_wallet');
      setStatus('error');
      return;
    }

    setError(null);
    setStatus('connecting');

    try {
      // eth_requestAccounts triggers the MetaMask popup
      const accounts = await prov.request({ method: 'eth_requestAccounts' });
      const id       = await prov.request({ method: 'eth_chainId' });

      setAddress(accounts[0]);
      setChainId(id);
      setStatus('connected');
      fetchBalance(accounts[0]);
    } catch (e) {
      setStatus('error');
      if (e.code === 4001) setError('rejected');   // user denied
      else if (e.code === -32002) setError('pending'); // request already pending
      else setError('failed');
    }
  }, [fetchBalance]);

  // ── Disconnect ────────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    setAddress(null);
    setBalance(null);
    setChainId(null);
    setStatus('idle');
    setError(null);
  }, []);

  // ── Switch network ────────────────────────────────────────────────────────
  const switchChain = useCallback(async (chainHex) => {
    const prov = getEthProvider();
    if (!prov) return;
    try {
      await prov.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainHex }],
      });
    } catch (e) {
      // Error 4902 = chain not added yet
      if (e.code === 4902) {
        console.warn('Chain not added to wallet:', chainHex);
      }
    }
  }, []);

  return {
    address,
    shortAddress: shortAddr(address),
    chainId,
    chainInfo: CHAINS[chainId] || { name: 'Unknown', symbol: '?', explorer: 'https://etherscan.io' },
    balance,
    status,
    error,
    hasWallet: !!getEthProvider(),
    isConnected:  status === 'connected',
    isConnecting: status === 'connecting',
    connect,
    disconnect,
    switchChain,
  };
}
