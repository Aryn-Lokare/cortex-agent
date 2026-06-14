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
*   [npm](https://www.npmjs.com/)
*   A running [Supabase](https://supabase.com/) project (remote or local)

### Setup & Configuration

1.  **Clone the Repository**:
    ```bash
    git clone <repository_url>
    cd cortex-marketing-agent
    ```

2.  **Install Application Dependencies**:
    ```bash
    cd cortex
    npm install
    ```

3.  **Configure Environment Variables**:
    Duplicate `.env.example` as `.env.local`:
    ```bash
    cp .env.example .env.local
    ```
    Fill in the required environment variables:
    *   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    *   `SUPABASE_SERVICE_ROLE_KEY`
    *   `GROQ_API_KEY` (Get from the Groq console)

4.  **Apply Supabase Database Migrations**:
    Open the [Supabase SQL Editor](https://supabase.com/dashboard) and run the following migration scripts located in the `cortex/supabase/` directory in order:
    1.  [migration.sql](file:///cortex/supabase/migration.sql) — Core schemas (chat sessions, messages, tasks, approval queue, activity)
    2.  [brand_profile_migration.sql](file:///cortex/supabase/brand_profile_migration.sql) — Brand profile structure
    3.  [features_migration.sql](file:///cortex/supabase/features_migration.sql) — Campaigns, posts library, and metrics analytics snapshots
    4.  [pipeline_migration.sql](file:///cortex/supabase/pipeline_migration.sql) — Sequential per-agent review runs and steps tables

5.  **Configure LinkedIn Social Integrations (Optional)**:
    By default, the application runs realistic posting simulations. To publish live content to your real LinkedIn feed, add your access token to `.env.local`:
    ```env
    LINKEDIN_ACCESS_TOKEN=your_linkedin_oauth_access_token_here
    ```

---

### Running the Development Environment

You must run both the Next.js development server and the Inngest local worker queue:

#### 1. Start the Next.js Web Server
```bash
# inside the cortex/ directory
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view your local dashboard.

#### 2. Start the Local Inngest Dev Server
Inngest handles coordinating the background agents and sequential pipeline steps. In a new terminal tab run:
```bash
# inside the cortex/ directory
npx inngest-cli@latest dev -u http://localhost:3000/api/inngest
```
Open [http://localhost:8288](http://localhost:8288) to view the Inngest local console to monitor agent workflows and retry tasks.


---

## 📖 Deep Dives & Documentation

For detailed guides, please check:
*   [Cortex AI Architecture](file:///docs/architecture.md) — Multi-agent setup, Hindsight reflection pipeline, and system event schemas.
*   [OmniSocial AI PRD](file:///docs/prd-social-media-management-agent.md) — In-depth user stories, scoped modules, and core testing boundaries.
*   [Google OAuth Setup Guide](file:///docs/google-oauth-setup.md) — Configuring OAuth connections for social platforms.
