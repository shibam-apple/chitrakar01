# Chitrakar — Product & Technical Specification

Status: **Draft v0.1** · Owner: @shibam-apple · Last updated: 2026-10-24

---

## 1. What we are building

A UI design app for **iPad (with Apple Pencil) and desktop**, delivered first as a
web app (installable PWA) and designed so it can later move to a native iPad app
without losing users' files or rewriting the core logic.

### Priorities, in order

1. **Ease of use.** A first-time user can sketch a screen, turn it into clean
   shapes, and export it within 2 minutes, without a tutorial.
2. **Efficiency.** Near-zero CPU when idle, minimal work while drawing, small
   download. Battery life on iPad matters.
3. **Portability.** The core (document model, geometry, file format) has no
   browser dependencies so it can be ported to Swift.

### Non-goals (for now)

- Backend, accounts, cloud sync, real-time collaboration.
- Code generation / developer handoff.
- Plugin system.
- Android-specific tuning (should work, not optimized).

---

## 2. Target platforms

| Platform | Browser | Input | Support level |
|---|---|---|---|
| iPad (iPadOS 18+) | Safari / Home Screen PWA | Apple Pencil, touch, keyboard, trackpad | **Primary** |
| macOS | Safari, Chrome | Mouse, trackpad, keyboard | **Primary** |
| Windows | Chrome, Edge | Mouse, pen, touch | Secondary |
| iPhone | Safari | Touch | View & light edits only |

Reference test devices: one iPad with Pencil hover support (M2+ iPad Pro / iPad
Air with Pencil Pro), one older iPad with 1st-gen/USB-C Pencil, one Mac.

---

## 3. Core user experience

### 3.1 Principles

- **The Pencil draws, fingers navigate.** No mode switching required on iPad.
- **One obvious way** to do each thing. Few tools, large hit targets (≥ 44 pt).
- **Everything is undoable.** Never ask "are you sure?".
- **Work is never lost.** Autosave, no "Save" button.
- **No hidden gestures for essential actions.** Every gesture has a visible
  button equivalent.

### 3.2 Layout

```
┌───────────────────────────────────────────────────┐
│ ☰ File name            ↶ ↷              ⇪ Export │  ← top bar (thin)
├───────────────────────────────────────────────────┤
│                                                   │
│                    Infinite canvas                │
│                                                   │
│                                                   │
├───────────────────────────────────────────────────┤
│   ▢ Select  ✎ Pen  ▭ Shape  T Text  ⬚ Frame  ⌫   │  ← floating toolbar
└───────────────────────────────────────────────────┘
```

- Toolbar sits at the bottom on iPad (thumb reach), and can dock left/right.
- A contextual properties panel appears **only when something is selected**,
  next to the selection, not as a permanent sidebar.
- Layers panel is hidden by default; opened from the menu.

### 3.3 MVP features

| Feature | Description |
|---|---|
| Infinite canvas | Pan, zoom (10%–3200%), zoom-to-fit, zoom-to-selection |
| Frames (artboards) | Device presets (iPhone, iPad, Desktop, custom) |
| Freehand ink | Pressure/tilt-sensitive strokes, smoothing |
| Shapes | Rectangle, ellipse, line, arrow |
| **Ink → shape** | Hold the Pencil still at the end of a stroke to snap a rough rectangle / ellipse / line into a clean shape |
| Text | Single and multi-line text, basic font size / weight / color |
| Images | Paste / drag-drop / Files picker |
| Select & transform | Tap, lasso (Pencil), marquee (mouse); move, resize, rotate |
| Smart guides | Snap to edges, centers, equal spacing |
| Style | Fill, stroke, corner radius, opacity |
| Layers | Reorder, hide, lock, rename |
| Undo / redo | Unlimited within session, persisted history depth 100 |
| Autosave | Local, debounced |
| Export | PNG, SVG, PDF of a frame or selection |
| Import/export file | `.chitrakar` file (see §6) |

### 3.4 Later (post-MVP)

Components & instances, auto layout, prototyping links, design tokens / shared
styles, handwriting → text, version history, sharing via link.

---

## 4. Input model

### 4.1 Input type detection

All input uses **Pointer Events**. `pointerType` distinguishes `pen`, `touch`
and `mouse`.

- There is **no web API to ask whether a Pencil is paired.** The app enters
  **Pencil mode** automatically on the first `pen` event (contact or hover)
  and remembers it (per device, `localStorage`).
- In Pencil mode, **touch never draws** (palm rejection); touch is for
  navigation and selection.
- Without Pencil mode (finger-only iPad, iPhone), a single finger draws with
  the active tool, two fingers navigate.
- A setting allows overriding: *"Finger draws: Auto / Always / Never"*.

### 4.2 Gesture map

