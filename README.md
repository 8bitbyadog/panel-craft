# Panel Craft - Comic Creation Tool

A modern web application for creating layered comic panels with AI-generated elements.

## Features

- Create multi-panel comics with customizable layouts
- Generate comic elements using Stable Diffusion AI
- Layer and manipulate elements with intuitive controls:
  - Drag and drop positioning
  - Resize with corner/edge handles
  - Rotate elements freely
  - Adjust opacity and layering
- Real-time preview of comic panels
- Modern, responsive interface

## Tech Stack

- React + TypeScript
- Vite for build tooling
- Konva.js for canvas manipulation
- Hugging Face API for AI image generation
- Modern CSS with responsive design

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/8bitbyadog/panel-craft.git
cd panel-craft
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your Hugging Face API key:
```bash
VITE_HUGGINGFACE_API_KEY=your_api_key_here
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## License

MIT License - See LICENSE file for details 