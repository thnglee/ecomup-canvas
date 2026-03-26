# Product Requirements Document: EcomUp Canvas

## 1. Executive Summary

EcomUp Canvas is a single-user infinite canvas web application designed for Performance Marketing Specialists managing multi-market Facebook Ads campaigns. It consolidates all scattered work resources — Google Sheets, Zalo group links, internal tools, SOPs, data tips, and product tables — into one visual, drag-and-drop workspace. The app prioritizes speed, dark-themed minimalism, and zero-friction interaction over collaboration features.

**Key deliverable:** A persistent, zoomable/pannable canvas where users place, connect, and organize work components (links, tables, notes, process blocks, images) with full drag-and-drop support and auto-save to Supabase.

---

## 2. Problem Statement

### Current State
A Performance Marketing Specialist at an ecommerce company manages:
- Multiple Facebook Ads accounts across 7 international markets (UK, US, AU, CA, NZ, DE, VN)
- Dozens of products, domains, pixels, and ad accounts
- Hourly ROI monitoring with real-time kill/keep decisions based on CPP, CPC, CR, ROI
- Cross-team coordination (content, resource, care) via Zalo groups
- Onboarding SOPs, naming conventions, data-reading tips, and checklists

### Pain Points
1. **Resource fragmentation** — Information lives in 10+ Google Sheets, multiple Zalo groups, internal web tools, and tribal knowledge
2. **Context switching** — Opening the right sheet/tool requires remembering which tab, which group, which link
3. **No single source of truth** — No unified view of "everything I need to do my job"
4. **Onboarding friction** — New hires must discover resources through chat history and word-of-mouth

### Desired State
Open one app → see everything on one infinite plane → click to access any resource → visually understand workflows → never lose a link again.

---

## 3. Product Vision & Goals

### Vision
"One screen to rule them all" — a personal command center for performance marketing operations.

### Goals
| Goal | Metric |
|------|--------|
| Consolidate all work resources into one place | 100% of daily-use links accessible from canvas |
| Reduce context-switching time | < 2 clicks to reach any resource |
| Visualize workflows as flowcharts | All SOPs represented as connected process blocks |
| Zero data loss | All changes persisted within 1 second |
| Instant load | Canvas loads and is interactive within 2 seconds |

### Non-Goals
- Real-time multi-user collaboration
- Mobile-first experience
- Replacing Google Sheets or Zalo (this app links TO them, not replaces them)
- Data analytics / dashboard functionality
- Automated ad management

---

## 4. User Persona

**Name:** Thang — Performance Marketing Specialist

| Attribute | Detail |
|-----------|--------|
| Role | Performance Marketing Specialist, Ecommerce |
| Experience | Manages Facebook Ads across 7 international markets |
| Daily tools | Facebook Ads Manager, Google Sheets (10+), Zalo (5+ groups), internal web tools |
| Technical skill | Can navigate web apps fluently; not a developer |
| Device | Desktop (primary), laptop with trackpad |
| Browser | Chrome |
| Work hours | Long shifts with hourly ROI checks |
| Key frustration | "I can never find the right link when I need it" |

---

## 5. Feature Requirements

### 5.1 World Clock Header Bar

**Description:** A fixed header bar at the top of the application displaying real-time clocks for all target advertising markets.

**Markets:**

| Market | Timezone | Flag |
|--------|----------|------|
| Vietnam | Asia/Ho_Chi_Minh (UTC+7) | 🇻🇳 |
| United Kingdom | Europe/London | 🇬🇧 |
| United States (EST) | America/New_York | 🇺🇸 |
| Australia (AEST) | Australia/Sydney | 🇦🇺 |
| Canada (EST) | America/Toronto | 🇨🇦 |
| New Zealand | Pacific/Auckland | 🇳🇿 |
| Germany | Europe/Berlin | 🇩🇪 |

**Display format:** `[Flag] [Country] [HH:MM:SS] [AM/PM]`

**Acceptance Criteria:**
- [ ] Header is fixed at the top, does not scroll with canvas
- [ ] All 7 clocks display and update every second
- [ ] Time is accurate to the second using `Intl.DateTimeFormat` with correct timezone
- [ ] Dark background, compact horizontal layout
- [ ] Clocks fit on a single row at 1280px+ viewport width
- [ ] Header height: 40px max
- [ ] Uses country flag emoji, not images

