/**
 * Camera Controller
 * Handles camera positioning and following the ball
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export class CameraController {
    constructor(canvas) {
        this.canvas = canvas;
        
        // Create perspective camera
        this.camera = new THREE.PerspectiveCamera(
            60, // FOV
            window.innerWidth / window.innerHeight, // Aspect
            0.1, // Near
            2000 // Far
        );
        
        // Camera offset from target
        this.offset = new THREE.Vector3(0, 30, 40);
        this.target = new THREE.Vector3(0, 0, 0);
        this.smoothness = 0.05;
        
        // Initial position
        this.camera.position.set(0, 30, 40);
        this.camera.lookAt(0, 0, 0);
        
        // Orbit controls state (for manual adjustment)
        this.orbitAngle = 0;
        this.orbitRadius = 50;
        this.orbitHeight = 30;
    }
    
    updateAspect(aspect) {
        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();
    }
    
    followTarget(targetPosition) {
        // Calculate desired camera position based on orbit
        const x = targetPosition.x + Math.sin(this.orbitAngle) * this.orbitRadius;
        const z = targetPosition.z + Math.cos(this.orbitAngle) * this.orbitRadius;
        const y = targetPosition.y + this.orbitHeight;
        
        // Smooth interpolation to desired position
        this.camera.position.x += (x - this.camera.position.x) * this.smoothness;
        this.camera.position.y += (y - this.camera.position.y) * this.smoothness;
        this.camera.position.z += (z - this.camera.position.z) * this.smoothness;
        
        // Look at target
        this.target.lerp(targetPosition, this.smoothness);
        this.camera.lookAt(this.target);
    }
    
    rotateLeft(amount = 0.05) {
        this.orbitAngle -= amount;
    }
    
    rotateRight(amount = 0.05) {
        this.orbitAngle += amount;
    }
    
    zoomIn(amount = 2) {
        this.orbitRadius = Math.max(20, this.orbitRadius - amount);
    }
    
    zoomOut(amount = 2) {
        this.orbitRadius = Math.min(100, this.orbitRadius + amount);
    }
    
    getAimDirection() {
        // Return the direction the camera is facing (for aiming)
        const direction = new THREE.Vector3();
        direction.x = -Math.sin(this.orbitAngle);
        direction.z = -Math.cos(this.orbitAngle);
        direction.y = 0;
        return direction.normalize();
    }
}
