const BASE_PRICES = { 'BTC/USDC': 97420, 'ETH/USDC': 3248, 'SOL/USDC': 182.4, 'ARB/USDC': 1.24, 'LINK/USDC': 18.7 }

export function generateCandles(pair, tf, count = 200) {
  const tfMs = { '1m':60000,'5m':300000,'15m':900000,'1h':3600000,'4h':14400000,'1d':86400000 }
  const ms = tfMs[tf] || 3600000
  const base = BASE_PRICES[pair] || 100
  let price = base * (0.85 + Math.random() * 0.3)
  const now = Math.floor(Date.now() / ms) * ms
  return Array.from({ length: count }, (_, i) => {
    const time = Math.floor((now - (count - i) * ms) / 1000)
    const open = price
    const change = price * (Math.random() - 0.5) * 0.02
    price = Math.max(price + change, price * 0.5)
    const high = Math.max(open, price) * (1 + Math.random() * 0.005)
    const low = Math.min(open, price) * (1 - Math.random() * 0.005)
    const volume = Math.random() * 500 + 50
    return { time, open, high, low, close: price, volume }
  })
}

export function generateOrderBook(pair) {
  const mid = BASE_PRICES[pair] || 100
  const asks = Array.from({ length: 12 }, (_, i) => ({
    price: mid * (1 + (i + 1) * 0.0002),
    size: Math.random() * 2 + 0.1
  }))
  const bids = Array.from({ length: 12 }, (_, i) => ({
    price: mid * (1 - (i + 1) * 0.0002),
    size: Math.random() * 2 + 0.1
  }))
  return { asks, bids, spread: mid * 0.0002 }
}

export function generateTrades(pair, count = 20) {
  const mid = BASE_PRICES[pair] || 100
  return Array.from({ length: count }, (_, i) => ({
    id: `t${Date.now()}-${i}`,
    price: mid * (1 + (Math.random() - 0.5) * 0.001),
    size: Math.random() * 1.5 + 0.01,
    side: Math.random() > 0.5 ? 'buy' : 'sell',
    time: Date.now() - i * 3000
  }))
}

export const MOCK_PAIRS = [
  { symbol: 'BTC/USDC', base: 'BTC', quote: 'USDC', price: 97420, change24h: 2.34, volume24h: 1240000000 },
  { symbol: 'ETH/USDC', base: 'ETH', quote: 'USDC', price: 3248,  change24h: 1.87, volume24h: 540000000 },
  { symbol: 'SOL/USDC', base: 'SOL', quote: 'USDC', price: 182.4, change24h: -0.92, volume24h: 120000000 },
  { symbol: 'ARB/USDC', base: 'ARB', quote: 'USDC', price: 1.24,  change24h: 3.41, volume24h: 45000000 },
  { symbol: 'LINK/USDC', base: 'LINK', quote: 'USDC', price: 18.7, change24h: 0.55, volume24h: 32000000 },
]

export const MOCK_POSITIONS = []
