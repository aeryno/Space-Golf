Group ID: 0429

# Assets Folder

This folder contains game assets for the Space Golf game.

## Structure

- `textures/` - Contains texture images for planets, surfaces, and UI elements
- `models/` - Contains 3D model files (GLTF/GLB format) for space objects

## Prototype Mode
In prototype mode, the game uses only primitive geometry and basic materials. No external assets are loaded.

## Full Mode
In full mode, the game loads textured planets and space models from these folders.

### Recommended Assets

**Textures:**
- Planet surface textures (diffuse, normal, roughness maps)
- Space skybox/environment maps
- UI elements and indicators

**Models:**
- Space station models
- Asteroid models
- Spacecraft/drone models
- Decorative space objects (satellites, debris, etc.)

## Adding Assets

1. Place texture files in the `textures/` directory
2. Place GLTF/GLB model files in the `models/` directory
3. Update the corresponding loader code in the game modules
