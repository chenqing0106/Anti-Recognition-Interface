# MorphSymmetry

MorphSymmetry is an experimental React web app for creating POLA APEX-inspired skin analysis visuals. It maps a portrait onto a radar-chart mesh so each metric changes both the chart shape and the warped face texture.

## Features

- Upload a local portrait image and render it into a textured radar mesh.
- Adjust skin-analysis metrics with sliders or by dragging points directly on the canvas.
- Switch to calibration mode to align mesh vertices with the uploaded face.
- Rename dimensions and change the number of analysis axes from 3 to 12.
- Apply quick metric presets such as `Dehydrated`, `Crystal Clear`, `Elastic Focus`, and `Deep Pore`.
- Download the rendered canvas as a PNG.

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- Framer Motion
- Lucide React icons
- Canvas 2D mesh-warp rendering

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm

### Install

```bash
npm install
```

### Run Locally

```bash
npm run dev
```

The app runs on:

```text
http://localhost:3000
```

The dev server is configured with `--host=0.0.0.0`, so it can also be opened from other devices on the same network if your firewall allows it.

## Available Scripts

```bash
npm run dev
```

Starts the Vite development server on port `3000`.

```bash
npm run build
```

Creates a production build in `dist/`.

```bash
npm run preview
```

Serves the production build locally for inspection.

```bash
npm run lint
```

Runs TypeScript type checking with `tsc --noEmit`.

```bash
npm run clean
```

Removes the `dist/` build output.

## Project Structure

```text
.
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   └── components/
│       └── MeshWarpCanvas.tsx
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Usage Notes

1. Upload a face image with `Upload Photo`.
2. Use the `Metrics` tab to tune each analysis dimension.
3. Drag metric vertices on the canvas for direct shape editing.
4. Use the `Calibration` tab when the mesh needs to better match the face position.
5. Click `Download Result` to export the current visualization.
