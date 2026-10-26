# Chitrakar — Product & Technical Specification

Status: **Draft v0.3** · Owner: @shibam-apple · Last updated: 2026-10-26

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

## 3. User experience and interface design

Ease of use is the reason Chitrakar exists. This section is the design spec for
the interface. The prototype in `prototype/index.html` implements most of it,
and §3.16 lists what it does not cover yet.

### 3.1 Design goals and how we measure them

| Goal | Target | How we check |
|---|---|---|
| Start without learning anything | First shape or stroke on the canvas within **10 s** of opening the app | Usability sessions (§3.17) |
| Build a real screen quickly | A first-time user builds a sign-in screen (status bar, title, two fields, button) in **under 3 min** | Timed task |
| Short paths to common changes | Any common property (color, corners, shadow, order, size) is **≤ 2 taps** from a selection | Tap-count audit per release |
| Nothing is scary | **0** confirmation dialogs in core flows; every action undoable | Code review rule |
| Finger-friendly | Every control **≥ 44 × 44 pt**; handles grow for fingers | Automated layout check |
| Works the same on iPad and desktop | Every gesture has a visible button or menu equivalent | Checklist per feature |

### 3.2 Principles

1. **The Pencil draws, fingers move.** No mode switches on iPad. The app detects
   the Pencil and adjusts (§4.1).
2. **Tools stay where your hand is.** Tools sit in a bottom dock (thumb reach).
   Options for the selection appear beside it, never in a far-away sidebar.
3. **Presets first, sliders second** (learned from Instagram, §3.4). Every panel
   opens with one-tap presets; fine control sits underneath.
4. **One thing at a time.** Only one panel is open at once. Panels close when you
   tap the canvas.
5. **Direct manipulation.** Drag to move, pinch a selected item to resize it,
   drag a line's end to move that end. Numbers are optional.
6. **Every action can be undone and nothing is lost.** Undo is always visible,
   autosave is always on, and toasts offer "Undo" or "Keep my drawing" right
   when something automatic happens.
7. **Teach once, at the moment it matters.** One-line tips appear the first time
   a situation arises, never as a tutorial up front.
8. **Plain words.** Controls say what they do ("Bring to front", "Space evenly").
   No jargon such as "boolean", "constraints" or "instance" in the main UI.

### 3.3 Benchmark: Figma, and where Chitrakar goes further

Figma is the reference for capability. Chitrakar matches its basics and removes
the friction a newcomer, or anyone on an iPad, runs into.

| Area | Figma | Friction | Chitrakar |
|---|---|---|---|
| Starting | Blank file, pick a frame tool | Blank-canvas paralysis | "What are you designing?" sheet puts a sized frame on screen in one tap |
| Drawing shapes | Shape tool menu, drag | Hard to sketch freely | Sketch with the Pencil; rough boxes, circles and lines snap to clean shapes, with "Keep my drawing" to undo the snap |
| UI parts | Community files, library setup | Needs a design system first | Built-in Insert library (~90 parts, searchable, live previews), plus **My components** saved from your own groups |
| Editing a part of a component | Double-click to enter, layers to dig | Hidden behaviour | Double-tap a label to edit it in place; double-tap a shape to open the component and select that part; **tap again to pick what's underneath** |
| Properties | Always-on right sidebar with every field | Dense, mouse-sized | Selection bar with 4 labelled panels (Style, Text, Effects, Arrange); only relevant controls appear |
| Effects | Effect list with numeric fields | Many steps for a shadow | Presets (Soft shadow, Lifted, Glass) plus 5 live sliders |
| Layers | Always visible | Takes space on iPad | Optional panel: grouped by frame, eye and lock per row, drag to reorder, rename |
| Alignment | Toolbar icons, smart guides | Good | Same: smart guides while dragging, align and space-evenly in Arrange |
| iPad | Viewer-first, limited Pencil use | Not built for touch | Pencil-first input model, finger-sized handles, pinch-to-resize, two-finger-tap undo |
| Learning | Docs and tutorials | Steep | No tutorial; one-time tips in context |

