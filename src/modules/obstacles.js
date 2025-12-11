/**
 * Obstacle Manager
 * Handles creation and animation of moving obstacles
 */

import * as THREE from 'three';

export class ObstacleManager {
    constructor(scene, mode = 'prototype') {
        this.scene = scene;
        this.mode = mode;
        this.obstacles = [];
        this.time = 0;
    }
    
    createObstacles(holeNumber) {
        this.clearObstacles();
        
        // More obstacles on later holes
        const obstacleCount = Math.min(holeNumber, 5);
        
        for (let i = 0; i < obstacleCount; i++) {
            this.createObstacle(holeNumber, i);
        }
    }
    
    createObstacle(holeNumber, index) {
        const obstacle = {
            mesh: null,
            radius: 1.5 + Math.random(),
            initialPosition: new THREE.Vector3(),
            movementType: 'oscillate', // oscillate, circular, static
            movementSpeed: 1 + Math.random() * 2,
            movementRange: 5 + Math.random() * 10,
            phase: Math.random() * Math.PI * 2,
            velocity: new THREE.Vector3()
        };
        
        // Determine movement type based on hole and index
        const types = ['oscillate', 'circular', 'static'];
        obstacle.movementType = types[index % types.length];
        
        // Create space-themed obstacles
        const spaceObjects = ['planet', 'star', 'ufo'];
        const objectType = spaceObjects[index % spaceObjects.length];
        
        // Make UFOs larger than other obstacles - all UFOs same size as Hole 3
        if (objectType === 'ufo') {
            obstacle.radius = 8; // All UFOs are now the large size
        }
        
        let geometry, material;
        
        switch (objectType) {
            case 'planet':
                // Create planet with rings
                geometry = new THREE.SphereGeometry(obstacle.radius, 32, 32);
                const planetColors = [0x4169e1, 0xdc143c, 0x32cd32, 0xff8c00, 0x9932cc];
                material = new THREE.MeshStandardMaterial({
                    color: planetColors[index % planetColors.length],
                    roughness: 0.7,
                    metalness: 0.2
                });
                
                obstacle.mesh = new THREE.Mesh(geometry, material);
                
                // Add rings to some planets as separate objects
                if (index % 2 === 0) {
                    const ringGeometry = new THREE.RingGeometry(
                        obstacle.radius * 1.3, 
                        obstacle.radius * 1.8, 
                        32
                    );
                    const ringMaterial = new THREE.MeshStandardMaterial({
                        color: 0xffd700,
                        transparent: true,
                        opacity: 0.6,
                        side: THREE.DoubleSide
                    });
                    const rings = new THREE.Mesh(ringGeometry, ringMaterial);
                    // Keep rings mostly horizontal with slight tilt
                    rings.rotation.x = Math.PI / 2;
                    rings.rotation.z = Math.random() * 0.3 - 0.15; // Small random tilt
                    rings.castShadow = true;
                    rings.receiveShadow = true;
                    
                    // Add rings as separate object to scene, not to planet
                    this.scene.add(rings);
                    
                    // Store ring reference for positioning
                    obstacle.rings = rings;
                }
                break;
                
            case 'star':
                // Create multi-pointed star
                const starShape = new THREE.Shape();
                const outerRadius = obstacle.radius;
                const innerRadius = obstacle.radius * 0.4;
                const points = 5;
                
                for (let i = 0; i < points * 2; i++) {
                    const angle = (i / (points * 2)) * Math.PI * 2;
                    const radius = i % 2 === 0 ? outerRadius : innerRadius;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    
                    if (i === 0) {
                        starShape.moveTo(x, y);
                    } else {
                        starShape.lineTo(x, y);
                    }
                }
                starShape.closePath();
                
                geometry = new THREE.ExtrudeGeometry(starShape, {
                    depth: obstacle.radius * 0.2,
                    bevelEnabled: false
                });
                
                material = new THREE.MeshStandardMaterial({
                    color: 0xffff00,
                    roughness: 0.3,
                    metalness: 0.8,
                    emissive: 0x333300
                });
                break;
                
            case 'ufo':
                // Create UFO group for flying saucer
                const ufoGroup = new THREE.Group();
                
                // Main saucer body (flattened sphere)
                const saucerGeometry = new THREE.SphereGeometry(obstacle.radius, 32, 16);
                const saucerMaterial = new THREE.MeshStandardMaterial({
                    color: 0xc0c0c0, // Metallic silver
                    roughness: 0.2,
                    metalness: 0.9
                });
                const saucer = new THREE.Mesh(saucerGeometry, saucerMaterial);
                saucer.scale.y = 0.3; // Flatten to create classic saucer shape
                ufoGroup.add(saucer);
                
                // Top dome
                const domeGeometry = new THREE.SphereGeometry(obstacle.radius * 0.4, 16, 16);
                const domeMaterial = new THREE.MeshStandardMaterial({
                    color: 0x4169e1, // Blue tinted dome
                    roughness: 0.1,
                    metalness: 0.8,
                    transparent: true,
                    opacity: 0.7
                });
                const dome = new THREE.Mesh(domeGeometry, domeMaterial);
                dome.position.y = obstacle.radius * 0.2;
                dome.scale.y = 0.8; // Slightly flatten dome
                ufoGroup.add(dome);
                
                // Green tractor beam pointing downward from UFO base
                const beamGeometry = new THREE.ConeGeometry(
                    obstacle.radius * 0.5, // Bottom radius (wide end at bottom)
                    obstacle.radius * 0.8, // Height (beam length - shorter)
                    16, // Radial segments
                    1,  // Height segments
                    true // Open ended (hollow cone)
                );
                const beamMaterial = new THREE.MeshStandardMaterial({
                    color: 0x00ff00, // Bright green
                    roughness: 0.1,
                    metalness: 0.1,
                    transparent: true,
                    opacity: 0.3,
                    emissive: 0x002200, // Glowing green
                    side: THREE.DoubleSide
                });
                const beam = new THREE.Mesh(beamGeometry, beamMaterial);
                beam.position.y = -obstacle.radius * 0.5; // Position at UFO base
                beam.rotation.x = 0; // Natural downward orientation (point at top)
                ufoGroup.add(beam);
                
                // Add glowing lights around the edge
                const lightCount = 8;
                for (let i = 0; i < lightCount; i++) {
                    const lightGeometry = new THREE.SphereGeometry(obstacle.radius * 0.05, 8, 8);
                    const lightMaterial = new THREE.MeshStandardMaterial({
                        color: 0x00ff00, // Green alien lights
                        roughness: 0.1,
                        metalness: 0.2,
                        emissive: 0x004400 // Glowing effect
                    });
                    const light = new THREE.Mesh(lightGeometry, lightMaterial);
                    
                    const angle = (i / lightCount) * Math.PI * 2;
                    light.position.x = Math.cos(angle) * obstacle.radius * 0.85;
                    light.position.z = Math.sin(angle) * obstacle.radius * 0.85;
                    light.position.y = -obstacle.radius * 0.05;
                    
                    ufoGroup.add(light);
                }
                
                obstacle.mesh = ufoGroup;
                geometry = null; // Not used for custom shape
                material = null; // Not used for custom shape
                break;
        }
        
        // Create mesh if not already created (for non-group objects)
        if (!obstacle.mesh) {
            obstacle.mesh = new THREE.Mesh(geometry, material);
        }
        
        obstacle.mesh.castShadow = true;
        obstacle.mesh.receiveShadow = true;
        
        // Store object type for animation
        obstacle.objectType = objectType;
        
        // Position obstacle - spread out based on course shape and hole number
        if (holeNumber === 3 && index === 2 && objectType === 'ufo') {
            // Special positioning for the central UFO on hole 3 - place it closer to start
            obstacle.initialPosition.set(
                0, // Center X
                obstacle.radius + 1, // Higher up due to large size
                5 // Closer to the starting point
            );
            obstacle.movementType = 'static'; // Keep it stationary as a central obstacle
        } else {
            // Improved positioning system based on hole configuration
            this.positionObstacleForHole(obstacle, holeNumber, index);
            // Adjust height for large UFOs
            if (objectType === 'ufo') {
                obstacle.initialPosition.y = obstacle.radius + 1; // Higher up for large UFOs
            }
        }
        obstacle.mesh.position.copy(obstacle.initialPosition);
        
        this.scene.add(obstacle.mesh);
        this.obstacles.push(obstacle);
    }
    
