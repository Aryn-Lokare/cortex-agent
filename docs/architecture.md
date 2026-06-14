# Cortex AI Architecture

This document outlines the complete technical and behavioral architecture for **Cortex**, powered by the **Cortex Cognitive Core Framework**. It defines the system topology, agent architecture, memory framework, asynchronous processing model, and technology stack.

---

## 1. System Overview

Cortex is an AI-powered social media operating system designed to function as a continuously learning brand assistant.

The platform separates:

- **User-facing state management**
- **Long-running agent execution**
- **Memory and learning systems**
- **Social platform integrations**

This architecture enables scalable autonomous content creation, posting, monitoring, and continuous brand adaptation.

---

## 2. High-Level System Topology

```
┌────────────────────┐
│      User UI       │
│  Dashboard / Chat  │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│    Next.js App     │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│    Supabase DB     │
│  + Realtime Layer  │
└─────────┬──────────┘
          │
          ▼
┌──────────────────────────────────┐
│      Cortex Cognitive Core       │
│                                  │
│        Orchestrator Agent        │
│                │                 │
│        ├── Strategy Agent        │
│        ├── Writing Agent         │
│        ├── Creation Agent        │
│        └── Posting Agent         │
└─────────┬────────────────────────┘
          │
          ▼
┌────────────────────┐
│  Social Platforms  │
└────────────────────┘
```

---

## 3. User Onboarding Flow

### 3.1 Initialization Gate

First-time users are routed into a mandatory onboarding workflow before accessing the dashboard.

#### Captured Information

##### Brand Identity

- **User Name**
- **Brand Name**
- **Brand Description**

##### Style Guidelines

- **Brand Voice**
- **Tone Preferences**
- **Writing Style Parameters**
- **Content Constraints**

##### Social Integrations

- **OAuth Tokens**
- **Connected Social Accounts**

#### Persistence Layer

All onboarding information is stored in Supabase and becomes the foundation for future agent behavior.

The resulting profile acts as the system's permanent brand context.

---

## 4. Core Workspace

### Dashboard

The dashboard functions as the operational control center.

#### Responsibilities

- Display business metrics
- Show content pipeline status
- Display pending approvals
- Monitor scheduled posts
- Surface memory-driven recommendations

### Chat Interface

A conversational control layer for interacting with Cortex.

#### Supported Actions

- Campaign generation
- Content requests
- Brand updates
- Feedback submission
- Memory overrides
- Strategic questions

---

## 5. Cortex Cognitive Core

The Cortex Core is the reasoning engine responsible for all decision making.

```
┌──────────────────────────────┐
│  Brand Details & Guidelines  │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────┐
│  Orchestrator Agent  │
└──────────┬───────────┘
           │
 ┌─────────┼─────────┐
 ▼         ▼         ▼
Strategy Writing  Creation
 Agent     Agent    Agent
 │         │         │
 └─────────┼─────────┘
           │
           ▼
     Posting Agent
           │
           ▼
    Social Platforms
```

---

## 6. Agent Architecture

### 6.1 Orchestrator Agent

#### Purpose

Acts as the central reasoning layer.

#### Model

- Groq
- `openai/gpt-oss-120b`

#### Responsibilities

- Goal decomposition
- Task planning
- Memory retrieval
- Agent coordination
- Decision evaluation

#### Inputs

- Brand Guidelines
- User Commands
- Hindsight Learnings
- Social Events

#### Outputs

- Structured execution plans

---

### 6.2 Strategy Agent

#### Purpose

Determines what content should be created.

#### Responsibilities

- Content themes
- Campaign planning
- Audience targeting
- Posting cadence
- Platform selection

#### Output

Structured content briefs.

---

### 6.3 Writing Agent

#### Purpose

Generates platform-specific copy.

#### Model

- `openai/gpt-oss-20b`
- Llama 4 Scout

#### Responsibilities

- X posts
- LinkedIn posts
- Instagram captions
- CTA generation
- Hook optimization

#### Output

Final text assets.

---

### 6.4 Creation Agent

#### Purpose

Produces visual assets.

#### Responsibilities

- Prompt generation
- Image generation
- Creative adaptation
- Asset variation

#### Integrations

- Flux.1
- Fal.ai

#### Output

Images and media assets.

---

### 6.5 Posting Agent

#### Purpose

Final execution layer.

#### Responsibilities

- Schedule posts
- Publish content
- Trigger approvals
- Queue actions
- Handle retries

#### Output

Published social content.

---

## 7. Hindsight Learning System

Hindsight is Cortex's long-term learning layer.

Unlike traditional memory systems, Hindsight does not store raw interactions. Instead, it converts user behavior into reusable insights.

---

## 8. Feedback Ingestion

Hindsight observes four major feedback sources:

### Approvals

Signals successful behavior.

- _Examples:_ Approved post, Approved schedule, Approved strategy

### Rejections

Signals failed behavior.

- _Examples:_ Rejected content, Rejected campaign, Rejected visuals

