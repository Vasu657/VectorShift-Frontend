# VectorShift - Advanced Pipeline Builder

--------------------------------------------------
## 1. Project Overview
--------------------------------------------------
Welcome to the **Advanced Pipeline Builder**, a highly sophisticated, beautifully designed, and feature-complete Node-Based Pipeline Builder workspace. 

Its primary purpose is to allow users to visually construct, manage, and analyze directed acyclic graphs (DAGs) representing complex pipelines, such as LLM execution flows or data processing workflows. The application targets advanced orchestration and rapid prototyping capabilities, providing developers and domain experts with a live, simulated execution environment right within the browser.

--------------------------------------------------
## 2. Original Task Requirements
--------------------------------------------------
The initial technical assessment mandated building upon a provided React frontend and Python/FastAPI backend template to accomplish four main objectives:
- **Node Abstraction:** Refactor duplicated code for four default node types into a flexible abstraction, and create five entirely new nodes to demonstrate it.
- **Styling:** Design a cohesive, appealing UI from the ground up for the canvas and application components.
- **Text Node Logic:** Enhance the default Text Node to dynamically adjust its height and width as content grows, and parse valid JavaScript variable names wrapped in `{{ double_brackets }}` to generate dynamic ReactFlow target handles.
- **Backend Integration:** Wire up the frontend to send the finalized pipeline data to a FastAPI backend endpoint, calculating the total nodes, total edges, and verifying whether the pipeline conforms to a valid Directed Acyclic Graph (DAG), returning an alert with the results.

--------------------------------------------------
## 3. Enhanced & Newly Added Features
--------------------------------------------------
To push this implementation from a functional assignment to a production-ready application, several advanced features were architected:

- **Command Palette (`Ctrl+K`)**
  - *Why it was added:* Canvas interaction natively relies on slow drag-and-drop operations, which frustrates power users.
  - *Technical implementation:* Built a Spotlight-inspired quick-lookup modal that captures global keyboard shortcuts, allowing instant text-based searching and spawning of nodes at the center of the viewport.
  - *Benefit over original requirement:* Massively speeds up pipeline construction and navigation. 
  - *Impact:* Drastically improves overall UX scalability without cluttering the screen with toolbars.

- **Dynamic Simulated Execution & Terminal Streaming**
  - *Why it was added:* Displaying a generic browser `alert()` is highly disruptive and provides no contextual insight into the graph data.
  - *Technical implementation:* Clicking "Submit" locks the canvas, highlights flow paths using animated ReactFlow CSS traits, calculates network depth on the backend, and streams detailed topological analysis directly into a beautifully styled, slide-up Terminal UI (`ui.js` / `submit.js`).
  - *Benefit over original requirement:* Turns a static evaluation into a live, interactive environment mimicking real-world compiler or CI/CD pipelines.

- **Configuration Sidebar & Settings Panel**
  - *Why it was added:* Housing massive configuration forms directly on visual nodes ruins canvas layout formatting.
  - *Technical implementation:* Extracted complex object configurations to standard generic Input/Select primitives within `BaseNode`, linked tightly to Zustand state, which syncs seamlessly to a collapsible right-hand property inspector sidebar.
  - *Impact on scalability:* Developers can add dozens of configurations to new node types without blowing up the visualization dimensions of the node itself.

- **Template Gallery**
  - *Why it was added:* Demonstrating functionality requires building complex graphs repeatedly.
  - *Technical implementation:* Pre-loaded JSON schema DAGs that instantly bulk-populate the ReactFlow canvas environment and update global state, bypassing manual reconstruction.
  - *Benefit:* Reduces testing time and provides excellent onboarding boilerplate.

- **Premium Dark Mode Support**
  - *Why it was added:* Standard expectation for modern developer-focused tooling.
  - *Technical implementation:* TailwindCSS deep color tokens integrated with Framer Motion transitions create fluid toggling and glassmorphic elevations across nodes.

--------------------------------------------------
## 4. Advanced Architectural Improvements
--------------------------------------------------
The monolith template was entirely deconstructed to promote **Separation of Concerns**, **Domain-Driven Design**, and robust **Modularization**:

- **Folder Structure Improvements:** Components, hooks, utilities, API handlers, and node definitions were relocated into highly focused micro-directories.
- **Design Patterns Introduced:** 
  - **Registry Pattern:** Node behavior and visuals are mapped through a centralized `registry/`, meaning extending the app requires simply registering the new class map, instantly propagating to menus and canvases automatically via a single source of truth.
  - **Service Layer Abstraction:** Abstracted Python algorithmic DAG checks out of FastAPI Routers directly into `services/graph_service.py` to decouple web delivery from network math computation.
