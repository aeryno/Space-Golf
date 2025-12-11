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
        this.minSpeed = 0.5; // Increased from 0.01 to allow shooting much sooner
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
        // Handle wall collisions (box-shaped objects)
        if (object.isWall) {
            const collision = this.checkBoxCollision(object);
            if (collision) console.log('Box collision detected with wall:', object);
            return collision;
        }
        
        // Handle spherical object collisions (obstacles)
        if (!object.mesh) return false;
        
        const ballPos = this.mesh.position;
        const objPos = object.mesh.position;
        
        // Get bounding sphere/box for collision
        const objRadius = object.radius || 1;
        const distance = ballPos.distanceTo(objPos);
        const collision = distance < (this.radius + objRadius);
        
        // Debug output for close approaches
        if (distance < (this.radius + objRadius) * 1.5) {
            console.log('Obstacle proximity - Distance:', distance.toFixed(2), 'Required:', (this.radius + objRadius).toFixed(2), 'Collision:', collision);
        }
        
        return collision;
    }
    
    checkBoxCollision(wall) {
        const ballPos = this.mesh.position;
        const wallPos = wall.position;
        
        // Get wall dimensions
        const wallWidth = wall.wallWidth || 1;
        const wallHeight = wall.wallHeight || 1;
        const wallDepth = wall.wallDepth || 1;
        
        // Simple distance check first
        const distance = ballPos.distanceTo(wallPos);
        const maxDistance = Math.max(wallWidth, wallHeight, wallDepth) / 2 + this.radius + 1;
        
        if (distance > maxDistance) {
            return false; // Too far away
        }
        
        // Calculate relative position
        const relativePos = ballPos.clone().sub(wallPos);
        
        // Handle wall rotation (simplified)
        if (wall.rotation.y !== 0) {
            relativePos.applyAxisAngle(new THREE.Vector3(0, 1, 0), -wall.rotation.y);
        }
        
        // Check if ball is within the wall's bounding box (expanded by ball radius)
        const halfWidth = wallWidth / 2 + this.radius;
        const halfHeight = wallHeight / 2 + this.radius;
        const halfDepth = wallDepth / 2 + this.radius;
        
        const collision = Math.abs(relativePos.x) < halfWidth &&
                         Math.abs(relativePos.y) < halfHeight &&
                         Math.abs(relativePos.z) < halfDepth;
        
        if (collision) {
            console.log('Box collision details:', {
                ballPos: ballPos.clone(),
                wallPos: wallPos.clone(),
                relativePos: relativePos.clone(),
                wallDimensions: { wallWidth, wallHeight, wallDepth },
                ballRadius: this.radius
            });
        }
        
        return collision;
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
    
    handleWallCollision(wall) {
        // Handle collision with course walls (guard rails)
        const ballPos = this.mesh.position.clone();
        const wallPos = wall.position.clone();
        
        // Get wall dimensions
        const wallWidth = wall.wallWidth || 1;
        const wallHeight = wall.wallHeight || 1;
        const wallDepth = wall.wallDepth || 1;
        
        // Calculate relative position
        const diff = ballPos.clone().sub(wallPos);
        
        // Convert to wall's local coordinates (accounting for rotation)
        const localDiff = diff.clone();
        if (wall.rotation.y !== 0) {
            localDiff.applyAxisAngle(new THREE.Vector3(0, 1, 0), -wall.rotation.y);
        }
        
        // Find the closest point on the wall to the ball
        const closestPoint = new THREE.Vector3(
            Math.max(-wallWidth/2, Math.min(wallWidth/2, localDiff.x)),
            Math.max(-wallHeight/2, Math.min(wallHeight/2, localDiff.y)),
            Math.max(-wallDepth/2, Math.min(wallDepth/2, localDiff.z))
        );
        
        // Calculate penetration vector
        const penetration = localDiff.clone().sub(closestPoint);
        const penetrationDistance = penetration.length();
        
        if (penetrationDistance > 0 && penetrationDistance < this.radius) {
            // Calculate collision normal in local space
            let normal = penetration.normalize();
            
            // If ball is inside the wall, find the closest face
            if (penetrationDistance < 0.01) {
                const distances = [
                    Math.abs(localDiff.x) - wallWidth/2,   // left/right
                    Math.abs(localDiff.y) - wallHeight/2,  // top/bottom
                    Math.abs(localDiff.z) - wallDepth/2    // front/back
                ];
                const minIndex = distances.indexOf(Math.min(...distances));
                
                if (minIndex === 0) normal.set(localDiff.x > 0 ? 1 : -1, 0, 0);
                else if (minIndex === 1) normal.set(0, localDiff.y > 0 ? 1 : -1, 0);
                else normal.set(0, 0, localDiff.z > 0 ? 1 : -1);
            }
            
            // Rotate normal back to world coordinates
            if (wall.rotation.y !== 0) {
                normal.applyAxisAngle(new THREE.Vector3(0, 1, 0), wall.rotation.y);
            }
            
            // Calculate required push distance to separate ball from wall
            const pushDistance = this.radius - penetrationDistance + 0.1;
            
            // Move ball out of wall
            this.mesh.position.add(normal.clone().multiplyScalar(pushDistance));
            
            // Bounce velocity off the wall
            const velocityDotNormal = this.velocity.dot(normal);
            if (velocityDotNormal < 0) { // Only bounce if moving towards the wall
                this.velocity.sub(normal.clone().multiplyScalar(2 * velocityDotNormal));
                
                // Reduce velocity slightly (wall friction/absorption)
                this.velocity.multiplyScalar(0.85);
            }
            
            this.isMoving = true;
        }
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
