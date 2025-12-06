/**
 * Ball - Golf ball physics and rendering
 * Handles ball movement, physics simulation, and collisions
 */

import * as THREE from 'three';

export class Ball {
    constructor(scene, mode = 'prototype') {
        this.scene = scene;
        this.mode = mode;
        
        // Physics properties
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.friction = 0.98;
        this.gravity = -9.8;
        this.bounciness = 0.6;
        this.minSpeed = 0.01;
        this.isMoving = false;
        
        // Ball properties
        this.radius = 0.5;
        
        // Create the ball mesh
        this.createMesh();
    }
    
    createMesh() {
        const geometry = new THREE.SphereGeometry(this.radius, 32, 32);
        let material;
        
        if (this.mode === 'prototype') {
            // Simple white material for prototype mode
            material = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                roughness: 0.4,
                metalness: 0.1
            });
        } else {
            // Glowing material for full mode
            material = new THREE.MeshStandardMaterial({
                color: 0x00ffff,
                emissive: 0x00aaff,
                emissiveIntensity: 0.5,
                roughness: 0.2,
                metalness: 0.8
            });
        }
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);
        
        // Add glow effect in full mode
        if (this.mode === 'full') {
            this.addGlow();
        }
    }
    
    addGlow() {
        const glowGeometry = new THREE.SphereGeometry(this.radius * 1.5, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide
        });
        this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        this.mesh.add(this.glowMesh);
    }
    
    setPosition(position) {
        this.mesh.position.copy(position);
        this.mesh.position.y = this.radius; // Ensure ball is on ground
        this.velocity.set(0, 0, 0);
        this.isMoving = false;
    }
    
    getPosition() {
        return this.mesh.position.clone();
    }
    
    shoot(direction, power) {
        const force = power * 50; // Max speed
        this.velocity.x = direction.x * force;
        this.velocity.z = direction.z * force;
        this.velocity.y = power * 5; // Slight upward arc
        this.isMoving = true;
    }
    
    update(delta) {
        if (!this.isMoving && this.velocity.length() < this.minSpeed) {
            return;
        }
        
        // Apply gravity
        this.velocity.y += this.gravity * delta;
        
        // Apply velocity
        this.mesh.position.x += this.velocity.x * delta;
        this.mesh.position.y += this.velocity.y * delta;
        this.mesh.position.z += this.velocity.z * delta;
        
        // Ground collision
        if (this.mesh.position.y < this.radius) {
            this.mesh.position.y = this.radius;
            this.velocity.y *= -this.bounciness;
            
            // Apply friction on ground
            this.velocity.x *= this.friction;
            this.velocity.z *= this.friction;
        }
        
        // Apply air resistance
        this.velocity.x *= 0.995;
        this.velocity.z *= 0.995;
        
        // Check if ball has stopped
        if (this.velocity.length() < this.minSpeed && this.mesh.position.y <= this.radius + 0.01) {
            this.velocity.set(0, 0, 0);
            this.isMoving = false;
        }
        
        // Rotate ball based on velocity (visual effect)
        const rotationSpeed = this.velocity.length() * 2;
        this.mesh.rotation.x += this.velocity.z * delta * rotationSpeed;
        this.mesh.rotation.z -= this.velocity.x * delta * rotationSpeed;
    }
    
    checkCollision(object) {
        if (!object.mesh) return false;
        
        const ballPos = this.mesh.position;
        const objPos = object.mesh.position;
        
        // Get bounding sphere/box for collision
        const objRadius = object.radius || 1;
        const distance = ballPos.distanceTo(objPos);
        
        return distance < (this.radius + objRadius);
    }
    
    handleCollision(obstacle) {
        // Calculate bounce direction
        const normal = new THREE.Vector3()
            .subVectors(this.mesh.position, obstacle.mesh.position)
            .normalize();
        
        // Reflect velocity
        const dot = this.velocity.dot(normal);
        this.velocity.sub(normal.multiplyScalar(2 * dot));
        
        // Apply some energy loss
        this.velocity.multiplyScalar(0.8);
        
        // Push ball out of obstacle
        const pushDistance = this.radius + (obstacle.radius || 1) - 
            this.mesh.position.distanceTo(obstacle.mesh.position);
        if (pushDistance > 0) {
            const pushDir = new THREE.Vector3()
                .subVectors(this.mesh.position, obstacle.mesh.position)
                .normalize();
            this.mesh.position.add(pushDir.multiplyScalar(pushDistance));
        }
    }
    
    handleDroneCollision(drone) {
        // Drones push the ball in their movement direction
        if (drone.velocity) {
            this.velocity.add(drone.velocity.clone().multiplyScalar(0.5));
        } else {
            // Default push away
            const pushDir = new THREE.Vector3()
                .subVectors(this.mesh.position, drone.mesh.position)
                .normalize();
            this.velocity.add(pushDir.multiplyScalar(5));
        }
        this.isMoving = true;
    }
    
    canShoot() {
        return !this.isMoving;
    }
    
    dispose() {
        this.scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
        if (this.glowMesh) {
            this.glowMesh.geometry.dispose();
            this.glowMesh.material.dispose();
        }
    }
}
