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

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.mode = 'full'; // 'prototype' or 'full' - default to full mode
        this.isRunning = false;
        this.clock = new THREE.Clock();
        
        // Game state
        this.currentHole = 1;
        this.strokeCount = 0;
        this.par = 3;
        this.completedHoles = new Set(); // Track completed holes
        this.scorecard = {}; // Track scores for each hole
        
        // Three.js components
        this.scene = null;
        this.renderer = null;
        this.cameraController = null;
        
        // Game components
        this.ball = null;
        this.course = null;
        this.inputHandler = null;
        this.obstacleManager = null;
        this.aimArrow = null;
        this.aimArrowStem = null;
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
        this.renderer.setClearColor(0x000000); // Ensure black background
        console.log('Renderer setup complete');
        console.log('Canvas dimensions:', this.canvas.width, this.canvas.height);
        console.log('Window dimensions:', window.innerWidth, window.innerHeight);
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
        // Force camera to look at the start position for debugging
        this.cameraController.camera.position.set(0, 50, 60);
        this.cameraController.camera.lookAt(0, 0, 20); // Look at start position
        console.log('Camera created at position:', this.cameraController.camera.position);
        console.log('Camera looking at start position');
    }
    
    setupComponents() {
        // Create course first
        this.course = new Course(this.scene, this.mode);
        this.course.createHole(this.currentHole);
        console.log('Course created, start position:', this.course.getStartPosition());
        
        // Create ball
        this.ball = new Ball(this.scene, this.mode);
        this.ball.setPosition(this.course.getStartPosition());
        console.log('Ball created at position:', this.ball.getPosition());
        console.log('Ball mesh:', this.ball.mesh);
        
        // Create obstacles
        this.obstacleManager = new ObstacleManager(this.scene, this.mode);
        this.obstacleManager.createObstacles(this.currentHole);
        console.log('Obstacles created:', this.obstacleManager.getObstacles().length);
        
        // Setup input
        this.inputHandler = new InputHandler(this.ball, this.cameraController, this);
        
        // Create aim arrow
        this.createAimArrow();
        
        // Debug: log scene children
        console.log('Scene children:', this.scene.children.length);
        console.log('Scene children:', this.scene.children);
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
        
        // Rebuild with new mode
        this.course = new Course(this.scene, this.mode);
        this.course.createHole(this.currentHole);
        
        this.ball = new Ball(this.scene, this.mode);
        this.ball.setPosition(this.course.getStartPosition());
        
        this.obstacleManager = new ObstacleManager(this.scene, this.mode);
        this.obstacleManager.createObstacles(this.currentHole);
        
        this.inputHandler.setBall(this.ball);
        
        // Recreate aim arrow
        if (this.aimArrow) {
            this.scene.remove(this.aimArrow);
            this.aimArrow.geometry.dispose();
            this.aimArrow.material.dispose();
        }
        if (this.aimArrowStem) {
            this.scene.remove(this.aimArrowStem);
            this.aimArrowStem.geometry.dispose();
            this.aimArrowStem.material.dispose();
        }
        this.createAimArrow();
    }
    
    handleDonutCenterCollision() {
        // Reset ball to start position
        this.ball.setPosition(this.course.getStartPosition());
        
        // Reset obstacles (they might have moved)
        this.obstacleManager.dispose();
        this.obstacleManager = new ObstacleManager(this.scene, this.mode);
        this.obstacleManager.createObstacles(this.currentHole);
        
        // Reset aim arrow visibility
        if (this.aimArrow) {
            this.aimArrow.visible = false;
        }
        if (this.aimArrowStem) {
            this.aimArrowStem.visible = false;
        }
        
        console.log('Level restarted - ball fell through donut center');
        
        // Show custom donut center message
        this.showDonutCenterMessage();
    }
    
    showDonutCenterMessage() {
        const messageEl = document.getElementById('restart-message');
        if (messageEl) {
            messageEl.innerHTML = '🍩 Ball fell through center! You must navigate around the ring.';
            messageEl.style.background = 'rgba(139, 69, 19, 0.9)';
            messageEl.style.border = '3px solid #daa520';
            messageEl.style.boxShadow = '0 0 20px rgba(218, 165, 32, 0.5)';
            messageEl.style.display = 'block';
            this.makeMessageClickable(messageEl);
            
            // Also hide automatically after 3 seconds if not clicked
            setTimeout(() => {
                if (messageEl.style.display !== 'none') {
                    messageEl.style.display = 'none';
                    messageEl.style.cursor = 'default';
                    messageEl.style.pointerEvents = 'none';
                    // Reset to original styling for regular out of bounds messages
                    messageEl.innerHTML = 'Ball went out of bounds! Level restarted.';
                    messageEl.style.background = 'rgba(255, 0, 0, 0.8)';
                    messageEl.style.border = 'none';
                    messageEl.style.boxShadow = 'none';
                }
            }, 3000);
        }
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
        this.inputHandler.update(delta);
        
        // Update camera to follow ball
        this.cameraController.followTarget(this.ball.getPosition());
        
        // Check collisions
        this.checkCollisions();
        
        // Check if ball is in hole
        if (this.course.checkHoleCollision(this.ball.getPosition())) {
            this.onHoleComplete();
        }
        
        // Update aim arrow
        this.updateAimArrow();
        
        // Update UI
        this.updateUI();
    }
    
    checkCollisions() {
        // Check if ball enters the center hole on hole 6 (donut course)
        if (this.currentHole === 6) {
            const ballPos = this.ball.mesh.position;
            const distanceFromCenter = Math.sqrt(ballPos.x * ballPos.x + ballPos.z * ballPos.z);
            
            // If ball enters the center hole (inner radius is 12), treat as out of bounds
            if (distanceFromCenter < 12) {
                console.log('DONUT CENTER COLLISION! Ball fell through center hole at distance:', distanceFromCenter.toFixed(2));
                this.handleDonutCenterCollision();
                return; // Exit early to prevent other collisions
            }
        }
        
        // Check obstacle collisions
        const obstacles = this.obstacleManager.getObstacles();
        for (const obstacle of obstacles) {
            if (obstacle.isBlackHole) {
                // Check black hole collision - if touched, return to start
                if (this.ball.checkCollision(obstacle)) {
                    console.log('BLACK HOLE COLLISION! Ball absorbed at:', obstacle.mesh.position.x.toFixed(2), obstacle.mesh.position.z.toFixed(2));
                    this.handleBlackHoleCollision();
                    return; // Exit early to prevent other collisions
                }
            } else {
                // Normal obstacle collision
                if (this.ball.checkCollision(obstacle)) {
                    console.log('OBSTACLE COLLISION! Ball bouncing off obstacle at:', obstacle.mesh.position.x.toFixed(2), obstacle.mesh.position.z.toFixed(2));
                    this.ball.handleCollision(obstacle);
                }
            }
        }
        
        // Check wall collisions (guard rails) - treat walls like large obstacles
        const walls = this.course.getWalls();
        for (const wall of walls) {
            const ballPos = this.ball.mesh.position;
            const wallPos = wall.position;
            const distance = ballPos.distanceTo(wallPos);
            
            // Very generous collision detection for walls
            const wallRadius = 3; // Large fixed radius for walls
            
            if (distance < this.ball.radius + wallRadius) {
                console.log('WALL COLLISION! Ball at:', ballPos.x.toFixed(2), ballPos.z.toFixed(2), 'Wall at:', wallPos.x.toFixed(2), wallPos.z.toFixed(2), 'Distance:', distance.toFixed(2));
                
                // Calculate bounce direction
                const normal = new THREE.Vector3()
                    .subVectors(ballPos, wallPos)
                    .normalize();
                
                // Reflect velocity
                const dot = this.ball.velocity.dot(normal);
                this.ball.velocity.sub(normal.multiplyScalar(2 * dot));
                
                // Apply energy loss
                this.ball.velocity.multiplyScalar(0.8);
                
                // Push ball away from wall
                this.ball.mesh.position.add(normal.multiplyScalar(2));
                
                this.ball.isMoving = true;
            }
        }
        
        // Check course bounds
        if (this.course.checkBounds(this.ball)) {
            console.log('LEVEL RESTART TRIGGERED! Ball position:', this.ball.getPosition());
            this.restartLevel();
        }
    }
    
    onHoleComplete() {
        console.log('=== HOLE COMPLETION STARTED ===', Date.now());
        console.log('Current hole:', this.currentHole);
        
        // Calculate and display golf scoring terminology before resetting stroke count
        const completedHole = this.currentHole;
        const strokesUsed = this.strokeCount;
        const par = this.course.getPar();
        
        // Get golf scoring terminology
        const scoreResult = this.getGolfScoreTerminology(strokesUsed, par);
        
        // Mark hole as completed and save score
        this.completedHoles.add(completedHole);
        this.scorecard[completedHole] = {
            strokes: strokesUsed,
            par: par,
            score: scoreResult
        };
        this.updateCompletedHolesDisplay();
        
        // Display the score result as overlay
        this.showScoreMessage(completedHole, scoreResult, strokesUsed, par);
        
        this.currentHole++;
        
        if (this.currentHole > 9) {
            // Game complete
            alert(`Congratulations! You completed the course in ${strokesUsed} total strokes!`);
            this.currentHole = 1;
            this.strokeCount = 0;
            this.completedHoles.clear(); // Reset completed holes for new game
            this.scorecard = {}; // Reset scorecard for new game
            this.updateCompletedHolesDisplay();
        } else {
            // Reset stroke count for the new hole
            this.strokeCount = 0;
        }
        
        this.rebuildScene();
        
        // Update levels UI if available
        if (typeof window.updateLevelsUI === 'function') {
            window.updateLevelsUI(this.currentHole);
        }
        
        console.log('=== HOLE COMPLETION FINISHED ===', Date.now());
    }
    
    getGolfScoreTerminology(strokes, par) {
        const difference = strokes - par;
        
        if (strokes === 1) {
            return "🏆 HOLE-IN-ONE! (Ace) 🏆";
        } else if (difference <= -3) {
            return "🦅 DOUBLE EAGLE! 🦅";
        } else if (difference === -2) {
            return "🦅 EAGLE! 🦅";
        } else if (difference === -1) {
            return "🐦 Birdie! 🐦";
        } else if (difference === 0) {
            return "📍 Par";
        } else if (difference === 1) {
            return "😐 Bogey";
        } else if (difference === 2) {
            return "😬 Double Bogey";
        } else if (difference === 3) {
            return "😰 Triple Bogey";
        } else if (difference >= 4) {
            return `😱 ${difference} Over Par`;
        }
        
        return "Par";
    }
    
    onStroke() {
        this.strokeCount++;
    }
    
    restartLevel() {
        // Reset ball to start position
        this.ball.setPosition(this.course.getStartPosition());
        
        // Reset obstacles (they might have moved)
        this.obstacleManager.dispose();
        this.obstacleManager = new ObstacleManager(this.scene, this.mode);
        this.obstacleManager.createObstacles(this.currentHole);
        
        // Reset drones if present
        this.droneManager.dispose();
        this.droneManager = new DroneManager(this.scene, this.mode);
        if (this.currentHole >= 5) {
            this.droneManager.createDrones(this.currentHole);
        }
        
        // Reset aim arrow visibility
        if (this.aimArrow) {
            this.aimArrow.visible = false;
        }
        if (this.aimArrowStem) {
            this.aimArrowStem.visible = false;
        }
        
        // Note: We intentionally don't reset strokeCount to preserve it across restarts
        console.log('Level restarted - ball went out of bounds');
        
        // Show restart message briefly
        this.showRestartMessage();
    }
    
    makeMessageClickable(messageEl) {
        // Make message clickable to dismiss instantly
        if (messageEl) {
            // Enable pointer events so the element can be clicked
            messageEl.style.pointerEvents = 'auto';
            
            const clickHandler = () => {
                messageEl.style.display = 'none';
                messageEl.style.pointerEvents = 'none'; // Reset to original state
                messageEl.removeEventListener('click', clickHandler);
                messageEl.style.cursor = 'default';
            };
            
            messageEl.addEventListener('click', clickHandler);
            messageEl.style.cursor = 'pointer';
            messageEl.style.userSelect = 'none'; // Prevent text selection
        }
    }
    
    showRestartMessage() {
        const messageEl = document.getElementById('restart-message');
        if (messageEl) {
            messageEl.style.display = 'block';
            this.makeMessageClickable(messageEl);
            
            // Also hide after 2 seconds automatically if not clicked
            setTimeout(() => {
                if (messageEl.style.display !== 'none') {
                    messageEl.style.display = 'none';
                    messageEl.style.cursor = 'default';
                    messageEl.style.pointerEvents = 'none';
                }
            }, 2000);
        }
    }
    
    handleBlackHoleCollision() {
        // Stop the ball immediately
        this.ball.velocity.set(0, 0, 0);
        this.ball.isMoving = false;
        
        // Show black hole message
        this.showBlackHoleMessage();
        
        // Move ball back to start position after a short delay
        setTimeout(() => {
            const startPos = this.course.getStartPosition();
            this.ball.setPosition(startPos);
            
            // Reset aim arrow visibility
            if (this.aimArrow) {
                this.aimArrow.visible = false;
            }
            if (this.aimArrowStem) {
                this.aimArrowStem.visible = false;
            }
            
            console.log('Ball returned to start position after black hole collision');
        }, 500);
    }
    
    showBlackHoleMessage() {
        const messageEl = document.getElementById('restart-message');
        if (messageEl) {
            messageEl.innerHTML = '🕳️ Absorbed by Black Hole! Ball returned to start.';
            messageEl.style.background = 'rgba(0, 0, 0, 0.9)';
            messageEl.style.border = '3px solid #ff4400';
            messageEl.style.boxShadow = '0 0 20px rgba(255, 68, 0, 0.5)';
            messageEl.style.display = 'block';
            this.makeMessageClickable(messageEl);
            
            // Also hide automatically after 3 seconds if not clicked
            setTimeout(() => {
                if (messageEl.style.display !== 'none') {
                    messageEl.style.display = 'none';
                    messageEl.style.cursor = 'default';
                    messageEl.style.pointerEvents = 'none';
                    // Reset to original styling for regular out of bounds messages
                    messageEl.innerHTML = 'Ball went out of bounds! Level restarted.';
                    messageEl.style.background = 'rgba(255, 0, 0, 0.8)';
                    messageEl.style.border = 'none';
                    messageEl.style.boxShadow = 'none';
                }
            }, 3000);
        }
    }
    
    showScoreMessage(holeNumber, scoreResult, strokes, par) {
        const messageEl = document.getElementById('score-message');
        const termEl = document.getElementById('score-term');
        const detailsEl = document.getElementById('score-details');
        
        if (messageEl && termEl && detailsEl) {
            // Set the content
            termEl.textContent = scoreResult;
            detailsEl.textContent = `Hole ${holeNumber} Complete! | Strokes: ${strokes} | Par: ${par}`;
            
            // Customize colors based on score
            if (strokes === 1) {
                messageEl.style.background = 'linear-gradient(135deg, rgba(255, 215, 0, 0.95), rgba(255, 193, 7, 0.95))';
                messageEl.style.borderColor = '#FFD700';
                messageEl.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.8)';
            } else if (strokes - par <= -1) {
                messageEl.style.background = 'linear-gradient(135deg, rgba(76, 175, 80, 0.95), rgba(56, 142, 60, 0.95))';
                messageEl.style.borderColor = '#4CAF50';
                messageEl.style.boxShadow = '0 0 20px rgba(76, 175, 80, 0.5)';
            } else if (strokes - par === 0) {
                messageEl.style.background = 'linear-gradient(135deg, rgba(33, 150, 243, 0.95), rgba(30, 136, 229, 0.95))';
                messageEl.style.borderColor = '#2196F3';
                messageEl.style.boxShadow = '0 0 20px rgba(33, 150, 243, 0.5)';
            } else {
                messageEl.style.background = 'linear-gradient(135deg, rgba(255, 152, 0, 0.95), rgba(245, 124, 0, 0.95))';
                messageEl.style.borderColor = '#FF9800';
                messageEl.style.boxShadow = '0 0 20px rgba(255, 152, 0, 0.5)';
            }
            
            // Show the message
            messageEl.style.display = 'block';
            this.makeMessageClickable(messageEl);
            
            // Also hide after 3.5 seconds automatically if not clicked
            setTimeout(() => {
                if (messageEl.style.display !== 'none') {
                    messageEl.style.display = 'none';
                    messageEl.style.cursor = 'default';
                    messageEl.style.pointerEvents = 'none';
                }
            }, 3500);
        }
    }
    
    updateCompletedHolesDisplay() {
        // Update the holes dropdown to show completed holes
        for (let hole = 1; hole <= 9; hole++) {
            const levelOption = document.querySelector(`[data-level="${hole}"]`);
            if (levelOption) {
                if (this.completedHoles.has(hole)) {
                    levelOption.classList.add('completed');
                } else {
                    levelOption.classList.remove('completed');
                }
            }
        }
    }
    
    ensureScorecardListeners() {
        // No longer needed - using direct onclick handlers in HTML
        console.log('Scorecard using direct onclick handlers - no setup needed');
    }
    
    showScorecard() {
        console.log('showScorecard() called - current hole:', this.currentHole);
        console.log('window.gameInstance exists:', !!window.gameInstance);
        console.log('this === window.gameInstance:', this === window.gameInstance);
        console.log('this object type:', typeof this);
        console.log('this constructor name:', this.constructor.name);
        
        const modal = document.getElementById('scorecard-modal');
        const content = document.getElementById('scorecard-content');
        const totals = document.getElementById('scorecard-totals');
        
        console.log('Modal elements found:', { modal: !!modal, content: !!content, totals: !!totals });
        
        if (!modal || !content || !totals) {
            console.error('Missing scorecard modal elements');
            return;
        }
        
        console.log('Current scorecard data:', this.scorecard);
        console.log('Completed holes:', Array.from(this.completedHoles));
        console.log('Current hole:', this.currentHole);
        
        // Build scorecard content
        let scorecardHTML = '<table style="width: 100%; border-collapse: collapse;">';
        scorecardHTML += '<tr style="border-bottom: 2px solid #ff6b35; background: rgba(255, 107, 53, 0.2);">';
        scorecardHTML += '<th style="padding: 10px; text-align: left;">Hole</th>';
        scorecardHTML += '<th style="padding: 10px; text-align: center;">Par</th>';
        scorecardHTML += '<th style="padding: 10px; text-align: center;">Score</th>';
        scorecardHTML += '<th style="padding: 10px; text-align: left;">Result</th>';
        scorecardHTML += '</tr>';
        
        let totalStrokes = 0;
        let totalPar = 0;
        let completedCount = 0;
        
        for (let hole = 1; hole <= 9; hole++) {
            const holeConfig = this.getHoleConfigForScorecard(hole);
            const holePar = holeConfig ? holeConfig.par : 3;
            const isCompleted = this.completedHoles.has(hole);
            const isCurrent = hole === this.currentHole;
            
            totalPar += holePar;
            
            let rowStyle = 'padding: 8px; border-bottom: 1px solid rgba(255, 107, 53, 0.3);';
            if (isCurrent) {
                rowStyle += 'background: rgba(255, 107, 53, 0.1);';
            }
            
            scorecardHTML += `<tr>`;
            scorecardHTML += `<td style="${rowStyle}">${hole}${isCurrent ? ' (current)' : ''}</td>`;
            scorecardHTML += `<td style="${rowStyle} text-align: center;">${holePar}</td>`;
            
            if (isCompleted && this.scorecard[hole]) {
                const score = this.scorecard[hole];
                totalStrokes += score.strokes;
                completedCount++;
                
                // Color code the score
                const diff = score.strokes - holePar;
                let scoreColor = '#fff';
                if (diff < 0) scoreColor = '#4CAF50'; // Under par - green
                else if (diff === 0) scoreColor = '#2196F3'; // Par - blue
                else scoreColor = '#FF9800'; // Over par - orange
                
                scorecardHTML += `<td style="${rowStyle} text-align: center; color: ${scoreColor}; font-weight: bold;">${score.strokes}</td>`;
                scorecardHTML += `<td style="${rowStyle}">${score.score}</td>`;
            } else {
                scorecardHTML += `<td style="${rowStyle} text-align: center; opacity: 0.5; font-style: italic;">--</td>`;
                scorecardHTML += `<td style="${rowStyle} opacity: 0.5; font-style: italic;">Not completed</td>`;
            }
            scorecardHTML += `</tr>`;
        }
        
        scorecardHTML += '</table>';
        content.innerHTML = scorecardHTML;
        
        // Update totals
        let totalsHTML = `<div>Course Par: ${totalPar}</div>`;
        totalsHTML += `<div>Holes Completed: ${completedCount} / 9</div>`;
        
        if (completedCount > 0) {
            const totalDiff = totalStrokes - (completedCount > 0 ? totalStrokes - totalDiff : 0);
            const actualParForCompleted = Object.values(this.scorecard).reduce((sum, score) => sum + score.par, 0);
            const realDiff = totalStrokes - actualParForCompleted;
            const diffText = realDiff === 0 ? 'Even' : 
                           realDiff > 0 ? `+${realDiff}` : `${realDiff}`;
            totalsHTML += `<div>Current Score: ${totalStrokes} (${diffText})</div>`;
        } else {
            totalsHTML += `<div style="font-style: italic; opacity: 0.7;">Start playing to see your scores!</div>`;
        }
        
        totals.innerHTML = totalsHTML;
        
        console.log('About to show modal. Current display:', modal.style.display);
        modal.style.display = 'block';
        console.log('Modal display set to:', modal.style.display);
        console.log('Modal computed style display:', window.getComputedStyle(modal).display);
        console.log('Modal offsetParent:', modal.offsetParent);
    }
    
    hideScorecard() {
        console.log('hideScorecard() called');
        console.log('window.gameInstance exists:', !!window.gameInstance);
        
        const modal = document.getElementById('scorecard-modal');
        console.log('Modal found:', !!modal);
        
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    getHoleConfigForScorecard(holeNumber) {
        // This should match the hole configurations in course.js
        const configs = [
            { par: 2 }, { par: 3 }, { par: 4 }, { par: 4 }, { par: 5 },
            { par: 5 }, { par: 6 }, { par: 6 }, { par: 7 }
        ];
        return configs[holeNumber - 1];
    }
    
    createAimArrow() {
        const arrowMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffff, // White color
            transparent: true,
            opacity: 0.8
        });
        
        // Create triangle arrow head using custom geometry
        const triangleGeometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([
            // Triangle vertices (flat on XZ plane, pointing in +Z direction)
            0.0,  0.0,  0.8,   // Top point (tip of arrow)
            -0.4, 0.0, -0.4,   // Bottom left
            0.4,  0.0, -0.4,   // Bottom right
            // Duplicate vertices for the bottom face (to make it double-sided)
            0.0,  0.0,  0.8,   // Top point (tip of arrow)
            0.4,  0.0, -0.4,   // Bottom right
            -0.4, 0.0, -0.4    // Bottom left
        ]);
        const indices = [
            0, 1, 2,  // Top face
            3, 4, 5   // Bottom face (reversed winding)
        ];
        
        triangleGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        triangleGeometry.setIndex(indices);
        triangleGeometry.computeVertexNormals();
        
        // Make the triangle material double-sided to ensure visibility
        const triangleMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffff,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        
        this.aimArrow = new THREE.Mesh(triangleGeometry, triangleMaterial);
        this.scene.add(this.aimArrow);
        
        // Create rectangular stem using a box
        const rectangleGeometry = new THREE.BoxGeometry(0.3, 0.05, 1); // width, height, depth
        this.aimArrowStem = new THREE.Mesh(rectangleGeometry, arrowMaterial);
        this.scene.add(this.aimArrowStem);
        
        // Initially hide both parts
        this.aimArrow.visible = false;
        this.aimArrowStem.visible = false;
    }
    
    updateAimArrow() {
        if (!this.aimArrow || !this.aimArrowStem || !this.ball || !this.inputHandler) return;
        
        // Show arrow whenever ball can be shot (not moving)
        const canShoot = this.ball.canShoot();
        
        this.aimArrow.visible = canShoot;
        this.aimArrowStem.visible = canShoot;
        
        if (this.aimArrow.visible) {
            const ballPos = this.ball.getPosition();
            const aimDirection = this.cameraController.getAimDirection();
            const power = this.inputHandler.getPower();
            
            // Calculate rotation angle for both arrow parts
            const angle = Math.atan2(aimDirection.x, aimDirection.z);
            
            // Stem length based on power (minimum 2 units, up to 6 units when charging)
            const stemLength = 2 + power * 4;
            
            // Position rectangular stem - starts from ball and extends toward aim direction
            this.aimArrowStem.position.copy(ballPos);
            this.aimArrowStem.position.y = 0.1; // Just above ground surface
            this.aimArrowStem.position.add(aimDirection.clone().multiplyScalar(stemLength / 2 + 0.8)); // Center the rectangle
            this.aimArrowStem.rotation.y = angle;
            
            // Scale stem length (only in Z direction for the rectangle)
            this.aimArrowStem.scale.set(1, 1, stemLength);
            
            // Position triangle arrow head - at the far end of the rectangle
            this.aimArrow.position.copy(ballPos);
            this.aimArrow.position.y = 0.1; // Just above ground surface
            this.aimArrow.position.add(aimDirection.clone().multiplyScalar(stemLength + 1.3)); // At end of rectangle
            this.aimArrow.rotation.y = angle;
            
            // Arrow head stays constant size
            this.aimArrow.scale.set(1, 1, 1);
        }
    }
    
    updateUI() {
        document.getElementById('hole-number').textContent = this.currentHole;
        document.getElementById('stroke-count').textContent = this.strokeCount;
        document.getElementById('par-count').textContent = this.course.getPar();
        
        // Update power bar
        const powerFill = document.getElementById('power-fill');
        powerFill.style.width = `${this.inputHandler.getPower() * 100}%`;
    }

    switchToHole(holeNumber) {
        if (holeNumber >= 1 && holeNumber <= 9) {
            this.currentHole = holeNumber;
            this.strokeCount = 0; // Reset stroke count for new hole
            this.rebuildScene();
            this.updateUI();
        }
    }
    
    render() {
        this.renderer.render(this.scene, this.cameraController.camera);
        // Debug: log render call (only log every 60 frames to avoid spam)
        if (this.renderCount === undefined) this.renderCount = 0;
        this.renderCount++;
        if (this.renderCount % 60 === 0) {
            console.log('Render called, frame:', this.renderCount);
        }
    }
}