**Parity we keep:** frames, shapes, text, images, groups, layers, smart guides,
align and distribute, numeric position and size, z-order, copy and paste,
duplicate, lock, hide, undo history, keyboard shortcuts.

**Deliberately later:** auto layout, variants, prototyping links, vector
networks, variables. They are powerful but complex, and each must arrive with
its own "one-tap preset" form (§3.19).

### 3.4 Lessons from Instagram's editor

Instagram's photo and video editor is powerful yet easy because of a few
patterns. Chitrakar adopts them directly.

| Instagram pattern | Chitrakar equivalent |
|---|---|
| A row of large, labelled tools; tapping one opens just that tool | Bottom dock with labelled tools; the selection bar opens one panel at a time |
| Filters (presets) before manual adjustments | Effects presets (None, Soft shadow, Lifted, Glass), corner presets (Square, Small, Medium, Round), text-size chips |
| Live preview while dragging a slider | Every slider updates the canvas as you drag; one undo step per drag |
| Stickers: pinch to resize, drag to move, directly on the object | Pinch a selected item with two fingers to resize it; drag it with one finger |
| Always-visible way back | Undo and redo pinned at the top; two- and three-finger taps |
| Full-width sheets on a phone | Panels become bottom sheets below 600 px width |

### 3.5 Layout and surfaces

```
┌──────────────────────────────────────────────────────────────┐
│ [▦ Chitrakar · file]        [↶  ↷]       [✎ Pencil][Layers][61%]│ top bar
│                                                     ┌────────┐ │
│        ┌──────────────┐                             │ Layers │ │
│  [●●●●●●● | Style  Text  Effects  Arrange  ⧉  🗑]   │  …     │ │ selection bar
│        │  selected    │                             │        │ │ (beside selection)
│        └──────────────┘                             └────────┘ │
│                                                                │
│   [Select  Draw  Shapes  Insert  Text  Frame  Erase | Color]   │ dock
└──────────────────────────────────────────────────────────────┘
```

| Surface | Contents | Rules |
|---|---|---|
| **Top bar** | New design, file name; undo and redo; Pencil chip (after a Pencil is seen), Layers, zoom (opens the View menu, §3.10) | Three small floating groups so the canvas stays visible |
| **Dock** | Select, Draw, Shapes (opens shape picker), Insert (opens library), Text, Frame, Erase, Color | Labelled icons; active tool filled; scrolls sideways on narrow screens |
| **Selection bar** | 7 color swatches; Corners (rectangles, images); Style; Text (for text); Effects; Arrange; Vectorize (drawings) or Edit points (vectors); Group or Ungroup; Save (for a group); Duplicate; Delete | Floats above the selection (below it near the top edge); hidden while dragging or pinching |
| **Panels** | Style, Text, Effects, Arrange (§3.9) | One at a time, beside their button; bottom sheet on narrow screens; close on canvas tap |
| **Insert** | Search, Image button, My components, 9 built-in categories | Large previews; tap a tile to place it in the middle of the view |
| **Layers** | Rows grouped under each frame; eye, lock, drag handle; rename by double-click | Docked on the right; stays open while you work |
| **Toasts** | One sentence plus at most one action | Bottom centre, above the dock; disappear by themselves |

**Size classes**

| Width | Behaviour |
|---|---|
| ≥ 600 pt (iPad, Stage Manager windows, desktop) | Everything as drawn above; Layers floats on the right and zoom-to-fit leaves room for it |
| < 600 pt (iPhone, Slide Over) | Doc name and button labels in the top bar hidden; dock scrolls; panels become bottom sheets |

### 3.6 Apple Pencil and iPad: design opportunities

