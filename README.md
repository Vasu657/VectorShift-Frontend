# VectorShift - Advanced Pipeline Builder

--------------------------------------------------
## 1. Project Overview
--------------------------------------------------
Welcome to the **Advanced Pipeline Builder**, a highly sophisticated, beautifully designed, and feature-complete Node-Based Pipeline Builder workspace. 

Its primary purpose is to allow users to visually construct, manage, and analyze directed acyclic graphs (DAGs) representing complex pipelines, such as LLM execution flows or data processing workflows. The application targets advanced orchestration and rapid prototyping capabilities, providing developers and domain experts with a live, simulated execution environment right within the browser.

--------------------------------------------------
## 2. Dynamic Execution & Orchestration
--------------------------------------------------
The builder has been engineered to go far beyond static DAG validation. It now supports a fully interactive, real-time advanced execution environment:

- **Streaming LLM Output:** Live, token-by-token streaming of LLM generations directly visualized on the frontend, using Server-Sent Events (SSE) from the FastAPI backend.
- **Live Cost & Token Tracking:** An integrated dashboard dynamically tracks in-flight token usage and calculates estimated USD costs per interaction using model-specific pricing data.
- **Human-in-the-Loop (HITL):** Pipeline execution can pause dynamically to request user input or manual approval, ensuring safe and controllable workflow progression.
- **Live Data Previews:** Real-time visibility into the exact payload data flowing between nodes, allowing deep inspection of graph state at any execution step.
- **Dynamic Simulated Execution & Terminal Streaming:** Elaborate visual feedback showing flow paths with animated ReactFlow CSS traits, while detailed topological analysis and execution logs stream directly into a styled Terminal UI.

--------------------------------------------------
## 3. Core Features & UX
--------------------------------------------------

- **Command Palette (`Ctrl+K`)**
  - A Spotlight-inspired quick-lookup modal that captures global keyboard shortcuts, allowing instant text-based searching and spawning of nodes at the center of the viewport without relying on slow drag-and-drop operations.

- **Configuration Sidebar & Settings Panel**
  - Complex object configurations are extracted to a collapsible right-hand property inspector sidebar, keeping the canvas neat and nodes compact. Settings also include global API key management for seamless LLM and external service integrations.

- **Template Gallery**
  - Pre-loaded JSON schema DAGs that instantly bulk-populate the ReactFlow canvas environment (e.g., Simple Chatbots, RAG Pipelines, Complex Data Extraction).

- **Premium Interface & Dark Mode**
  - TailwindCSS deep color tokens integrated with Framer Motion transitions create fluid toggling and glassmorphic elevations across nodes.

--------------------------------------------------
## 4. Architectural Innovations
--------------------------------------------------
The project promotes **Separation of Concerns**, **Domain-Driven Design**, and robust **Modularization**:

- **Registry Pattern:** Node behavior and visuals are mapped through a centralized `registry/`, meaning extending the app requires simply registering the new class map, instantly propagating to menus and canvases automatically.
- **Service Layer Abstraction:** Python algorithmic DAG checks and execution pipelines are abstracted into dedicated backend services (`graph_service.py`, `execution_service.py`), keeping FastAPI routers clean.
- **State Management:** Uses **Zustand (`store.js`)** to prevent deep prop-drilling, creating a predictable global store for UI components and pipeline state.
- **Error Handling:** Granular `NodeErrorBoundary` elements and robust backend Pydantic validation ensure app stability and graceful degradation.

### Project Structure Tree

```text
├── frontend/src/
│    ├── api/                 # Axios configuration and API interceptors
│    ├── components/          # Reusable UI partials (Command Palette, Sidebar, Terminals)
│    ├── hooks/               # Custom lifecycle & interaction hooks 
│    ├── nodes/               # Node implementations (BaseNode, LLM, ImageGen, textNode)
│    ├── registry/            # Centralized dictionary pattern for mapping Node types
│    ├── store/               # Zustand global state slices
│    ├── templates/           # Static JSON pipeline boilerplate
│    └── utils/               # Formatting helper functions
│
└── backend/
     ├── api/v1/routers/      # API endpoints (Validation, Execution, SSE Streaming)
     ├── domain/              # Pydantic schemas enforcing strict payload validation
     ├── services/            # Pure Python business/graph logic (Execution Engine, DAG info)
     └── main.py              # FastAPI application core with Middleware
```

--------------------------------------------------
## 5. Performance Optimizations
--------------------------------------------------
- **Memoization & Rendering Parity:** Deep adoption of `useMemo` and `useCallback` to completely freeze unaffected Node UI elements, minimizing ReactFlow render cycles.
- **State Slicing Optimization:** Dividing `store.js` into functional contexts ensures canvas interactions (zooming/dragging) don't trigger unnecessary re-renders in other panels.
- **Algorithmic Graph Computing:** Backend leverages `networkx` to compute topological sorting, manage complex DAG validation, and orchestrate execution sequences efficiently.

--------------------------------------------------
## 6. Tech Stack
--------------------------------------------------
- **Frontend:** React 18, React Flow, Zustand, Framer Motion, TailwindCSS, Lucide React, Axios, Dagre
- **Backend:** Python 3, FastAPI, NetworkX, Uvicorn, SSE Starlette, Pydantic
- **Tooling:** ESLint, Prettier

--------------------------------------------------
## 7. Setup & Installation
--------------------------------------------------
### Clone Repository
```bash
git clone https://github.com/Vasu657/VectorShift-Frontend.git
cd VectorShift-Frontend
```

### Start Backend Services
```bash
cd backend
python -m venv venv
# On Windows: venv\Scripts\activate
# On Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn main:app --reload
```
*The API is now running at `http://localhost:8000`.*

### Start Frontend Client
```bash
cd frontend
npm install
npm start
```
*The Builder is now running at `http://localhost:3000`.*

--------------------------------------------------
## 8. Acknowledgements
--------------------------------------------------
Thank you for reviewing this advanced iteration of the Pipeline Builder!
