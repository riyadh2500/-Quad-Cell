# Quad Cell

A premium DeFi web application built on Rialo infrastructure.

## Features

- **Prediction Markets** — Trade on real-world outcomes with live probability feeds
- **Perpetual DEX** — Full trading terminal with real-time Binance candlestick charts, live order book, and leverage up to 50×
- **AI Payments** — Natural language payment agent powered by Rialo Edge + IPC
- **AI Agents** — Autonomous on-chain agents with the Rialo Agentic Edge Harness
- **Infrastructure Demos** — Reactive Transactions, Rialo Stream, Edge, IPC, Workflow

## Live Data

- **Binance WebSocket** — Real-time prices, order book depth, trade tape
- **Binance REST** — OHLCV candlestick data for all pairs and timeframes
- **CoinGecko** — Global market stats, 24h volume, BTC dominance

## Tech Stack

- React 18 + Vite 5
- React Router v6 (HashRouter)
- lightweight-charts v4 (TradingView)
- Binance WebSocket API (no key required)
- CoinGecko API (no key required)

## Run Locally

```bash
npm install
npm run dev
```

Or serve the production build:

```bash
npm run build
node server.js
```

Then open: http://localhost:8080

## Built on Rialo

Quad Cell uses Rialo's blockchain primitives:
- Rialo Execution Engine
- Rialo Interop
- Rialo IPC (Identity, Privacy, Compliance)
- Rialo Stream (Oracle)
- Rialo Edge (Web2 interoperability)
- Rialo Workflow (Automation)
- Rialo Cruise (Zero gas fees)
- Rialo VM (RISC-V)
- Rialo Read Path
- Rialo Omni Account
