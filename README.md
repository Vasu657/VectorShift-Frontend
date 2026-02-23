<div align="center">
  <img src="https://via.placeholder.com/150?text=VectorShift" alt="Logo" width="100"/>
  <h1>VectorShift</h1>
  <p><strong>Advanced Node-Based Pipeline Builder & Orchestration Engine</strong></p>

  <p>
    <img src="https://img.shields.io/badge/React-18-blue?logo=react&logoColor=white" alt="React 18" />
    <img src="https://img.shields.io/badge/FastAPI-0.111.0-teal?logo=fastapi&logoColor=white" alt="FastAPI" />
    <img src="https://img.shields.io/badge/Zustand-State-orange" alt="Zustand" />
    <img src="https://img.shields.io/badge/Tailwind-CSS-cyan?logo=tailwindcss&logoColor=white" alt="TailwindCSS" />
    <img src="https://img.shields.io/badge/NetworkX-DAG-lightgrey" alt="NetworkX" />
  </p>
</div>

---

## 🚀 1. Project Overview & Vision

Welcome to the **VectorShift Pipeline Builder** — a highly sophisticated, aesthetically premium, and feature-complete **Node-Based Execution Environment**.

Designed for developers, engineers, and domain experts, VectorShift allows users to visually construct, manage, personalize, and analyze **directed acyclic graphs (DAGs)** representing complex execution pipelines. Whether you are building Agentic LLM flows, orchestrating multi-step API chains, or constructing complex data extraction workflows, this platform provides a **live, real-time simulated execution environment** natively within your browser. 

The core philosophy of VectorShift is to bridge the gap between abstract algorithmic programming and intuitive visual workflow orchestration, without compromising on power or flexibility.

---

## ⚡ 2. Dynamic Execution & Real-Time Orchestration

The platform transcends traditional static DAG validation, introducing a fully interactive, real-time execution engine.

- **Streaming LLM Output ([SSE Integration])**: Live, token-by-token streaming of Large Language Model generations. Rendered seamlessly onto the frontend via FastAPI Server-Sent Events (SSE). Watch your agents think, type, and respond in real-time.
- **Live Cost & Token Dashboard**: An integrated tracking system monitors in-flight token usage in real-time. Dynamically calculates estimated USD costs using model-specific pricing data, preventing bill shock during heavy LLM workflows.
- **Human-in-the-Loop (HITL) Execution**: Workflows can intelligently pause execution, requesting manual human approval or dynamic user inputs before progressing. Ensures high-fidelity control over autonomous sequences and potentially destructive actions.
- **Live Data Previews**: Inspect exactly what payloads, JSON objects, and textual data are flowing between nodes via interactive Data Preview Modals and dynamic Terminal UI streaming. 
- **Animated Simulated Execution**: Exquisite visual feedback paths utilizing animated ReactFlow edge states. A built-in terminal processes execution logs using robust topological sorting logic, allowing you to debug flows easily.

---

## ✨ 3. Premium Core Features & UX

- **Spotlight Command Palette (`Ctrl/Cmd + K`)**
  A beautifully designed spotlight-style modal that captures global keyboard shortcuts, enabling instant text-based searches and dynamic node spawning exactly where the viewport is focused.
  
- **Centralized Configuration Sidebar**
  Deep node configurations are abstracted away into a collapsible, right-hand property inspector sidebar. This ensures the canvas remains pristine, and nodes remain beautifully compact while neatly integrating global API key management securely.
  
- **Intelligent Template Gallery**
  Instantly bootstrap your workspace. Load pre-configured JSON schema templates—such as Customer Support Bots, QA RAG pipelines, or Sequential Data extractors—directly onto the ReactFlow canvas with a single click.

- **Premium Interface Ecosystem & Dark Mode**
  Leveraging TailwindCSS deep color tokens and Framer Motion micro-animations to deliver a modern glassmorphic aesthetic, buttery smooth transitions, and a meticulously crafted deep Dark Mode environment.

---

## 🧩 4. Comprehensive Node Ecosystem

