export const MOCK_MARKETS = [
  {
    id: 'm1', category: 'crypto',
    question: 'Will BTC reach $120,000 before January 2027?',
    yesProb: 0.67, volume: 4200000, participants: 1842,
    endDate: '2027-01-01', created: '2026-08-01',
    description: 'This market resolves YES if BTC/USD price on any major exchange reaches $120,000 before January 1, 2027.',
    resolved: false, outcome: null,
    history: Array.from({length:30},(_,i)=>({ t: Date.now()-((29-i)*86400000), p: 0.55+Math.random()*0.2 }))
  },
  {
    id: 'm2', category: 'crypto',
    question: 'Will ETH flip BTC market cap by Q3 2027?',
    yesProb: 0.29, volume: 1800000, participants: 934,
    endDate: '2027-09-30', created: '2026-07-15',
    description: 'Resolves YES if ETH market cap exceeds BTC market cap before October 1, 2027.',
    resolved: false, outcome: null,
    history: Array.from({length:30},(_,i)=>({ t: Date.now()-((29-i)*86400000), p: 0.22+Math.random()*0.15 }))
  },
  {
    id: 'm3', category: 'technology',
    question: 'Will Rialo mainnet launch hit 1M+ TPS in first month?',
    yesProb: 0.82, volume: 920000, participants: 567,
    endDate: '2027-03-01', created: '2026-09-01',
    description: 'Resolves YES if Rialo mainnet achieves sustained 1M TPS within the first 30 days of launch.',
    resolved: false, outcome: null,
    history: Array.from({length:30},(_,i)=>({ t: Date.now()-((29-i)*86400000), p: 0.72+Math.random()*0.18 }))
  },
  {
    id: 'm4', category: 'crypto',
    question: 'Will SOL price exceed $500 by end of 2026?',
    yesProb: 0.44, volume: 2100000, participants: 1203,
    endDate: '2026-12-31', created: '2026-06-01',
    description: 'Resolves YES if SOL/USD price reaches $500 on any major exchange before December 31, 2026.',
    resolved: false, outcome: null,
    history: Array.from({length:30},(_,i)=>({ t: Date.now()-((29-i)*86400000), p: 0.35+Math.random()*0.2 }))
  },
  {
    id: 'm5', category: 'politics',
    question: 'Will a G7 country adopt a CBDC before 2027?',
    yesProb: 0.61, volume: 3400000, participants: 2156,
    endDate: '2027-01-01', created: '2026-05-10',
    description: 'Resolves YES if any G7 nation officially launches a retail Central Bank Digital Currency before January 2027.',
    resolved: false, outcome: null,
    history: Array.from({length:30},(_,i)=>({ t: Date.now()-((29-i)*86400000), p: 0.5+Math.random()*0.2 }))
  },
  {
    id: 'm6', category: 'sports',
    question: 'Will any NFL team sign a crypto sponsorship >$100M in 2026?',
    yesProb: 0.38, volume: 870000, participants: 445,
    endDate: '2026-12-31', created: '2026-08-20',
    description: 'Resolves YES if any NFL franchise announces a crypto or blockchain company sponsorship deal valued at over $100M USD in calendar year 2026.',
    resolved: false, outcome: null,
    history: Array.from({length:30},(_,i)=>({ t: Date.now()-((29-i)*86400000), p: 0.28+Math.random()*0.18 }))
  },
  {
    id: 'm7', category: 'technology',
    question: 'Will GPT-5 be released publicly before March 2027?',
    yesProb: 0.73, volume: 5600000, participants: 3421,
    endDate: '2027-03-01', created: '2026-07-01',
    description: 'Resolves YES if OpenAI releases GPT-5 to the general public (not just API) before March 1, 2027.',
    resolved: false, outcome: null,
    history: Array.from({length:30},(_,i)=>({ t: Date.now()-((29-i)*86400000), p: 0.6+Math.random()*0.22 }))
  },
  {
    id: 'm8', category: 'crypto',
    question: 'Will total DeFi TVL exceed $500B by Q2 2027?',
    yesProb: 0.55, volume: 2900000, participants: 1678,
    endDate: '2027-06-30', created: '2026-09-05',
    description: 'Resolves YES if the total value locked across all DeFi protocols exceeds $500 billion USD before July 1, 2027.',
    resolved: false, outcome: null,
    history: Array.from({length:30},(_,i)=>({ t: Date.now()-((29-i)*86400000), p: 0.42+Math.random()*0.22 }))
  },
  {
    id: 'm9', category: 'politics',
    question: 'Will the US pass a comprehensive stablecoin bill in 2026?',
    yesProb: 0.48, volume: 4100000, participants: 2890,
    endDate: '2026-12-31', created: '2026-04-01',
    description: 'Resolves YES if the US Congress passes and the President signs a comprehensive federal stablecoin regulatory framework in 2026.',
    resolved: true, outcome: 'pending',
    history: Array.from({length:30},(_,i)=>({ t: Date.now()-((29-i)*86400000), p: 0.38+Math.random()*0.2 }))
  },
  {
    id: 'm10', category: 'technology',
    question: 'Will any L2 achieve 100k TPS sustained in production?',
    yesProb: 0.34, volume: 1200000, participants: 723,
    endDate: '2027-06-01', created: '2026-08-15',
    description: 'Resolves YES if any Ethereum L2 network demonstrates sustained 100,000+ TPS in production (not testnet) for at least 7 days.',
    resolved: false, outcome: null,
    history: Array.from({length:30},(_,i)=>({ t: Date.now()-((29-i)*86400000), p: 0.25+Math.random()*0.18 }))
  },
  {
    id: 'm11', category: 'crypto',
    question: 'Will Bitcoin halving 2028 push BTC above $200k?',
    yesProb: 0.71, volume: 6800000, participants: 4123,
    endDate: '2028-12-31', created: '2026-09-10',
    description: 'Resolves YES if BTC/USD price exceeds $200,000 within 12 months following the 2028 Bitcoin halving event.',
    resolved: false, outcome: null,
    history: Array.from({length:30},(_,i)=>({ t: Date.now()-((29-i)*86400000), p: 0.6+Math.random()*0.2 }))
  },
  {
    id: 'm12', category: 'sports',
    question: 'Will the 2026 FIFA World Cup have an official crypto partner?',
    yesProb: 0.89, volume: 3200000, participants: 2100,
    endDate: '2026-06-01', created: '2026-03-01',
    description: 'Resolves YES if FIFA announces an official global cryptocurrency or blockchain partner for the 2026 FIFA World Cup.',
    resolved: false, outcome: null,
    history: Array.from({length:30},(_,i)=>({ t: Date.now()-((29-i)*86400000), p: 0.80+Math.random()*0.14 }))
  },
]

export const MOCK_USER_POSITIONS = [
  { id: 'p1', marketId: 'm1', market: 'Will BTC reach $120,000?', side: 'YES', amount: 500, shares: 746, avgPrice: 0.67, currentProb: 0.67, pnl: 0 },
  { id: 'p2', marketId: 'm7', market: 'Will GPT-5 be released?', side: 'YES', amount: 200, shares: 274, avgPrice: 0.73, currentProb: 0.73, pnl: 12 },
]
