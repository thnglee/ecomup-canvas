# Development Plan: EcomUp Canvas

## 1. Tech Stack Decision

### Frontend: Next.js 14 (App Router)

**Why Next.js over plain React:**
- File-based routing (even though this is mostly a single-page app, auth pages and potential future pages benefit)
- Built-in API routes for any server-side logic (e.g., Supabase service-role operations)
- Optimized build with automatic code splitting
- Native Vercel deployment with zero config
- Server Components for the auth/login page (fast initial load)

**Key packages:**
- `next@14` — framework
- `react@18` — UI library
- `typescript` — type safety
- `tailwindcss@3` — styling (utility-first, fast to build dark theme)
- `zustand` — lightweight state management (simpler than Redux, perfect for canvas state)
- `@dnd-kit/core` + `@dnd-kit/sortable` — drag and drop from sidebar
- `react-markdown` + `remark-gfm` — markdown rendering for sticky notes

### Canvas Engine: Custom Canvas with React + SVG/HTML Overlay

**Evaluation of options:**

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **React Flow** | Excellent for node graphs, built-in edges/connectors, minimap | Opinionated node layout; styling custom node types is complex; heavy for simple use case | ❌ Too opinionated for our mixed-component needs |
| **Konva (react-konva)** | True canvas rendering, good performance, rich shape library | Everything is canvas-drawn (no native HTML in nodes); text editing requires custom implementation; accessibility poor | ❌ Too low-level, poor text/form support |
| **tldraw** | Full-featured canvas, excellent UX, open source | Very opinionated; hard to customize component types; large bundle | ❌ Too opinionated |
| **Custom (HTML/CSS transforms + SVG connectors)** | Full control; native HTML for components (forms, tables work natively); CSS transforms for pan/zoom; SVG layer for connectors | Must implement pan/zoom/selection ourselves | ✅ Best fit |

**Custom canvas architecture:**
```
┌─ Viewport Container (overflow: hidden) ────────────────┐
│                                                          │
│  ┌─ Transform Layer (CSS transform: translate + scale) ─┐│
│  │                                                       ││
│  │  ┌─ Grid Layer (CSS background) ───────────────────┐ ││
│  │  │  Dot grid pattern via CSS radial-gradient        │ ││
│  │  └─────────────────────────────────────────────────┘ ││
│  │                                                       ││
│  │  ┌─ Zone Layer (HTML divs, low z-index) ───────────┐ ││
│  │  │  Zones rendered as positioned divs               │ ││
│  │  └─────────────────────────────────────────────────┘ ││
│  │                                                       ││
│  │  ┌─ SVG Layer (connectors) ────────────────────────┐ ││
│  │  │  <svg> with <line>/<path> elements               │ ││
│  │  └─────────────────────────────────────────────────┘ ││
│  │                                                       ││
│  │  ┌─ Component Layer (HTML divs, high z-index) ─────┐ ││
│  │  │  Components rendered as absolutely positioned     │ ││
│  │  │  React components with native HTML                │ ││
│  │  └─────────────────────────────────────────────────┘ ││
│  │                                                       ││
│  └───────────────────────────────────────────────────────┘│
│                                                          │
│  ┌─ Selection Layer (overlay, pointer-events: none) ────┐│
│  │  Selection box rectangle                              ││
│  └──────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────┘
```

**Pan/Zoom implementation:**
- Track `viewportX`, `viewportY`, `zoom` in Zustand store
- Apply to transform layer: `transform: translate(${x}px, ${y}px) scale(${zoom})`
- Use `will-change: transform` for GPU acceleration
- Zoom toward cursor: calculate cursor position in canvas space, apply zoom, adjust translate to keep cursor point fixed
- All event handling on the viewport container

### Backend: Supabase

**Why Supabase:**
- PostgreSQL with JSONB support (perfect for flexible component data)
- Built-in Auth (email/password)
- Row Level Security (data isolation without custom backend)
- JavaScript client with typed queries
- Realtime subscriptions (not needed now, but available if multi-user is added later)
- Storage for image uploads
- Free tier sufficient for single-user app

**Key packages:**
- `@supabase/supabase-js` — client library
- `@supabase/auth-helpers-nextjs` — auth middleware

### Hosting: Vercel

**Why Vercel:**
- Zero-config Next.js deployment
- Automatic preview deployments on PR
- Edge functions if needed
- Free tier sufficient

