import { RialoAdapter } from './adapter.js';
import { MOCK_MARKETS, MOCK_USER_POSITIONS } from './mock/markets.js';

export class PredictionMarketService extends RialoAdapter {
  constructor() {
    super();
    this._markets = MOCK_MARKETS.map(m => ({ ...m, yesProb: m.yesProb }));
    this._positions = [...MOCK_USER_POSITIONS];
    // Slowly drift probabilities
    setInterval(() => {
      this._markets = this._markets.map(m => ({
        ...m,
        yesProb: Math.max(0.01, Math.min(0.99, m.yesProb + (Math.random()-0.5)*0.002))
      }));
    }, 3000);
  }
  async getMarkets() {
    await this._delay(120);
    return [...this._markets];
  }
  async getMarket(id) {
    await this._delay(80);
    return this._markets.find(m => m.id === id) || null;
  }
  async placeBet(marketId, side, amount) {
    await this._delay(220);
    const m = this._markets.find(m => m.id === marketId);
    if (!m) throw new Error('Market not found');
    const price = side === 'YES' ? m.yesProb : (1 - m.yesProb);
    const shares = amount / price;
    const pos = { id: `p${Date.now()}`, marketId, market: m.question, side, amount, shares, avgPrice: price, currentProb: m.yesProb, pnl: 0 };
    this._positions.push(pos);
    return { success: true, txHash: `0x${Math.random().toString(16).slice(2,18)}`, position: pos };
  }
  async getUserPositions() {
    await this._delay(80);
    return this._positions.map(p => {
      const m = this._markets.find(m => m.id === p.marketId);
      const currentProb = m ? m.yesProb : p.avgPrice;
      const currentVal = p.side === 'YES' ? p.shares * currentProb : p.shares * (1-currentProb);
      return { ...p, currentProb, pnl: currentVal - p.amount };
    });
  }
  async claimPayout(marketId) {
    await this._delay(300);
    this._positions = this._positions.filter(p => p.marketId !== marketId);
    return { success: true, amount: Math.random() * 500 + 100 };
  }
}

export const predictionMarketService = new PredictionMarketService();
