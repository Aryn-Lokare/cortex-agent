# Cortex AI — Social Media Management Operating System

Cortex is an autonomous, continuously learning AI-powered brand assistant and social media management system. Powered by the **Cortex Cognitive Core Framework**, it balances fully autonomous micro-interactions (likes, low-stakes replies) with a Human-in-the-Loop (HITL) approval gateway for high-stakes actions (publishing posts, campaign strategies, and handling negative sentiment).

---

## 🚀 Key Features

*   **Command Dashboard & Task Queue:** A centralized workspace displaying business metrics, real-time sentiment analysis, scheduled posts, and a live queue of agent actions.
*   **Human-in-the-Loop (HITL) Approval:** Safe execution gateway requiring manual supervisor sign-off before content goes live.
*   **Multi-Agent Orchestration:** A collaborative agent matrix featuring:
    *   **Orchestrator Agent:** Handles goal decomposition, memory retrieval, and agent coordination.
    *   **Strategy Agent:** Designs campaigns and plans target audience-centric content briefs.
    *   **Writing Agent:** Generates platform-adapted copy (X/Twitter, LinkedIn, Instagram).
    *   **Creation Agent:** Generates high-quality visual briefs and media assets.
    *   **Posting Agent:** Coordinates scheduled execution and artificial pacing (jitter).
*   **Hindsight Learning System:** An evolutionary memory layer that reflects on user feedback (approvals, rejections, direct edits, and chat commands) to build confidence-gated, structured learnings.
*   **Natural Language Chat:** Direct, conversational control to schedule campaigns, update guidelines, override memory, and query the agent's reasoning.

---

## 📁 Repository Structure

```text
├── .agents/            # Agent guidelines and custom skills (grill-me, tdd, etc.)
├── cortex/             # Core Next.js Web Application
│   ├── app/            # Next.js App Router (Dashboard, Chat interface, Webhooks)
│   ├── components/     # Reusable UI Components
│   ├── lib/            # Shared helper functions and service clients
│   └── package.json    # Application dependencies and scripts
└── docs/               # Detailed system specifications and diagrams
    ├── architecture.md                     # Cognitive core, reflection loop, and system topology
    ├── prd-social-media-management-agent.md # Full product requirements, user stories, and modules
    └── google-oauth-setup.md               # Setting up Google OAuth integrations
```

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | [Next.js](https://nextjs.org/) (App Router) | Dashboard UI, Chat console, API routes |
| **Database & Realtime** | [Supabase](https://supabase.com/) (PostgreSQL) | Persistence layer, realtime event updates |
| **Workflow Engine** | [Inngest](https://www.inngest.com/) | Asynchronous, durable agent workflows & event queues |
| **Strategic Reasoning** | Groq (`gpt-oss-120b` or equivalent) | High-level orchestration, goal decomposition |
| **Content Copywriting** | Groq (`gpt-oss-20b` or equivalent) | Platform-specific text generation |
| **Visual Asset Gen** | Flux.1 via Fal.ai | Generates image content from agent briefs |
| **Authentication** | Supabase Auth (OAuth Providers) | Direct social handle linking and management |

---

## ⚡ Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) (v18.x or later)
*   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
*   A running [Supabase](https://supabase.com/) project

### Configuration

1.  Navigate into the frontend application directory:
    ```bash
    cd cortex
    ```
2.  Duplicate `.env.example` as `.env.local`:
    ```bash
    cp .env.example .env.local
    ```
3.  Fill in the required environment variables:
    *   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    *   `SUPABASE_SERVICE_ROLE_KEY`
    *   `GROQ_API_KEY`
    *   `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY`

### Running the Development Server

Start the local server within the `cortex/` subdirectory:

```bash
# Install dependencies
npm install

# Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view your local instance.

---

## 📖 Deep Dives & Documentation

For detailed guides, please check:
*   [Cortex AI Architecture](file:///docs/architecture.md) — Multi-agent setup, Hindsight reflection pipeline, and system event schemas.
*   [OmniSocial AI PRD](file:///docs/prd-social-media-management-agent.md) — In-depth user stories, scoped modules, and core testing boundaries.
*   [Google OAuth Setup Guide](file:///docs/google-oauth-setup.md) — Configuring OAuth connections for social platforms.