### State Management: Zustand

**Why Zustand over Redux/Context:**
- Minimal boilerplate — one file for the entire canvas store
- No providers needed — access state from anywhere
- Built-in subscriptions — components only re-render when their slice changes
- Middleware: `immer` for immutable updates, `devtools` for debugging
- Perfect for canvas state: high-frequency updates (drag, zoom) need selective re-rendering

**Store structure:**
```typescript
interface CanvasStore {
  // Viewport
  viewport: { x: number; y: number; zoom: number };
  setViewport: (v: Partial<Viewport>) => void;

  // Components
  components: Map<string, CanvasComponent>;
  addComponent: (c: CanvasComponent) => void;
  updateComponent: (id: string, updates: Partial<CanvasComponent>) => void;
  deleteComponents: (ids: string[]) => void;

  // Zones
  zones: Map<string, Zone>;
  addZone: (z: Zone) => void;
  updateZone: (id: string, updates: Partial<Zone>) => void;
  deleteZone: (id: string) => void;

  // Connectors
  connectors: Map<string, Connector>;
  addConnector: (c: Connector) => void;
  updateConnector: (id: string, updates: Partial<Connector>) => void;
  deleteConnector: (id: string) => void;

  // Selection
  selectedIds: Set<string>;
  select: (id: string, multi?: boolean) => void;
  selectAll: () => void;
  deselectAll: () => void;

  // UI State
  sidebarCollapsed: boolean;
  minimapVisible: boolean;
  snapToGrid: boolean;
  activeTool: 'select' | 'zone' | 'connector';

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}
```

---

## 2. Project Structure

