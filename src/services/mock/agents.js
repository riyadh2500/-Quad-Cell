export const MOCK_AGENTS = [
  {
    id: 'a1', name: 'DCA Bot Alpha', status: 'active',
    description: 'Dollar-cost averages into BTC weekly. Buys $50 USDC worth every Monday at 9am UTC.',
    lastAction: 'Purchased 0.000513 BTC for $50 USDC', lastActionTime: Date.now()-86400000,
    wallet: '0x1234...5678', spendingLimit: 1000, spent30d: 200,
    triggers: [{ type: 'schedule', value: 'Every Monday 09:00 UTC' }],
    actions: Array.from({length:8},(_,i)=>({ id:`act${i}`, description:`Purchased ${(Math.random()*0.001).toFixed(6)} BTC`, time: Date.now()-(i+1)*86400000*7, status:'success' }))
  },
  {
    id: 'a2', name: 'Yield Optimizer', status: 'active',
    description: 'Monitors yield rates across protocols and moves funds to highest APY automatically.',
    lastAction: 'Moved 500 USDC to Rialo Yield Pool (12.4% APY)', lastActionTime: Date.now()-3600000*2,
    wallet: '0x2345...6789', spendingLimit: 5000, spent30d: 1200,
    triggers: [{ type: 'condition', value: 'APY differential > 2%' }],
    actions: Array.from({length:5},(_,i)=>({ id:`act${i}`, description:`Rebalanced yield position`, time: Date.now()-(i+1)*86400000*3, status:'success' }))
  },
  {
    id: 'a3', name: 'Liquidation Guard', status: 'paused',
    description: 'Monitors open perp positions and adds collateral automatically if liquidation risk > 80%.',
    lastAction: 'Added 200 USDC collateral to BTC long position', lastActionTime: Date.now()-86400000*5,
    wallet: '0x3456...7890', spendingLimit: 2000, spent30d: 0,
    triggers: [{ type: 'condition', value: 'Liquidation risk > 80%' }],
    actions: []
  },
  {
    id: 'a4', name: 'News Sentiment Trader', status: 'active',
    description: 'Analyzes on-chain news feeds and executes small trades based on sentiment signals.',
    lastAction: 'Long 0.01 ETH on positive sentiment spike', lastActionTime: Date.now()-3600000,
    wallet: '0x4567...8901', spendingLimit: 500, spent30d: 180,
    triggers: [{ type: 'event', value: 'Sentiment score > 0.75' }],
    actions: Array.from({length:12},(_,i)=>({ id:`act${i}`, description:`Executed sentiment trade`, time: Date.now()-(i+1)*3600000*6, status: i===3?'failed':'success' }))
  },
]