VectorShift ships with a robust library of functional nodes, spanning various domains of computation. They are categorized neatly in the builder:

### 📥 Inputs & Outputs
- **Input Node**: The entry point for passing user queries or programmatic arguments into the pipeline.
- **Output Node**: The finale of a sequence, collecting terminal data and presenting it back to the user or caller. 
- **Text Area Node**: For statically declared large text blobs or system prompts.

### 🤖 Artificial Intelligence (LLMs & Image Gen)
- **LLM Node**: Connects to the robust OpenRouter ecosystem. Supports streaming, dynamic system prompt injection, and granular temperature/parameter control.
- **Image Generation Node**: Hooks into vision models (e.g., DALL-E) to dynamically output generated image URLs directly into the pipeline flow.

### 🌐 Integrations (Search & APIs)
- **Tavily Search Node**: A hyper-optimized search orchestration node capable of gathering, summarizing, and routing modern web data into your LLMs.
- **HTTP/API Node**: Construct custom GET/POST requests dynamically. Chain multiple API calls and inject outputs into downstream nodes.

### ⚙️ Logic & Conditionals
- **Router Node**: Conditionally route the flow of execution based on specific Regex matches or string inclusions. Acts as the control-flow mechanism of your DAG.
- **Math Node**: Perform rapid mathematical aggregations, basic algebra, or array-based calculations.

### 🐍 Code Execution (Data Processing)
- **Python Execution Node**: Safely run and transform data using a lightweight Python evaluator, manipulating JSON objects mid-flight between nodes without leaving the canvas.

---

## 🏗️ 5. Architectural Innovations

Built with **Separation of Concerns**, **Domain-Driven Design**, and extensive **Modularity**:

- **Dynamic Registry Pattern**: Node behaviors, metadata, structure, and visuals are fully mapped via a centralized `registry/`. Extending the platform just requires adding functional Node definitions into the registry list — instantly propagating to the Sidebar, Command Palette, and Canvas capabilities.
- **Abstracted Service Layer**: Complex Python algorithmic routines (DAG cyclic checks, topological sorting, runtime execution streams) are cleanly abstracted into pure business logic modules (`execution_service.py`, `graph_service.py`). Fast API routers remain lightweight.
- **Granular State Slicing**: Utilizing **Zustand** alongside `zundo` for robust undo/redo capabilities. Distinct stores like `canvasSlice`, `executionSlice`, and `uiSlice` prevent unnecessary React prop-drilling and rendering bottlenecks.
- **Robust API & Execution Security**: Granular `NodeErrorBoundary` React elements protect UI stability. Strict Pydantic models on the backend explicitly validate request payloads. Rate limiting via SlowAPI prevents backend exploitation entirely.

### Directory Structure Topology

```text
📦 VectorShift-Frontend
├── 📂 backend
│    ├── 📂 api/v1/routers/    # API endpoints (Validation, Execution SSE, Models, Persistence)
│    ├── 📂 domain/            # Strict Pydantic schemas enforcing request validation
│    ├── 📂 services/          # Core Business Logic (Execution Engine, Graph/DAG, SQLite Store)
│    ├── 📄 main.py            # FastAPI entry point, Middleware & Rate limiting configuration
│    └── 📄 pipelines.db       # Embedded SQLite persistence store
│
└── 📂 frontend
     ├── 📂 src
     │    ├── 📂 api/          # Axios interceptors & backend API definitions
     │    ├── 📂 components/   # Pure UI Partials (Command Palette, Terminal, Sidebar)
     │    ├── 📂 hooks/        # Intelligent React Hooks (Store bindings, event listeners)
     │    ├── 📂 nodes/        # ReactFlow Custom Node Definitions Ecosystem
     │    ├── 📂 registry/     # Centralized Dictionary Pattern mapping Node architectures
     │    ├── 📂 store/        # Zustand global state (Canvas, Execution, UI slices)
     │    ├── 📂 templates/    # Immutable JSON configurations for pipeline templates
     │    └── 📂 utils/        # Generic layout algorithms (Dagre) and formatting helpers
     └── 📄 tailwind.config.js # Strict UI design tokens
```