| Action | Pencil | Touch (Pencil mode) | Mouse / trackpad | Keyboard |
|---|---|---|---|---|
| Use active tool | Draw / tap | — | Click-drag | — |
| Pan | — | 1 or 2 finger drag | Space+drag, scroll, trackpad | — |
| Zoom | — | Pinch | Ctrl/⌘+scroll, pinch | ⌘+ / ⌘− |
| Select | Tap with Select tool; lasso to multi-select | Tap object (any tool) | Click | V |
| Undo / redo | — | 2-finger / 3-finger tap | — | ⌘Z / ⇧⌘Z |
| Quick eraser | — | — | — | E |
| Hover preview | Pencil hover shows brush cursor (supported devices) | — | Cursor | — |

### 4.3 Pencil data captured

| Field | Source | Notes |
|---|---|---|
| x, y | `PointerEvent` | Canvas coordinates |
| pressure | `pressure` | 0–1 |
| tilt | `tiltX`, `tiltY` (and `altitudeAngle` / `azimuthAngle` where present) | Brush shape |
| time | `timeStamp` | Velocity-based smoothing |
| hover | `pointermove` with `buttons === 0` on `pen` | Brush preview |

Pencil double-tap, squeeze and barrel-roll are **not available on the web**;
they are planned for the native wrapper (§9).

### 4.4 iPadOS specifics

- Disable Scribble, text selection, callouts and double-tap zoom on the canvas
  (`touch-action: none`, `user-select: none`, `-webkit-touch-callout: none`).
- Keep Scribble working inside real text inputs.
- Prevent Safari edge-swipe / pull-to-refresh from interfering when installed
  as a PWA.

---

## 5. Efficiency requirements

Efficiency is a feature, enforced by budgets in CI (§10).

### 5.1 Budgets

| Metric | Budget |
|---|---|
| Idle CPU (no input, app visible) | **0 timers, 0 rAF callbacks** |
| Background (tab hidden) | All work suspended |
| Initial JS (gzipped) | **≤ 80 KB** |
| Initial CSS (gzipped) | ≤ 10 KB |
| Time to interactive, iPad on Wi-Fi | ≤ 1.0 s |
| Frame time while drawing | ≤ 8 ms of script per frame (p95) |
| Ink latency (input → pixels) | ≤ 1 frame beyond browser minimum |
| Pan/zoom | 60 fps, no full-scene redraw during gesture |
| Document with 10,000 strokes | Pan/zoom stays at 60 fps |
| Memory, 10,000-stroke document | ≤ 150 MB |

### 5.2 Rules

1. **Event-driven rendering only.** No continuous animation loop. A render is
   scheduled with one `requestAnimationFrame` when something is dirty, and
   nothing is scheduled otherwise.
2. **Coalesce input.** Pointer events are buffered and processed once per
   frame. Use `getCoalescedEvents()` for full Pencil resolution where
   supported.
3. **Layered canvases.**
   - *Scene layer*: committed content, cached as tiles.
   - *Active layer*: only the stroke/shape being drawn.
   - *Overlay layer*: selection handles, guides, hover cursor.
   Drawing touches only the active layer; committing a stroke updates only
   affected tiles.
4. **Tiled cache.** The scene is split into tiles (e.g. 512×512 device px) per
   zoom bucket. Only visible tiles are drawn; only dirty tiles are re-rendered.
5. **Compositor pan/zoom.** During a gesture, the cached layers are moved with
   CSS `transform`. One crisp re-render happens when the gesture ends.
6. **Spatial index** (R-tree or grid) for hit-testing and visibility culling.
7. **Compact data.** Stroke points stored in `Float32Array`s (x, y, pressure,
   t), not arrays of objects.
8. **UI framework out of the hot path.** The UI shell uses **Preact** (or
   no framework). Canvas input never triggers a component re-render.
9. **No expensive CSS.** No `backdrop-filter`, no large blurred shadows, no
   CSS animations running while idle.
10. **Debounced persistence.** Saves to IndexedDB 1 s after the last change,
    off the input path; flush on `visibilitychange` → hidden.
11. **Suspend when hidden.** On `visibilitychange`, cancel pending frames and
    timers.
12. **Rendering backend.** Canvas 2D first (GPU-accelerated in Safari).
    WebGPU is the upgrade path only if profiling shows Canvas 2D is the
    bottleneck.

---

## 6. Architecture

### 6.1 Layers

```
┌─────────────────────────────────────────────┐
│ core/        (pure TypeScript, no DOM)      │  ← ported to Swift later
│  document model · ops & undo · geometry     │
│  stroke smoothing · shape recognition       │
│  hit-testing · spatial index · file format  │
├─────────────────────────────────────────────┤
│ platform/web/                               │  ← replaced by native shell
│  input (Pointer Events) · renderer (Canvas) │
│  storage (IndexedDB) · export · UI (Preact) │
└─────────────────────────────────────────────┘
```