```
ecomup/
├── public/
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout (Inter font, dark theme)
│   │   ├── page.tsx                # Main canvas page (protected)
│   │   ├── login/
│   │   │   └── page.tsx            # Login page
│   │   └── globals.css             # Tailwind + custom CSS vars
│   │
│   ├── components/
│   │   ├── header/
│   │   │   └── WorldClockBar.tsx   # Clock header component
│   │   │
│   │   ├── sidebar/
│   │   │   ├── Sidebar.tsx         # Sidebar container
│   │   │   └── ComponentCard.tsx   # Draggable component card
│   │   │
│   │   ├── canvas/
│   │   │   ├── Canvas.tsx          # Main canvas viewport
│   │   │   ├── GridBackground.tsx  # Dot grid CSS pattern
│   │   │   ├── TransformLayer.tsx  # Pan/zoom transform wrapper
│   │   │   ├── SelectionBox.tsx    # Drag-select rectangle
│   │   │   ├── Minimap.tsx         # Minimap overlay
│   │   │   └── StatusBar.tsx       # Bottom status bar (zoom %, save status)
│   │   │
│   │   ├── nodes/                  # Canvas component renderers
│   │   │   ├── NodeWrapper.tsx     # Shared wrapper (position, resize, select)
│   │   │   ├── LinkBox.tsx
│   │   │   ├── DataTable.tsx
│   │   │   ├── StickyNote.tsx
│   │   │   ├── ProcessBlock.tsx
│   │   │   └── ImageBadge.tsx
│   │   │
│   │   ├── connectors/
│   │   │   ├── ConnectorLayer.tsx  # SVG overlay for all connectors
│   │   │   ├── ConnectorLine.tsx   # Single connector renderer
│   │   │   └── ConnectionPoint.tsx # Anchor dot on components
│   │   │
│   │   ├── zones/
│   │   │   └── Zone.tsx            # Zone rectangle renderer
│   │   │
│   │   ├── editors/                # Edit panels/modals for each type
│   │   │   ├── LinkBoxEditor.tsx
│   │   │   ├── DataTableEditor.tsx
│   │   │   ├── StickyNoteEditor.tsx
│   │   │   ├── ProcessBlockEditor.tsx
│   │   │   └── ImageEditor.tsx
│   │   │
│   │   └── ui/                     # Shared UI primitives
│   │       ├── ContextMenu.tsx
│   │       ├── FloatingToolbar.tsx
│   │       ├── Toast.tsx
│   │       ├── Modal.tsx
│   │       └── Tooltip.tsx
│   │
│   ├── stores/
│   │   ├── canvasStore.ts          # Zustand store (main state)
│   │   ├── undoStore.ts            # Undo/redo middleware
│   │   └── uiStore.ts             # UI-only state (modals, tooltips)
│   │
│   ├── hooks/
│   │   ├── useCanvasEvents.ts      # Pan, zoom, click, keyboard handler
│   │   ├── useDragDrop.ts          # Sidebar-to-canvas drag logic
│   │   ├── useAutoSave.ts          # Debounced save to Supabase
│   │   ├── useKeyboardShortcuts.ts # Global keyboard shortcuts
│   │   ├── useViewportCulling.ts   # Determine visible components
│   │   └── useConnectorDraw.ts     # Drawing new connectors
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts           # Supabase browser client
│   │   │   ├── server.ts           # Supabase server client (SSR)
│   │   │   └── middleware.ts       # Auth middleware
│   │   ├── canvas/
│   │   │   ├── math.ts             # Coordinate transforms, zoom math
│   │   │   ├── grid.ts             # Snap-to-grid calculations
│   │   │   ├── selection.ts        # Hit testing, box selection
│   │   │   └── zone.ts             # Zone containment logic
│   │   └── constants.ts            # Colors, sizes, presets
│   │
│   └── types/
│       ├── canvas.ts               # CanvasComponent, Zone, Connector types
│       ├── components.ts           # LinkBoxData, DataTableData, etc.
│       └── database.ts             # Supabase generated types
│
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # Database schema
│
├── .env.local                      # NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 3. Development Phases

### Phase 1: Foundation (Sprint 1–2)

**Goal:** Bare canvas with pan/zoom, grid background, basic project scaffolding, Supabase connected.

#### Sprint 1: Project Setup & Canvas Core

**Tasks:**

| # | Task | Details | Effort |
|---|------|---------|--------|
| 1.1 | Initialize Next.js project | `npx create-next-app@14 --typescript --tailwind --app --src-dir` | 0.5h |
| 1.2 | Configure Tailwind dark theme | Set up `globals.css` with dark color palette, Inter + JetBrains Mono fonts | 1h |
| 1.3 | Create layout structure | Root layout with header slot, sidebar slot, main canvas area. Fixed positioning. | 2h |
| 1.4 | Build World Clock Bar | 7 clocks, `Intl.DateTimeFormat`, 1-second interval update, flag emojis. Component: `WorldClockBar.tsx` | 2h |
| 1.5 | Implement Canvas viewport | `Canvas.tsx` — overflow hidden container. `TransformLayer.tsx` — CSS transform div. Track viewport in Zustand. | 3h |
| 1.6 | Implement pan | Middle mouse button drag + Space+Left click. Update `viewport.x/y` on mousemove. Cursor changes. | 3h |
| 1.7 | Implement zoom | Scroll wheel zoom toward cursor position. Clamp 0.1–4.0. Smooth interpolation. Pinch gesture via `wheel` event with `ctrlKey`. | 3h |
| 1.8 | Implement grid background | CSS `radial-gradient` for dot grid. Scale with zoom. Color #333 on #1a1a1a. | 1h |
| 1.9 | Add StatusBar | Bottom bar showing zoom percentage, snap-to-grid toggle. | 1h |

**Sprint 1 total: ~16.5h**

#### Sprint 2: Supabase Setup & Basic Persistence

| # | Task | Details | Effort |
|---|------|---------|--------|
| 2.1 | Create Supabase project | Set up project on supabase.com, get URL + anon key | 0.5h |
| 2.2 | Run database migration | Execute `001_initial_schema.sql` — tables, RLS, triggers, indexes | 1h |
| 2.3 | Set up Supabase client | `@supabase/supabase-js` + `@supabase/auth-helpers-nextjs`. Browser client + server client + middleware. | 2h |
| 2.4 | Implement auth (login page) | Simple email/password login page. Redirect to canvas on success. Auth middleware to protect canvas route. | 3h |
| 2.5 | Create Zustand canvas store | Full store with types: components (Map), zones (Map), connectors (Map), viewport, selection, UI state. | 3h |
| 2.6 | Implement data loading | On canvas mount: fetch canvas_state, components, zones, connectors from Supabase → hydrate Zustand store. Loading skeleton. | 2h |
| 2.7 | Implement auto-save hook | `useAutoSave.ts` — watch store changes, debounce 500ms, batch upserts to Supabase. Save indicator UI. | 3h |
| 2.8 | Save/restore viewport | Save viewport position + zoom on change. Restore on page load. | 1h |
| 2.9 | Generate TypeScript types | `supabase gen types typescript` → `types/database.ts` | 0.5h |

**Sprint 2 total: ~16h**

#### Phase 1 Definition of Done:
- [ ] App loads at `/` with login redirect
- [ ] After login, canvas is displayed with dark dot grid
- [ ] User can pan (middle mouse + space+click) and zoom (scroll wheel + pinch)
- [ ] Zoom follows cursor position, not center
- [ ] Grid scales with zoom
- [ ] World clock bar shows all 7 timezones updating every second
- [ ] StatusBar shows current zoom level
- [ ] Supabase tables exist with RLS
- [ ] Viewport position persists across page reloads
- [ ] Auto-save indicator works (Saving... → Saved)

---

### Phase 2: Components (Sprint 3–4)

**Goal:** Sidebar with all 5 component types, drag-and-drop creation, component rendering, editing, selection.

#### Sprint 3: Sidebar, Drag-Drop, First Components

| # | Task | Details | Effort |
|---|------|---------|--------|
| 3.1 | Build Sidebar | Collapsible sidebar (260px). Component cards with icon, name, description. Search/filter input. | 3h |
| 3.2 | Implement drag-from-sidebar | `@dnd-kit/core` — drag component card from sidebar, drop on canvas. Convert screen coords to canvas coords (accounting for viewport transform). Create ghost preview. | 4h |
| 3.3 | Build NodeWrapper | Shared wrapper for all components: absolute positioning, resize handles (8 points), selection border, drag to move. | 4h |
| 3.4 | Implement component selection | Click to select. Shift+Click for multi-select. Selection box (drag on empty area). Selected state styling (blue border). | 3h |
| 3.5 | Implement snap-to-grid | When dragging/resizing, snap position to nearest 20px grid point. Respect toggle. | 1.5h |
| 3.6 | Build LinkBox component | Render: icon, title, description, external link indicator. Ctrl+Click opens URL. | 2h |
| 3.7 | Build LinkBoxEditor | Edit panel/modal: title, description, URL, icon picker (preset + emoji), color accent picker. | 2h |
| 3.8 | Build StickyNote component | Render: colored card with markdown content. `react-markdown` for rendering. | 2h |
| 3.9 | Build StickyNoteEditor | Textarea for markdown input with live preview. Color picker. Font size selector. | 2h |
| 3.10 | Build FloatingToolbar | Small toolbar above selected component(s): Edit, Duplicate, Delete buttons. | 2h |

**Sprint 3 total: ~25.5h**

#### Sprint 4: Remaining Components & Edit Flows

| # | Task | Details | Effort |
|---|------|---------|--------|
| 4.1 | Build DataTable component | Render: table with header row, alternating row colors, monospace font, horizontal scroll. | 3h |
| 4.2 | Build DataTableEditor | Full table editor: click cell to edit, Tab/Enter navigation, add/delete rows and columns, right-click menus. | 5h |
| 4.3 | Build ProcessBlock component | Render: colored rounded rect based on block_type, title, description, link icon. 4 connection points on edges. | 3h |
| 4.4 | Build ProcessBlockEditor | Edit: title, description, block_type dropdown, optional URL. | 1.5h |
| 4.5 | Build ImageBadge component | Render: image within bounds, aspect ratio maintained. Upload flow + URL paste. Loading/error states. | 3h |
| 4.6 | Build ImageEditor | Upload file to Supabase Storage, or paste URL. Alt text field. | 2h |
| 4.7 | Set up Supabase Storage bucket | Create `component-images` bucket, configure max size 5MB, allowed MIME types. RLS policy. | 1h |
| 4.8 | Implement context menu | Right-click on component: Edit, Duplicate, Delete, Bring to Front, Send to Back. Right-click on canvas: Paste (if copied). | 3h |
| 4.9 | Implement duplicate | Ctrl+D or context menu. Clone component with +20px offset. Save to Supabase. | 1.5h |
| 4.10 | Implement delete with undo toast | Delete selected → remove from store → show toast "Deleted. Undo?" for 5 seconds → if undo clicked, restore. If not, delete from Supabase. | 2h |
| 4.11 | Implement z-index management | Bring to Front / Send to Back — update z_index values. | 1h |

**Sprint 4 total: ~26h**

#### Phase 2 Definition of Done:
- [ ] Sidebar shows all 5 component types with search
- [ ] Dragging from sidebar creates component on canvas at drop position
- [ ] Edit modal/panel opens on component creation
- [ ] All 5 component types render correctly with dark theme
- [ ] LinkBox: displays icon, title, desc; Ctrl+Click opens URL
- [ ] DataTable: renders table with headers/rows; inline cell editing works
- [ ] StickyNote: renders markdown; color and font size changeable
- [ ] ProcessBlock: renders with type-based coloring; shows connection points on hover
- [ ] Image: renders image with aspect ratio; upload to Supabase Storage works
- [ ] Selection: click, shift-click, selection box all work
- [ ] Floating toolbar appears on selection
- [ ] Context menu works with all options
- [ ] Duplicate and delete work (delete has undo toast)
- [ ] All CRUD operations persist to Supabase

---

### Phase 3: Connectors & Zones (Sprint 5)

**Goal:** Draw connectors between components, create zones for grouping, group-move behavior.

#### Sprint 5: Connectors & Zones

| # | Task | Details | Effort |
|---|------|---------|--------|
| 5.1 | Build ConnectionPoint component | Small circles (6px) on each edge of components. Visible on hover or when connector tool is active. | 2h |
| 5.2 | Implement connector drawing | Click connection point → drag → hover over target component's connection point → release to create connector. Visual feedback during draw (preview line follows cursor). | 4h |
| 5.3 | Build ConnectorLayer (SVG) | SVG overlay covering entire canvas (same transform as components). Renders all connectors as `<line>` elements. | 2h |
| 5.4 | Build ConnectorLine renderer | Render line/arrow/bidirectional. Arrowhead via SVG marker. Solid/dashed via `stroke-dasharray`. Color. | 2h |
| 5.5 | Implement connector auto-update | When a connected component moves, recalculate connector start/end points based on anchor positions. | 2h |
| 5.6 | Implement connector label | Double-click on connector midpoint → show text input. Label renders with dark background pill. | 2h |
| 5.7 | Implement connector selection & edit | Click on connector to select. Context menu: change type, style, color, delete. | 2h |
| 5.8 | Build Zone component | Render: positioned div with semi-transparent background, name label at top-left. Resizable (corner/edge handles). | 3h |
| 5.9 | Implement zone creation | Toolbar "Add Zone" button → enter zone-draw mode → click+drag on canvas to define rectangle → zone created with default name. | 2h |
| 5.10 | Implement zone naming | Double-click zone label to edit name. | 0.5h |
| 5.11 | Implement zone group-move | When zone is dragged: find all components whose center point is inside the zone → move them by the same delta. Update `zone_id` on components based on containment. | 3h |
| 5.12 | Implement zone deletion | Delete zone → components inside are NOT deleted, just `zone_id` set to null. | 0.5h |
| 5.13 | Zone z-index layering | Zones always render below components. Zone z-index starts at -1000. | 0.5h |

**Sprint 5 total: ~25.5h**

#### Phase 3 Definition of Done:
- [ ] Connection points visible on component hover
- [ ] Dragging from connection point creates a connector with visual preview
- [ ] Connectors render as lines/arrows between components
- [ ] Connectors update position when components are moved
- [ ] Connector labels work (double-click to add/edit)
- [ ] Connectors are selectable and deletable
- [ ] Connector type/style/color changeable via context menu
- [ ] Deleting a component deletes its connectors
- [ ] Zones can be created by draw-drag
- [ ] Zone names are editable
- [ ] Zones render below components with semi-transparent fill
- [ ] Moving a zone moves its contained components
- [ ] Zones are resizable and deletable
- [ ] All connectors and zones persist to Supabase

---

### Phase 4: Polish (Sprint 6)

**Goal:** Undo/redo, keyboard shortcuts, minimap, performance optimization, UX polish.

#### Sprint 6: Polish & Optimization

| # | Task | Details | Effort |
|---|------|---------|--------|
| 6.1 | Implement undo/redo system | Zustand middleware that tracks action history. Each action stores previous state snapshot (or inverse operation). 50-action depth. Batch drag operations. | 4h |
| 6.2 | Implement keyboard shortcuts | `useKeyboardShortcuts.ts` — global event listener. All shortcuts from PRD. Disable when input focused. Space for pan mode. | 3h |
| 6.3 | Build Minimap | Render all components as tiny colored rectangles. Show viewport rectangle. Click to jump. Drag to pan. Collapsible. | 4h |
| 6.4 | Implement viewport culling | `useViewportCulling.ts` — compute visible bounds (viewport + 200px buffer). Only render components within bounds. Recalculate on pan/zoom. | 3h |
| 6.5 | Performance audit & optimization | Profile with Chrome DevTools. Ensure 60fps during pan/zoom with 200 components. Optimize re-renders (React.memo, useMemo). | 3h |
| 6.6 | Implement Ctrl+0 (reset zoom) and Ctrl+1 (fit all) | Reset zoom: set zoom to 1.0, center on (0,0). Fit all: calculate bounding box of all components, set viewport to show all with padding. | 1.5h |
| 6.7 | Add loading states | Skeleton loaders for initial data fetch. Component creation animation. Smooth transitions. | 2h |
| 6.8 | Error handling | Toast notifications for save errors. Retry logic. Graceful degradation if Supabase is unreachable. | 2h |
| 6.9 | UX polish pass | Cursor states (grab, grabbing, crosshair, pointer). Hover animations. Transition timing. Focus rings for accessibility. | 2h |
| 6.10 | Cross-browser testing | Test on Chrome, Edge, Safari. Fix any rendering issues. | 2h |

**Sprint 6 total: ~26.5h**

#### Phase 4 Definition of Done:
- [ ] Ctrl+Z undoes last action; Ctrl+Shift+Z redoes
- [ ] Undo works for: create, delete, move, resize, edit, connector changes
- [ ] All keyboard shortcuts from PRD work correctly
- [ ] Minimap shows overview and supports click-to-jump
- [ ] Canvas renders at 60fps with 200 components during pan/zoom
- [ ] Viewport culling: components outside viewport are not in DOM
- [ ] Loading skeleton shown during initial data fetch
- [ ] Error toasts shown on save failure with retry
- [ ] Cursors change appropriately for all interaction modes
- [ ] Works correctly on Chrome and Edge

---

### Phase 5: Deploy & Data (Sprint 7)

**Goal:** Production deployment, auth hardening, initial data population, final testing.

#### Sprint 7: Ship It

| # | Task | Details | Effort |
|---|------|---------|--------|
| 7.1 | Vercel deployment | Connect GitHub repo to Vercel. Configure environment variables. Set up production domain. | 1h |
| 7.2 | Supabase production config | Confirm RLS policies. Set strong auth settings. Configure storage bucket policies. Enable database backups. | 1h |
| 7.3 | Environment configuration | Separate `.env.local` (dev) vs Vercel env vars (prod). Supabase URL + anon key. | 0.5h |
| 7.4 | Auth hardening | Rate limiting on login. Session management. Redirect flows (login → canvas → logout). | 1.5h |
| 7.5 | Export to JSON feature | "Export" button in toolbar → calls RPC `export_canvas` → downloads JSON file. | 2h |
| 7.6 | Initial data entry | Populate canvas with user's actual resources: all link boxes, data tables, sticky notes, process blocks from the prompt context. | 3h |
| 7.7 | End-to-end testing | Manual test all flows: create each component type, edit, move, connect, zone, delete, undo, reload persistence. | 3h |
| 7.8 | Performance final check | Load test with 200+ components. Lighthouse audit. Bundle size check. | 1h |
| 7.9 | Bug fixes & polish | Fix issues found during testing. | 3h |

**Sprint 7 total: ~16h**

#### Phase 5 Definition of Done:
- [ ] App is live on Vercel at production URL
- [ ] Login works with email/password
- [ ] All user's actual resources are on the canvas (links, tables, notes, processes)
- [ ] Canvas loads in < 2 seconds on production
- [ ] Export to JSON downloads complete canvas data
- [ ] No critical bugs
- [ ] RLS policies prevent unauthorized access

---

## 4. Task Summary

| Phase | Sprint | Hours | Key Deliverable |
|-------|--------|-------|-----------------|
| Phase 1: Foundation | Sprint 1 | 16.5h | Canvas with pan/zoom/grid |
| Phase 1: Foundation | Sprint 2 | 16h | Supabase connected, auth, auto-save |
| Phase 2: Components | Sprint 3 | 25.5h | Sidebar, drag-drop, LinkBox, StickyNote |
| Phase 2: Components | Sprint 4 | 26h | DataTable, ProcessBlock, Image, edit flows |
| Phase 3: Connectors & Zones | Sprint 5 | 25.5h | Connectors, zones, group behavior |
| Phase 4: Polish | Sprint 6 | 26.5h | Undo/redo, shortcuts, minimap, performance |
| Phase 5: Deploy | Sprint 7 | 16h | Production deploy, data entry, testing |
| **Total** | | **152h** | |

---

## 5. Technical Decisions Log

### Decision 1: Custom Canvas vs Library

**Context:** Need an infinite canvas that supports mixed HTML components (tables with inline editing, markdown, links with hover states).

**Decision:** Custom implementation using CSS transforms for pan/zoom + absolutely positioned HTML divs for components + SVG overlay for connectors.

**Rationale:**
- React Flow is great for node graphs but forces a specific node/edge model that doesn't fit our mixed component types well
- Konva draws to `<canvas>`, which means no native HTML — text inputs, tables, markdown rendering would all need custom canvas implementations
- tldraw is powerful but too opinionated and hard to customize for our specific component types
- Custom approach gives full control, uses native HTML/CSS for components (so tables, markdown, links work natively), and SVG for connectors (simpler than canvas for lines/arrows)

**Trade-offs:**
- More code to write for pan/zoom/selection
- No built-in minimap (must build from scratch)
- Must handle coordinate transforms manually

**Mitigations:**
- Pan/zoom is well-documented; CSS `transform` approach is proven
- Minimap is a simplified render of component positions (not complex)
- Coordinate transform math is encapsulated in `lib/canvas/math.ts`

---

### Decision 2: Zustand for State Management

**Context:** Canvas state requires high-frequency updates (drag = many position changes per second) and selective re-rendering (moving one component shouldn't re-render all others).

**Decision:** Zustand with Map-based component storage and selector-based subscriptions.

**Rationale:**
- Redux is too much boilerplate for a single-user app
- React Context causes full subtree re-renders on any state change
- Zustand's selector pattern (`useStore(state => state.components.get(id))`) gives per-component re-rendering
- `Map<string, Component>` provides O(1) lookup by ID
- `immer` middleware enables immutable updates with mutable syntax

---

### Decision 3: Debounced Auto-Save Strategy

**Context:** Canvas has high-frequency changes (dragging, resizing). Saving every change would flood the API.

**Decision:** Debounced batch save — 500ms after last change, save all dirty entities in one batch.

**Implementation:**
1. Zustand store tracks `dirtyComponents`, `dirtyZones`, `dirtyConnectors`, `dirtyCanvasState` (Sets of IDs)
2. On any change, add affected entity ID to the dirty set
3. `useAutoSave` hook watches dirty sets with a 500ms debounce
4. On trigger: batch upsert all dirty entities, clear dirty sets
5. Show "Saving..." indicator during save, "Saved" on success

**Why not Supabase Realtime / Subscriptions:**
- Single user — no need for realtime sync
- Push-based save is simpler and more predictable
- Avoids complexity of conflict resolution

---

### Decision 4: JSONB for Component Data

**Context:** Each component type has different fields (LinkBox has URL, DataTable has columns/rows, etc.).

**Decision:** Single `components` table with a `type` enum and `data JSONB` column.

**Rationale:**
- Avoids 5 separate tables (one per component type)
- JSONB is queryable in PostgreSQL if needed
- Schema flexibility — adding a field to a component type doesn't require a migration
- Trade-off: no DB-level validation of data structure → validate in application code with TypeScript types

---

### Decision 5: SVG for Connectors (not Canvas)

**Context:** Connectors (lines/arrows) need to be drawn between components and update when components move.

**Decision:** Use an SVG overlay layer for connectors.

**Rationale:**
- SVG `<line>` and `<path>` elements are simpler than Canvas2D for straight lines and arrows
- SVG supports CSS styling (dash patterns, colors, hover states)
- SVG elements are individually clickable/selectable (unlike Canvas2D which requires hit-testing math)
- SVG markers provide built-in arrowhead support
- Performance is sufficient for < 500 connectors (well within our 200-component target)

---

## 6. Key Implementation Notes

### Coordinate Systems

The app has two coordinate systems:

1. **Screen space:** pixel position on the physical screen (event.clientX/Y)
2. **Canvas space:** logical position on the infinite canvas

**Conversion:**
```typescript
// Screen → Canvas
function screenToCanvas(screenX: number, screenY: number, viewport: Viewport): Point {
  return {
    x: (screenX - viewport.x) / viewport.zoom,
    y: (screenY - viewport.y) / viewport.zoom,
  };
}