### Edits

Signals preferred modifications.

- _Examples:_ Copy changes, Tone adjustments, Scheduling changes

### Chat Feedback

Natural language guidance provided through the chatbot.

- _Examples:_
  - "Make posts shorter."
  - "Use fewer emojis."
  - "Be more professional."

---

## 9. Reflection & Learning Loop

Raw interactions are transformed into structured learnings.

### Reflection Flow

```
Observation
    │
    ▼
Reflection
    │
    ▼
 Learning
    │
    ▼
Future Behavior Change
```

### Learning Pipeline

```
Raw Interaction
    │
    ▼
Reflection Engine (LLM)
    │
    ▼
Structured Insight
    │
    ▼
Vector Storage
    │
    ▼
Future Retrieval
```

---

## 10. Structured Learning Format

Instead of storing full conversations, Cortex stores distilled insights.

### Example

```json
{
  "type": "writing_preference",
  "insight": "Avoid excessive emojis",
  "confidence": 0.91,
  "source": "Repeated user edits"
}
```

### Benefits

- Smaller context windows
- Faster retrieval
- Reduced noise
- Better long-term adaptation

---

## 11. Memory Retrieval Flow

Before execution begins:

```
User Request
    │
    ▼
Retrieve Brand Guidelines
    │
    ▼
Retrieve Hindsight Learnings
    │
    ▼
Build Working Context
    │
    ▼
Run Agent Pipeline
```

This ensures every output reflects both static brand rules and evolving user preferences.

---

## 12. Asynchronous Event Processing

```
Incoming Platform Event
    │
    ▼
Webhook Listener
    │
    ▼
Supabase Write
    │
    ├──────────────► Dashboard Update
    │
    ▼
Cortex Trigger
    │
    ├── Retrieve Learnings
    ├── Analyze Context
    └── Execute Agents
    │
    ▼
Decision Node
    │
    ├── Approval Required
    └── Auto Execute
```

---

## 13. Webhook Processing

External social platforms send events into public endpoints.

### Examples

- New comment
- Mention
- Direct message
- Post engagement
- Follow event

### Flow

```
Social Platform
    │
    ▼
Webhook Endpoint
    │
    ▼
Database Record
    │
    ▼
Realtime Dashboard Update
    │
    ▼
Agent Evaluation
```

---

## 14. Decision Evaluation Layer

Every generated action passes through a decision node.

### Human Approval Required

- _Examples:_ New post creation, Campaign launch, Brand-sensitive content, Negative sentiment response
- _Status:_ `Pending Approval`

### Autonomous Execution

- _Examples:_ Likes, Simple replies, Positive engagement actions
- _Status:_ `Queued With Jitter`

---

## 15. Action Queue System

The queue prevents robotic behavior.

### Features

- Randomized timing
- Retry mechanisms
- Failure recovery
- Rate-limit awareness
- Platform-specific constraints

### Managed through

- Supabase
- Inngest

---

## 16. Technology Stack

| Layer                  | Technology                 | Purpose                       |
| :--------------------- | :------------------------- | :---------------------------- |
| **Frontend**           | Next.js App Router         | User interface and API routes |
| **Database**           | Supabase PostgreSQL        | Persistent storage            |
| **Realtime**           | Supabase Realtime          | Live dashboard updates        |
| **Memory**             | Vectorize Hindsight        | Learning and memory           |
| **Orchestrator Model** | Groq `openai/gpt-oss-120b` | Strategic reasoning           |
| **Writing Model**      | Groq `openai/gpt-oss-20b`  | Content generation            |
| **Visual Generation**  | Flux.1 via Fal.ai          | Creative assets               |
| **Workflow Engine**    | Inngest                    | Async orchestration           |
| **Authentication**     | OAuth Providers            | Social account linking        |

---

## 17. Core Design Principles

### Separation of Concerns

Each agent has a narrowly defined responsibility.

### Memory Through Learning

Store insights, not conversations.

### Human-in-the-Loop Safety

High-impact actions require approval.

### Async by Default

All external events enter durable queues.

### Continuous Adaptation

Every interaction improves future behavior.

---

## 18. End-to-End Lifecycle

```
User Onboards
    │
    ▼
Brand Guidelines Stored
    │
    ▼
User Requests Content
    │
    ▼
Retrieve Learnings
    │
    ▼
Orchestrator Planning
    │
    ▼
Strategy Agent
    │
    ▼
Writing Agent
    │
    ▼
Creation Agent
    │
    ▼
Decision Layer
    │
    ├── Approval Required
    └── Auto Execute
    │
    ▼
Posting Agent
    │
    ▼
Social Platform
    │
    ▼
Feedback Captured
    │
    ▼
Hindsight Reflection
    │
    ▼
New Learning Stored
    │
    ▼
Future Behavior Improved
```

This architecture creates a self-improving social media operating system where every interaction becomes a learning signal, enabling Cortex to continuously adapt to the brand's evolving preferences while maintaining consistency, scalability, and operational safety.
