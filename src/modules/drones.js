/**
 * Drone Manager
 * Handles NPC drones that appear on harder levels
 */

import * as THREE from 'three';

export class DroneManager {
    constructor(scene, mode = 'prototype') {
        this.scene = scene;
        this.mode = mode;
        this.drones = [];
        this.time = 0;
    }
    
    createDrones(holeNumber) {
        this.clearDrones();
        
        // Only create drones on hole 5+
        if (holeNumber < 5) return;
        
        // More drones on later holes
        const droneCount = Math.min(holeNumber - 4, 4);
        
        for (let i = 0; i < droneCount; i++) {
            this.createDrone(holeNumber, i);
        }
    }
    
    createDrone(holeNumber, index) {
        const drone = {
            mesh: null,
            radius: 1.2,
            patrolPath: [],
            currentPathIndex: 0,
            speed: 3 + Math.random() * 2,
            velocity: new THREE.Vector3(),
            // Behavior state
            state: 'patrol', // patrol, chase, return
            detectionRadius: 15,
            chaseSpeed: 5
        };
        
        // Create drone mesh
        const group = new THREE.Group();
        
        if (this.mode === 'prototype') {
            // Simple geometric drone
            const bodyGeometry = new THREE.SphereGeometry(0.8, 8, 8);
            const bodyMaterial = new THREE.MeshStandardMaterial({
                color: 0x00ff00,
                roughness: 0.5,
                metalness: 0.5
            });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            group.add(body);
            
            // Propellers (simple boxes)
            const propGeometry = new THREE.BoxGeometry(2, 0.1, 0.3);
            const propMaterial = new THREE.MeshStandardMaterial({
                color: 0x333333,
                roughness: 0.3,
                metalness: 0.7
            });
            
            const prop1 = new THREE.Mesh(propGeometry, propMaterial);
            prop1.position.y = 0.5;
            group.add(prop1);
            
            const prop2 = new THREE.Mesh(propGeometry.clone(), propMaterial);
            prop2.position.y = 0.5;
            prop2.rotation.y = Math.PI / 2;
            group.add(prop2);
            
            // Eye indicator
            const eyeGeometry = new THREE.SphereGeometry(0.2, 8, 8);
            const eyeMaterial = new THREE.MeshStandardMaterial({
                color: 0xff0000,
                emissive: 0xff0000,
                emissiveIntensity: 0.5
            });
            const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            eye.position.z = 0.7;
            eye.position.y = 0.2;
            group.add(eye);
            drone.eye = eye;
            drone.propeller1 = prop1;
            drone.propeller2 = prop2;
        } else {
            // More detailed sci-fi drone
            const bodyGeometry = new THREE.DodecahedronGeometry(0.7, 0);
            const bodyMaterial = new THREE.MeshStandardMaterial({
                color: 0x1a1a2e,
                roughness: 0.3,
                metalness: 0.8,
                emissive: 0x00ff88,
                emissiveIntensity: 0.2
            });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            group.add(body);
            
            // Energy ring
            const ringGeometry = new THREE.TorusGeometry(1, 0.1, 8, 16);
            const ringMaterial = new THREE.MeshStandardMaterial({
                color: 0x00ffff,
                emissive: 0x00ffff,
                emissiveIntensity: 0.8,
                transparent: true,
                opacity: 0.7
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = Math.PI / 2;
            group.add(ring);
            drone.ring = ring;
            
            // Sensor light
            const sensorGeometry = new THREE.SphereGeometry(0.15, 8, 8);
            const sensorMaterial = new THREE.MeshStandardMaterial({
                color: 0xff00ff,
                emissive: 0xff00ff,
                emissiveIntensity: 1
            });
            const sensor = new THREE.Mesh(sensorGeometry, sensorMaterial);
            sensor.position.z = 0.6;
            group.add(sensor);
            drone.eye = sensor;
        }
        
        group.castShadow = true;
        drone.mesh = group;
        
        // Set up patrol path
        const pathRadius = 8 + index * 3;
        const pathOffset = new THREE.Vector3(
            (index - 1) * 10,
            3 + index,
            -10 - index * 5
        );
        
        for (let p = 0; p < 4; p++) {
            const angle = (p / 4) * Math.PI * 2;
            drone.patrolPath.push(new THREE.Vector3(
                pathOffset.x + Math.cos(angle) * pathRadius,
                pathOffset.y,
                pathOffset.z + Math.sin(angle) * pathRadius
            ));
        }
        
        // Start position
        drone.mesh.position.copy(drone.patrolPath[0]);
        
        this.scene.add(drone.mesh);
        this.drones.push(drone);
    }
    
    update(delta) {
        this.time += delta;
        
        for (const drone of this.drones) {
            this.updateDrone(drone, delta);
            this.animateDrone(drone, delta);
        }
    }
    
    updateDrone(drone, delta) {
        const prevPos = drone.mesh.position.clone();
        
        // Get current target
        const targetPoint = drone.patrolPath[drone.currentPathIndex];
        
        if (!targetPoint) return;
        
        // Move towards target
        const direction = new THREE.Vector3()
            .subVectors(targetPoint, drone.mesh.position)
            .normalize();
        
        const distance = drone.mesh.position.distanceTo(targetPoint);
        
        if (distance < 1) {
            // Reached waypoint, move to next
            drone.currentPathIndex = (drone.currentPathIndex + 1) % drone.patrolPath.length;
        } else {
            // Move towards waypoint
            drone.mesh.position.add(direction.multiplyScalar(drone.speed * delta));
        }
        
        // Calculate velocity for collision physics
        drone.velocity.subVectors(drone.mesh.position, prevPos).divideScalar(delta);
        
        // Face movement direction
        if (drone.velocity.length() > 0.1) {
            const lookTarget = drone.mesh.position.clone().add(drone.velocity.normalize());
            drone.mesh.lookAt(lookTarget.x, drone.mesh.position.y, lookTarget.z);
        }
    }
    
    animateDrone(drone, delta) {
        // Hover bob effect
        drone.mesh.position.y += Math.sin(this.time * 3) * 0.01;
        
        if (this.mode === 'prototype') {
            // Spin propellers
            if (drone.propeller1) {
                drone.propeller1.rotation.y += delta * 20;
            }
            if (drone.propeller2) {
                drone.propeller2.rotation.y += delta * 20;
            }
        } else {
            // Spin energy ring
            if (drone.ring) {
                drone.ring.rotation.z += delta * 5;
            }
        }
        
        // Pulse eye/sensor
        if (drone.eye) {
            const pulse = Math.sin(this.time * 5) * 0.5 + 0.5;
            drone.eye.material.emissiveIntensity = 0.5 + pulse * 0.5;
        }
    }
    
    getDrones() {
        return this.drones;
    }
    
    clearDrones() {
        for (const drone of this.drones) {
            this.scene.remove(drone.mesh);
            drone.mesh.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        }
        this.drones = [];
    }
    
    dispose() {
        this.clearDrones();
    }
}
