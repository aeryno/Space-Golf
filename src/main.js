/**
 * Space Golf - Main Entry Point
 * A space-themed 3D mini-golf game built with Three.js
 */

import { Game } from './modules/game.js';

// Initialize the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const game = new Game(canvas);
    
    // Mode switching
    const btnPrototype = document.getElementById('btn-prototype');
    const btnFull = document.getElementById('btn-full');
    
    btnPrototype.addEventListener('click', () => {
        btnPrototype.classList.add('active');
        btnFull.classList.remove('active');
        game.setMode('prototype');
    });
    
    btnFull.addEventListener('click', () => {
        btnFull.classList.add('active');
        btnPrototype.classList.remove('active');
        game.setMode('full');
    });
    
    // Start the game
    game.init();
    game.start();
});
