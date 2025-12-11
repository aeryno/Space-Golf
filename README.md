# Space-Golf

A space-themed 3D mini-golf game built with Three.js.

## Features

- **Two Game Modes**:
  - **Prototype Mode**: Uses primitive geometry only (spheres, boxes, cylinders)
  - **Full Mode**: Features textured planets and space-themed models

- **Controls**:
  - **Keyboard**: Arrow keys or WASD to aim, Space to charge and shoot
  - **Mobile**: Touch buttons for aiming, tap and hold to charge shot

- **Game Elements**:
  - 9 unique holes with increasing difficulty
  - Animated moving obstacles (oscillating, circular motion)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Project Structure

```
Space-Golf/
├── index.html          # Main HTML file with canvas and UI
├── package.json        # Dependencies and scripts
├── src/
│   ├── main.js         # Entry point
│   └── modules/
│       ├── game.js     # Main game controller and loop
│       ├── camera.js   # Camera controls
│       ├── ball.js     # Ball physics and rendering
│       ├── course.js   # Course/hole generation
│       ├── input.js    # Keyboard and touch input
│       └── obstacles.js # Animated moving obstacles
└── assets/
    ├── textures/       # Texture images for full mode
    └── models/         # 3D models for full mode
```

## Controls

| Action | Keyboard | Touch |
|--------|----------|-------|
| Aim Left | Left Arrow / A | Left Button / Swipe |
| Aim Right | Right Arrow / D | Right Button / Swipe |
| Zoom In | Up Arrow / W | - |
| Zoom Out | Down Arrow / S | - |
| Charge Shot | Hold Space | Hold Shoot Button |
| Release Shot | Release Space | Release Shoot Button |

## Gameplay

1. Use the arrow keys or touch controls to aim your shot
2. Hold Space (or the shoot button) to charge your shot power
3. Release to hit the ball
4. Avoid moving obstacles
5. Get the ball into the hole in as few strokes as possible

## Technologies

- [Three.js](https://threejs.org/) - 3D graphics library
- [Vite](https://vitejs.dev/) - Build tool and development server

## License

MIT