| Opportunity | Behaviour | Status |
|---|---|---|
| Automatic Pencil mode | First Pencil touch or hover switches fingers to move-and-select; chip in the top bar lets you change it | Prototype |
| Palm rejection | In Pencil mode, a resting palm or finger never draws | Prototype |
| Pressure ink | Line width follows pressure | Prototype |
| Rough shape → clean shape | Box, ellipse, straight line (snapped to horizontal/vertical) | Prototype |
| Vectorize on lift | Optional: every Pencil stroke becomes an editable vector path | Prototype |
| Edit points with the Pencil | Precise point and handle dragging; hover shows which point a tap would grab | Prototype |
| Hover preview (M2+ iPads) | Pencil hover shows the brush size while drawing, and outlines the item a tap would pick while selecting | Prototype |
| Scribble into text | Handwrite into a text box; iPadOS converts it | Prototype (system feature) |
| Finger + Pencil together | Finger drags or pinches the selected item while the Pencil stays ready to draw | Prototype |
| Tap again to dig | Tapping the same spot twice picks the next item underneath | Prototype |
| Lasso select | Draw a loop with the Pencil in Select to select what it encloses | Planned |
| Tilt shading | Tilted Pencil draws wider, softer strokes | Planned |
| Pencil double-tap / squeeze | Toggle Draw ↔ Erase; squeeze opens a palette at the Pencil tip | Native wrapper only (§9) |
| Barrel roll (Pencil Pro) | Rotate the brush or the selected item | Native wrapper only |
| Keyboard and trackpad | Full shortcut set (§4.3); trackpad hover outlines like a mouse | Prototype |
| Stage Manager / Split View | Layout adapts by size class; drag images in from other apps | Prototype (drop); planned (window sizes tested) |

**Other tablets ("tabs").** Android tablets with a stylus and Windows tablets
with a pen use the same Pointer Events, so Pencil mode, palm rejection and
pressure work there too. A pen's eraser end (`buttons & 32`) will switch to the
Erase tool while held. Android and Windows tablets are a secondary target (§2).

### 3.7 Core flows

| Flow | Steps |
|---|---|
| Start an iPhone screen | New → iPhone (2 taps) |
| Add a button and change its label | Insert → Button → double-tap the label → type (3 taps + typing) |
| Make a card float | Tap card → Effects → Lifted (3 taps) |
| Frosted glass | Tap shape → Effects → Glass (3 taps); a one-time tip explains it needs something colourful behind |
| Move a circle that sits under text | Tap → tap again (the circle) → drag; or Layers → tap its row |
| Rebuild a segmented control from basics and reuse it | Draw two rounded rectangles with Shapes, add labels with Text → select them all → Group → Save; it appears under Insert → My components |
| Align three items and space them evenly | Select them (marquee or Shift) → Arrange → Middle → Space evenly ↔ |
| Bring something forward | Tap → Arrange → Forward (3 taps), or ⌘] |
| Round a card's corners | Tap → drag the corner handle; or Corners → Medium |
| Clean up a sketched icon | Tap the drawing → Vectorize → Edit points → drag points → Done |
| Zoom with a mouse | Turn the wheel over the spot you want to zoom into |

### 3.8 Selection and editing model

- **Tap** picks the top item under the finger, Pencil or pointer. Frames are
  picked by their name label or edge, so taps inside an empty frame still draw.
- **Tap the same spot again** picks the item underneath (and so on, wrapping
  around).
- **Double-tap text** edits it. **Double-tap a component**: on its label, edit
  the label in place (centred labels stay centred); elsewhere, open the
  component and select the part you tapped.
- **Drag** moves the selection; frames carry their contents. **Smart guides**
  snap edges and centres to nearby items and frames (hold ⌘ to turn snapping
  off).
- **Handles:** corner squares resize (groups, icons and images keep their
  proportions; Shift keeps them for anything); lines show two round end handles
  instead. Handles are 24 pt for fingers and 14 pt for pointers, and shrink on
  small items so the middle of the item is always grabbable.
- **Pinch a selected item** (two fingers on it) to resize it around its centre.
- **Marquee** (drag on empty canvas in Select) selects everything fully inside.
- **Groups and components:** Insert places a group. Ungroup drops invisible
  helper boxes so they never block taps. Group (⌘G) and Save turn your own work
  into reusable components.
- **Hidden** items are skipped by taps and not drawn. **Locked** items can't be
  moved or tapped; select them from Layers to unlock.