- `core/` may not import anything from `platform/` or use `window`,
  `document`, or DOM types. Enforced by a lint rule.
- `core/` exposes a small, data-in / data-out API so it can be ported
  function-by-function.

### 6.2 Document model (summary)

```ts
Document  { version, id, name, pages: Page[], assets: Asset[] }
Page      { id, name, nodes: Node[] }            // flat list, parent ids
Node      = Frame | Rect | Ellipse | Line | Text | Image | Stroke | Group
NodeBase  { id, parentId, name, x, y, w, h, rotation, opacity, locked, hidden }
Stroke    { ...NodeBase, points: Float32Array /* x,y,p,t */, style }
```

- All edits are **operations** (`insert`, `update`, `delete`, `reorder`) applied
  through one function. Undo/redo is the inverse operation list.
- Operations are plain data so they can later support sync/collaboration.

### 6.3 File format

- `.chitrakar` = zip containing `document.json`, binary point buffers, and
  image assets.
- Top-level `formatVersion` integer; every change adds a migration.
- A set of **fixture files** in `core/fixtures/` is the cross-platform contract:
  the future native app must load them and produce identical geometry.

---

## 7. Persistence

- IndexedDB, one record per document plus an asset store.
- Request persistent storage (`navigator.storage.persist()`) so iPadOS is less
  likely to evict data; show a gentle reminder to export if not granted.
- Document list ("Home") shows thumbnails generated on save, at low resolution.

---

## 8. Accessibility & polish

- All toolbar actions reachable by keyboard, with visible focus.
- Respect `prefers-reduced-motion` and `prefers-color-scheme` (light/dark UI;
  canvas stays user-defined).
- VoiceOver labels on all controls.
- Hit targets ≥ 44 × 44 pt.

---

## 9. Native migration path

| Stage | What | Gain |
|---|---|---|
| 1. Web PWA | This spec | Fastest iteration |
| 2. Native wrapper | Same web app inside a WKWebView app shell; native bridge for Pencil double-tap / squeeze, Files integration | App Store presence, Pencil gestures |
| 3. Native shell | SwiftUI UI + PencilKit/Metal input & rendering; `core/` ported to Swift and verified against fixtures | Lowest latency (predicted touches), best battery |

Rust/WASM for `core/` is **deferred**: only considered if profiling shows the
TypeScript core is a bottleneck or if sharing one codebase with native becomes
more valuable than iteration speed.

---

## 10. Development workflow

- **Stack:** Vite, TypeScript (strict), Preact, Vitest, Playwright.
- **Branching:** every change is a PR.
- **Preview deploys:** each PR gets a preview URL (Vercel or Cloudflare Pages)
  to open directly on iPad and desktop.
- **CI checks (GitHub Actions):**
  - typecheck, lint (incl. `core/` purity rule), unit tests
  - bundle-size budget (§5.1)
  - Playwright perf checks: idle test asserts no rAF/timers after 2 s idle;
    synthetic 10,000-stroke pan test reports frame times
- **Manual check on iPad** for each input-related PR, using a short checklist
  (Pencil draws, palm ignored, pinch zoom, hover cursor, Scribble off on canvas).
- **Power profiling:** Safari Web Inspector (requires a Mac) for periodic
  energy-impact checks on a real iPad.

---

## 11. Milestones

| # | Milestone | Done when |
|---|---|---|
| M0 | Repo, spec, CI, preview deploys | PR previews open on iPad |
| M1 | Canvas foundation | Pencil/touch/mouse input, palm rejection, pan/zoom, ink with pressure, idle = 0 work |
| M2 | Objects | Frames, shapes, text, select/transform, undo/redo |
| M3 | Ink → shape, smart guides | Rough rectangle snaps to clean shape |
| M4 | Persistence & export | Autosave, home screen, PNG/SVG/PDF, `.chitrakar` file |
| M5 | Polish & PWA | Installable, offline, accessibility pass, perf budgets green |
| M6 | Native wrapper (optional) | TestFlight build with Pencil double-tap |

---

## 12. Open questions

1. **Name.** "Chitrakar" (from the repo name) is the working title; confirm or change.
2. **Hosting for previews.** Vercel vs Cloudflare Pages (both free for this).
3. **Verify on device:** Safari support for `getCoalescedEvents()` /
   `getPredictedEvents()`, exact Pencil hover reporting, and whether
   `requestAnimationFrame` runs at 60 or 120 Hz on ProMotion iPads in Safari.
4. **Ink → shape trigger:** hold-to-snap vs automatic with undo.
5. **Default fonts:** system fonts only (zero download) vs bundled font.
