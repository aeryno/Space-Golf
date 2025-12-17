/**
 * Input Handler
 * Handles keyboard and mobile touch controls for aiming and shooting
 * Used copilot to help
 */

export class InputHandler {
    // Initialize with references to ball and camera controller
    constructor(ball, cameraController, game = null) {
        this.ball = ball;
        this.cameraController = cameraController;
        this.game = game;
        
        // Aim state
        this.aimAngle = 0;
        this.aimSpeed = 2;
        
        // Power state
        this.power = 0;
        this.isCharging = false;
        this.chargeSpeed = 1;
        this.maxPower = 1;
        
        // Input state
        this.keys = {
            left: false,
            right: false,
            up: false,
            down: false,
            space: false
        };
        
        // Touch state
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.isTouching = false;
        
        this.setupKeyboardControls();
        this.setupTouchControls();
    }
    // Keyboard event listeners
    setupKeyboardControls() {
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
    }
    // Handle key down events
    onKeyDown(event) {
        switch (event.code) {
            case 'ArrowLeft':
            case 'KeyA':
                this.keys.left = true;
                event.preventDefault();
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.keys.right = true;
                event.preventDefault();
                break;
            case 'ArrowUp':
            case 'KeyW':
                this.keys.up = true;
                event.preventDefault();
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.keys.down = true;
                event.preventDefault();
                break;
            case 'Space':
                if (!this.isCharging && this.ball.canShoot()) {
                    this.isCharging = true;
                    this.power = 0;
                }
                event.preventDefault();
                break;
        }
    }
    // Handle key up events
    onKeyUp(event) {
        switch (event.code) {
            case 'ArrowLeft':
            case 'KeyA':
                this.keys.left = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.keys.right = false;
                break;
            case 'ArrowUp':
            case 'KeyW':
                this.keys.up = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.keys.down = false;
                break;
            case 'Space':
                if (this.isCharging) {
                    this.shoot();
                }
                break;
        }
    }
    // Touch event listeners
    setupTouchControls() {
        const canvas = document.getElementById('game-canvas');
        
        // Main canvas touch for swipe aiming
        canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
        canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
        canvas.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: false });
        
        // Touch button controls
        const btnLeft = document.getElementById('touch-left');
        const btnRight = document.getElementById('touch-right');
        const btnShoot = document.getElementById('touch-shoot');

        if (btnLeft) {
            btnLeft.addEventListener('touchstart', () => { this.keys.left = true; });
            btnLeft.addEventListener('touchend', () => { this.keys.left = false; });
        }
        
        if (btnRight) {
            btnRight.addEventListener('touchstart', () => { this.keys.right = true; });
            btnRight.addEventListener('touchend', () => { this.keys.right = false; });
        }
        
        if (btnShoot) {
            btnShoot.addEventListener('touchstart', () => {
                if (this.ball.canShoot()) {
                    this.isCharging = true;
                    this.power = 0;
                }
            });
            btnShoot.addEventListener('touchend', () => {
                if (this.isCharging) {
                    this.shoot();
                }
            });
        }
    }
    // Touch event handlers
    onTouchStart(event) {
        if (event.touches.length === 1) {
            this.touchStartX = event.touches[0].clientX;
            this.touchStartY = event.touches[0].clientY;
            this.isTouching = true;
            event.preventDefault();
        }
    }
    // Handle touch move for aiming
    onTouchMove(event) {
        if (this.isTouching && event.touches.length === 1) {
            const deltaX = event.touches[0].clientX - this.touchStartX;
            
            // Swipe to aim
            if (Math.abs(deltaX) > 10) {
                if (deltaX > 0) {
                    this.cameraController.rotateRight(0.02);
                } else {
                    this.cameraController.rotateLeft(0.02);
                }
                this.touchStartX = event.touches[0].clientX;
            }
            
            event.preventDefault();
        }
    }
    // Handle touch end
    onTouchEnd(event) {
        this.isTouching = false;
    }
    
    update(delta) {
        // Handle camera rotation
        if (this.keys.left) {
            this.cameraController.rotateLeft(this.aimSpeed * delta);
        }
        if (this.keys.right) {
            this.cameraController.rotateRight(this.aimSpeed * delta);
        }
        
        // Handle zoom
        if (this.keys.up) {
            this.cameraController.zoomIn(10 * delta);
        }
        if (this.keys.down) {
            this.cameraController.zoomOut(10 * delta);
        }
        
        // Handle power charging
        if (this.isCharging) {
            this.power += this.chargeSpeed * delta;
            if (this.power > this.maxPower) {
                this.power = this.maxPower;
            }
        }
    }
    // Execute the shot
    shoot() {
        if (!this.ball.canShoot()) return;
        // Shoot the ball in the aimed direction with the charged power
        const direction = this.cameraController.getAimDirection();
        this.ball.shoot(direction, this.power);
        // Reset charging state
        this.isCharging = false;
        this.power = 0;
        
        // Notify game of stroke
        if (this.game && this.game.onStroke) {
            this.game.onStroke();
        }
    }
    
    getPower() {
        return this.power;
    }
    
    isAiming() {
        // Show arrow when player is using arrow keys or charging power
        return this.keys.left || this.keys.right || this.isCharging || this.isTouching;
    }
    
    setBall(ball) {
        this.ball = ball;
    }
}
