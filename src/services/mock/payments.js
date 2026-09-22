export const MOCK_TX_HISTORY = [
  { id: 'tx1', to: 'alice.eth', amount: 500, token: 'USDC', status: 'confirmed', route: 'Rialo Interop', fee: 0, time: Date.now()-300000, hash: '0xabc...123' },
  { id: 'tx2', to: 'bob.eth', amount: 1200, token: 'USDC', status: 'confirmed', route: 'Rialo Interop', fee: 0, time: Date.now()-900000, hash: '0xdef...456' },
  { id: 'tx3', to: 'vault.eth', amount: 0.05, token: 'ETH', status: 'confirmed', route: 'Rialo Interop', fee: 0, time: Date.now()-3600000, hash: '0xghi...789' },
  { id: 'tx4', to: 'dao.eth', amount: 250, token: 'USDC', status: 'pending', route: 'Rialo Interop', fee: 0, time: Date.now()-60000, hash: '0xjkl...012' },
  { id: 'tx5', to: 'carol.eth', amount: 75, token: 'USDC', status: 'failed', route: 'Rialo Interop', fee: 0, time: Date.now()-7200000, hash: '0xmno...345', error: 'Insufficient balance' },
]

export const MOCK_SCHEDULED = [
  { id: 's1', to: 'bob.eth', amount: 50, token: 'USDC', frequency: 'weekly', nextRun: Date.now()+86400000*3, status: 'active' },
  { id: 's2', to: 'savings.eth', amount: 100, token: 'USDC', frequency: 'monthly', nextRun: Date.now()+86400000*10, status: 'active' },
]
