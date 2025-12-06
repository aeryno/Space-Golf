/**
 * Course - Golf course/hole generation
 * Creates the playing surface, obstacles, and hole
 */

import * as THREE from 'three';

export class Course {
    constructor(scene, mode = 'prototype') {
        this.scene = scene;
        this.mode = mode;
        this.objects = [];
        
        // Course data
        this.startPosition = new THREE.Vector3(0, 0, 0);
        this.holePosition = new THREE.Vector3(0, 0, 0);
        this.holeRadius = 1.5;
        this.par = 3;
        
        // Bounds
        this.minBounds = new THREE.Vector3(-50, -10, -50);
        this.maxBounds = new THREE.Vector3(50, 50, 50);
    }
    
    createHole(holeNumber) {
        this.clearCourse();
        
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
                start: new THREE.Vector3(-15, 0, 15),
                hole: new THREE.Vector3(15, 0, -15),
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
            { // Hole 4 - Multiple platforms
                par: 4,
                start: new THREE.Vector3(-20, 0, 20),
                hole: new THREE.Vector3(20, 0, -20),
                groundSize: { width: 50, depth: 50 },
                groundShape: 'scattered'
            },
            { // Hole 5 - With drones (harder)
                par: 4,
                start: new THREE.Vector3(0, 0, 30),
                hole: new THREE.Vector3(0, 0, -30),
                groundSize: { width: 25, depth: 70 },
                groundShape: 'narrow'
            },
            { // Hole 6 - Asteroid field
                par: 4,
                start: new THREE.Vector3(-25, 0, 25),
                hole: new THREE.Vector3(25, 0, -25),
                groundSize: { width: 60, depth: 60 },
                groundShape: 'asteroid'
            },
            { // Hole 7 - Wormhole jump
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
    
    createGround(config) {
        let geometry, material;
        
        if (this.mode === 'prototype') {
            material = new THREE.MeshStandardMaterial({
                color: 0x2a4d2a,
                roughness: 0.8,
                metalness: 0.2
            });
        } else {
            // Space-themed purple/blue surface
            material = new THREE.MeshStandardMaterial({
                color: 0x1a0a3e,
                roughness: 0.6,
                metalness: 0.4,
                emissive: 0x110022,
                emissiveIntensity: 0.1
            });
        }
        
        switch (config.groundShape) {
            case 'circular':
                geometry = new THREE.RingGeometry(
                    config.groundSize.radius - 10,
                    config.groundSize.radius,
                    32
                );
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
                // Multiple platform pieces
                for (let i = 0; i < 5; i++) {
                    const x = (Math.random() - 0.5) * config.groundSize.width;
                    const z = (Math.random() - 0.5) * config.groundSize.depth;
                    const size = 8 + Math.random() * 10;
                    this.createBox(x, -0.5, z, size, 1, size, material);
                }
                // Ensure start and end platforms
                this.createBox(config.start.x, -0.5, config.start.z, 10, 1, 10, material);
                this.createBox(config.hole.x, -0.5, config.hole.z, 10, 1, 10, material);
                break;
                
            default:
                // Default rectangle
                geometry = new THREE.BoxGeometry(
                    config.groundSize.width,
                    1,
                    config.groundSize.depth
                );
                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.y = -0.5;
                mesh.receiveShadow = true;
                this.scene.add(mesh);
                this.objects.push(mesh);
        }
        
        // Add edges/borders
        this.createBorders(config);
    }
    
    createBox(x, y, z, width, height, depth, material) {
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        this.objects.push(mesh);
        return mesh;
    }
    
    createBorders(config) {
        const borderMaterial = new THREE.MeshStandardMaterial({
            color: this.mode === 'prototype' ? 0x444444 : 0x4a00e0,
            roughness: 0.5,
            metalness: 0.5
        });
        
        const borderHeight = 0.5;
        const borderThickness = 0.3;
        
        if (config.groundShape === 'rectangle' || config.groundShape === 'narrow' || config.groundShape === 'split') {
            const w = config.groundSize.width;
            const d = config.groundSize.depth;
            
            // Left border
            this.createBox(-w/2 - borderThickness/2, borderHeight/2, 0, borderThickness, borderHeight, d, borderMaterial);
            // Right border
            this.createBox(w/2 + borderThickness/2, borderHeight/2, 0, borderThickness, borderHeight, d, borderMaterial);
            // Back border
            this.createBox(0, borderHeight/2, -d/2 - borderThickness/2, w, borderHeight, borderThickness, borderMaterial);
            // Front border (with gap for start)
            this.createBox(0, borderHeight/2, d/2 + borderThickness/2, w, borderHeight, borderThickness, borderMaterial);
        }
    }
    
    createHoleMesh() {
        // Create the hole (flag and cup)
        const cupGeometry = new THREE.CylinderGeometry(this.holeRadius, this.holeRadius, 0.5, 32);
        const cupMaterial = new THREE.MeshStandardMaterial({
            color: this.mode === 'prototype' ? 0x000000 : 0xff00ff,
            roughness: 0.3,
            metalness: 0.7
        });
        
        const cup = new THREE.Mesh(cupGeometry, cupMaterial);
        cup.position.copy(this.holePosition);
        cup.position.y = -0.25;
        this.scene.add(cup);
        this.objects.push(cup);
        
        // Flag pole
        const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 5, 8);
        const poleMaterial = new THREE.MeshStandardMaterial({
            color: this.mode === 'prototype' ? 0x888888 : 0xffd700,
            roughness: 0.4,
            metalness: 0.6
        });
        
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
            
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            glow.position.copy(this.holePosition);
            glow.position.y = 0.01;
            glow.rotation.x = -Math.PI / 2;
            this.scene.add(glow);
            this.objects.push(glow);
        }
    }
    
    createDecorations(config) {
        if (this.mode === 'full') {
            // Add planets in the background
            this.createBackgroundPlanets();
        }
    }
    
    createBackgroundPlanets() {
        const planetColors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xfeca57];
        
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
    
    checkHoleCollision(ballPosition) {
        const distance = new THREE.Vector2(
            ballPosition.x - this.holePosition.x,
            ballPosition.z - this.holePosition.z
        ).length();
        
        return distance < this.holeRadius * 0.8;
    }
    
    checkBounds(ball) {
        const pos = ball.getPosition();
        
        // Reset ball if it goes out of bounds
        if (pos.x < this.minBounds.x || pos.x > this.maxBounds.x ||
            pos.y < this.minBounds.y ||
            pos.z < this.minBounds.z || pos.z > this.maxBounds.z) {
            ball.setPosition(this.startPosition);
        }
    }
    
    clearCourse() {
        for (const obj of this.objects) {
            this.scene.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
        }
        this.objects = [];
    }
    
    dispose() {
        this.clearCourse();
    }
}