    positionObstacleForHole(obstacle, holeNumber, index) {
        // Get hole-specific positioning based on course layout
        let x, z;
        
        switch (holeNumber) {
            case 1: // Straight rectangular course (15x50)
                // Spread obstacles along the path with some variation
                const positions1 = [
                    { x: -4, z: 10 },   // Left side, forward
                    { x: 3, z: 0 },     // Right side, center
                    { x: -2, z: -8 },   // Left side, back
                    { x: 5, z: 5 },     // Right side, forward
                    { x: 0, z: -15 }    // Center, back
                ];
                const pos1 = positions1[index % positions1.length];
                x = pos1.x;
                z = pos1.z;
                break;
                
            case 2: // L-shaped course (40x40)
                // Position obstacles in both arms of the L
                const positions2 = [
                    { x: -10, z: 5 },   // Left arm
                    { x: 8, z: -8 },    // Right arm
                    { x: -5, z: -5 },   // Corner area
                    { x: 15, z: 2 },    // Far right
                    { x: -15, z: 8 }    // Far left
                ];
                const pos2 = positions2[index % positions2.length];
                x = pos2.x;
                z = pos2.z;
                break;
                
            case 3: // Rectangle course (20x60)
                // Spread along the longer axis with side variations
                const positions3 = [
                    { x: -6, z: 15 },   // Left, forward
                    { x: 6, z: 8 },     // Right, mid-forward
                    { x: -3, z: -5 },   // Left, mid-back
                    { x: 4, z: -18 },   // Right, back
                    { x: 0, z: 0 }      // Center
                ];
                const pos3 = positions3[index % positions3.length];
                x = pos3.x;
                z = pos3.z;
                break;
                
            case 4: // Donut course (outer radius 30, inner radius 12)
                // Position in the playable ring area
                const ringRadius = 21; // Middle of the ring (12 + 30) / 2
                const angle4 = (index * 2.4) + (holeNumber * 0.5); // Better spacing
                x = Math.cos(angle4) * ringRadius;
                z = Math.sin(angle4) * ringRadius;
                break;
                
            case 5: // Narrow course (25x70)
                // Spread along the length with alternating sides
                const positions5 = [
                    { x: -8, z: 20 },   // Left, forward
                    { x: 7, z: 10 },    // Right, mid-forward
                    { x: -6, z: -2 },   // Left, center
                    { x: 9, z: -15 },   // Right, mid-back
                    { x: -4, z: -25 }   // Left, back
                ];
                const pos5 = positions5[index % positions5.length];
                x = pos5.x;
                z = pos5.z;
                break;
                
            case 6: // Asteroid field (60x60 square)
                // More spread out positioning for larger area
                const positions6 = [
                    { x: -20, z: 15 },  // Far left, forward
                    { x: 18, z: 20 },   // Far right, forward
                    { x: -12, z: -5 },  // Left, back
                    { x: 22, z: -12 },  // Far right, back
                    { x: 5, z: 8 }      // Center-right
                ];
                const pos6 = positions6[index % positions6.length];
                x = pos6.x;
                z = pos6.z;
                break;
                
            case 7: // Split course (30x80)
                // Position obstacles to work with split design
                const positions7 = [
                    { x: -8, z: 25 },   // Left side, forward
                    { x: 10, z: 15 },   // Right side, forward
                    { x: -6, z: -10 },  // Left side, back
                    { x: 8, z: -20 },   // Right side, back
                    { x: 0, z: 5 }      // Center gap
                ];
                const pos7 = positions7[index % positions7.length];
                x = pos7.x;
                z = pos7.z;
                break;
                
            case 8: // Circular course (radius 35)
                // Spread around the circle at different radii
                const angle8 = (index * 1.4) + (holeNumber * 0.3); // Good spacing
                const radius8 = 15 + (index * 4); // Vary radius from center
                x = Math.cos(angle8) * radius8;
                z = Math.sin(angle8) * radius8;
                break;
                
            case 9: // Complex course (70x70)
                // Maximum spread for final challenge
                const positions9 = [
                    { x: -25, z: 20 },  // Far corners
                    { x: 28, z: 25 },
                    { x: -20, z: -18 },
                    { x: 22, z: -22 },
                    { x: 0, z: 0 }      // Center
                ];
                const pos9 = positions9[index % positions9.length];
                x = pos9.x;
                z = pos9.z;
                break;
                
            default:
                // Fallback to improved angular distribution
                const angle = (index * 2.2) + (holeNumber * 0.4);
                const distance = 8 + index * 3;
                x = Math.cos(angle) * distance;
                z = Math.sin(angle) * distance;
        }
        
        // Set position with proper height
        obstacle.initialPosition.set(x, obstacle.radius + 0.5, z);
    }
    
