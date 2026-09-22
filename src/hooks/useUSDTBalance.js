// Hook: live USDT balance on Sepolia
import { useState, useEffect, useCallback } from 'react';
import { getUSDTBalance, USDT_SEPOLIA } from './useToken.js';
import { useWallet } from './useWallet.js';

export function useUSDTBalance() {
  const { address, chainId, isConnected } = useWallet();
  const [balance,    setBalance]    = useState(null);
  const [loading,    setLoading]    = useState(false);
  const onSepolia = chainId === USDT_SEPOLIA.chainId;

  const refresh = useCallback(async () => {
    if (!address || !isConnected) { setBalance(null); return; }
    setLoading(true);
    const bal = await getUSDTBalance(address);
    setBalance(bal);
    setLoading(false);
  }, [address, isConnected]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 10000); // refresh every 10s
    return () => clearInterval(t);
  }, [refresh]);

  return { balance, loading, onSepolia, refresh };
}
