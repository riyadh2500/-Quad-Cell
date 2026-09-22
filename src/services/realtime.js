// ─────────────────────────────────────────────────────
// RealTimeManager — Binance WebSocket + REST feeds
// No API key required. CORS-friendly via browser fetch.
// ─────────────────────────────────────────────────────

const BINANCE_WS   = 'wss://stream.binance.com:9443/stream';
const BINANCE_REST = 'https://api.binance.com/api/v3';
const COINGECKO    = 'https://api.coingecko.com/api/v3';

// Map our internal symbols to Binance symbols
const SYMBOL_MAP = {
  'BTC/USDC': 'BTCUSDT',
  'ETH/USDC': 'ETHUSDT',
  'SOL/USDC': 'SOLUSDT',
  'ARB/USDC': 'ARBUSDT',
  'LINK/USDC': 'LINKUSDT',
};

const COINGECKO_IDS = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  ARB: 'arbitrum',
  LINK: 'chainlink',
};

class RealTimeManager {
  constructor() {
    this._prices     = { BTC: 0, ETH: 0, SOL: 0, ARB: 0, LINK: 0 };
    this._change24h  = { BTC: 0, ETH: 0, SOL: 0, ARB: 0, LINK: 0 };
    this._volume24h  = { BTC: 0, ETH: 0, SOL: 0, ARB: 0, LINK: 0 };
    this._orderBooks = {};
    this._trades     = {};
    this._listeners  = {};
    this._ws         = null;
    this._wsReady    = false;
    this._init();
  }

  // ── Subscribe to combined streams ──
  _init() {
    const streams = [
      'btcusdt@ticker', 'ethusdt@ticker', 'solusdt@ticker',
      'arbusdt@ticker', 'linkusdt@ticker',
      'btcusdt@depth20@100ms',
      'ethusdt@trade',
      'btcusdt@trade',
      'solusdt@trade',
    ].join('/');

    const connect = () => {
      this._ws = new WebSocket(`${BINANCE_WS}?streams=${streams}`);

      this._ws.onopen  = () => { this._wsReady = true; this._emit('status', 'connected'); };
      this._ws.onclose = () => { this._wsReady = false; setTimeout(connect, 3000); };
      this._ws.onerror = () => { this._ws.close(); };

      this._ws.onmessage = (e) => {
        try {
          const { stream, data } = JSON.parse(e.data);
          if (!stream || !data) return;

          // Ticker → price + 24h change + volume
          if (stream.endsWith('@ticker')) {
            const sym = this._binanceToBase(stream.replace('@ticker', ''));
            if (sym) {
              this._prices[sym]    = parseFloat(data.c);
              this._change24h[sym] = parseFloat(data.P);
              this._volume24h[sym] = parseFloat(data.q); // quote volume in USDT
              this._emit('price', { sym, price: this._prices[sym], change24h: this._change24h[sym] });
            }
          }

          // Depth → order book
          if (stream.endsWith('@depth20@100ms')) {
            const sym = this._binanceToBase(stream.replace('@depth20@100ms', ''));
            if (sym) {
              this._orderBooks[sym] = {
                asks: data.asks.slice(0,15).map(([p,s]) => ({ price: parseFloat(p), size: parseFloat(s) })),
                bids: data.bids.slice(0,15).map(([p,s]) => ({ price: parseFloat(p), size: parseFloat(s) })),
                mid:  (parseFloat(data.asks[0]?.[0] || 0) + parseFloat(data.bids[0]?.[0] || 0)) / 2,
              };
              this._emit('orderbook', { sym, book: this._orderBooks[sym] });
            }
          }

          // Trade stream
          if (stream.endsWith('@trade')) {
            const sym = this._binanceToBase(stream.replace('@trade', ''));
            if (sym) {
              if (!this._trades[sym]) this._trades[sym] = [];
              this._trades[sym].unshift({
                id:    String(data.t),
                price: parseFloat(data.p),
                size:  parseFloat(data.q),
                side:  data.m ? 'sell' : 'buy',
                time:  data.T,
              });
              this._trades[sym] = this._trades[sym].slice(0, 50);
              this._emit('trade', { sym, trade: this._trades[sym][0] });
            }
          }
        } catch {}
      };
    };

    connect();
    // Also seed prices via REST immediately
    this._fetchTickerRest();
    setInterval(() => this._fetchTickerRest(), 30000);
  }

