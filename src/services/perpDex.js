import { RialoAdapter } from './adapter.js';
import { rtm } from './realtime.js';
import { generateCandles } from './mock/dex.js';

const SYM_BASE = { 'BTC/USDC':'BTC', 'ETH/USDC':'ETH', 'SOL/USDC':'SOL', 'ARB/USDC':'ARB', 'LINK/USDC':'LINK' };

const FALLBACK_PRICES = { 'BTC/USDC': 97420, 'ETH/USDC': 3248, 'SOL/USDC': 182.4, 'ARB/USDC': 1.24, 'LINK/USDC': 18.7 };

export class PerpDexService extends RialoAdapter {
  constructor() {
    super();
    this._positions = [];
  }

  getPrice(pair) {
    const base = SYM_BASE[pair];
    const live = base ? rtm.getPrice(base) : 0;
    return live > 0 ? live : (FALLBACK_PRICES[pair] || 100);
  }

  async getPairs() {
    const pairs = [
      { symbol: 'BTC/USDC',  base: 'BTC',  quote: 'USDC' },
      { symbol: 'ETH/USDC',  base: 'ETH',  quote: 'USDC' },
      { symbol: 'SOL/USDC',  base: 'SOL',  quote: 'USDC' },
      { symbol: 'ARB/USDC',  base: 'ARB',  quote: 'USDC' },
      { symbol: 'LINK/USDC', base: 'LINK', quote: 'USDC' },
    ];
    return pairs.map(p => ({
      ...p,
      price:     this.getPrice(p.symbol),
      change24h: rtm.getChange24h(p.base),
      volume24h: rtm.getVolume24h(p.base),
    }));
  }

  // Real candles from Binance
  async getCandles(pair, tf = '1h', count = 200) {
    const candles = await rtm.getCandles(pair, tf, count);
    if (candles.length > 0) return candles;
    // Fallback to mock if API fails
    return generateCandles(pair, tf, count);
  }

  // Real order book from Binance WebSocket
  async getOrderBook(pair) {
    const base = SYM_BASE[pair];
    const book = base ? rtm.getOrderBook(base) : null;
    if (book && book.asks.length > 0) return book;
    // Fallback: generate from live price
    const mid  = this.getPrice(pair);
    const asks = Array.from({length:12},(_,i)=>({ price: mid*(1+(i+1)*0.00015), size: Math.random()*2+0.05 }));
    const bids = Array.from({length:12},(_,i)=>({ price: mid*(1-(i+1)*0.00015), size: Math.random()*2+0.05 }));
    return { asks, bids, mid };
  }

  // Real trades from Binance WebSocket
  async getTrades(pair, count = 20) {
    const base   = SYM_BASE[pair];
    const trades = base ? rtm.getTrades(base) : [];
    if (trades.length > 0) return trades.slice(0, count);
    const mid = this.getPrice(pair);
    return Array.from({length:count},(_,i)=>({
      id: `t${Date.now()}-${i}`,
      price: mid * (1+(Math.random()-0.5)*0.0008),
      size:  Math.random()*1.5+0.01,
      side:  Math.random()>0.5?'buy':'sell',
      time:  Date.now()-i*2500,
    }));
  }

  async openPosition(params) {
    await this._delay(200);
    const { pair, side, collateral, leverage, orderType } = params;
    const entryPrice = this.getPrice(pair);
    const size       = (collateral * leverage) / entryPrice;
    const liqMult    = side === 'long' ? (1 - 0.8/leverage) : (1 + 0.8/leverage);
    const pos = {
      id: `pos${Date.now()}`, pair, side, collateral, leverage, size,
      entryPrice, markPrice: entryPrice, liqPrice: entryPrice * liqMult,
      unrealizedPnl: 0, orderType: orderType||'market', openedAt: Date.now(),
    };
    this._positions.push(pos);
    return { success: true, txHash: `0x${Math.random().toString(16).slice(2,18)}`, position: pos };
  }

  async closePosition(id) {
    await this._delay(180);
    const pos = this._positions.find(p => p.id === id);
    if (!pos) throw new Error('Position not found');
    const closePrice = this.getPrice(pos.pair);
    const pnl = pos.side==='long' ? (closePrice-pos.entryPrice)*pos.size : (pos.entryPrice-closePrice)*pos.size;
    this._positions = this._positions.filter(p => p.id !== id);
    return { success: true, pnl, closePrice, txHash: `0x${Math.random().toString(16).slice(2,18)}` };
  }

  async getUserPositions() {
    return this._positions.map(p => {
      const mark = this.getPrice(p.pair);
      const pnl  = p.side==='long' ? (mark-p.entryPrice)*p.size : (p.entryPrice-mark)*p.size;
      return { ...p, markPrice: mark, unrealizedPnl: pnl };
    });
  }
}

export const perpDexService = new PerpDexService();
