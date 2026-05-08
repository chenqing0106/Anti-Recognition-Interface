# Anti-Recognition Interface

Anti-Recognition Interface is an experimental React web app that treats the face as a coordinate system under suspicion. It borrows the visual language of skin analysis, facial measurement, and identity dashboards, then redirects it toward questions of recognition, data exposure, and the loss of self when appearance becomes measurable.

## Concept

The project is inspired by POLA APEX's facial-coordinate visual language, but it shifts the goal away from beauty diagnosis. Each uploaded face is mapped onto a radar-chart mesh, where dimensions such as recognizability, trace, exposure, anomaly, fragmentation, and disguise describe how an identity might be captured, misread, or made unstable by technical systems.

The core question is:

```text
If the face becomes data, where does the self remain?
```

## Features

- Upload a local portrait image and render it into a textured radar mesh.
- Adjust identity-coordinate metrics with sliders or by dragging points directly on the canvas.
- Switch to calibration mode to align mesh vertices with the uploaded face.
- Rename dimensions and change the number of analysis axes from 3 to 12.
- Apply quick metric presets such as `Traceable`, `Data Leak`, `Identity Drift`, and `Disguise Field`.
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
npm run deploy
```

Builds the app and deploys `dist/` to a remote Linux server with `rsync`.

```bash
npm run clean
```

Removes the `dist/` build output.

## Deploy to Alibaba Cloud

This project is a static Vite app. The deployment script builds it locally and syncs the generated `dist/` directory to your Alibaba Cloud Hong Kong server.

### One-time server setup

Install Nginx and rsync on the server:

```bash
sudo apt update
sudo apt install -y nginx rsync
sudo systemctl enable --now nginx
```

If your server uses Alibaba Cloud security groups, open inbound TCP port `80`. Open `443` too if you later add HTTPS.

### Deploy

Replace the IP, domain, and SSH key path with your own values:

```bash
SERVER_HOST=your_server_ip \
SERVER_USER=root \
SSH_KEY=~/.ssh/aliyun-hk.pem \
DOMAIN=your-domain.com \
SETUP_NGINX=1 \
npm run deploy
```

After the first deploy, you can omit `SETUP_NGINX=1`:

```bash
SERVER_HOST=your_server_ip \
SERVER_USER=root \
SSH_KEY=~/.ssh/aliyun-hk.pem \
DOMAIN=your-domain.com \
npm run deploy
```

Useful options:

```text
SERVER_PORT=22                    SSH port
SERVER_PATH=/var/www/morphsymmetry Remote web root
APP_NAME=morphsymmetry            Nginx config filename prefix
SKIP_BUILD=1                      Reuse the existing local dist/ build
```

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

1. Upload a face image with `Upload Face`.
2. Use the `Coordinates` tab to tune each analysis dimension.
3. Drag metric vertices on the canvas for direct shape editing.
4. Use the `Calibration` tab when the mesh needs to better match the face position.
5. Click `Export Trace` to export the current visualization.