    update(delta) {
        this.time += delta;
        
        for (const obstacle of this.obstacles) {
            const prevPos = obstacle.mesh.position.clone();
            
            switch (obstacle.movementType) {
                case 'oscillate':
                    // Side to side movement
                    obstacle.mesh.position.x = obstacle.initialPosition.x + 
                        Math.sin(this.time * obstacle.movementSpeed + obstacle.phase) * 
                        obstacle.movementRange;
                    break;
                    
                case 'circular':
                    // Circular movement
                    obstacle.mesh.position.x = obstacle.initialPosition.x + 
                        Math.cos(this.time * obstacle.movementSpeed + obstacle.phase) * 
                        obstacle.movementRange;
                    obstacle.mesh.position.z = obstacle.initialPosition.z + 
                        Math.sin(this.time * obstacle.movementSpeed + obstacle.phase) * 
                        obstacle.movementRange;
                    break;
                    
                case 'static':
                    // No movement, just rotation
                    break;
            }
            
            // Add space-themed rotations
            switch (obstacle.objectType) {
                case 'planet':
                    // Planets rotate on their axis (only Y-axis to keep rings stable)
                    obstacle.mesh.rotation.y += delta * 0.5;
                    
                    // Keep rings positioned at planet location but stationary
                    if (obstacle.rings) {
                        obstacle.rings.position.copy(obstacle.mesh.position);
                    }
                    break;
                case 'star':
                    // Stars twinkle and rotate slowly
                    obstacle.mesh.rotation.z += delta * 1.5;
                    // Add pulsing effect
                    const pulse = 1 + Math.sin(this.time * 3) * 0.1;
                    obstacle.mesh.scale.setScalar(pulse);
                    break;
                case 'ufo':
                    // UFOs hover and rotate mysteriously
                    obstacle.mesh.rotation.y += delta * 1.5; // Faster rotation for alien tech
                    obstacle.mesh.position.y = obstacle.initialPosition.y + Math.sin(this.time * 2) * 0.3; // Hovering motion
                    obstacle.mesh.rotation.x = Math.sin(this.time * 1.2) * 0.1; // Slight wobble
                    obstacle.mesh.rotation.z = Math.cos(this.time * 0.8) * 0.1; // Alien flight pattern
                    break;
            }
            
            // Calculate velocity for collision physics
            if (delta > 0) {
                obstacle.velocity.subVectors(obstacle.mesh.position, prevPos).divideScalar(delta);
            }
            
            // Rotate obstacle
            obstacle.mesh.rotation.x += delta * 0.5;
            obstacle.mesh.rotation.y += delta * 0.3;
        }
    }
    
    getObstacles() {
        return this.obstacles;
    }
    
    clearObstacles() {
        for (const obstacle of this.obstacles) {
            this.scene.remove(obstacle.mesh);
            
            // Remove rings if they exist
            if (obstacle.rings) {
                this.scene.remove(obstacle.rings);
                obstacle.rings.geometry.dispose();
                obstacle.rings.material.dispose();
            }
            
            // Dispose of mesh resources
            if (obstacle.mesh.geometry) {
                obstacle.mesh.geometry.dispose();
            }
            if (obstacle.mesh.material) {
                obstacle.mesh.material.dispose();
            }
        }
        this.obstacles = [];
    }
    
    dispose() {
        this.clearObstacles();
    }
}
