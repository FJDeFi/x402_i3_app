# Intelligence Cubed – x402 AI Agent Hub

> Multi-model AI agent marketplace where every model and workflow call is paid with **x402 on Solana Devnet**.

**Submission:** Solana x402 Hackathon – **Best x402 Agent Application**  
**Status:** Fully working prototype with on-chain payments, model marketplace, benchmarks, workflows, and Canvas editor.

---

## 🔗 Hackathon Resources


* **Demo Video (≤ 3 min):** <TODO: YouTube link>

---

## 📚 Table of Contents

1. [Overview](#-overview)
2. [Problem & Solution](#-problem--solution)
3. [Key Features](#-key-features)
4. [How x402 & Solana Payments Work](#-how-x402--solana-payments-work)
5. [Architecture & Tech Stack](#-architecture--tech-stack)
6. [Getting Started](#-getting-started)
7. [Local Development](#-local-development)
8. [Testing Guide for Judges](#-testing-guide-for-judges)
9. [Limitations & Roadmap](#-limitations--roadmap)
10. [Team](#-team)
11. [License](#-license)

---

## 1️⃣ Overview

**Intelligence Cubed** is a decentralized modelverse that lets users:

* Discover curated AI models with **transparent USDC pricing**
* Benchmark and compare models
* Build and run **multi-step workflows** in a Canvas editor
* Chat with any model or workflow via a unified **Chats** interface

Every paid action (single model call or workflow run) is gated through **x402-style invoices** and settled in **USDC on Solana Devnet** via **Phantom**. Only after a payment is confirmed on-chain will the app invoke the underlying model(s) and stream back the answer.


---

## 2️⃣ Problem & Solution

### Problem

Today, AI users face two gaps:

1. **Model discovery gap** – It’s hard to find the “right” model for a specific task. Model lists are long, pricing opaque, and routing logic is often a black box.
2. **Payment gap** – Most AI apps are centralized, credit-based, or subscription-based. There is no standard way for third-party agents to programmatically *pay* for model usage and get verifiable receipts on-chain.

### Solution

**Intelligence Cubed** addresses both:

* A **Modelverse + Benchmark + Workflows + Canvas** UI for discovering, comparing, and composing models.
* A **unified x402 payment layer**:

  * Each model and workflow has a **price per API call in USDC**.
  * The MCP backend issues **402 responses**, prompts Phantom, and verifies **Solana Devnet** settlement.
  * Only after the invoice is **Paid** do we call the model or run the workflow.

Any external AI agent (e.g., MCP-enabled IDE, LLM tool) can call the same backend to **pay with x402 + invoke our models** in an autonomous, verifiable way.

---

## 3️⃣ Key Features

### Multi-Page AI Hub

* **Chats (`index.html`)**  
  Single-model or Auto Router chat interface with a central input box:

  * “Ask AI anything…” prompt
  * **Auto Router** toggle: when enabled, the system scores hundreds of models and picks the best suited one for the user’s query.

* **Modelverse (`modelverse.html`)**  
  Model marketplace with:

  * Name, category, industry
  * **Price / API call (USDC)**
  * Usage, compatibility, total score
  * Actions: **Try** (jump into Chats) & **Add to Cart**

* **Benchmark (`benchmark.html`)**  
  Model benchmark leaderboard showing:

  * Performance scores
  * Usage metrics
  * Price & market stats
  * One-click “Try” into Chats.

* **Workflows (`workflow.html`)**  
  Workflow leaderboard:

  * Each card shows **Compute Cost**, **Estimated Gas**, and **Total (x402)** in USDC.
  * Actions: **Details**, **Pay with x402**.

* **Canvas (`canvas.html`)**  
  Visual workflow editor:

  * Drag-and-drop nodes (models)
  * Connect them into multi-step pipelines
  * Click **Run** to execute the pipeline, paying node-by-node through x402.

### x402 & On-chain Payments

* **402 Payment Progress widget** in the bottom-right shows:

  * Invoice status (Pending → Paid / Cancelled)
  * Amount, memo, and Solana tx link.
* **Phantom (Solana Devnet)** integration:

  * Users log in and confirm each payment.
  * Every payment is visible on **Solana Explorer**.

---

## 4️⃣ How x402 & Solana Payments Work

### A. Single-Model Chat Flow

1. User opens **Chats** (`index.html`), selects a model (or enables Auto Router), and sends a question, e.g. `“What does this do?”`.
2. The frontend sends the request to the MCP server; the server:

   * Calculates the model price in USDC.
   * Creates a **x402 payment** describing the required payment.
3. The UI shows a **x402 Payment Progress** card and prompts the user to **connect Phantom (Solana Devnet)**.
4. Phantom pops up:

   * User enters password (if locked) and approves the USDC transfer (plus small SOL network fee).
5. Once the transaction is confirmed:

   * The 402 card shows **Paid – Payment settled on Solana**, including:

     * Amount (USDC)
     * Memo (invoice ID)
     * `Tx` link to **Solana Explorer**.
6. Only then does the MCP server forward the prompt to the selected model and stream the answer back into the chat.

### B. Modelverse / Benchmark “Try” Flow

1. User visits **Modelverse** or **Benchmark** and clicks **Try** next to a model.
2. They are redirected to **Chats** with that model pre-selected.
3. They ask a question; the **same x402 flow** (invoice → Phantom → Explorer → answer) runs automatically.

### C. Workflow & Canvas Flow

1. User opens **Workflows** and chooses a workflow card (e.g. “AI Safety & Watermarking Pipeline”), then clicks **Pay with x402**.
2. The app opens **Canvas**, pre-loading the workflow graph.
3. User optionally edits the graph and clicks **Run**.
4. Backend:

   * Calculates the required price for the first node and returns a 402.
   * After payment, verifies the Solana transfer and executes that node.
   * Repeats the 402/payment cycle for each remaining node until the workflow completes.
5. Final results surface back through the **Chats** interface.

---

## 5️⃣ Architecture & Tech Stack

### Frontend

* **Vite multi-page app** (`index.html`, `modelverse.html`, `benchmark.html`, `workflow.html`, `canvas.html`)
* Modern layout with light purple accent (`#8B7CF6`), responsive design
* Custom components for:

  * Chats input + Auto Router toggle
  * Model tables & workflow cards
  * 402 Payment Progress widget

### Backend

* **Express.js** server (`serve.js`)

  * Serves static assets for all pages
  * Provides REST APIs: `/api/health`, `/api/models`, etc.
  * Hosts **MCP routes** under `/mcp/*` to:

    * Create x402-style invoices
    * Poll invoice/payment status
    * Proxy model calls after successful payment

### Payments & On-chain

* x402-compatible payment flow for invoice creation & validation
* **Solana Devnet**:

  * **USDC mint** as payment token
  * **Merchant/agent recipient address** for all usage fees
  * User payments via **Phantom** wallet
* **Billing logs**:

  * `data/billing-entries.json` stores local logs of each paid run for debugging and reconciliation (JSON shape: `{ "entries": [...] }`).

---

## 6️⃣ Getting Started

### Prerequisites

* **Node.js** ≥ 18
* **npm** ≥ 8 (or `yarn`)
* **Phantom** wallet installed in your browser, set to **Solana Devnet**
* Optional but recommended: some DEVNET SOL & USDC in Phantom for testing.

### Clone & Install

```bash
git clone <TODO: repository-url>
cd x402_i3_app
npm install
# or
yarn install
```

### Environment Variables

You can export these in your shell or use a `.env` file (with `dotenv` wired into `serve.js`):

* **Server basics**

  * `PORT` – default `3000` (often mapped to `8080` in production)
  * `HOST` – default `127.0.0.1` (use `0.0.0.0` to listen on all interfaces)
  * `NODE_ENV` – `development` or `production`

* **Model proxy**

  * `I3_PROXY_BASE` – base URL of the proxy (e.g. `http://localhost:8000`)

* **x402 / Solana settings** (can also live in `server/mcp/config.js`)

  * `X402_NETWORK` – e.g. `solana-devnet`
  * `X402_MINT` – USDC mint address on Devnet
  * `X402_RECIPIENT` – your merchant/agent wallet address
  * `X402_PAYMENT_URL` – optional x402 facilitator endpoint
  * `X402_EXPLORER_URL` – Solana Explorer base URL
  * `X402_RPC_URL` – Solana RPC endpoint
  * `X402_DECIMALS` – token decimals (usually `6` for USDC)
  * `X402_EXPIRES_SECONDS` – invoice expiry duration in seconds

Ensure that `data/billing-entries.json` exists, is writable, and follows `{ "entries": [] }`. The repo ships with a sample file; replace it with an empty structure if you need a clean slate.

---

## 7️⃣ Local Development

### Frontend (Vite dev server)

```bash
npm run dev
# or
yarn dev
```

* Default: `http://localhost:3000`
* Hot reload enabled.
* `vite.config.js` is configured with `host: '0.0.0.0'` so you can access it from other devices on your LAN.

### Backend / MCP server

In a separate terminal:

```bash
npm start
# or
yarn start
```

This launches `serve.js`, which:

* Serves static files (for production build)
* Exposes `/api/*` and `/mcp/*` routes
* Handles 402 invoice creation, polling, and post-payment model calls

### Production Build

```bash
npm run build
npm run preview     # optional local preview of the built assets
```

In production, you typically:

1. `npm run build`
2. `npm start` (or `node serve.js`) behind a reverse proxy.

---

### Roadmap

* **Mainnet-beta deployment** with production-grade RPC and observability.
* **Model provider onboarding**:

  * Let external developers list models/workflows with their own x402 pricing and recipient addresses.
* **More wallets & platforms**:

  * Support additional Solana wallets and mobile-first flows.
* **Agent API**:

  * Document and expose MCP endpoints so external AI agents can programmatically:

    * Discover models
    * Quote prices
    * Pay with x402
    * Invoke models and workflows

---

## 🧾 License

> Choose one that matches your goals (MIT is common for hackathons).

This project is licensed under the **MIT License** – see the [`LICENSE`](./LICENSE) file for details.

