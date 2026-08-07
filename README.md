# Pear No Clone

![Pear No Clone banner](docs/assets/readme-banner.png)

A React + Vite recreation of the [pear.no](https://pear.no/) experience.
This project focuses on the site’s scroll-driven storytelling, combining WebGL shaders, 2D canvas masking, SVG overlays, and responsive layout logic into a single timeline.

![Blue hero scene](docs/assets/readme-scene-blue.png)

## What’s included

- **WebGL hero stage** driven by custom GLSL shaders
- **Canvas-based sequence overlays** for grid lines, transition effects, and chroma-key masking
- **Scroll timeline mapping** that keeps desktop and mobile chapter timing aligned
- **Navigation and chapter rail** with active-state tracking
- **Terms / narrative sections** that unfold alongside the main stage
- **Application scene and modal** for the apply flow
- **FAQ carousel** and footer transition animations
- **Mask calibration widget** for tuning hero positioning and sky-mask sensitivity

![Model sequence](docs/assets/readme-scene-model.png)

## Tech stack

- React 19
- Vite 6
- Custom GLSL shaders
- HTML Canvas 2D
- SVG overlays
- Static media in `public/`

## Project structure

- `src/App.jsx` — app composition, scroll handling, calibration state, and section orchestration
- `src/timeline.js` — logical road length and scroll-progress remapping
- `src/components/` — UI, canvas, modal, and narrative sections
- `src/glsl/` — WebGL shader sources used by the hero and footer transition canvases
- `public/films/` — video loops and posters for the main scenes
- `docs/` — reference notes, including replication lessons and prompt examples

## Getting started

This repository uses **pnpm**.

```bash
pnpm install
pnpm dev
```

The development server runs on:

- `http://localhost:3000/`

## Available scripts

```bash
pnpm dev      # start the Vite dev server
pnpm build    # build a production bundle
pnpm preview  # preview the production build locally
```

## Useful runtime notes

- You can force the initial hero film with the query parameter `?hero=signal`, `?hero=colossus`, or `?hero=reveal`.
- The mask calibration panel is hidden by default. Double-click anywhere on the page to open or close it.
- The panel exposes `Zoom / Overscan`, `Object Position X`, `Sky Sensitivity`, a mask debug toggle, reset/preset controls, and a scroll-road locator.
- Scroll timing is remapped on mobile so the same logical sequence stays aligned across breakpoints.
- Loading is state-driven: the poster or hero video releases the initial loading state, so a fixed delay cannot expose a blank canvas.
- If both opening assets fail for 10 seconds, the loading state reports the failure and exposes a `Retry` action.
- Fly sequence, transition frames, and footer shader media load non-blockingly. During a fast jump, the site keeps the last available frame visible and reports the active phase (`FLY SEQUENCE`, `TRANSITION`, or `FOOTER TRANSITION`) while assets finish loading.

![Terms sequence](docs/assets/readme-scene-terms.png)

## Design and replication notes

This repo includes two companion documents that explain the work in more detail:

- `handoff.md` — session progress and implementation notes
- `REPLICATION_LESSONS.md` — technical lessons learned while recreating the experience

## License

No explicit license file is included. Treat the code according to your project and usage requirements.