---

## 📖 6. User Guide: Building Your First Pipeline

1. **Open the Canvas**: Navigate to `http://localhost:3000`. You'll be presented with a blank workspace.
2. **Spawn Nodes**: Press `Cmd/Ctrl + K` to open the Command Palette. Type "Input" and press Enter. A new Input node will spawn in the center of the canvas. 
3. **Configure & Connect**: Spawn an "LLM Node" and an "Output Node". Click and drag from the right handle of the Input Node to the left handle of the LLM Node. Connect the LLM Node to the Output Node.
4. **Input Settings**: Click on a Node. On the right-hand sidebar, enter your API key or configure strict model inputs (e.g., set System Prompts or modify the Model version). 
5. **Execute**: From the top navigation, hit **"Run Execution"**. The built-in terminal will slide up from the bottom, showing topological progression, while the final generative output streams back live.

---

## 🏎️ 7. Performance Optimizations

1. **Memoization Parity**: Aggressive adoption of React `useMemo` and `useCallback` completely freezes unaffected ReactFlow UI components, constraining React rendering cycles purely to active components.
2. **Topological Graph Computing**: The backend leverages `networkx` to compute valid topological routes instantly, isolating dead graphs and detecting cyclic flow exceptions precisely prior to expensive API execution.
3. **Database Persistence Cache**: Auto-saving capabilities integrated fluidly via `aiosqlite` ensures the user's pipeline states persist securely without pausing or interrupting active canvas visualizations.

---

## 🛠️ 8. Tech Stack Overview

| Area | Technologies |
|---|---|
| **Frontend Framework** | React 18, React Router v6 |
| **State Orchestration** | Zustand, Zundo (Time Travel) |
| **UI Ecosystem** | TailwindCSS, Framer Motion, Lucide React, clsx, tailwind-merge |
| **Pipeline UI** | React Flow 11, Dagre (Auto-Layout) |
| **Backend Engine** | Python 3, FastAPI, Uvicorn |
| **Graph Algebra** | NetworkX |
| **Streaming & APIs** | Server-Sent Events (SSE), HTTPX, Pydantic, SlowAPI |
| **Database** | aiosqlite (SQLite Async) |

---

## 💻 9. Setup & Installation Guide

Launch the scalable VectorShift environment seamlessly on your local machine.

### 1. Clone the Repository
```bash
git clone https://github.com/Vasu657/VectorShift-Frontend.git
cd VectorShift-Frontend
```

### 2. Start Backend API Layer (FastAPI)
```bash
cd backend

# Create Virtual Environment & Activate
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

# Install Dependencies
pip install -r requirements.txt

# Start the Application Module
python -m uvicorn main:app --reload
```
> The robust API validation & execution server will mount at `http://localhost:8000`

### 3. Start Frontend Client (React)
Open a new terminal session.
```bash
cd frontend

# Install Dependencies securely
npm install

# Launch Dev Server
npm start
```
> The highly interactive Web Application UI starts automatically at `http://localhost:3000`

---

## 🎯 10. Future Roadmap

- **Multi-Agent Workflows**: Support for circular, stateful agent conversational graphs (vs just DAGs).
- **Environment Management**: Create separate Dev, Staging, and Production environments for deployed endpoint pipelines.
- **Version Control**: Git-style commit history and visual diffs of pipeline states.
- **Self-Hosted LLMs**: Deeper connection integrations with local Ollama or vLLM instances for privacy-compliant deployments.

---

## 🤝 11. Contributing

We welcome contributions from the community! 
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 12. License & Acknowledgements

Distributed under the MIT License. See `LICENSE` for more information.

VectorShift demonstrates exhaustive foundational platform architecture, highly scalable state handling, sophisticated aesthetic standards, and powerful real-time execution capabilities. Thank you for assessing the VectorShift advanced Node-Based Pipeline engine!
