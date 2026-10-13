import { RialoAdapter } from './adapter.js';
import { rtm } from './realtime.js';
import { generateCandles } from './mock/dex.js';

// Canonical pair list — key must match what all components use
export const PAIRS = [
  { symbol: 'BTC/USDT',  base: 'BTC',  quote: 'USDT', fallback: 97420  },
  { symbol: 'ETH/USDT',  base: 'ETH',  quote: 'USDT', fallback: 3248   },
  { symbol: 'SOL/USDT',  base: 'SOL',  quote: 'USDT', fallback: 182.4  },
  { symbol: 'ARB/USDT',  base: 'ARB',  quote: 'USDT', fallback: 1.24   },
  { symbol: 'LINK/USDT', base: 'LINK', quote: 'USDT', fallback: 18.7   },
];

// Map pair symbol → rtm base symbol
const SYM_BASE = Object.fromEntries(PAIRS.map(p => [p.symbol, p.base]));
// Map pair symbol → fallback price
const FALLBACK  = Object.fromEntries(PAIRS.map(p => [p.symbol, p.fallback]));

export class PerpDexService extends RialoAdapter {
  constructor() {
    super();
    this._positions   = [];
    this._orderHistory = [];
  }

  // ── Live price ─────────────────────────────────────────────────────────────
  getPrice(pair) {
    const base = SYM_BASE[pair];
    if (!base) return FALLBACK[pair] || 100;
    const live = rtm.getPrice(base);
    return live > 0 ? live : (FALLBACK[pair] || 100);
  }

  // ── Pairs list with live data ─────────────────────────────────────────────
  async getPairs() {
    return PAIRS.map(p => ({
      ...p,
      price:     this.getPrice(p.symbol),
      change24h: rtm.getChange24h(p.base) || 0,
      volume24h: rtm.getVolume24h(p.base) || 0,
    }));
  }

  // ── Candles — real from Binance, mock fallback ────────────────────────────
  async getCandles(pair, tf = '1h', count = 200) {
    try {
      const candles = await rtm.getCandles(pair, tf, count);
      if (candles && candles.length > 0) return candles;
    } catch { /* fall through */ }
    return generateCandles(pair, tf, count);
  }

  // ── Order book — real from Binance WS, mock fallback ──────────────────────
  async getOrderBook(pair) {
    const base = SYM_BASE[pair];
    if (base) {
      const book = rtm.getOrderBook(base);
      if (book && book.asks.length > 0) return book;
    }
    // Fallback: generate from live price
    const mid  = this.getPrice(pair);
    const asks = Array.from({ length: 14 }, (_, i) => ({
      price: mid * (1 + (i + 1) * 0.00014 + Math.random() * 0.00005),
      size:  parseFloat((Math.random() * 2 + 0.05).toFixed(4)),
    })).sort((a, b) => a.price - b.price);
    const bids = Array.from({ length: 14 }, (_, i) => ({
      price: mid * (1 - (i + 1) * 0.00014 - Math.random() * 0.00005),
      size:  parseFloat((Math.random() * 2 + 0.05).toFixed(4)),
    })).sort((a, b) => b.price - a.price);
    return { asks, bids, mid };
  }

  // ── Recent trades — real from Binance WS, mock fallback ───────────────────
  async getTrades(pair, count = 30) {
    const base = SYM_BASE[pair];
    if (base) {
      const trades = rtm.getTrades(base);
      if (trades && trades.length > 0) return trades.slice(0, count);
    }
    const mid = this.getPrice(pair);
    return Array.from({ length: count }, (_, i) => ({
      id:    `t${Date.now()}-${i}`,
      price: mid * (1 + (Math.random() - 0.5) * 0.0006),
      size:  parseFloat((Math.random() * 1.5 + 0.001).toFixed(4)),
      side:  Math.random() > 0.5 ? 'buy' : 'sell',
      time:  Date.now() - i * 1800,
    }));
  }

  // ── Open position ─────────────────────────────────────────────────────────
  async openPosition({ pair, side, collateral, leverage, orderType, txHash }) {
    await this._delay(180);
    const entryPrice = this.getPrice(pair);
    const size       = (collateral * leverage) / entryPrice;
    const liqMult    = side === 'long' ? (1 - 0.8 / leverage) : (1 + 0.8 / leverage);
    const pos = {
      id:           `pos${Date.now()}`,
      pair, side, collateral, leverage, size,
      entryPrice, markPrice: entryPrice,
      liqPrice:     entryPrice * liqMult,
      unrealizedPnl: 0,
      orderType:    orderType || 'market',
      openedAt:     Date.now(),
      txHash:       txHash || `0x${Math.random().toString(16).slice(2, 18)}`,
    };
    this._positions.push(pos);
    return { success: true, txHash: pos.txHash, position: pos };
  }

  // ── Close position ────────────────────────────────────────────────────────
  async closePosition(id) {
    await this._delay(160);
    const pos = this._positions.find(p => p.id === id);
    if (!pos) throw new Error('Position not found');
    const closePrice = this.getPrice(pos.pair);
    const pnl = pos.side === 'long'
      ? (closePrice - pos.entryPrice) * pos.size
      : (pos.entryPrice - closePrice) * pos.size;
    this._positions = this._positions.filter(p => p.id !== id);
    const record = { ...pos, closePrice, pnl, closedAt: Date.now() };
    this._orderHistory.unshift(record);
    return { success: true, pnl, closePrice, txHash: `0x${Math.random().toString(16).slice(2, 18)}` };
  }

  // ── Live positions with updated mark price ────────────────────────────────
  async getUserPositions() {
    return this._positions.map(p => {
      const mark = this.getPrice(p.pair);
      const pnl  = p.side === 'long'
        ? (mark - p.entryPrice) * p.size
        : (p.entryPrice - mark) * p.size;
      const pnlPct = ((pnl / p.collateral) * 100);
      return { ...p, markPrice: mark, unrealizedPnl: pnl, pnlPct };
    });
  }

  // ── Order history ─────────────────────────────────────────────────────────
  async getOrderHistory() {
    return [...this._orderHistory];
  }
}

export const perpDexService = new PerpDexService();
