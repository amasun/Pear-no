# Hand-off Summary & Session Progress

## 1. Project Overview & Objective
- **Project**: Pear No Web Application Clone ([https://pear.no/](https://pear.no/))
- **Core Technology Stack**: React (Vite), WebGL Custom Shaders (`HeroCanvas.jsx`, `hero_main_fragment.glsl`, `hero_vertex.glsl`), 2D Canvas Blue-Sky Chromakey Masking (`SequenceCanvas.jsx`), GSAP ScrollTrigger Animations.

---

## 2. Key Accomplishments & Resolved Bugs

### A. Grid Hairline Styling & 4-Pointed Sparkle Stars
- **Subtle 1px Hairline Grid Lines**: Set `linesCtx.strokeStyle = 'rgba(255, 255, 255, 0.32)'` and `lineWidth = 1` matching original site style.
- **4-Pointed Sparkle Star SVGs**:
  - Implemented mathematical SVG path `d="M12 0Q13.1 10.9 24 12Q13.1 13.1 12 24Q10.9 13.1 0 12Q10.9 10.9 12 0Z"` with quadratic bezier curve rendering `drawSparkleStar` at line intersections $(v_1, h_1)$, $(v_2, h_1)$, $(v_1, h_2)$, $(v_2, h_2)$ in both DOM ([Navigation.jsx](file:///x:/XCoding/shader/Pear-no/src/components/Navigation.jsx)) and 2D Canvas ([SequenceCanvas.jsx](file:///x:/XCoding/shader/Pear-no/src/components/SequenceCanvas.jsx)).

### B. Mathematical Alignment of WebGL Video & Chromakey Blue-Sky Mask
- **Default Focal Position**: Settled and confirmed by user at **`object-pos x = 50%`** (`0.50`).
- **Unified CSS Cover-Fit Math**:
  $$\text{scale} = \max\left(\frac{w}{vw}, \frac{h}{vh}\right)$$
  $$\text{sw} = vw \times \text{scale},\quad \text{sh} = vh \times \text{scale}$$
  $$\text{tx} = (w - \text{sw}) \times 0.50,\quad \text{ty} = (h - \text{sh}) \times 0.50$$
- **WebGL `uPanPx` Mapping**:
  $$uPanPx = (0.50 - 0.50) \times (w - \text{sw}) = 0$$
  Ensures 100.00% pixel-perfect alignment between WebGL background video and Canvas chromakey mask on all viewport ratios.

### C. Bulletproof Single-Hook React Canvas Architecture
- Replaced multiple `useEffect` hooks in [SequenceCanvas.jsx](file:///x:/XCoding/shader/Pear-no/src/components/SequenceCanvas.jsx) with a single unified `useEffect(() => { ... }, [])` hook using synchronous `useRef` values (`scrollProgressRef`, `mousePosRef`, `activeChapterRef`, `maskPosXRef`, `sensitivityRef`, `showDebugRef`).
- Completely eliminated React hook array size desync during Vite HMR hot reloads.

### D. Interactive Double-Click Mask Calibration Widget ([MaskCalibrator.jsx](file:///x:/XCoding/shader/Pear-no/src/components/MaskCalibrator.jsx))
- **Hidden by default** for clean production preview.
- **Double-click anywhere on page** toggles the floating glassmorphism control panel.
- Controls: `Object-Pos X` slider (30%-80%), `Sky Sensitivity` slider (0-30), `Show Red Mask Overlay` toggle, and `Reset 50%` button.

### E. Text & Subhead Layout Fixes
- **Top Alignment**: `.col-stand` subhead paragraph is top-aligned with the left `AT YOUR SERVICE` chip (`top: calc(var(--h2) + 4.0%)`).
- **Tight Line Spacing**: Removed `<br />` tags and applied original site CSS properties:
  - `line-height: 1.05`
  - `margin: -0.14em 0 -0.20em`
  - `padding: 0.14em 0 0.20em`

---

## 3. Core File Map
- [src/App.jsx](file:///x:/XCoding/shader/Pear-no/src/App.jsx): Root component, manages scroll progress, active beats, and calibration state (`maskPosX = 0.50`).
- [src/components/HeroCanvas.jsx](file:///x:/XCoding/shader/Pear-no/src/components/HeroCanvas.jsx): WebGL stage canvas rendering custom fragment shaders with video texture `uA` and frame sequence `uB`/`uG`.
- [src/components/SequenceCanvas.jsx](file:///x:/XCoding/shader/Pear-no/src/components/SequenceCanvas.jsx): 2D Canvas rendering grid lines, 4-pointed sparkle stars, and blue-sky chromakey alpha masking.
- [src/components/Navigation.jsx](file:///x:/XCoding/shader/Pear-no/src/components/Navigation.jsx): Overlay layer container with logo, chapter rail, headline beats, and guideline anchor elements.
- [src/components/MaskCalibrator.jsx](file:///x:/XCoding/shader/Pear-no/src/components/MaskCalibrator.jsx): Floating calibration widget toggleable via double-click.

---

## 4. Current Status & Next Steps
- **Build Status**: Production build via `pnpm build` passes with zero errors.
- **Dev Server**: Running on `http://localhost:3000/`.
- **Next Steps**: Continue restoring downstream scroll-triggered WebGL transition sequences (Ch. 2 `colossus`, Ch. 3 `reveal`, and paper burn effects).
