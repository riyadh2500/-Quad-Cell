import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { rtm } from '../services/realtime.js';

const DataContext = createContext(null);

const INFRA_PRIMITIVES = ['executionEngine','interop','ipc','stream','edge','workflow','cruise','vm','readPath','omniAccount'];
const makeInfraStatus  = () => Object.fromEntries(INFRA_PRIMITIVES.map(k => [k, 'ok']));

const ACTIVITY_TEMPLATES = [
  () => ({ type:'dex',     icon:'📈', text:`Long ${(Math.random()*0.5+0.01).toFixed(3)} BTC opened`,  amount:`$${(Math.random()*5000+500).toFixed(0)}`,  status:'confirmed' }),
  () => ({ type:'market',  icon:'🎯', text:`YES bet on prediction market`,                            amount:`$${(Math.random()*1000+50).toFixed(0)}`,   status:'confirmed' }),
  () => ({ type:'payment', icon:'💸', text:`AI payment to ${['alice','bob','vault','dao'][Math.floor(Math.random()*4)]}.eth`, amount:`$${(Math.random()*500+10).toFixed(0)}`, status:'confirmed' }),
  () => ({ type:'dex',     icon:'📉', text:`Short ${(Math.random()*2+0.1).toFixed(2)} ETH closed`,    amount:`$${(Math.random()*3000+200).toFixed(0)}`,  status:'confirmed' }),
  () => ({ type:'agent',   icon:'🤖', text:`AI agent executed DCA trade`,                             amount:`$50`,                                      status:'confirmed' }),
];

const makeActivity = () => {
  const tpl = ACTIVITY_TEMPLATES[Math.floor(Math.random() * ACTIVITY_TEMPLATES.length)];
  return { id: `act${Date.now()}-${Math.random()}`, ...tpl(), time: Date.now() };
};

export function DataProvider({ children }) {
  const [prices,      setPrices]      = useState({ BTC: 0, ETH: 0, SOL: 0 });
  const [globalStats, setGlobalStats] = useState({ totalVolume24h: 0, btcDominance: 0, totalMarketCap: 0 });
  const [blockTime,   setBlockTime]   = useState(50);
  const [wsStatus,    setWsStatus]    = useState('connecting');
  const [infraStatus]                 = useState(makeInfraStatus);
  const [activity,    setActivity]    = useState(() => Array.from({ length: 8 }, makeActivity));

  useEffect(() => {
    // ── Listen to live Binance price ticks ──
    const unsubPrice = rtm.on('price', ({ sym, price }) => {
      if (['BTC','ETH','SOL'].includes(sym)) {
        setPrices(prev => ({ ...prev, [sym]: price }));
      }
    });

    const unsubStatus = rtm.on('status', (s) => setWsStatus(s));

    // ── Seed prices from REST immediately ──
    const seedPrices = () => {
      const live = rtm.getAllPrices();
      const hasPrices = Object.values(live).some(v => v > 0);
      if (hasPrices) setPrices({ BTC: live.BTC||0, ETH: live.ETH||0, SOL: live.SOL||0 });
    };
    const seedTimer = setInterval(seedPrices, 1000);

    // ── CoinGecko global stats every 60s ──
    const fetchGlobal = () => rtm.getGlobalStats().then(setGlobalStats);
    fetchGlobal();
    const globalTimer = setInterval(fetchGlobal, 60000);

    // ── Block time jitter (Rialo sim) ──
    const blockTimer = setInterval(() => setBlockTime(48 + Math.random() * 5), 2000);

    // ── Activity feed ──
    const activityTimer = setInterval(() => {
      setActivity(prev => [makeActivity(), ...prev].slice(0, 30));
    }, 4000);

    return () => {
      unsubPrice(); unsubStatus();
      clearInterval(seedTimer); clearInterval(globalTimer);
      clearInterval(blockTimer); clearInterval(activityTimer);
    };
  }, []);

  const stats = {
    totalVolume24h: globalStats.totalVolume24h || 2_400_000_000,
    openPositions:  1284,
    activeMarkets:  12,
    aiPayments24h:  8420,
    btcDominance:   globalStats.btcDominance,
    totalMarketCap: globalStats.totalMarketCap,
  };

  return (
    <DataContext.Provider value={{ prices, blockTime, gasPrice: 0, infraStatus, activity, stats, wsStatus }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