### 3.9 Panels

| Panel | Shown for | Contents |
|---|---|---|
| **Style** | Shapes, components, lines, drawings, icons, images | Fill on/off; Border on/off, width, border colour; Corners slider + Square/Small/Medium/Round; Sides (polygon) or Points (star); Width or Line weight; Arrow head |
| **Text** | Text | Size stepper and chips (12–64); Weight: Regular, Medium, Semibold, Bold |
| **Effects** | Anything but frames | Presets: None, Soft shadow, Lifted, Glass; Opacity; Shadow (None/Soft/Medium/Strong); Blur; Background blur; Fill opacity |
| **Corners** | Rectangles, images, components with a rectangle base | Square, Small, Medium, Large, Round; slider (§3.11) |
| **Arrange** | Anything | To front, Forward, Backward, To back; Align left/centre/right/top/middle/bottom (to each other, or within the frame for one item); Space evenly (3+ items); X, Y (relative to the frame), W, H, R (corner radius); drag a label to scrub; Lock |
| **Insert** | Always | Search; Image from Files; My components; Basic shapes (9), Buttons (8), Controls (10), Inputs (6), Navigation (8), Content (11), Feedback & overlays (7), Glass & effects (4), Icons (28) |
| **Layers** | Always | Frames as headings with their items beneath, topmost first; eye, lock, drag handle; tap to select and scroll it into view; double-click to rename |

Components apply colour, style and effects to their **main shape** (the first
visible shape, such as a button's background or a card's surface), so recolouring
a button recolours the button, not its label.

### 3.10 Navigation and zoom

| Input | Behaviour |
|---|---|
| **Mouse wheel** | **Zooms** around the pointer by default. Hold Shift to scroll sideways, Space + drag to pan. Can be switched to "Scroll" in the View menu |
| **Trackpad** | Two-finger swipe pans; pinch zooms around the pointer (unchanged by the wheel setting) |
| **Touch** | Pinch zooms around the fingers; two-finger drag pans |
| **Keyboard** | ⌘+ / ⌘− zoom around the centre, ⌘0 zoom to fit, ⌘1 actual size |

Telling a mouse wheel from a trackpad: wheel events in line or page units, or
whole-number vertical steps of 40 px or more with no sideways movement, count as
a mouse wheel. Everything else counts as a trackpad. If the guess is wrong, the
View menu setting lets people pick.

**View menu** (tap the zoom percentage in the top bar):

- Large − and + buttons, and the current zoom.
- **Fit everything**, **Fit selection**, **100 %**.
- **Mouse wheel:** Zoom / Scroll (saved per device).

Zoom range stays 10 %–3200 %. Each wheel notch zooms by about 10 %, and the
point under the cursor stays put.

### 3.11 Corner rounding

Rounded corners are one of the most common UI edits, so they get three entry
points:

1. **On the canvas:** a selected rectangle or image shows a small round
   **corner handle** just inside its top-left corner. Drag it diagonally to round
   all corners. The value shows next to the handle while dragging. The handle
   appears only when the item is at least 48 pt on screen, so it never crowds
   small items.
2. **Selection bar → Corners** (rectangles, images and components whose main
   shape is a rectangle): presets **Square, Small (8), Medium (16), Large (24),
   Round** and a slider. "Round" makes a pill or a circle.
3. **Arrange → R** field for an exact value, with drag-to-scrub.

Later: per-corner radii (drag a corner handle with a second finger held, or
unlock corners in the Corners panel) and smooth "squircle" corners like iOS.

### 3.12 Touch-first controls

The interface is designed for fingers first and still works well with a mouse.

