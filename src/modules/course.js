/**
 * Course - Golf course/hole generation
 * Creates the playing surface, obstacles, and hole
 * Used copilot to help
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
// Import any additional modules if needed
export class Course {
    // Initialize with scene and mode
    constructor(scene, mode = 'prototype') {
        this.scene = scene;
        this.mode = mode;
        this.objects = [];
        this.walls = [];
        this.currentHoleNumber = 1;
        
        // Course data
        this.startPosition = new THREE.Vector3(0, 0, 0);
        this.holePosition = new THREE.Vector3(0, 0, 0);
        this.holeRadius = 1.5;
        this.par = 3;
        
        // Bounds - more restrictive for out-of-bounds detection
        this.minBounds = new THREE.Vector3(-30, -10, -30);
        this.maxBounds = new THREE.Vector3(30, 20, 30);
    }
    // Clear existing course objects
    createHole(holeNumber) {
        this.clearCourse();
        this.currentHoleNumber = holeNumber; // Store current hole number
        
        // Get hole configuration
        const holeConfig = this.getHoleConfig(holeNumber);
        this.par = holeConfig.par;
        this.startPosition.copy(holeConfig.start);
        this.holePosition.copy(holeConfig.hole);
        
        // Create ground/platform
        this.createGround(holeConfig);
        
        // Create the hole (target)
        this.createHoleMesh();
        
        // Create decorative elements
        this.createDecorations(holeConfig);
    }
    // Get configuration for each hole
    getHoleConfig(holeNumber) {
        // Different configurations for each hole
        const configs = [
            { // Hole 1 - Simple straight
                par: 2,
                start: new THREE.Vector3(0, 0, 20),
                hole: new THREE.Vector3(0, 0, -20),
                groundSize: { width: 15, depth: 50 },
                groundShape: 'rectangle'
            },
            { // Hole 2 - Slight curve
                par: 3,
                start: new THREE.Vector3(-15, 0, 10),
                hole: new THREE.Vector3(12, 0, -12),
                groundSize: { width: 40, depth: 40 },
                groundShape: 'L'
            },
            { // Hole 3 - Planet platform
                par: 3,
                start: new THREE.Vector3(0, 0, 25),
                hole: new THREE.Vector3(0, 0, -25),
                groundSize: { width: 20, depth: 60 },
                groundShape: 'rectangle'
            },
            { // Hole 4 - Donut shaped course
                par: 3,
                start: new THREE.Vector3(0, 0, 25),
                hole: new THREE.Vector3(0, 0, -25),
                groundSize: { outerRadius: 30, innerRadius: 12 },
                groundShape: 'donut'
            },
            { // Hole 5 
                par: 4,
                start: new THREE.Vector3(0, 0, 30),
                hole: new THREE.Vector3(0, 0, -30),
                groundSize: { width: 25, depth: 70 },
                groundShape: 'narrow'
            },
            { // Hole 6 - Donut course
                par: 4,
                start: new THREE.Vector3(0, 0, 25),
                hole: new THREE.Vector3(0, 0, -25),
                groundSize: { outerRadius: 30, innerRadius: 12 },
                groundShape: 'donut'
            },
            { // Hole 7 
                par: 5,
                start: new THREE.Vector3(0, 0, 35),
                hole: new THREE.Vector3(0, 0, -35),
                groundSize: { width: 30, depth: 80 },
                groundShape: 'split'
            },
            { // Hole 8 - Ring world
                par: 5,
                start: new THREE.Vector3(30, 0, 0),
                hole: new THREE.Vector3(-30, 0, 0),
                groundSize: { radius: 35 },
                groundShape: 'circular'
            },
            { // Hole 9 - Final challenge
                par: 6,
                start: new THREE.Vector3(-30, 0, 30),
                hole: new THREE.Vector3(30, 0, -30),
                groundSize: { width: 70, depth: 70 },
                groundShape: 'complex'
            }
        ];
        
        return configs[Math.min(holeNumber - 1, configs.length - 1)];
    }
    // Create ground/platform based on configuration
    createGround(config) {
        let geometry, material;
        // Choose material based on mode
        if (this.mode === 'prototype') {
            material = new THREE.MeshStandardMaterial({
                color: 0x2a4d2a,
                roughness: 0.8,
                metalness: 0.2
            });
        } else {
            // Space-themed brighter purple surface
            material = new THREE.MeshStandardMaterial({
                color: 0x4d1a99, 
                roughness: 0.4,
                metalness: 0.3,
                emissive: 0x330055, 
                emissiveIntensity: 0.3
            });
        }
        // Create ground shape based on config
        switch (config.groundShape) {
            // Circular ground
            case 'circular':
                geometry = new THREE.CircleGeometry(config.groundSize.radius, 32);
                const circleMesh = new THREE.Mesh(geometry, material);
                circleMesh.rotation.x = -Math.PI / 2;
                circleMesh.receiveShadow = true;
                this.scene.add(circleMesh);
                this.objects.push(circleMesh);
                break;
                
            case 'L':
                // Create L-shaped course with two boxes
                this.createBox(0, -0.5, 0, config.groundSize.width, 1, config.groundSize.depth * 0.6, material);
                this.createBox(config.groundSize.width * 0.3, -0.5, -config.groundSize.depth * 0.3, 
                    config.groundSize.width * 0.6, 1, config.groundSize.depth * 0.4, material);
                break;
                
            case 'scattered':
                // Create connected stepping stone platforms from start to hole
                const startX = config.start.x;
                const startZ = config.start.z;
                const holeX = config.hole.x;
                const holeZ = config.hole.z;
                
                // Store platform info for wall creation
                config.scatteredPlatforms = [];
                
                // Create start platform
                this.createBox(startX, -0.5, startZ, 12, 1, 12, material);
                config.scatteredPlatforms.push({x: startX, z: startZ, size: 12});
                
                // Create intermediate stepping stones in a path
                const numSteps = 4;
                for (let i = 1; i <= numSteps; i++) {
                    const progress = i / (numSteps + 1);
                    const x = startX + (holeX - startX) * progress;
                    const z = startZ + (holeZ - startZ) * progress;
                    // Add some variation but keep platforms reachable
                    const offsetX = (Math.random() - 0.5) * 8;
                    const offsetZ = (Math.random() - 0.5) * 8;
                    const size = 10 + Math.random() * 4;
                    const finalX = x + offsetX;
                    const finalZ = z + offsetZ;
                    this.createBox(finalX, -0.5, finalZ, size, 1, size, material);
                    config.scatteredPlatforms.push({x: finalX, z: finalZ, size: size});
                }
                
                // Create hole platform
                this.createBox(holeX, -0.5, holeZ, 12, 1, 12, material);
                config.scatteredPlatforms.push({x: holeX, z: holeZ, size: 12});
                break;
                
            case 'donut':
                // Create donut/ring shaped course
                geometry = new THREE.RingGeometry(
                    config.groundSize.innerRadius,
                    config.groundSize.outerRadius,
                    32
                );
                // Create mesh
                const donutMesh = new THREE.Mesh(geometry, material);
                donutMesh.rotation.x = -Math.PI / 2;
                donutMesh.position.y = -0.5;
                donutMesh.receiveShadow = true;
                this.scene.add(donutMesh);
                this.objects.push(donutMesh);
                break;
                
            case 'star':
                // Create star-shaped course with 5 points
                const starShape = new THREE.Shape();
                const outerRadius = config.groundSize.outerRadius;
                const innerRadius = config.groundSize.innerRadius;
                const points = 5;
                
                // Start at the first outer point
                starShape.moveTo(0, outerRadius);
                
                for (let i = 1; i <= points * 2; i++) {
                    const angle = (i * Math.PI) / points;
                    const radius = i % 2 === 0 ? outerRadius : innerRadius;
                    const x = Math.sin(angle) * radius;
                    const y = Math.cos(angle) * radius;
                    starShape.lineTo(x, y);
                }
                // Close the shape
                geometry = new THREE.ShapeGeometry(starShape);
                const starMesh = new THREE.Mesh(geometry, material);
                starMesh.rotation.x = -Math.PI / 2;
                starMesh.position.y = -0.5;
                starMesh.receiveShadow = true;
                this.scene.add(starMesh);
                this.objects.push(starMesh);
                break;
                
            default:
                // Default rectangle
                geometry = new THREE.BoxGeometry(
                    config.groundSize.width,
                    1,
                    config.groundSize.depth
                );
                // Create mesh
                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.y = -0.5;
                mesh.receiveShadow = true;
                this.scene.add(mesh);
                this.objects.push(mesh);
        }
        
        // Add edges/borders
        this.createBorders(config);
        
        // Add boundary walls
        this.createBoundaryWalls(config);
    }
    // Create a box and add to scene
    createBox(x, y, z, width, height, depth, material) {
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        this.objects.push(mesh);
        return mesh;
    }
    // Create a wall box and add to scene
    createWallBox(x, y, z, width, height, depth, material) {
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        mesh.receiveShadow = true;
        
        // Store wall properties for collision detection
        mesh.isWall = true;
        mesh.wallWidth = width;
        mesh.wallHeight = height;
        mesh.wallDepth = depth;
        
        this.scene.add(mesh);
        this.objects.push(mesh);
        this.walls.push(mesh); // Add to walls array for collision checking
        return mesh;
    }
    
    createBorders(config) {
        // No borders - removed all borders from every hole
        return;
    }
    
    createBoundaryWalls(config) {
        // No walls - removed all boundary walls from every hole
        return;
    }
    
    createRectangularWalls(config, material, height, thickness) {
        const w = config.groundSize.width;
        const d = config.groundSize.depth;
        
        // Left wall
        this.createWallBox(-w/2 - thickness/2, height/2, 0, thickness, height, d + thickness, material);
        // Right wall
        this.createWallBox(w/2 + thickness/2, height/2, 0, thickness, height, d + thickness, material);
        // Back wall
        this.createWallBox(0, height/2, -d/2 - thickness/2, w + thickness*2, height, thickness, material);
        // Front wall
        this.createWallBox(0, height/2, d/2 + thickness/2, w + thickness*2, height, thickness, material);
    }
    // Create circular walls for circular courses
    createCircularWalls(config, material, height, thickness) {
        const radius = config.groundSize.radius;
        const segments = 48; // Increased for smoother curves
        // Create outer ring of walls
        for (let i = 0; i < segments; i++) {
            const angle1 = (i / segments) * Math.PI * 2;
            const angle2 = ((i + 1) / segments) * Math.PI * 2 + 0.01; // Small overlap to prevent gaps
            // Calculate wall segment endpoints
            const x1 = Math.cos(angle1) * (radius + thickness/2);
            const z1 = Math.sin(angle1) * (radius + thickness/2);
            const x2 = Math.cos(angle2) * (radius + thickness/2);
            const z2 = Math.sin(angle2) * (radius + thickness/2);
            // Midpoint for positioning
            const midX = (x1 + x2) / 2;
            const midZ = (z1 + z2) / 2;
            // Calculate wall length and angle
            const wallLength = Math.sqrt((x2-x1)*(x2-x1) + (z2-z1)*(z2-z1));
            const wallAngle = Math.atan2(z2-z1, x2-x1);
            // Create wall mesh
            const wallGeometry = new THREE.BoxGeometry(wallLength, height, thickness);
            const wall = new THREE.Mesh(wallGeometry, material);
            wall.position.set(midX, height/2, midZ);
            wall.rotation.y = wallAngle;
            
            // Store wall properties for collision detection
            wall.isWall = true;
            wall.wallWidth = wallLength;
            wall.wallHeight = height;
            wall.wallDepth = thickness;
            
            this.scene.add(wall);
            this.objects.push(wall);
            this.walls.push(wall); // Add to walls array for collision checking
        }
    }
    // Create L-shaped walls for L-shaped courses
    createLShapeWalls(config, material, height, thickness) {
        const w = config.groundSize.width;
        const d = config.groundSize.depth;
        
        // Main section walls
        this.createWallBox(-w/4 - thickness/2, height/2, 0, thickness, height, d*0.6 + thickness, material);
        this.createWallBox(w/4 + thickness/2, height/2, 0, thickness, height, d*0.6 + thickness, material);
        this.createWallBox(0, height/2, -d*0.3 - thickness/2, w/2 + thickness*2, height, thickness, material);
        this.createWallBox(0, height/2, d*0.3 + thickness/2, w/2 + thickness*2, height, thickness, material);
        
        // Extension section walls
        const extW = w * 0.6;
        const extD = d * 0.4;
        const extX = w * 0.3;
        const extZ = -d * 0.3;
        // Extension walls
        this.createWallBox(extX - extW/2 - thickness/2, height/2, extZ, thickness, height, extD + thickness, material);
        this.createWallBox(extX + extW/2 + thickness/2, height/2, extZ, thickness, height, extD + thickness, material);
        this.createWallBox(extX, height/2, extZ - extD/2 - thickness/2, extW + thickness*2, height, thickness, material);
        this.createWallBox(extX, height/2, extZ + extD/2 + thickness/2, extW + thickness*2, height, thickness, material);
    }
    // Create donut-shaped walls for donut-shaped courses
    createDonutWalls(config, material, height, thickness) {
        const innerRadius = config.groundSize.innerRadius;
        const segments = 48; // Increased for smoother curves
        
        // Create inner ring of walls - barriers facing outward from center
        for (let i = 0; i < segments; i++) {
            const angle1 = (i / segments) * Math.PI * 2;
            const angle2 = ((i + 1) / segments) * Math.PI * 2 + 0.01; // Small overlap to prevent gaps
            // Calculate wall segment endpoints
            const x1 = Math.cos(angle1) * (innerRadius - thickness/2);
            const z1 = Math.sin(angle1) * (innerRadius - thickness/2);
            const x2 = Math.cos(angle2) * (innerRadius - thickness/2);
            const z2 = Math.sin(angle2) * (innerRadius - thickness/2);
            // Midpoint for positioning
            const centerX = (x1 + x2) / 2;
            const centerZ = (z1 + z2) / 2;
            const wallLength = Math.sqrt((x2-x1)**2 + (z2-z1)**2);
            const wallAngle = Math.atan2(z2-z1, x2-x1);
            // Create wall mesh
            const wall = new THREE.Mesh(
                new THREE.BoxGeometry(wallLength, height, thickness),
                material
            );
            wall.position.set(centerX, height/2, centerZ);
            wall.rotation.y = wallAngle;
            wall.receiveShadow = true;
            // Store wall properties for collision detection
            wall.isWall = true;
            wall.wallWidth = wallLength;
            wall.wallHeight = height;
            wall.wallDepth = thickness;
            
            this.scene.add(wall);
            this.objects.push(wall);
            this.walls.push(wall);
        }
    }
    // Create walls for scattered platforms
    createScatteredWalls(config, material, height, thickness) {
        // Create walls around all scattered platforms, avoiding overlaps
        if (config.scatteredPlatforms) {
            this.createNonOverlappingPlatformWalls(config.scatteredPlatforms, material, height, thickness);
        } else {
            // Fallback for older scattered course format
            this.createPlatformWalls(config.start.x, config.start.z, 10, material, height, thickness);
            this.createPlatformWalls(config.hole.x, config.hole.z, 10, material, height, thickness);
        }
    }
    // Create walls around multiple platforms without overlapping
    createNonOverlappingPlatformWalls(platforms, material, height, thickness) {
        // Track wall segments to avoid overlaps
        const wallSegments = [];
        // For each platform, attempt to create walls on all four sides
        for (const platform of platforms) {
            const x = platform.x;
            const z = platform.z;
            const halfSize = platform.size / 2;
            
            // Define potential wall positions for this platform
            const potentialWalls = [
                { // Left wall
                    x: x - halfSize - thickness/2,
                    z: z,
                    width: thickness,
                    depth: platform.size + thickness,
                    orientation: 'vertical'
                },
                { // Right wall
                    x: x + halfSize + thickness/2,
                    z: z,
                    width: thickness,
                    depth: platform.size + thickness,
                    orientation: 'vertical'
                },
                { // Back wall
                    x: x,
                    z: z - halfSize - thickness/2,
                    width: platform.size + thickness*2,
                    depth: thickness,
                    orientation: 'horizontal'
                },
                { // Front wall
                    x: x,
                    z: z + halfSize + thickness/2,
                    width: platform.size + thickness*2,
                    depth: thickness,
                    orientation: 'horizontal'
                }
            ];
            
            // Check each wall against existing walls and only create if no overlap
            for (const wall of potentialWalls) {
                if (!this.wallOverlaps(wall, wallSegments)) {
                    this.createWallBox(wall.x, height/2, wall.z, wall.width, height, wall.depth, material);
                    wallSegments.push(wall);
                }
            }
        }
    }
    // Check if a new wall overlaps with existing walls
    wallOverlaps(newWall, existingWalls) {
        for (const existing of existingWalls) {
            // Check for overlap - walls overlap if they intersect in both x and z dimensions
            const newLeft = newWall.x - newWall.width/2;
            const newRight = newWall.x + newWall.width/2;
            const newBack = newWall.z - newWall.depth/2;
            const newFront = newWall.z + newWall.depth/2;
            // Existing wall boundaries
            const existingLeft = existing.x - existing.width/2;
            const existingRight = existing.x + existing.width/2;
            const existingBack = existing.z - existing.depth/2;
            const existingFront = existing.z + existing.depth/2;
            
            // Check if rectangles overlap
            const xOverlap = !(newRight <= existingLeft || newLeft >= existingRight);
            const zOverlap = !(newFront <= existingBack || newBack >= existingFront);
            
            if (xOverlap && zOverlap) {
                return true; // Overlap detected
            }
        }
        return false; // No overlap
    }
    // Create walls around a single platform
    createPlatformWalls(x, z, size, material, height, thickness) {
        const halfSize = size / 2;
        // Left wall
        this.createWallBox(x - halfSize - thickness/2, height/2, z, thickness, height, size + thickness, material);
        // Right wall  
        this.createWallBox(x + halfSize + thickness/2, height/2, z, thickness, height, size + thickness, material);
        // Back wall
        this.createWallBox(x, height/2, z - halfSize - thickness/2, size + thickness*2, height, thickness, material);
        // Front wall
        this.createWallBox(x, height/2, z + halfSize + thickness/2, size + thickness*2, height, thickness, material);
    }

    createHoleMesh() {
        // Create the hole (flag and cup)
        const cupGeometry = new THREE.CylinderGeometry(this.holeRadius, this.holeRadius, 0.5, 32);
        const cupMaterial = new THREE.MeshStandardMaterial({
            color: 0x000000,
            roughness: 0.3,
            metalness: 0.7
        });
        // Cup mesh
        const cup = new THREE.Mesh(cupGeometry, cupMaterial);
        cup.position.copy(this.holePosition);
        cup.position.y = -0.1; 
        this.scene.add(cup);
        this.objects.push(cup);
        
        // Flag pole
        const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 5, 8);
        const poleMaterial = new THREE.MeshStandardMaterial({
            color: this.mode === 'prototype' ? 0x888888 : 0xffd700,
            roughness: 0.4,
            metalness: 0.6
        });
        // Pole mesh
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.copy(this.holePosition);
        pole.position.y = 2.5;
        this.scene.add(pole);
        this.objects.push(pole);
        
        // Flag
        const flagGeometry = new THREE.PlaneGeometry(2, 1);
        const flagMaterial = new THREE.MeshStandardMaterial({
            color: this.mode === 'prototype' ? 0xff0000 : 0x00ffff,
            roughness: 0.5,
            side: THREE.DoubleSide,
            emissive: this.mode === 'full' ? 0x00aaff : 0x000000,
            emissiveIntensity: 0.3
        });
        // Flag mesh
        const flag = new THREE.Mesh(flagGeometry, flagMaterial);
        flag.position.copy(this.holePosition);
        flag.position.y = 4.5;
        flag.position.x += 1;
        this.scene.add(flag);
        this.objects.push(flag);
        
        // Glow effect around hole in full mode
        if (this.mode === 'full') {
            const glowGeometry = new THREE.RingGeometry(this.holeRadius, this.holeRadius + 0.5, 32);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: 0xff00ff,
                transparent: true,
                opacity: 0.5,
                side: THREE.DoubleSide
            });
            // Glow mesh
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            glow.position.copy(this.holePosition);
            glow.position.y = 0.01;
            glow.rotation.x = -Math.PI / 2;
            this.scene.add(glow);
            this.objects.push(glow);
        }
    }
    // Create decorative elements based on mode
    createDecorations(config) {
        if (this.mode === 'full') {
            // Add planets in the background
            this.createBackgroundPlanets();
        }
    }
    // Create decorative planets in the background
    createBackgroundPlanets() {
        const planetColors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xfeca57];
        // Create several planets at random positions
        for (let i = 0; i < 5; i++) {
            const radius = 5 + Math.random() * 15;
            const geometry = new THREE.SphereGeometry(radius, 32, 32);
            const material = new THREE.MeshStandardMaterial({
                color: planetColors[i % planetColors.length],
                roughness: 0.7,
                metalness: 0.3
            });
            
            const planet = new THREE.Mesh(geometry, material);
            
            // Position planets far away
            const angle = (i / 5) * Math.PI * 2;
            planet.position.x = Math.cos(angle) * (100 + Math.random() * 50);
            planet.position.y = 20 + Math.random() * 60;
            planet.position.z = Math.sin(angle) * (100 + Math.random() * 50);
            
            this.scene.add(planet);
            this.objects.push(planet);
        }
    }
    
    getStartPosition() {
        return this.startPosition.clone();
    }
    
    getPar() {
        return this.par;
    }
    
    getWalls() {
        return this.walls;
    }

    checkHoleCollision(ballPosition) {
        const dx = ballPosition.x - this.holePosition.x;
        const dz = ballPosition.z - this.holePosition.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        return distance < this.holeRadius * 0.8;
    }
    
    checkBounds(ball) {
        const pos = ball.getPosition();
        
        // Check bounds based on course shape and wall positions
        const holeConfig = this.getHoleConfig(this.getCurrentHole());
        // Use specific bounds checking per shape
        switch (holeConfig.groundShape) {
            case 'rectangle':
            case 'narrow':
            case 'split':
                return this.checkRectangularBounds(pos, holeConfig);
            case 'circular':
                return this.checkCircularBounds(pos, holeConfig);
            case 'L':
                return this.checkLShapeBounds(pos, holeConfig);
            case 'scattered':
                return this.checkScatteredBounds(pos, holeConfig);
            case 'donut':
                return this.checkDonutBounds(pos, holeConfig);
            default:
                return this.checkRectangularBounds(pos, holeConfig);
        }
    }
    
    getCurrentHole() {
        return this.currentHoleNumber || 1;
    }
    
    checkRectangularBounds(pos, config) {
        const w = config.groundSize.width;
        const d = config.groundSize.depth;
        const wallThickness = 0.3;
        const wallHeight = 0.8;
        const safetyMargin = 2.0; 
        
        // Check if ball is significantly beyond walls (not just touching)
        const wayBeyondWalls = (pos.x < -w/2 - wallThickness - safetyMargin ||
                               pos.x > w/2 + wallThickness + safetyMargin ||
                               pos.z < -d/2 - wallThickness - safetyMargin ||
                               pos.z > d/2 + wallThickness + safetyMargin);
        
        // Ball is out if way beyond walls AND below wall height, or if it falls way below
        if ((wayBeyondWalls && pos.y <= wallHeight) || pos.y < -5) {
            return true;
        }
        return false;
    }
    
    checkCircularBounds(pos, config) {
        const radius = config.groundSize.radius;
        const wallThickness = 0.3;
        const wallHeight = 0.8;
        const safetyMargin = 2.0; 
        
        // Calculate distance from center
        const distance = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
        
        // Check if ball is significantly beyond circular wall
        const wayBeyondWall = distance > radius + wallThickness + safetyMargin;
        
        // Ball is out if way beyond wall AND below wall height, or falls way below
        if ((wayBeyondWall && pos.y <= wallHeight) || pos.y < -5) {
            return true;
        }
        return false;
    }
    
    checkLShapeBounds(pos, config) {
        const w = config.groundSize.width;
        const d = config.groundSize.depth;
        const wallThickness = 0.3;
        const wallHeight = 0.8;
        const safetyMargin = 8.0;
        
        // Check if in main section (with safety margin)
        const inMainSection = (pos.x >= -w/4 - wallThickness - safetyMargin && pos.x <= w/4 + wallThickness + safetyMargin &&
                              pos.z >= -d*0.3 - wallThickness - safetyMargin && pos.z <= d*0.3 + wallThickness + safetyMargin);
        
        // Check if in extension section (with safety margin)
        const extW = w * 0.6;
        const extD = d * 0.4;
        const extX = w * 0.3;
        const extZ = -d * 0.3;
        const inExtSection = (pos.x >= extX - extW/2 - wallThickness - safetyMargin && pos.x <= extX + extW/2 + wallThickness + safetyMargin &&
                             pos.z >= extZ - extD/2 - wallThickness - safetyMargin && pos.z <= extZ + extD/2 + wallThickness + safetyMargin);
        
        // Ball is way outside bounds only if not in either expanded section
        const wayOutsideBounds = !inMainSection && !inExtSection;
        
        // Ball is out if way outside bounds AND below wall height, or falls way below
        if ((wayOutsideBounds && pos.y <= wallHeight) || pos.y < -5) {
            return true;
        }
        return false;
    }
    
    checkScatteredBounds(pos, config) {
        const wallThickness = 0.3;
        const platformSize = 10;
        const wallHeight = 0.8;
        const safetyMargin = 3.0; 
        
        // Check if near start platform (with safety margin)
        const nearStart = (Math.abs(pos.x - config.start.x) <= platformSize/2 + wallThickness + safetyMargin &&
                          Math.abs(pos.z - config.start.z) <= platformSize/2 + wallThickness + safetyMargin);
        
        // Check if near hole platform (with safety margin)
        const nearHole = (Math.abs(pos.x - config.hole.x) <= platformSize/2 + wallThickness + safetyMargin &&
                         Math.abs(pos.z - config.hole.z) <= platformSize/2 + wallThickness + safetyMargin);
        
        // For scattered courses, be even more lenient - only restart if extremely far
        const extremelyFarOut = (Math.abs(pos.x) > 50 || Math.abs(pos.z) > 50);
        
        // Ball is out if extremely far AND below wall height, or falls way below
        if ((extremelyFarOut && pos.y <= wallHeight) || pos.y < -5) {
            return true;
        }
        return false;
    }
    
    checkDonutBounds(pos, config) {
        const outerRadius = config.groundSize.outerRadius;
        const innerRadius = config.groundSize.innerRadius;
        const wallThickness = 0.3;
        const wallHeight = 0.8;
        const safetyMargin = 3.0; // Reduced safety margin to make bounds more strict
        
        // Calculate distance from center
        const distanceFromCenter = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
        
        // Ball is out if it's outside the outer radius or inside the inner radius
        const outsideOuter = distanceFromCenter > (outerRadius + wallThickness + safetyMargin);
        const insideInner = distanceFromCenter < (innerRadius - wallThickness - safetyMargin);
        const belowGround = pos.y < -3; // Fall detection
        
        // Add debug logging
        if (outsideOuter || insideInner || belowGround) {
            console.log('Donut bounds violation:', {
                distanceFromCenter,
                outsideOuter,
                insideInner,
                belowGround,
                pos: {x: pos.x, y: pos.y, z: pos.z}
            });
        }
        
        return outsideOuter || insideInner || belowGround;
    }
    
    clearCourse() {
        for (const obj of this.objects) {
            this.scene.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
        }
        this.objects = [];
        this.walls = []; // Clear walls array too
    }
    
    dispose() {
        this.clearCourse();
    }
}
