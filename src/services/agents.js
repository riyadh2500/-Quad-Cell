import { RialoAdapter } from './adapter.js';
import { MOCK_AGENTS } from './mock/agents.js';

export class AgentService extends RialoAdapter {
  constructor() {
    super();
    this._agents = MOCK_AGENTS.map(a=>({...a}));
  }
  async getAgents() { await this._delay(80); return [...this._agents]; }
  async getAgent(id) { await this._delay(50); return this._agents.find(a=>a.id===id)||null; }
  async toggleAgent(id) {
    await this._delay(150);
    this._agents = this._agents.map(a=>a.id===id?{...a,status:a.status==='active'?'paused':'active'}:a);
    return this._agents.find(a=>a.id===id);
  }
  async createAgent(params) {
    await this._delay(300);
    const agent = { id:`a${Date.now()}`, ...params, status:'active', lastAction:'Agent created', lastActionTime:Date.now(), wallet:`0x${Math.random().toString(16).slice(2,12)}...`, spendingLimit:params.spendingLimit||500, spent30d:0, triggers:params.triggers||[], actions:[] };
    this._agents.push(agent);
    return agent;
  }
}

export const agentService = new AgentService();
