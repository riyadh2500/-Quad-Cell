import { RialoAdapter } from './adapter.js';
import { MOCK_TX_HISTORY, MOCK_SCHEDULED } from './mock/payments.js';

const RESPONSES = {
  send: (amt,tok,to) => ({ type:'send', amount:parseFloat(amt), token:tok||'USDC', to, route:'Rialo Interop', fee:0, eta:50, compliance:'passed' }),
  swap: (from,to,amt) => ({ type:'swap', from:from||'ETH', to:to||'USDC', amount:parseFloat(amt)||100, route:'Rialo Interop', fee:0, eta:80, compliance:'passed' }),
  schedule: (freq,amt,tok,to) => ({ type:'schedule', frequency:freq||'weekly', amount:parseFloat(amt)||50, token:tok||'USDC', to, route:'Rialo Interop', fee:0, compliance:'passed' }),
};

function parseNL(text) {
  const t = text.toLowerCase();
  const amtM = t.match(/(\d+(?:\.\d+)?)/);
  const toM = t.match(/to\s+([\w.]+)/);
  const tokM = t.match(/\b(usdc|eth|btc|sol|usdt)\b/i);
  const to = toM?.[1]||'unknown.eth';
  const amt = amtM?.[1]||'100';
  const tok = tokM?.[1]?.toUpperCase()||'USDC';
  if (t.includes('swap')) return RESPONSES.swap(tok,tok==='USDC'?'ETH':'USDC',amt);
  if (t.includes('schedule')||t.includes('weekly')||t.includes('monthly')||t.includes('daily')) {
    const freq = t.includes('daily')?'daily':t.includes('monthly')?'monthly':'weekly';
    return RESPONSES.schedule(freq,amt,tok,to);
  }
  return RESPONSES.send(amt,tok,to);
}

export class AIPaymentService extends RialoAdapter {
  constructor() {
    super();
    this._history = [...MOCK_TX_HISTORY];
    this._scheduled = [...MOCK_SCHEDULED];
  }
  async parseCommand(text) {
    await this._delay(400);
    return parseNL(text);
  }
  async previewTransaction(parsed) {
    await this._delay(150);
    return { ...parsed, estimatedGas: 0, rialoRoute: true, ipcVerified: true };
  }
  async executeTransaction(preview) {
    const steps = [
      { id:1, label:'Parsing command', duration: 12 },
      { id:2, label:'Routing via Rialo Interop', duration: 23 },
      { id:3, label:'Compliance check (Rialo IPC)', duration: 8 },
      { id:4, label:'Executing on-chain', duration: 45 },
      { id:5, label:'Confirmation', duration: 3 },
    ];
    const tx = { id:`tx${Date.now()}`, ...preview, status:'confirmed', time:Date.now(), hash:`0x${Math.random().toString(16).slice(2,18)}`, steps };
    if (preview.type === 'schedule') {
      this._scheduled.push({ id:`s${Date.now()}`, to:preview.to, amount:preview.amount, token:preview.token, frequency:preview.frequency, nextRun:Date.now()+86400000*7, status:'active' });
    } else {
      this._history.unshift(tx);
    }
    return { success:true, steps, tx };
  }
  async getHistory() { await this._delay(60); return [...this._history]; }
  async getScheduled() { await this._delay(60); return [...this._scheduled]; }
  async cancelScheduled(id) {
    await this._delay(120);
    this._scheduled = this._scheduled.filter(s=>s.id!==id);
    return { success:true };
  }
}

export const aiPaymentService = new AIPaymentService();