  async _fetchTickerRest() {
    try {
      const syms = ['BTCUSDT','ETHUSDT','SOLUSDT','ARBUSDT','LINKUSDT'];
      const res  = await fetch(`${BINANCE_REST}/ticker/24hr?symbols=${JSON.stringify(syms)}`);
      const data = await res.json();
      data.forEach(t => {
        const sym = this._binanceToBase(t.symbol.replace('USDT','').toLowerCase() + 'usdt');
        if (sym) {
          this._prices[sym]    = parseFloat(t.lastPrice);
          this._change24h[sym] = parseFloat(t.priceChangePercent);
          this._volume24h[sym] = parseFloat(t.quoteVolume);
        }
      });
      this._emit('prices', this._prices);
    } catch {}
  }

  _binanceToBase(streamSym) {
    const map = { btcusdt:'BTC', ethusdt:'ETH', solusdt:'SOL', arbusdt:'ARB', linkusdt:'LINK' };
    return map[streamSym] || null;
  }

  // ── Candles from Binance REST ──
  async getCandles(pair, tf = '1h', limit = 200) {
    const sym  = SYMBOL_MAP[pair] || 'BTCUSDT';
    const ivMap = { '1m':'1m','5m':'5m','15m':'15m','1h':'1h','4h':'4h','1d':'1d' };
    const iv   = ivMap[tf] || '1h';
    try {
      const res  = await fetch(`${BINANCE_REST}/klines?symbol=${sym}&interval=${iv}&limit=${limit}`);
      const data = await res.json();
      return data.map(k => ({
        time:   Math.floor(k[0] / 1000),
        open:   parseFloat(k[1]),
        high:   parseFloat(k[2]),
        low:    parseFloat(k[3]),
        close:  parseFloat(k[4]),
        volume: parseFloat(k[5]),
      }));
    } catch {
      return [];
    }
  }

  // ── CoinGecko — global market stats ──
  async getGlobalStats() {
    try {
      const res  = await fetch(`${COINGECKO}/global`);
      const json = await res.json();
      const d    = json.data;
      return {
        totalMarketCap:     d.total_market_cap?.usd || 0,
        totalVolume24h:     d.total_volume?.usd || 0,
        btcDominance:       d.market_cap_percentage?.btc || 0,
        activeCryptos:      d.active_cryptocurrencies || 0,
        marketCapChange24h: d.market_cap_change_percentage_24h_usd || 0,
      };
    } catch {
      return { totalMarketCap: 0, totalVolume24h: 0, btcDominance: 0, activeCryptos: 0, marketCapChange24h: 0 };
    }
  }

  // ── CoinGecko — coin detail ──
  async getCoinDetails(ids = ['bitcoin','ethereum','solana']) {
    try {
      const res  = await fetch(`${COINGECKO}/coins/markets?vs_currency=usd&ids=${ids.join(',')}&order=market_cap_desc&sparkline=false&price_change_percentage=1h,24h,7d`);
      return await res.json();
    } catch {
      return [];
    }
  }

  // ── Event emitter ──
  on(event, cb)  { if (!this._listeners[event]) this._listeners[event] = []; this._listeners[event].push(cb); return () => this.off(event, cb); }
  off(event, cb) { if (this._listeners[event]) this._listeners[event] = this._listeners[event].filter(f => f !== cb); }
  _emit(event, data) { (this._listeners[event] || []).forEach(cb => { try { cb(data); } catch {} }); }

  // ── Getters ──
  getPrice(sym)      { return this._prices[sym] || 0; }
  getAllPrices()     { return { ...this._prices }; }
  getOrderBook(sym)  { return this._orderBooks[sym] || null; }
  getTrades(sym)     { return this._trades[sym] || []; }
  getChange24h(sym)  { return this._change24h[sym] || 0; }
  getVolume24h(sym)  { return this._volume24h[sym] || 0; }
  isReady()          { return this._wsReady; }
}

// Singleton
export const rtm = new RealTimeManager();
