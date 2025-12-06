/**
 * Game - Main game controller
 * Handles scene setup, game loop, and overall game state
 */

import * as THREE from 'three';
import { CameraController } from './camera.js';
import { Ball } from './ball.js';
import { Course } from './course.js';
import { InputHandler } from './input.js';
import { ObstacleManager } from './obstacles.js';
import { DroneManager } from './drones.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.mode = 'prototype'; // 'prototype' or 'full'
        this.isRunning = false;
        this.clock = new THREE.Clock();
        
        // Game state
        this.currentHole = 1;
        this.strokeCount = 0;
        this.par = 3;
        
        // Three.js components
        this.scene = null;
        this.renderer = null;
        this.cameraController = null;
        
        // Game components
        this.ball = null;
        this.course = null;
        this.inputHandler = null;
        this.obstacleManager = null;
        this.droneManager = null;
    }
    
    init() {
        this.setupRenderer();
        this.setupScene();
        this.setupLighting();
        this.setupCamera();
        this.setupComponents();
        this.setupEventListeners();
    }
    
    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    
    setupScene() {
        this.scene = new THREE.Scene();
        this.createSkybox();
    }
    
    createSkybox() {
        // Create a simple starfield for both modes
        const geometry = new THREE.BufferGeometry();
        const starCount = 2000;
        const positions = new Float32Array(starCount * 3);
        
        for (let i = 0; i < starCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 2000;
            positions[i + 1] = (Math.random() - 0.5) * 2000;
            positions[i + 2] = (Math.random() - 0.5) * 2000;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 2,
            sizeAttenuation: true
        });
        
        this.stars = new THREE.Points(geometry, material);
        this.scene.add(this.stars);
    }
    
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);
        
        // Main directional light (sun)
        const sunLight = new THREE.DirectionalLight(0xffffff, 1);
        sunLight.position.set(50, 100, 50);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 500;
        sunLight.shadow.camera.left = -100;
        sunLight.shadow.camera.right = 100;
        sunLight.shadow.camera.top = 100;
        sunLight.shadow.camera.bottom = -100;
        this.scene.add(sunLight);
        
        // Point light for extra glow
        const pointLight = new THREE.PointLight(0x6666ff, 0.5, 200);
        pointLight.position.set(-30, 20, -30);
        this.scene.add(pointLight);
    }
    
    setupCamera() {
        this.cameraController = new CameraController(this.canvas);
    }
    
    setupComponents() {
        // Create course first
        this.course = new Course(this.scene, this.mode);
        this.course.createHole(this.currentHole);
        
        // Create ball
        this.ball = new Ball(this.scene, this.mode);
        this.ball.setPosition(this.course.getStartPosition());
        
        // Create obstacles
        this.obstacleManager = new ObstacleManager(this.scene, this.mode);
        this.obstacleManager.createObstacles(this.currentHole);
        
        // Create drones for harder levels
        this.droneManager = new DroneManager(this.scene, this.mode);
        if (this.currentHole >= 5) {
            this.droneManager.createDrones(this.currentHole);
        }
        
        // Setup input
        this.inputHandler = new InputHandler(this.ball, this.cameraController);
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    onWindowResize() {
        this.cameraController.updateAspect(window.innerWidth / window.innerHeight);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    setMode(mode) {
        if (this.mode === mode) return;
        
        this.mode = mode;
        this.rebuildScene();
    }
    
    rebuildScene() {
        // Clear existing game objects
        this.course.dispose();
        this.ball.dispose();
        this.obstacleManager.dispose();
        this.droneManager.dispose();
        
        // Rebuild with new mode
        this.course = new Course(this.scene, this.mode);
        this.course.createHole(this.currentHole);
        
        this.ball = new Ball(this.scene, this.mode);
        this.ball.setPosition(this.course.getStartPosition());
        
        this.obstacleManager = new ObstacleManager(this.scene, this.mode);
        this.obstacleManager.createObstacles(this.currentHole);
        
        this.droneManager = new DroneManager(this.scene, this.mode);
        if (this.currentHole >= 5) {
            this.droneManager.createDrones(this.currentHole);
        }
        
        this.inputHandler.setBall(this.ball);
    }
    
    start() {
        this.isRunning = true;
        this.gameLoop();
    }
    
    stop() {
        this.isRunning = false;
    }
    
    gameLoop() {
        if (!this.isRunning) return;
        
        requestAnimationFrame(() => this.gameLoop());
        
        const delta = this.clock.getDelta();
        this.update(delta);
        this.render();
    }
    
    update(delta) {
        // Update stars rotation for atmosphere
        if (this.stars) {
            this.stars.rotation.y += delta * 0.01;
        }
        
        // Update game components
        this.ball.update(delta);
        this.obstacleManager.update(delta);
        this.droneManager.update(delta);
        this.inputHandler.update(delta);
        
        // Update camera to follow ball
        this.cameraController.followTarget(this.ball.getPosition());
        
        // Check collisions
        this.checkCollisions();
        
        // Check if ball is in hole
        if (this.course.checkHoleCollision(this.ball.getPosition())) {
            this.onHoleComplete();
        }
        
        // Update UI
        this.updateUI();
    }
    
    checkCollisions() {
        // Check obstacle collisions
        const obstacles = this.obstacleManager.getObstacles();
        for (const obstacle of obstacles) {
            if (this.ball.checkCollision(obstacle)) {
                this.ball.handleCollision(obstacle);
            }
        }
        
        // Check drone collisions (they push the ball)
        const drones = this.droneManager.getDrones();
        for (const drone of drones) {
            if (this.ball.checkCollision(drone)) {
                this.ball.handleDroneCollision(drone);
            }
        }
        
        // Check course bounds
        this.course.checkBounds(this.ball);
    }
    
    onHoleComplete() {
        this.currentHole++;
        
        if (this.currentHole > 9) {
            // Game complete
            alert(`Congratulations! You completed the course in ${this.strokeCount} strokes!`);
            this.currentHole = 1;
            this.strokeCount = 0;
        }
        
        this.rebuildScene();
    }
    
    onStroke() {
        this.strokeCount++;
    }
    
    updateUI() {
        document.getElementById('hole-number').textContent = this.currentHole;
        document.getElementById('stroke-count').textContent = this.strokeCount;
        document.getElementById('par-count').textContent = this.course.getPar();
        
        // Update power bar
        const powerFill = document.getElementById('power-fill');
        powerFill.style.width = `${this.inputHandler.getPower() * 100}%`;
    }
    
    render() {
        this.renderer.render(this.scene, this.cameraController.camera);
    }
}
