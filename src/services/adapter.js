export class RialoAdapter {
  constructor() {
    this.useMock = import.meta.env.VITE_USE_REAL_API !== 'true';
  }
  async _fetch(url, opts = {}) {
    const res = await fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', ...opts.headers } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
  _delay(ms) { return new Promise(r => setTimeout(r, ms)); }
}