// Canvas → Screen
function canvasToScreen(canvasX: number, canvasY: number, viewport: Viewport): Point {
  return {
    x: canvasX * viewport.zoom + viewport.x,
    y: canvasY * viewport.zoom + viewport.y,
  };
}
```

### Zoom Toward Cursor

```typescript
function zoomAtPoint(screenX: number, screenY: number, newZoom: number, viewport: Viewport): Viewport {
  const canvasPoint = screenToCanvas(screenX, screenY, viewport);
  return {
    zoom: newZoom,
    x: screenX - canvasPoint.x * newZoom,
    y: screenY - canvasPoint.y * newZoom,
  };
}
```

### Snap to Grid

```typescript
function snapToGrid(value: number, gridSize: number = 20): number {
  return Math.round(value / gridSize) * gridSize;
}
```

### Zone Containment Check

```typescript
function isComponentInZone(component: CanvasComponent, zone: Zone): boolean {
  const centerX = component.position_x + component.width / 2;
  const centerY = component.position_y + component.height / 2;
  return (
    centerX >= zone.position_x &&
    centerX <= zone.position_x + zone.width &&
    centerY >= zone.position_y &&
    centerY <= zone.position_y + zone.height
  );
}
```

### Viewport Culling

```typescript
function getVisibleComponents(
  components: Map<string, CanvasComponent>,
  viewport: Viewport,
  screenWidth: number,
  screenHeight: number,
  buffer: number = 200
): CanvasComponent[] {
  const topLeft = screenToCanvas(-buffer, -buffer, viewport);
  const bottomRight = screenToCanvas(screenWidth + buffer, screenHeight + buffer, viewport);

  return Array.from(components.values()).filter(c =>
    c.position_x + c.width >= topLeft.x &&
    c.position_x <= bottomRight.x &&
    c.position_y + c.height >= topLeft.y &&
    c.position_y <= bottomRight.y
  );
}
```

---

## 7. Dependencies

### Production Dependencies

```json
{
  "next": "^14.2.0",
  "react": "^18.3.0",
  "react-dom": "^18.3.0",
  "@supabase/supabase-js": "^2.45.0",
  "@supabase/auth-helpers-nextjs": "^0.10.0",
  "@dnd-kit/core": "^6.1.0",
  "@dnd-kit/utilities": "^3.2.0",
  "zustand": "^4.5.0",
  "immer": "^10.1.0",
  "react-markdown": "^9.0.0",
  "remark-gfm": "^4.0.0",
  "uuid": "^9.0.0"
}
```

### Dev Dependencies

```json
{
  "typescript": "^5.5.0",
  "@types/react": "^18.3.0",
  "@types/node": "^20.0.0",
  "@types/uuid": "^9.0.0",
  "tailwindcss": "^3.4.0",
  "postcss": "^8.4.0",
  "autoprefixer": "^10.4.0",
  "eslint": "^8.57.0",
  "eslint-config-next": "^14.2.0"
}
```

---

## 8. Getting Started (for developer / AI agent)

```bash
# 1. Clone and install
cd ecomup
npx create-next-app@14 . --typescript --tailwind --app --src-dir --import-alias "@/*"
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs @dnd-kit/core @dnd-kit/utilities zustand immer react-markdown remark-gfm uuid
npm install -D @types/uuid

# 2. Set up environment
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

# 3. Set up Supabase
# - Create project at supabase.com
# - Run supabase/migrations/001_initial_schema.sql in SQL Editor
# - Create storage bucket "component-images"
# - Enable email auth in Auth settings

# 4. Start development
npm run dev
```

**Build order within each sprint:** Follow task numbers sequentially. Each task builds on the previous. Tasks within a sprint may have dependencies — the task list is already ordered to respect them.