- **State Management:** Extracted deep prop-drilling into **Zustand (`store.js`)** creating a lightweight, predictable global store that selectively renders the UI components on slice updates.
- **Error Handling Strategy:** Integrated granular `NodeErrorBoundary` elements around independent Node implementations, guaranteeing that one malformed node definition will not crash the entire parent React tree.

### Project Structure Tree

```text
├── frontend/src/
│    ├── api/                 # Axios configuration and API interceptors
│    ├── components/          # Reusable UI partials (Command Palette, Sidebar, Terminals)
│    ├── hooks/               # Custom lifecycle & interaction hooks (shortcuts, resizing)
│    ├── nodes/               # Node implementations (BaseNode, textNode, custom wrappers)
│    ├── registry/            # Centralized dictionary pattern for mapping Node types
│    ├── store/               # Zustand global state slices
│    ├── templates/           # Static JSON pipeline boilerplate
│    └── utils/               # Pure formatting helper functions
│
└── backend/
     ├── api/v1/routers/      # API Versioning endpoints 
     ├── domain/              # Pydantic schemas enforcing strict payload validation
     ├── services/            # Pure Python business/graph logic (NetworkX, DAG algo)
     └── main.py              # FastAPI application core with Middleware/Rate-Limiting
```

--------------------------------------------------
## 5. Performance Optimizations
--------------------------------------------------
- **Memoization & Rendering Parity:** Deep adoption of `useMemo` and `useCallback` inside `BaseNode` hooks to completely freeze unaffected Node UI elements while adjacent inputs change, significantly reducing ReactFlow render cycles.
- **State Slicing Optimization:** By dividing `store.js` logic into functional contexts, zooming or dragging the canvas no longer re-renders Sidebar attributes.
- **Debouncing:** API validation logic and custom layout effects (like dynamically sizing the `textNode` based on bounding rect dimensions) utilize strict debounce handlers to avoid blocking browser painting cycles.
- **Algorithmic Graph Computing:** Backend graph traversal leverages `networkx`, an optimized C-backed Python library natively designed to handle highly complex DAG topologies in milliseconds. Specifically, DAG validation (`is_dag`) and execution planning run on a **Depth-First Search (DFS) based topological sorting algorithm** to accurately detect cycles and compute the longest network path.

--------------------------------------------------
## 6. Security Improvements
--------------------------------------------------
- **Backend Pydantic Validation:** The `domain` package enforces rigid schema-checking on incoming JSON node data, effectively sanitizing malformed graph structures before network processing.
- **Rate-Limiting (SlowAPI):** Critical HTTP processing pathways are throttled by IP-based rate limiting, defending against DDOS or API spam typical for unauthenticated SaaS platforms.
- **CORS Middleware Restrictions:** Tightly bound `CORSMiddleware` strictly whitelists explicit frontend local domains (`http://localhost:3000`).
- **Frontend Error Boundaries:** Gracefully isolated crashes obscure stack trace internals from generic users, logging them safely within the contextual execution terminal context.

--------------------------------------------------
## 7. Scalability & Future-Readiness
--------------------------------------------------
The environment is aggressively architected for extensibility:
- **Zero-Friction Extensibility:** Thanks to `BaseNode` taking generalized props map properties, simply defining a new node configuration inside `registry/` immediately grants it command-palette functionality, right-pane settings support, and visual UI formatting without writing a single line of React.
- **API Versioning Ready:** Current implementation acts under `/api/v1/pipelines/`. Because data models reside in `domain`, migrating to an advanced `/v2/` schema would not require altering generic infrastructure code.
- **Modular and Adaptable Backend:** Backend graph logic functions completely independent of web-service handling, allowing trivial migration into async queueing architectures (Celery, AWS SQS) for ultra-long-running node execution simulations in the future.

--------------------------------------------------
## 8. Tech Stack
--------------------------------------------------
- **Frontend Technologies:** React 18, React Flow, Zustand, Framer Motion, TailwindCSS, Lucide React, Axios, Dagre
- **Backend Technologies:** Python 3, FastAPI, NetworkX, Uvicorn, SlowAPI, Pydantic
- **Tooling:** ESLint, Prettier
- **Build Tools:** Create React App (Webpack, Babel)

--------------------------------------------------
## 9. Setup & Installation
--------------------------------------------------
### Clone Repository
```bash
git clone <repo-url>
cd <project-folder>
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
## 10. Acknowledgements
--------------------------------------------------
Thank you for the opportunity to complete this assessment and for taking the time to review my work! I thoroughly enjoyed building this advanced iteration and look forward to potentially discussing the architecture and design decisions with **Albert** and **Alex** in the next rounds.