| Control | Spec |
|---|---|
| Targets | **48 × 48 pt** minimum in panels and bars, 8 pt apart; dock tools 64 × 60 pt |
| Sliders | Full-width track 8 pt high, **28 pt thumb**, drag anywhere on the track, value shown beside it, live preview, one undo step per drag |
| Number fields | 44 pt high. **Drag the label left or right to scrub** the value (Shift for ×10); tap the field to type with the number keypad |
| Steppers | 48 pt buttons; press and hold to repeat |
| Segmented controls | 40 pt high, whole segment is the target |
| Swatches | 40 pt in panels, 36 pt in the selection bar |
| Toggles | 52 × 32 pt, whole row is tappable |
| Panels | 340 pt wide on iPad and desktop; bottom sheets under 600 pt with a grab handle |
| Handles | 24 pt touch radius (14 pt for mouse); shrink on small items so the middle stays grabbable |
| Feedback | Pressed state shows at once (no 300 ms delay); haptic tap on snap and on value presets in the native wrapper |

### 3.13 Vectorize and edit points

Freehand ink is great for sketching but hard to refine. **Vectorize** turns a
drawing into a clean vector path that you can edit like a Figma vector.

**Turning ink into vectors**

- **Selection bar → Vectorize** on one or more drawings.
- **Color menu → "Vectorize drawings when I lift the Pencil"** for automatic
  vectorizing (off by default). Rough shapes still snap to clean shapes first.
- How it works: the stroke is simplified (Ramer–Douglas–Peucker, tolerance tied
  to stroke width), then fitted with smooth cubic Bézier curves through the
  remaining points. A typical stroke drops from hundreds of points to under 20.
  The path keeps the stroke's colour and its average thickness. Closed loops
  stay closed and can be filled.
- A toast says what happened ("Vectorized: 184 points → 11") with **Undo**.

**Editing points** (tap **Edit points** on a vector, or double-tap it)

| Action | Gesture |
|---|---|
| Move a point | Drag it (24 pt touch target) |
| Select a point | Tap it; its curve handles appear |
| Bend a curve | Drag a handle; on smooth points the opposite handle mirrors it |
| Corner ↔ smooth | Double-tap a point, or the Corner / Smooth button |
| Add a point | Tap on the line between two points |
| Delete a point | Delete button in the bar, or the Delete key |
| Close or open the path | Close path / Open path button |
| Finish | **Done**, tap empty canvas, or Esc |

While editing, the selection bar shows only these point actions plus Done.

**Using vectors**

- Style applies as for lines: colour, width, fill for closed paths.
- **Copy SVG** puts the path's SVG on the clipboard for use in code or other
  tools. Full SVG export comes with Export (§3.18).

**Later:** pressure-preserving vectors (variable-width outlines), boolean
operations (union, subtract), a Pen tool for drawing Béziers point by point,
and **image tracing** (turn a photo or a scanned sketch into vector shapes).

### 3.14 Visual design system (app chrome)

| Token | Light | Dark | Use |
|---|---|---|---|
| `--chrome` | #ffffff | #1e1f27 | Bars, panels |
| `--chrome-2` | #f1f1f6 | #2a2b35 | Hover, inputs, segmented controls |
| `--line` | #dcdde7 | #393b49 | Borders, dividers |
| `--fg` / `--fg-2` | #1b1c26 / #5e6174 | #ececf3 / #a4a7b9 | Text, secondary text and icons |
| `--accent` | #3d47c9 (indigo) | #8f97ff | Active tool, selection, focus |
| `--accent-soft` | #e6e8fb | #2d3060 | Open panel, selected row |
| `--canvas` | #e9e9ef | #d9d9e0 | Canvas around frames (stays light: designs keep true colours) |
| Smart guide | #e5487d | same | Snap lines only |

- **Type:** system font (San Francisco on Apple devices), no download. Scale:
  11 (labels), 12–13 (secondary), 14–15 (body), 22 (sheet titles). Uppercase
  section labels with 0.04 em letter spacing.
- **Spacing:** 4 pt grid; panels 14 pt padding; 48 pt targets in panels and bars (§3.12).
- **Shape:** 14 pt radius for bars and panels, 10 pt for buttons, 8 pt for chips.
- **Elevation:** one level only (1 px border + small soft shadow); no blur or
  frosted chrome, for battery reasons (§5.2).
- **Icons:** 24 pt grid, 1.8 pt round strokes, always paired with a text label
  in the dock and selection bar.
