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
        
        // Create mesh based on mode
        let geometry, material;
        
        if (this.mode === 'prototype') {
            // Simple geometric shapes
            const shapes = ['box', 'cylinder', 'sphere'];
            const shape = shapes[index % shapes.length];
            
            switch (shape) {
                case 'box':
                    geometry = new THREE.BoxGeometry(
                        obstacle.radius * 2,
                        obstacle.radius * 2,
                        obstacle.radius * 2
                    );
                    break;
                case 'cylinder':
                    geometry = new THREE.CylinderGeometry(
                        obstacle.radius,
                        obstacle.radius,
                        obstacle.radius * 3,
                        16
                    );
                    break;
                default:
                    geometry = new THREE.SphereGeometry(obstacle.radius, 16, 16);
            }
            
            material = new THREE.MeshStandardMaterial({
                color: 0xff6600,
                roughness: 0.6,
                metalness: 0.4
            });
        } else {
            // Space-themed asteroids/objects
            geometry = new THREE.DodecahedronGeometry(obstacle.radius, 0);
            
            material = new THREE.MeshStandardMaterial({
                color: 0x8b4513,
                roughness: 0.9,
                metalness: 0.1,
                flatShading: true
            });
        }
        
        obstacle.mesh = new THREE.Mesh(geometry, material);
        obstacle.mesh.castShadow = true;
        obstacle.mesh.receiveShadow = true;
        
        // Position obstacle
        const angle = (index / 5) * Math.PI * 2;
        const distance = 10 + index * 5;
        obstacle.initialPosition.set(
            Math.cos(angle) * distance * 0.5,
            obstacle.radius + 0.5,
            Math.sin(angle) * distance * 0.3 - holeNumber * 2
        );
        obstacle.mesh.position.copy(obstacle.initialPosition);
        
        this.scene.add(obstacle.mesh);
        this.obstacles.push(obstacle);
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
            
            // Calculate velocity for collision physics
            obstacle.velocity.subVectors(obstacle.mesh.position, prevPos).divideScalar(delta);
            
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
            obstacle.mesh.geometry.dispose();
            obstacle.mesh.material.dispose();
        }
        this.obstacles = [];
    }
    
    dispose() {
        this.clearObstacles();
    }
}