---

### 5.2 Infinite Canvas

**Description:** The core workspace — an infinite 2D plane that the user can pan and zoom freely.

**Acceptance Criteria:**
- [ ] Canvas extends infinitely in all directions (no hard boundaries)
- [ ] Pan via middle mouse button drag
- [ ] Pan via Space + left mouse button drag (Space held = pan mode; cursor changes to grab hand)
- [ ] Zoom via scroll wheel — zooms toward cursor position, NOT viewport center
- [ ] Zoom via Ctrl+Scroll (same behavior)
- [ ] Zoom via pinch gesture on trackpad
- [ ] Zoom range: 10% to 400% (clamped)
- [ ] Dot grid background visible at all zoom levels (grid dots scale with zoom)
- [ ] Grid dot spacing: 20px at 100% zoom
- [ ] Grid dots: subtle color (#333 on #1a1a1a background)
- [ ] Snap-to-grid: components snap to nearest grid point when dragged (20px increments)
- [ ] Snap-to-grid toggle in toolbar (default: ON)
- [ ] Canvas background: #1a1a1a (dark)
- [ ] 60fps rendering at all times during pan/zoom

---

### 5.3 Minimap

**Description:** A small overview panel showing the entire canvas contents and current viewport position.

**Acceptance Criteria:**
- [ ] Positioned at bottom-right corner of the screen
- [ ] Size: ~200x150px, semi-transparent background
- [ ] Shows all components as small colored dots/rectangles
- [ ] Shows current viewport as a highlighted rectangle
- [ ] Click on minimap to jump to that position
- [ ] Drag viewport rectangle on minimap to pan
- [ ] Can be collapsed/hidden via toggle button
- [ ] Updates in real-time as user pans/zooms

---

### 5.4 Sidebar Component Panel

**Description:** A left-side panel containing all draggable component types.

**Acceptance Criteria:**
- [ ] Sidebar width: 260px expanded, 0px collapsed (with 40px toggle button visible)
- [ ] Toggle collapse/expand via button (hamburger icon or chevron)
- [ ] Contains component type cards: Link Box, Data Table, Sticky Note, Process Block, Image
- [ ] Each card shows: icon, name, brief description
- [ ] Search/filter input at top of sidebar — filters component list by name
- [ ] Drag behavior:
  - Hover: cursor changes to `grab`
  - Mousedown: creates ghost element that follows cursor
  - Drag into canvas: ghost shows drop position (snaps to grid if enabled)
  - Mouseup on canvas: creates component at drop position and opens edit modal
  - Mouseup outside canvas (or back on sidebar): cancels creation
- [ ] Ghost element: semi-transparent preview of component
- [ ] Entire drag animation runs at 60fps with no jank
- [ ] Sidebar has dark background matching app theme (#242424)

---

### 5.5 Zones

**Description:** Rectangular regions that group components visually and behaviorally.

**Acceptance Criteria:**
- [ ] Created via toolbar button ("Add Zone") then click-drag on canvas to define rectangle
- [ ] Zone has a name label at the top-left corner (editable via double-click)
- [ ] Zone background: semi-transparent color fill (opacity: 0.08-0.12)
- [ ] Color is selectable from presets: blue, green, purple, orange, red, gray
- [ ] Zone renders BELOW all components (lowest z-index layer)
- [ ] Zone is resizable via corner/edge handles
- [ ] Zone is movable via drag on the name label area or any part of the zone border
- [ ] **Group behavior:** When a zone is moved, all components whose center point is inside the zone move with it
- [ ] Components can be dragged in and out of zones freely
- [ ] Zone `zone_id` is automatically set on components based on spatial containment (center-point check)
- [ ] Zones can be deleted (components inside are NOT deleted, just unlinked)
- [ ] Zone minimum size: 100x100px

---

### 5.6 Connectors

**Description:** Lines and arrows connecting two components to represent relationships and workflows.

**Acceptance Criteria:**
- [ ] Created by clicking a connection point on a component and dragging to another component's connection point
- [ ] Each component has 4 connection points: top, right, bottom, left (shown on hover/select)
- [ ] Connection points appear as small circles (6px diameter) on component edges
- [ ] Connector types: `line` (no arrowhead), `arrow` (one arrowhead at target), `bidirectional` (arrowheads at both ends)
- [ ] Default type: `arrow`
- [ ] Type is changeable after creation via context menu or properties panel
- [ ] Line styles: `solid` (default), `dashed`
- [ ] Color is selectable from presets: white (default), blue, green, yellow, red, purple
- [ ] Optional label text on the connector midpoint (editable via double-click on connector)
- [ ] Label has a small dark background pill for readability
- [ ] Connectors auto-route: when a connected component moves, the line updates in real-time
- [ ] Connectors use straight lines (not curved/bezier — keep it simple)
- [ ] Deleting a component deletes all its connectors
- [ ] Connectors can be selected (click) and deleted (Delete key or context menu)

---

### 5.7 Selection & Editing

**Description:** Standard selection, editing, and manipulation interactions.

**Acceptance Criteria:**

**Selection:**
- [ ] Left click on component: select it (deselect all others unless Shift held)
- [ ] Shift + left click: toggle component in/out of selection
- [ ] Left click drag on empty canvas area: draw selection box; all components intersecting the box are selected on mouseup
- [ ] Selected components show a highlight border (blue, 2px)
- [ ] Selected components show a floating toolbar above: [Edit] [Duplicate] [Delete]

**Editing:**
- [ ] Double-click component: open edit mode (inline or side panel, depending on component type)
- [ ] Edit panel appears on the right side (400px width) for complex components (Data Table)
- [ ] Simple components (Sticky Note, Link Box) use inline editing where possible
- [ ] Click outside or press Escape: close edit mode, auto-save changes
- [ ] All edits are persisted via debounced auto-save (500ms)

**Context Menu (Right-click):**
- [ ] Options: Edit, Duplicate, Delete, Bring to Front, Send to Back
- [ ] If multiple selected: Duplicate All, Delete All, Align Left/Right/Top/Bottom
- [ ] Dark themed context menu matching app style

**Delete:**
- [ ] Delete key or Backspace: delete selected component(s)
- [ ] Show toast notification: "Deleted [component name]. Undo?" with 5-second undo window
- [ ] Undo restores component to exact previous position and data

**Duplicate:**
- [ ] Ctrl+D or context menu: duplicate selected component(s)
- [ ] Duplicated component placed at +20px, +20px offset from original

---

### 5.8 Undo/Redo

**Description:** Full undo/redo history for all canvas operations.

**Acceptance Criteria:**
- [ ] Ctrl+Z: undo last action
- [ ] Ctrl+Shift+Z: redo
- [ ] History tracks: create, delete, move, resize, edit content, connector changes, zone changes
- [ ] History is stored in-memory (not persisted — resets on page reload)
- [ ] History depth: at least 50 actions
- [ ] Batch moves: dragging a component counts as one undo step (not one step per pixel)

---

### 5.9 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Delete / Backspace | Delete selected components |
| Ctrl+Z | Undo |
| Ctrl+Shift+Z | Redo |
| Ctrl+D | Duplicate selected |
| Ctrl+A | Select all components |
| Space (hold) | Pan mode |
| + / = | Zoom in |
| - | Zoom out |
| Ctrl+0 | Reset zoom to 100% |
| Ctrl+1 | Fit all content in viewport |
| Escape | Deselect all / close edit panel |

**Acceptance Criteria:**
- [ ] All shortcuts work as specified
- [ ] Shortcuts do not conflict with browser defaults (Ctrl+A is intercepted, not browser select-all)
- [ ] Space for pan only activates on hold; typing Space in an input field works normally
- [ ] Shortcuts are disabled when an input/textarea is focused (except Escape)

---

### 5.10 Persistence & Auto-Save

**Description:** All canvas state is automatically saved to Supabase.

**Acceptance Criteria:**
- [ ] Auto-save triggers 500ms after the last change (debounced)
- [ ] Changes are batched: if user moves 3 components in rapid succession, one save call covers all 3
- [ ] Save indicator in the UI: small icon showing "Saving..." → "Saved" → (idle)
- [ ] On app load: fetch all canvas data from Supabase and render
- [ ] Loading state: show skeleton/spinner while fetching initial data
- [ ] Error handling: if save fails, show error toast and retry after 3 seconds (max 3 retries)
- [ ] If offline: queue changes and sync when back online (nice-to-have)
- [ ] Viewport position and zoom are also saved and restored on reload

---

## 6. UI/UX Specifications

### 6.1 Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  [🇻🇳 VN 14:30:22 PM] [🇬🇧 UK 08:30:22 AM] [🇺🇸 US ...] │  ← World Clock Header (40px)
├────────┬────────────────────────────────────────────────┤
│        │                                                │
│ Side-  │                                                │
│ bar    │              Infinite Canvas                   │
│ 260px  │                                                │
│        │                                                │
│ [Link] │                                           ┌──┐ │
│ [Table]│                                           │mm│ │  ← Minimap
│ [Note] │                                           └──┘ │
│ [Proc] │                                                │
│ [Img]  │                                                │
├────────┴────────────────────────────────────────────────┤
│  [Snap: ON] [Zoom: 100%]              [Saving... ✓]    │  ← Status Bar (28px)
└─────────────────────────────────────────────────────────┘
```

### 6.2 Color Palette

| Element | Color |
|---------|-------|
| App background | #0f0f0f |
| Canvas background | #1a1a1a |
| Sidebar background | #242424 |
| Header background | #1a1a1a |
| Card/component background | #2a2a2a |
| Card border | #3a3a3a |
| Primary text | #e0e0e0 |
| Secondary text | #888888 |
| Accent / selection | #3b82f6 (blue) |
| Grid dots | #333333 |
| Hover state | #363636 |
| Danger / delete | #ef4444 |

### 6.3 Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Clock text | Inter / system-ui | 13px | 500 |
| Sidebar heading | Inter | 12px | 600 |
| Component title | Inter | 14px | 600 |
| Component body | Inter | 13px | 400 |
| Table cell | JetBrains Mono / monospace | 12px | 400 |
| Sticky note | Inter | 14px | 400 |

### 6.4 Interaction States

**Component States:**
- **Default:** border #3a3a3a, bg #2a2a2a
- **Hover:** border #4a4a4a, bg #333333, slight scale (1.005)
- **Selected:** border #3b82f6 (2px), shadow `0 0 0 1px #3b82f6`
- **Dragging:** opacity 0.8, slight rotation (1deg), elevated shadow
- **Editing:** border #3b82f6, edit controls visible

---

## 7. Component Specifications

### 7.1 Link Box

**Purpose:** Represent an external link (Google Sheet, web tool, Zalo group, etc.)

**Visual Design:**
```
┌─────────────────────────────┐
│ 📊  Sheet Training           ↗│
│     Quy trình onboard mới    │
│     team member               │
└─────────────────────────────┘
  ↑ accent color bar (3px left border)
```

**Default size:** 260x80px (resizable)

**Fields:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| title | string | Yes | 1-100 chars |
| description | string | No | 0-200 chars |
| url | string | Yes | Valid URL format |
| icon | string | No | Emoji or preset key |
| color_accent | string | No | Hex color, default #3b82f6 |

**Preset Icons:**
| Key | Emoji | Use Case |
|-----|-------|----------|
| sheet | 📊 | Google Sheets |
| web | 🌐 | Websites |
| chat | 💬 | Zalo/chat groups |
| folder | 📁 | Google Drive folders |
| video | 🎬 | Video content |
| image | 🖼️ | Image/thumbnail |
| tool | 🔧 | Internal tools |
| ads | 📢 | Ad-related tools |

**Behavior:**
- Single click: select (do NOT open link)
- Double-click: open edit mode
- Ctrl+Click or click on external link icon (↗): open URL in new tab
- Hover: show full URL in tooltip
- External link icon (↗) appears on hover in top-right corner

**JSONB `data` schema:**
```json
{
  "title": "Sheet Training",
  "description": "Quy trình onboard mới team member",
  "url": "https://docs.google.com/spreadsheets/d/...",
  "icon": "sheet",
  "color_accent": "#3b82f6"
}
```

---

### 7.2 Data Table

**Purpose:** Display tabular data directly on canvas without opening external links.

**Visual Design:**
```
┌─────────────────────────────────────┐
│  Tài nguyên cá nhân                 │
├──────────┬──────────────────────────┤
│ Tài nguyên│ Giá trị                 │
├──────────┼──────────────────────────┤
│ TKQC     │ Gala 84, Gala 21        │
│ Pixel    │ 12024xxxx               │
│ STT      │ 213                     │
│ Ký tự    │ stmse                   │
└──────────┴──────────────────────────┘
```

**Default size:** 400x250px (resizable)

**Fields:**

| Field | Type | Required |
|-------|------|----------|
| title | string | Yes |
| columns | string[] | Yes (min 1) |
| rows | string[][] | No |

**Behavior:**
- Double-click: enter edit mode for the table
- In edit mode:
  - Click cell: select cell, show cursor for editing
  - Tab: move to next cell
  - Enter: move to cell below
  - "Add Row" button below table
  - "Add Column" button at right of header
  - Right-click column header: delete column
  - Right-click row: delete row
- Table renders with alternating row backgrounds for readability (#2a2a2a / #262626)
- Header row: slightly lighter background (#333), font-weight 600
- Monospace font for cell content (JetBrains Mono, 12px)
- Horizontal scroll if table width exceeds component width

**JSONB `data` schema:**
```json
{
  "title": "Tài nguyên cá nhân",
  "columns": ["Tài nguyên", "Giá trị"],
  "rows": [
    ["Tài khoản QC", "Gala 84, Gala 21, Shop 05"],
    ["Pixel", "12024xxxx, 12023xxxx"],
    ["STT lên camp", "213"],
    ["Ký tự tên", "stmse"],
    ["ROI hoà", "varies by product"]
  ]
}
```

---

### 7.3 Sticky Note / Text Block

**Purpose:** Quick notes, tips, reminders displayed directly on canvas.

**Visual Design:**
```
┌─────────────────────────────┐
│ 💡 Tips đọc dữ liệu         │
│                              │
│ • CPP > 45 → sắp lỗ nhiều  │
│ • CPP TB = 20, tiêu 40$    │
│   2 đơn → chấp nhận được   │
│ • Cam = tiêu >45$ chưa có  │
│   đơn 2                     │
└─────────────────────────────┘
```

**Default size:** 240x160px (resizable)

**Fields:**

| Field | Type | Required |
|-------|------|----------|
| content | string (markdown) | Yes |
| color | string | No, default "blue" |
| font_size | number | No, default 14 |

**Color Presets (dark-toned):**

| Name | Background | Border |
|------|-----------|--------|
| yellow | #3d3520 | #6b5c28 |
| blue | #1e2a3a | #2563eb |
| green | #1a2e1a | #22863a |
| red | #3a1e1e | #dc2626 |
| purple | #2d1e3a | #7c3aed |
| gray | #2a2a2a | #525252 |

**Behavior:**
- Double-click: enter edit mode — content becomes a textarea with markdown preview
- Supports markdown: **bold**, *italic*, `code`, - bullet lists, numbered lists
- Rendered markdown (not raw) in view mode
- Font size adjustable: 12px, 14px, 16px, 18px (via edit panel dropdown)
- Color selectable via edit panel

**JSONB `data` schema:**
```json
{
  "content": "**Tips đọc dữ liệu:**\n\n- CPP > 45 → sắp lỗ nhiều\n- CPP TB = 20, tiêu 40$ 2 đơn → chấp nhận được",
  "color": "yellow",
  "font_size": 14
}
```

---

### 7.4 Process Block

**Purpose:** Represent a single step in a workflow. Combined with connectors to create flowcharts.

**Visual Design:**
```
        ●  (connection point)
    ┌───────────────────┐
  ● │ 🔵 Share TK vào   │ ●
    │    tools           │
    │    Click to open → │
    └───────────────────┘
        ●
```

**Default size:** 200x80px (resizable)

**Fields:**

| Field | Type | Required |
|-------|------|----------|
| title | string | Yes |
| description | string | No |
| block_type | enum | Yes |
| url | string | No |

**Block Types & Colors:**

| Type | Color | Use Case |
|------|-------|----------|
| action | #1e3a5f (blue) | Action to perform |
| decision | #3d3520 (yellow) | Decision point (if/else) |
| contact | #2d1e3a (purple) | Need to contact someone |
| wait | #2a2a2a (gray) | Waiting for response |

**Behavior:**
- 4 connection points (circles, 6px) at center of each edge — visible on hover or when in connector-drawing mode
- Click on connection point + drag: start drawing a connector to another component
- Double-click: edit title/description/type/url
- If URL is set: small link icon visible; Ctrl+Click opens URL
- Block type determines background color and a small icon badge

**JSONB `data` schema:**
```json
{
  "title": "Share TK vào tools",
  "description": "Share tài khoản quảng cáo vào phần mềm lên camp",
  "block_type": "action",
  "url": "https://tool.example.com"
}
```

---

### 7.5 Image / Badge

**Purpose:** Place images, logos, or visual badges on the canvas.

**Default size:** 200x200px (resizable, maintains aspect ratio)

**Fields:**

| Field | Type | Required |
|-------|------|----------|
| image_url | string | No (one of url or upload required) |
| image_data | base64 string | No |
| alt_text | string | No |

**Behavior:**
- Two ways to add image:
  1. Paste image URL (external)
  2. Upload from local machine (stored in Supabase Storage, max 5MB)
- Image renders within the component bounds, maintaining aspect ratio
- Resize via corner handles (aspect-ratio locked by default; hold Shift to unlock)
- No edit mode — just resize and move
- Loading state: gray placeholder with spinner until image loads
- If image fails to load: show broken image icon with alt text

**JSONB `data` schema:**
```json
{
  "image_url": "https://example.com/logo.png",
  "image_data": null,
  "alt_text": "Company logo"
}
```

---

## 8. Data Model (Supabase Schema)

### 8.1 Database Schema

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Table: canvas_state
-- Purpose: Store viewport state (single row per user)
-- ============================================
CREATE TABLE canvas_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewport_x FLOAT NOT NULL DEFAULT 0,
  viewport_y FLOAT NOT NULL DEFAULT 0,
  viewport_zoom FLOAT NOT NULL DEFAULT 1.0,
  snap_to_grid BOOLEAN NOT NULL DEFAULT TRUE,
  sidebar_collapsed BOOLEAN NOT NULL DEFAULT FALSE,
  minimap_visible BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================
-- Table: zones
-- Purpose: Rectangular grouping regions
-- ============================================
CREATE TABLE zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled Zone',
  position_x FLOAT NOT NULL DEFAULT 0,
  position_y FLOAT NOT NULL DEFAULT 0,
  width FLOAT NOT NULL DEFAULT 400,
  height FLOAT NOT NULL DEFAULT 300,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  z_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Table: components
-- Purpose: All canvas components (link_box, data_table, sticky_note, process_block, image)
-- ============================================
CREATE TYPE component_type AS ENUM (
  'link_box',
  'data_table',
  'sticky_note',
  'process_block',
  'image'
);

CREATE TABLE components (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type component_type NOT NULL,
  position_x FLOAT NOT NULL DEFAULT 0,
  position_y FLOAT NOT NULL DEFAULT 0,
  width FLOAT NOT NULL DEFAULT 260,
  height FLOAT NOT NULL DEFAULT 80,
  z_index INT NOT NULL DEFAULT 1,
  data JSONB NOT NULL DEFAULT '{}',
  zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Table: connectors
-- Purpose: Lines/arrows between components
-- ============================================
CREATE TYPE connector_type AS ENUM ('line', 'arrow', 'bidirectional');
CREATE TYPE connector_style AS ENUM ('solid', 'dashed');

CREATE TABLE connectors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_component_id UUID NOT NULL REFERENCES components(id) ON DELETE CASCADE,
  to_component_id UUID NOT NULL REFERENCES components(id) ON DELETE CASCADE,
  from_anchor TEXT NOT NULL DEFAULT 'right',  -- 'top', 'right', 'bottom', 'left'
  to_anchor TEXT NOT NULL DEFAULT 'left',
  type connector_type NOT NULL DEFAULT 'arrow',
  style connector_style NOT NULL DEFAULT 'solid',
  color TEXT NOT NULL DEFAULT '#ffffff',
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (from_component_id != to_component_id)
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_components_user_id ON components(user_id);
CREATE INDEX idx_components_zone_id ON components(zone_id);
CREATE INDEX idx_zones_user_id ON zones(user_id);
CREATE INDEX idx_connectors_user_id ON connectors(user_id);
CREATE INDEX idx_connectors_from ON connectors(from_component_id);
CREATE INDEX idx_connectors_to ON connectors(to_component_id);

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE canvas_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE components ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE connectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own canvas_state"
  ON canvas_state FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own components"
  ON components FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own zones"
  ON zones FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own connectors"
  ON connectors FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- Updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_canvas_state_updated
  BEFORE UPDATE ON canvas_state
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_components_updated
  BEFORE UPDATE ON components
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_zones_updated
  BEFORE UPDATE ON zones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_connectors_updated
  BEFORE UPDATE ON connectors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Storage bucket for images
-- ============================================
-- Created via Supabase Dashboard:
-- Bucket name: "component-images"
-- Public: false
-- Max file size: 5MB
-- Allowed MIME types: image/png, image/jpeg, image/gif, image/webp, image/svg+xml
```

### 8.2 JSONB Data Schemas by Component Type

Refer to Section 7 (Component Specifications) for the `data` JSONB structure of each component type.

---

## 9. API Specifications

All data access uses the Supabase JavaScript client (`@supabase/supabase-js`). No custom backend API is needed.

### 9.1 Canvas State

**Load canvas (on app mount):**
```typescript
// Fetch canvas state
const { data: canvasState } = await supabase
  .from('canvas_state')
  .select('*')
  .single();

// Fetch all components
const { data: components } = await supabase
  .from('components')
  .select('*')
  .order('z_index', { ascending: true });

// Fetch all zones
const { data: zones } = await supabase
  .from('zones')
  .select('*')
  .order('z_index', { ascending: true });

// Fetch all connectors
const { data: connectors } = await supabase
  .from('connectors')
  .select('*');
```

**Save canvas state (debounced):**
```typescript
await supabase
  .from('canvas_state')
  .upsert({
    user_id: userId,
    viewport_x: viewport.x,
    viewport_y: viewport.y,
    viewport_zoom: viewport.zoom,
    snap_to_grid: settings.snapToGrid,
    sidebar_collapsed: settings.sidebarCollapsed,
    minimap_visible: settings.minimapVisible,
  });
```

### 9.2 Component CRUD

```typescript
// Create
const { data } = await supabase
  .from('components')
  .insert({ user_id, type, position_x, position_y, width, height, data: jsonData })
  .select()
  .single();

// Update position (batch — for multi-select move)
const updates = movedComponents.map(c => ({
  id: c.id,
  user_id: userId,
  position_x: c.position_x,
  position_y: c.position_y,
}));
await supabase.from('components').upsert(updates);

// Update data (content edit)
await supabase
  .from('components')
  .update({ data: newJsonData })
  .eq('id', componentId);

// Delete
await supabase
  .from('components')
  .delete()
  .eq('id', componentId);

// Batch delete (multi-select)
await supabase
  .from('components')
  .delete()
  .in('id', componentIds);
```

### 9.3 Zone CRUD

```typescript
// Create
const { data } = await supabase
  .from('zones')
  .insert({ user_id, name, position_x, position_y, width, height, color })
  .select()
  .single();

// Update (position, size, name, color)
await supabase
  .from('zones')
  .update({ position_x, position_y, width, height, name, color })
  .eq('id', zoneId);

// Delete (components inside are NOT deleted — zone_id set to NULL via ON DELETE SET NULL)
await supabase
  .from('zones')
  .delete()
  .eq('id', zoneId);
```

### 9.4 Connector CRUD

```typescript
// Create
const { data } = await supabase
  .from('connectors')
  .insert({
    user_id,
    from_component_id,
    to_component_id,
    from_anchor,
    to_anchor,
    type: 'arrow',
    style: 'solid',
    color: '#ffffff',
  })
  .select()
  .single();

// Update
await supabase
  .from('connectors')
  .update({ type, style, color, label })
  .eq('id', connectorId);

// Delete
await supabase
  .from('connectors')
  .delete()
  .eq('id', connectorId);
```

### 9.5 Image Upload

```typescript
// Upload to Supabase Storage
const { data, error } = await supabase.storage
  .from('component-images')
  .upload(`${userId}/${crypto.randomUUID()}.${extension}`, file, {
    contentType: file.type,
    upsert: false,
  });

// Get public URL
const { data: urlData } = supabase.storage
  .from('component-images')
  .getPublicUrl(data.path);
```

### 9.6 Export Canvas to JSON (Nice-to-have)

```typescript
// RPC function for full canvas export
// Create via Supabase SQL Editor:

CREATE OR REPLACE FUNCTION export_canvas(p_user_id UUID)
RETURNS JSON AS $$
  SELECT json_build_object(
    'canvas_state', (SELECT row_to_json(cs) FROM canvas_state cs WHERE user_id = p_user_id),
    'components', (SELECT json_agg(row_to_json(c)) FROM components c WHERE user_id = p_user_id),
    'zones', (SELECT json_agg(row_to_json(z)) FROM zones z WHERE user_id = p_user_id),
    'connectors', (SELECT json_agg(row_to_json(cn)) FROM connectors cn WHERE user_id = p_user_id),
    'exported_at', NOW()
  );
$$ LANGUAGE sql SECURITY DEFINER;
```

---

## 10. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Authentication** | Supabase Auth with email/password. Single user. No social login needed. |
| **Performance** | Canvas renders at 60fps with 200+ components. Initial load < 2 seconds. |
| **Viewport culling** | Only render components within the visible viewport + 200px buffer. |
| **Save latency** | Auto-save completes within 500ms of debounce trigger. |
| **Browser support** | Chrome 120+, Edge 120+ (primary). Safari 17+ (best-effort). |
| **Responsive** | Desktop-first (1280px+). Tablet usable but not optimized. No mobile layout. |
| **Accessibility** | Tab navigation between components. Focus indicators. Escape to deselect. |
| **Security** | Supabase RLS ensures users can only access their own data. No public endpoints. |
| **Image storage** | Max 5MB per image. Supabase Storage with user-scoped paths. |
| **Data backup** | Supabase automatic backups. Optional JSON export via RPC function. |

---

## 11. Out of Scope

The following are explicitly NOT part of this product:

1. **Multi-user collaboration** — No real-time sync, no shared canvases, no user roles
2. **Mobile app** — No native mobile, no mobile-responsive canvas
3. **Data analytics** — No charts, no ad metrics integration, no API to Facebook Ads
4. **Automated workflows** — No triggers, no if-this-then-that automation
5. **Rich text editor** — Markdown only for sticky notes, no WYSIWYG
6. **Template system** — No pre-built canvas templates (may add later)
7. **Version history** — No canvas versioning or rollback (Supabase backups are sufficient)
8. **Offline mode** — App requires internet connection (offline queueing is nice-to-have)
9. **Custom component types** — Users cannot create new component types
10. **Search across all components** — Global canvas search (may add later)
11. **Embedding external content** — No iframe embeds, no live sheet previews

---

## 12. Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| All daily resources accessible | 100% of links on canvas | Manual audit |
| Time to find a resource | < 5 seconds | User feedback |
| Canvas load time | < 2 seconds | Browser DevTools |
| Interaction smoothness | 60fps during pan/zoom/drag | Chrome Performance tab |
| Data persistence | Zero data loss over 30 days | Manual verification |
| Daily usage | App is open during work hours | User self-report |

---

## 13. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Canvas engine performance degrades with many components | High — app becomes unusable | Medium | Viewport culling, lazy rendering, benchmark early with 200+ components |
| Supabase free tier limits hit | Medium — save failures | Low | Monitor usage; upgrade plan is cheap ($25/mo); batch saves to reduce API calls |
| Complex drag-and-drop interactions are buggy | High — core UX broken | Medium | Use proven library (dnd-kit); extensive manual testing; automated E2E tests for core flows |
| Zone group-move logic is complex | Medium — unexpected behavior | Medium | Keep algorithm simple: center-point check on move start; don't re-calculate mid-drag |
| User expects features that are out of scope | Low — disappointment | Low | Clear scope document; focus on doing core features excellently |
| Browser compatibility issues with canvas rendering | Medium — broken for some users | Low | Target Chrome only initially; test Safari as stretch goal |
| Data model changes needed after initial build | Medium — migration pain | Medium | Use JSONB for component data (flexible schema); keep relational structure simple |