- **States:** active = accent fill; open = accent tint; disabled = 35 % opacity;
  visible keyboard focus ring.
- **Motion:** only the toggle thumb animates (150 ms); nothing animates while
  idle; `prefers-reduced-motion` turns it off.

### 3.15 Feedback and copy

- Toasts: one sentence, at most one action ("Undo", "Keep my drawing",
  "Open Insert"), 3–6 s.
- One-time tips: first launch, Pencil detected, first Ungroup, first
  tap-to-dig, first Glass. Stored so they never repeat.
- Errors say what happened and what to do ("That file couldn't be opened as an
  image. Try a PNG or JPEG.").
- No modal confirmations; destructive actions are undoable instead.

### 3.16 Prototype coverage

Covered: everything in §3.5–3.15 marked "Prototype".
Not yet: lasso select, rotation, tilt shading, export, multiple pages, per-corner radii, image tracing,
auto layout, pen eraser button, keyboard shortcut overlay, VoiceOver pass.

### 3.17 Usability testing

- **Who:** 5 people per round: 2 who have never used a design tool, 2 Figma
  users, 1 iPad-only artist.
- **Devices:** iPad with Pencil (hover-capable), iPad without Pencil, a Mac.
- **Tasks:** the flows in §3.7, timed, thinking aloud, no help.
- **Pass:** median times meet §3.1; nobody gets stuck for more than 30 s on
  any task; every "where is…?" moment becomes an issue.
- **Cadence:** every milestone (§11).

### 3.18 MVP feature list

| Feature | Description |
|---|---|
| Infinite canvas | Pan, zoom (10 %–3200 %) with mouse wheel, trackpad, pinch; View menu (§3.10) |
| Frames | Device presets (iPhone, iPad, Desktop) and custom; move with contents |
| Freehand ink | Pressure-sensitive strokes with smoothing |
| Shapes | Rectangle, ellipse, line, arrow, triangle, polygon, star, diamond |
| Ink → shape | Automatic, with "Keep my drawing" and an off switch |
| Insert library | ~90 parts, search, previews, My components |
| Text | Multi-line; size, weight, colour; edit inside components |
| Images | Files picker, paste, drag and drop |
| Select & transform | Tap, tap-to-dig, marquee, move, resize, pinch-resize, line ends |
| Smart guides | Edges and centres, to items and frames |
| Style & effects | §3.9, corner rounding §3.11 |
| Vectorize | Ink → editable vector paths, point editing, Copy SVG (§3.13) |
| Arrange | Order, align, distribute, numeric position and size, lock |
| Layers | Frames and items, hide, lock, reorder, rename |
| Clipboard | Copy, cut, paste, duplicate |
| Undo / redo | 100 steps, buttons and gestures |
| Autosave | Local, debounced |
| Export | PNG, SVG, PDF of a frame or selection (not in prototype) |
| File | `.chitrakar` import/export (§6) |

### 3.19 Later (post-MVP)

Each arrives with a one-tap form first and detail second:

- **Auto layout** as "Stack" presets (vertical list, horizontal row, wrap), so a
  button grows with its label.
- **Variants** for components (on/off toggle, selected tab), switched from the
  selection bar.
- **Prototyping:** tap a button, then tap the destination frame.
- **Shared styles and colour tokens**, version history, share links, comments.
- **Rotation**, with a two-finger twist on the selected item.

---

## 4. Input model

### 4.1 Input type detection

All input uses **Pointer Events**; `pointerType` tells `pen`, `touch` and
`mouse` apart.

- There is **no web API to ask whether a Pencil is paired.** The app enters
  **Pencil mode** on the first `pen` event (contact or hover) and remembers it.
- In Pencil mode, fingers move and select (palm rejection). The Pencil chip
  switches to "Fingers draw too".
- Without Pencil mode (finger-only iPad, iPhone), one finger uses the active
  tool and two fingers navigate.

### 4.2 Gesture map

| Action | Pencil | Finger (Pencil mode) | Finger (no Pencil) | Mouse / trackpad |
|---|---|---|---|---|
| Use the active tool | Draw / tap | — | Drag | Drag |
| Select | Tap (any tool) | Tap | Tap (any tool) | Click |
| Pick what's underneath | Tap again | Tap again | Tap again | Click again |
| Edit text / open a component | Double-tap | Double-tap | Double-tap | Double-click, Enter |
| Move selected | Drag (Select) | Drag the selected item | Drag (Select) | Drag |
| Resize selected | Drag a handle | Drag a handle, or pinch the item | Drag a handle, or pinch the item | Drag a handle |
| Pan | — | Drag empty canvas, or two fingers | Two fingers | Trackpad swipe, Shift + wheel, Space + drag, middle button |
| Zoom | — | Pinch on empty canvas | Pinch | **Mouse wheel** (or Scroll, §3.10), trackpad pinch, ⌘/Ctrl + scroll |
| Undo / redo | — | Two- / three-finger tap | Two- / three-finger tap | ⌘Z / ⇧⌘Z |
| Hover preview | Brush size, item outline | — | — | Item outline |

### 4.3 Keyboard shortcuts

| Keys | Action |
|---|---|
| V, P, R, O, L, ⇧L, T, F, E | Select, Draw, Rectangle, Ellipse, Line, Arrow, Text, Frame, Erase |
| I | Insert library |
| ⌘Z, ⇧⌘Z / ⌘Y | Undo, redo |
| ⌘C, ⌘X, ⌘V, ⌘D | Copy, cut, paste, duplicate |
| ⌘G, ⇧⌘G | Group, ungroup |
| ⌘], ⌘[, ⇧⌘], ⇧⌘[ | Forward, backward, to front, to back |
| Arrows, ⇧ + arrows | Nudge 1, 10 |
| Enter, Esc | Edit text or open a component; deselect / close |
| ⌘0, ⌘1, ⌘+, ⌘− | Zoom to fit, 100 %, in, out |
| Space (hold) | Pan with the mouse |
| Shift + wheel | Scroll sideways |
| ⌘ (hold while dragging) | Turn smart guides off |

### 4.4 Pencil data captured

| Field | Source | Notes |
|---|---|---|
| x, y | `PointerEvent` (+ `getCoalescedEvents()`) | Canvas coordinates |
| pressure | `pressure` | 0–1 |
| tilt | `tiltX`, `tiltY` (`altitudeAngle`, `azimuthAngle` where present) | Planned for shading |
| time | `timeStamp` | Taps, double-taps, smoothing |
| hover | `pointermove` with `buttons === 0` on `pen` | Brush and target preview |

Pencil double-tap, squeeze and barrel roll are **not available on the web**;
they are planned for the native wrapper (§9).

### 4.5 iPadOS specifics

- The canvas disables Scribble, text selection, callouts and double-tap zoom
  (`touch-action: none`, `user-select: none`, `-webkit-touch-callout: none`,
  `gesturestart` prevented).
- Real text inputs keep Scribble, so handwriting into a text box works.
- Prevent Safari edge-swipe and pull-to-refresh when installed as a PWA.

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
12. **Blur without `ctx.filter`.** Layer and background blur use a
    downsample/upsample pyramid on small scratch canvases. It works in every
    browser, including Safari versions without canvas filters, and costs a few
    small image copies per blurred item. Blurred items are the first
    candidates for the tile cache.
13. **Rendering backend.** Canvas 2D first (GPU-accelerated in Safari).
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

1. **Hosting for previews.** Vercel vs Cloudflare Pages (both free for this).
2. **Verify on device:** Safari support for `getCoalescedEvents()` /
   `getPredictedEvents()`, exact Pencil hover reporting, and whether
   `requestAnimationFrame` runs at 60 or 120 Hz on ProMotion iPads in Safari.
3. **Ink → shape trigger:** automatic with "Keep my drawing" (prototype) vs hold-to-snap. Decide after usability round 1.
4. **Default fonts:** system fonts only (zero download) vs bundled font.
5. **Auto layout scope** for the first release: "Stack" presets only, or full padding and spacing controls.
