# Intelligence Cubed (i³) – x402 Edition

<div align="center">

![Intelligence Cubed Logo](svg/I3%20logo.svg)

**A Decentralized AI Marketplace with x402 Payments**

Where AI models are both **Model-as-a-Service (MaaS)** and **liquid, revenue-sharing assets**. Discover, compare, and compose models in a visual Canvas with transparent **USDC pricing** and **on-chain x402 payments** on **Solana Devnet**.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Solana Devnet](https://img.shields.io/badge/Solana-Devnet-14F195)](https://solana.com/)
[![x402 Payments](https://img.shields.io/badge/x402-Enabled-9945FF)](https://solana.com/)
[![USDC Payments](https://img.shields.io/badge/Payment-USDC-2775CA)](https://www.circle.com/usdc)

[Litepaper](http://intelligencecubed.com/) | [Twitter](https://x.com/I3_Cubed) | [Telegram](https://t.me/I3_Cubed)

</div>

---

## 🏆 Hackathon Submission

**Hackathon:** Solana x402 Hackathon – **Best x402 Agent Application**  
**Status:** Fully working prototype with on-chain x402 payments, model marketplace, benchmarks, workflows, and Canvas editor  
**Demo Video (≤ 3 min):** <https://www.youtube.com/watch?v=aUPYiAM4obg>

### 🚀 What Makes This Special

- ✅ **x402 Payment Protocol** – Every AI model call is paid via x402 invoices
- ✅ **Solana Devnet Integration** – Fast, low-cost on-chain payment settlement
- ✅ **USDC-Based Pricing** – Transparent, stablecoin-denominated pricing for all models
- ✅ **Phantom Wallet Integration** – Seamless payment experience for users
- ✅ **Verifiable On-Chain Receipts** – Every transaction is traceable on Solana Explorer

---

## 📚 Table of Contents
1. [Hackathon Submission](#-hackathon-submission)
2. [Overview](#1-overview)
3. [What the Product *Is*](#2-what-the-product-is)
4. [Problem & Solution](#3-problem--solution)
5. [Core Concepts](#4-core-concepts)
6. [Key Features](#3️⃣-key-features)
   - [Multi-Page AI Hub](#multi-page-ai-hub)
   - [x402 & On-chain Payments](#x402--on-chain-payments)
7. [How x402 & Solana Payments Work](#4️⃣-how-x402--solana-payments-work)
   - [A) Single-Model Chat Flow](#a-single-model-chat-flow)
   - [B) Modelverse / Benchmark "Try" Flow](#b-modelverse--benchmark-try-flow)
   - [C) Workflow & Canvas Flow](#c-workflow--canvas-flow)
8. [User Journey](#5️⃣-user-journey)
   - [Core User Flows](#core-user-flows-x402-payment-first-approach)
   - [Detailed User Journey](#detailed-user-journey-with-x402-payments)
9. [Architecture & Tech Stack](#6️⃣-architecture--tech-stack)
   - [High-Level System Architecture](#high-level-system-architecture)
   - [Component Architecture](#component-architecture)
   - [Data Flow Architecture](#data-flow-architecture-with-x402-payments)
   - [Architecture Components](#architecture-components)
10. [Technology Stack](#7️⃣-technology-stack)
11. [Getting Started](#8️⃣-getting-started)
    - [Prerequisites](#prerequisites)
    - [Clone & Install](#clone--install)
    - [Environment Variables](#environment-variables)
12. [Local Development](#9️⃣-local-development)
    - [Frontend (Vite dev server)](#frontend-vite-dev-server)
    - [Backend / MCP server](#backend--mcp-server)
    - [Production Build](#production-build)
13. [Roadmap](#-roadmap)
14. [License](#-license)

---
# Intelligence Cubed (i³)

> A decentralized **Modelverse** — think **Hugging Face × Uniswap** — where models are both **Model-as-a-Service (MaaS)** and **liquid, revenue-sharing assets**. Discover, compare, and compose models in a visual Canvas; pay per call with transparent USDC pricing; and get verifiable on-chain receipts via **x402**.

---

## 1) Overview

**Intelligence Cubed (i³)** is a decentralized modelverse that lets users:

- Discover curated AI models with transparent **USDC** pricing  
- Benchmark and compare models with community-driven **Proof of Intelligence**  
- Build and run multi-step workflows in a **Canvas** editor  
- Chat with any model or workflow via a unified **Chats** interface

Every paid action (single model call or workflow run) is **gated by x402 invoices** and settled in **USDC on Solana Devnet** via **Phantom**. Only **after** on-chain payment confirmation does the app invoke the underlying model(s) and stream back the answer.

---

## 2) What the Product *Is*

i³ is four layers that work together:

1. **Model-as-a-Service (MaaS)**  
   Call models directly via chat/API, chain them into workflows, and enable fine-tuning and secondary creation.

2. **Model as a Liquid Asset**  
   Tokenize models through **IMO (Initial Model Offering)** so ownership and usage revenues are shared transparently.

3. **Co-Creation (Canvas)**  
   Drag-and-drop to compose multi-step pipelines; derivative models automatically return royalties to ancestors.

4. **Democratic Benchmark (Proof of Intelligence)**  
   Usage-driven rankings and indices so the best models rise on merit, not just lab tests.

> **Open-source threshold:** when **>51%** of a model’s ownership is publicly held, the model transitions to open source to accelerate adoption and remixing.

---

## 3) Problem & Solution

### Problems
- **Model discovery gap:** Lists are long, quality varies, pricing is opaque, and router logic is often a black box.  
- **Payment gap:** Most AI apps are centralized, credit- or subscription-based. There’s no standard way for third-party agents to **programmatically** pay per call and obtain **verifiable on-chain receipts**.

### Our Solution
- **Modelverse + Benchmark + Workflows + Canvas** for one-stop **discover → compare → compose**.  
- **Tokenized ownership & royalties** (IMO + derivative revenue share) for sustainable creator incentives.  
- **Unified x402 payment layer**: each call is invoiced, paid, verified on-chain, then executed.

---

## 4) Core Concepts

- **IMO (Initial Model Offering):** Creators mint model ownership, fund development, and share future usage revenues.  
- **Royalties Accumulation:** Derivative models automatically pay upstream royalties across the lineage.  
- **Proof of Intelligence:** Continuous, usage-driven scoring and vertical indices (quality, usage, momentum).  
- **Democratic Pricing:** Stablecoin-anchored pricing that reflects demand and capacity, not arbitrary fees.

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

## 5️⃣ User Journey

### Core User Flows (x402 Payment-First Approach)

```mermaid
flowchart TD
    Start[🌐 User Lands on Platform] --> Auth{🔐 Wallet Connected?}
    
    Auth -->|No| WalletConnect[Connect Phantom Wallet]
    WalletConnect --> SolanaAuth[Solana Devnet]
    SolanaAuth --> Authenticated[✅ Authenticated]
    
    Auth -->|Yes| Authenticated
    
    Authenticated --> MainHub{Choose Action}
    
    subgraph Discovery["🔍 Discovery Flow"]
        D1[Browse Modelverse] --> D2[Filter & Search]
        D2 --> D3[View Model Details - USDC Pricing]
        D3 --> D4[Compare in Benchmark]
        D4 --> D5[Record View On-Chain]
    end
    
    subgraph Payment["💳 x402 Payment Flow"]
        P1[Create x402 Invoice] --> P2[Display USDC Amount]
        P2 --> P3[User Approves in Phantom]
        P3 --> P4[Solana Transaction Confirmed]
        P4 --> P5[Verifiable On-Chain Receipt]
    end
    
    subgraph Chat["💬 Chat Flow with x402"]
        C1[Open Chat Interface] --> C2{Auto Router?}
        C2 -->|ON| C3[AI Selects Best Model]
        C2 -->|OFF| C4[User Selects Model]
        C3 --> C5[x402 Invoice Created]
        C4 --> C5
        C5 --> C6[Pay with USDC on Solana]
        C6 --> C7[Payment Verified]
        C7 --> C8[Stream AI Response]
        C8 --> C9[Record Usage On-Chain]
    end
    
    subgraph Canvas["🎨 Canvas Flow with Multi-Step x402"]
        W1[Create Workflow] --> W2[Drag Model Nodes]
        W2 --> W3[Connect Pipeline]
        W3 --> W4[Calculate Total USDC Cost]
        W4 --> W5[Pay Node-by-Node via x402]
        W5 --> W6[Execute Workflow]
        W6 --> W7[Log Execution On-Chain]
    end
    
    MainHub -->|Discover| D1
    MainHub -->|Chat| C1
    MainHub -->|Build| W1
    
    C1 --> P1
    W1 --> P1
    
    D5 --> MyAssets[💼 Save to My Assets]
    C9 --> MyAssets
    W7 --> MyAssets
    
    MyAssets --> TokenRewards[🎁 Earn USDC Rewards]
    TokenRewards --> MainHub
    
    style Start fill:#FFE082,stroke:#FFA000
    style Auth fill:#FF5252,stroke:#D32F2F,color:#fff
    style Authenticated fill:#4CAF50,stroke:#45a049,color:#fff
    style Discovery fill:#8B7CF6,stroke:#6B5CD6,color:#fff
    style Payment fill:#9945FF,stroke:#14F195,color:#fff
    style Chat fill:#00BCD4,stroke:#0097A7,color:#fff
    style Canvas fill:#FF9800,stroke:#F57C00,color:#fff
    style MyAssets fill:#E91E63,stroke:#C2185B,color:#fff
```

### Detailed User Journey with x402 Payments

```mermaid
sequenceDiagram
    actor User
    participant UI as Web Interface
    participant Phantom as Phantom Wallet
    participant Solana as Solana Devnet
    participant x402 as x402 Protocol
    participant API as MCP Server
    participant Router as Auto Router
    participant Model as AI Models
    
    User->>UI: 1. Land on Platform
    UI->>UI: Check Wallet Connection
    
    alt Not Connected
        UI->>User: Show "Connect Phantom" Modal
        User->>UI: Click Connect Phantom
        UI->>Phantom: Request Connection
        Phantom->>User: Approve Connection
        Phantom-->>UI: Wallet Address (Solana Devnet)
        UI->>Solana: Verify Wallet Signature
        Solana-->>UI: ✅ Authenticated
    else Already Connected
        UI->>Solana: Verify Session
        Solana-->>UI: ✅ Session Valid
    end
    
    UI->>User: Display Main Interface
    
    rect rgb(100, 150, 255)
        Note over User,Model: Chat Flow with x402 Payment (USDC on Solana)
        User->>UI: Ask Question in Chat
        UI->>API: Send Query + Wallet Address
        
        alt Auto Router Enabled
            API->>Router: Analyze Query
            Router->>Router: Score 100+ Models
            Router->>API: Select Best Model
        else Manual Selection
            User->>UI: Choose Model
            UI->>API: Use Selected Model
        end
        
        API->>x402: Create Invoice (USDC Amount)
        x402-->>API: Invoice ID + Payment Details
        API-->>UI: Display x402 Invoice
        
        UI->>User: Show Payment Modal
        Note over User,Solana: User sees USDC amount + SOL gas fee
        
        User->>Phantom: Approve USDC Payment
        Phantom->>Solana: Submit Transaction
        Solana-->>Phantom: Transaction Hash
        Phantom-->>UI: Payment Confirmed
        
        UI->>x402: Verify Payment On-Chain
        x402->>Solana: Check Transaction
        Solana-->>x402: ✅ USDC Transfer Verified
        x402-->>UI: Payment Receipt + Explorer Link
        
        Note over UI,User: Display: "Paid - Payment settled on Solana"
        
        API->>Model: Forward Query (After Payment)
        Model-->>API: Stream Response
        API-->>UI: Stream to Client
        UI-->>User: Display AI Answer
        
        API->>Solana: Record Usage Metadata On-Chain
        Solana-->>UI: Update User's Transaction History
    end
    
    rect rgb(200, 150, 100)
        Note over User,Model: Canvas Flow with Multi-Node x402 Payments
        User->>UI: Create Workflow in Canvas
        User->>UI: Drag & Connect Model Nodes
        User->>UI: Click "Run Workflow"
        
        UI->>API: Request Workflow Execution
        API->>API: Calculate Total Cost (All Nodes)
        API-->>UI: Display Total USDC Amount
        
        loop For Each Node
            API->>x402: Create Node Invoice
            x402-->>UI: Invoice for Node N
            
            User->>Phantom: Approve USDC Payment
            Phantom->>Solana: Submit Transaction
            Solana-->>Phantom: Tx Confirmed
            
            x402->>Solana: Verify Payment
            Solana-->>x402: ✅ Verified
            
            API->>Model: Execute Node N
            Model-->>API: Node Results
            API-->>UI: Stream Node Output
        end
        
        UI->>Solana: Record Workflow Execution
        Solana-->>UI: On-Chain Receipt
        UI->>User: Display Final Results + All Tx Links
    end
```

---

## 6️⃣ Architecture & Tech Stack

### High-Level System Architecture

```mermaid
graph TB
    subgraph Client["🖥️ Frontend Layer"]
        UI[Multi-Page Web App]
        Pages[Chat • Modelverse • Benchmark • Workflow • Canvas]
        Payment402[x402 Payment Widget]
        UI --> Pages
        UI --> Payment402
    end
    
    subgraph Server["⚙️ Application Layer"]
        Express[Express.js Server]
        APIManager[API Manager<br/>- Auto Router<br/>- I3 Gateway]
        MCPServer[MCP Server<br/>- x402 Invoices<br/>- Payment Verification]
        Express --> APIManager
        Express --> MCPServer
    end
    
    subgraph Blockchain["⛓️ Solana Devnet Layer"]
        Solana[Solana Devnet<br/>Fast & Low-Cost]
        USDC[USDC Token Program<br/>SPL Token]
        Phantom[Phantom Wallet<br/>User Authentication]
        Solana --> USDC
        Phantom --> Solana
    end
    
    subgraph Payment["💳 x402 Payment Layer"]
        x402Protocol[x402 Protocol]
        Invoice[Invoice Creation & Management]
        Verification[On-Chain Payment Verification]
        x402Protocol --> Invoice
        x402Protocol --> Verification
    end
    
    subgraph AI["🤖 AI Model Layer"]
        I3GW[I3 Gateway / Model Proxy]
        Provider1[AI Provider A]
        Provider2[AI Provider B]
        Provider3[AI Provider C]
        I3GW --> Provider1
        I3GW --> Provider2
        I3GW --> Provider3
    end
    
    subgraph Data["💾 Data Layer"]
        BillingLog[Billing Entries JSON<br/>Local Transaction Log]
        ModelDB[Model Metadata<br/>Pricing & Registry]
    end
    
    UI <-->|HTTP/WebSocket| Express
    Payment402 <-->|Payment Status| MCPServer
    APIManager <-->|Query Models| ModelDB
    APIManager <-->|Stream Responses| I3GW
    MCPServer <-->|Create/Poll Invoices| x402Protocol
    x402Protocol <-->|Verify Tx| Solana
    Phantom <-->|Sign & Approve| Payment402
    MCPServer -->|Log Payments| BillingLog
    
    style Client fill:#8B7CF6,stroke:#6B5CD6,color:#fff
    style Server fill:#4CAF50,stroke:#45a049,color:#fff
    style Blockchain fill:#14F195,stroke:#9945FF,color:#000
    style Payment fill:#9945FF,stroke:#14F195,color:#fff
    style AI fill:#E91E63,stroke:#C2185B,color:#fff
    style Data fill:#FFA000,stroke:#FF8F00,color:#fff
```

### Component Architecture

```mermaid
graph LR
    subgraph Frontend["Frontend Components"]
        Chat[💬 Chat Interface]
        MV[🤖 Modelverse]
        BM[📊 Benchmark]
        Canvas[🎨 Canvas Editor]
        Payment[💳 x402 Payment Widget]
    end
    
    subgraph Core["Core Services"]
        API[API Manager]
        MCP[MCP Server]
        x402[x402 Handler]
        Wallet[Phantom Integration]
    end
    
    subgraph External["External Services"]
        Models[AI Model APIs]
        Solana[Solana Devnet]
        USDC[USDC Token]
    end
    
    Chat --> API
    MV --> API
    BM --> API
    Canvas --> API
    
    Chat --> Payment
    Canvas --> Payment
    
    Payment --> x402
    Payment --> Wallet
    
    API --> Models
    MCP --> x402
    x402 --> Solana
    Wallet --> Solana
    Solana --> USDC
    
    style Frontend fill:#E3F2FD,stroke:#2196F3
    style Core fill:#F3E5F5,stroke:#9C27B0
    style External fill:#E8F5E9,stroke:#4CAF50
```

### Data Flow Architecture with x402 Payments

```mermaid
flowchart TD
    User[👤 User Input] --> Frontend{Frontend Router}
    
    Frontend -->|Chat| ChatFlow[Chat Handler]
    Frontend -->|Browse| MVFlow[Modelverse Handler]
    Frontend -->|Build| CanvasFlow[Canvas Handler]
    
    ChatFlow --> PaymentGate{Payment Required?}
    PaymentGate -->|Yes| x402Invoice[Create x402 Invoice]
    
    x402Invoice --> DisplayPayment[Display USDC Amount]
    DisplayPayment --> PhantomApproval[User Approves in Phantom]
    PhantomApproval --> SolanaSubmit[Submit to Solana Devnet]
    SolanaSubmit --> VerifyPayment[Verify USDC Transfer]
    
    VerifyPayment -->|✅ Paid| AutoRouter{Auto Router?}
    AutoRouter -->|Yes| ModelSelect[ML Model Selection]
    AutoRouter -->|No| UserSelect[User Selection]
    
    ModelSelect --> I3Gateway[I3 Gateway / Proxy]
    UserSelect --> I3Gateway
    MVFlow --> I3Gateway
    
    CanvasFlow --> WorkflowEngine[Workflow Engine]
    WorkflowEngine --> MultiPayment[Multi-Node x402 Cycle]
    MultiPayment --> I3Gateway
    
    I3Gateway --> ModelAPI[AI Model Providers]
    ModelAPI --> StreamResponse[Stream Handler]
    
    StreamResponse --> Frontend
    StreamResponse --> BillingLog[(Billing Entries JSON)]
    
    VerifyPayment --> OnChainReceipt[On-Chain Receipt]
    OnChainReceipt --> SolanaExplorer[Solana Explorer Link]
    SolanaExplorer --> Display[Display Results + Tx Link]
    BillingLog --> Display
    
    style User fill:#FFE082,stroke:#FFA000
    style Frontend fill:#8B7CF6,stroke:#6B5CD6,color:#fff
    style x402Invoice fill:#9945FF,stroke:#14F195,color:#fff
    style SolanaSubmit fill:#14F195,stroke:#9945FF,color:#000
    style I3Gateway fill:#4CAF50,stroke:#45a049,color:#fff
    style ModelAPI fill:#E91E63,stroke:#C2185B,color:#fff
    style OnChainReceipt fill:#2196F3,stroke:#1976D2,color:#fff
```

### Architecture Components

#### 1. **Frontend Layer** (HTML/CSS/JavaScript + Vite)
- Multi-page application with distinct interfaces
- **x402 Payment Progress Widget** for real-time payment status
- Phantom wallet integration for Solana Devnet
- Real-time streaming responses from AI models
- Responsive design with modern UI/UX

#### 2. **Application Layer** (Node.js/Express)
- RESTful API endpoints (`/api/*`)
- **MCP Server routes** (`/mcp/*`) for x402 payment handling
- Model selection and routing logic (Auto Router)
- Session and state management
- I3 Gateway for model orchestration

#### 3. **Blockchain Layer - Solana Devnet**
- **Solana Devnet**: Fast, low-cost blockchain for testing
- **USDC Token**: SPL Token standard for stablecoin payments
- **Phantom Wallet**: User authentication and payment approval
- **On-Chain Verification**: Every payment is verifiable on Solana Explorer
- **Transaction Receipts**: Immutable proof of payment

#### 4. **x402 Payment Layer**
- **Invoice Creation**: Generate payment requests with USDC amounts
- **Payment Polling**: Real-time status updates (Pending → Paid → Verified)
- **On-Chain Verification**: Confirm USDC transfers on Solana
- **Receipt Generation**: Provide Solana Explorer links for each transaction
- **Billing Logs**: Local JSON logging for reconciliation

#### 5. **AI Model Layer**
- Multiple AI model providers
- I3 Gateway for unified model access
- Response streaming for real-time interactions
- Usage tracking and analytics
- Pay-per-call execution model

#### 6. **Data Layer**
- **Model Registry**: Metadata, pricing, and capability information
- **Billing Entries**: `data/billing-entries.json` for transaction logs
- **User Profiles**: Wallet-based identity and transaction history

### Data Flow Summary

1. **User Action** → Frontend captures intent (chat query, workflow execution)
2. **x402 Invoice** → Create payment request with USDC amount
3. **Phantom Approval** → User approves USDC transfer on Solana Devnet
4. **Payment Verification** → Confirm on-chain transaction
5. **Model Selection** → Auto Router or user selects appropriate model(s)
6. **API Request** → Forward to I3 Gateway after payment confirmation
7. **Model Execution** → Execute AI model and stream response
8. **On-Chain Receipt** → Generate verifiable Solana Explorer link
9. **Billing Log** → Record transaction in local JSON for reconciliation

---

## 7️⃣ Technology Stack

### Frontend
- **HTML5/CSS3**: Modern web standards
- **JavaScript (ES6+)**: Client-side logic
- **Vite**: Build tool and dev server
- **Phantom Wallet SDK**: Solana wallet integration

### Backend
- **Node.js (≥18)**: Runtime environment
- **Express.js**: Web framework
- **CORS**: Cross-origin resource sharing
- **I3 Gateway**: Unified API gateway for AI models

### Blockchain & Payments
- **Solana Devnet**: Fast, low-cost blockchain network
- **@solana/web3.js**: Solana JavaScript SDK
- **@solana/spl-token**: SPL Token library for USDC
- **x402 Protocol**: Payment invoice standard
- **Phantom Wallet**: User authentication and payments

### Data & Storage
- **JSON File System**: Local billing logs (`data/billing-entries.json`)
- **Model Registry**: Metadata and pricing database

### AI/ML
- **Auto Router**: Intelligent model selection system
- **I3 API**: Standardized interface for all models
- **Streaming Responses**: Real-time text generation

---

## 8️⃣ Getting Started

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

## 9️⃣ Local Development

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

## 🔮 Roadmap

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

This project is licensed under the **MIT License** – see the [`LICENSE`](./LICENSE) file for details.

