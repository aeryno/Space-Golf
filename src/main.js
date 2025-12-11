/**
 * Space Golf - Main Entry Point
 * A space-themed 3D mini-golf game built with Three.js
 */

import { Game } from './modules/game.js';

// Initialize the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('DOM loaded, starting game...');
        const canvas = document.getElementById('game-canvas');
        console.log('Canvas element:', canvas);
        
        const game = new Game(canvas);
        console.log('Game instance created:', game);
        
        // Make game globally accessible for HTML button handlers
        window.gameInstance = game;
        
        // Robust scorecard function that directly shows modal and populates it
        window.showScorecardRobust = function() {
            console.log('showScorecardRobust called at', Date.now());
            
            const modal = document.getElementById('scorecard-modal');
            const content = document.getElementById('scorecard-content');
            const totals = document.getElementById('scorecard-totals');
            
            if (!modal || !content || !totals) {
                console.error('Missing scorecard modal elements');
                return;
            }
            
            // Get game data directly from global instance
            if (!window.gameInstance) {
                console.error('No game instance available');
                return;
            }
            
            const game = window.gameInstance;
            console.log('Game scorecard data:', game.scorecard);
            console.log('Completed holes:', game.completedHoles ? Array.from(game.completedHoles) : 'undefined');
            
            // Build scorecard content directly
            let scorecardHTML = '<table style="width: 100%; border-collapse: collapse;">';
            scorecardHTML += '<tr style="border-bottom: 2px solid #ff6b35; background: rgba(255, 107, 53, 0.2);">';
            scorecardHTML += '<th style="padding: 10px; text-align: left;">Hole</th>';
            scorecardHTML += '<th style="padding: 10px; text-align: center;">Par</th>';
            scorecardHTML += '<th style="padding: 10px; text-align: center;">Score</th>';
            scorecardHTML += '<th style="padding: 10px; text-align: left;">Result</th>';
            scorecardHTML += '</tr>';
            
            let totalPar = 0;
            let totalStrokes = 0;
            let completedCount = 0;
            
            for (let hole = 1; hole <= 9; hole++) {
                // Try to get the actual par for the hole, fallback to 3
                let holePar = 3;
                try {
                    if (game.getHoleConfigForScorecard) {
                        const holeConfig = game.getHoleConfigForScorecard(hole);
                        holePar = holeConfig ? holeConfig.par : 3;
                    }
                } catch (e) {
                    console.log('Could not get hole config, using default par 3');
                    holePar = 3;
                }
                
                const isCompleted = game.completedHoles && game.completedHoles.has(hole);
                const isCurrent = hole === game.currentHole;
                
                totalPar += holePar;
                
                let rowStyle = 'padding: 8px; border-bottom: 1px solid rgba(255, 107, 53, 0.3);';
                if (isCurrent) {
                    rowStyle += 'background: rgba(255, 107, 53, 0.1);';
                }
                
                scorecardHTML += '<tr>';
                scorecardHTML += `<td style="${rowStyle}">${hole}${isCurrent ? ' (current)' : ''}</td>`;
                scorecardHTML += `<td style="${rowStyle} text-align: center;">${holePar}</td>`;
                
                if (isCompleted && game.scorecard && game.scorecard[hole]) {
                    const score = game.scorecard[hole];
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
                scorecardHTML += '</tr>';
            }
            
            scorecardHTML += '</table>';
            content.innerHTML = scorecardHTML;
            
            // Update totals
            let totalsHTML = `<div>Course Par: ${totalPar}</div>`;
            totalsHTML += `<div>Holes Completed: ${completedCount} / 9</div>`;
            
            if (completedCount > 0) {
                const actualParForCompleted = Object.values(game.scorecard || {}).reduce((sum, score) => sum + score.par, 0);
                const realDiff = totalStrokes - actualParForCompleted;
                const diffText = realDiff === 0 ? 'Even' : 
                               realDiff > 0 ? `+${realDiff}` : `${realDiff}`;
                totalsHTML += `<div>Current Score: ${totalStrokes} (${diffText})</div>`;
            } else {
                totalsHTML += `<div style="font-style: italic; opacity: 0.7;">Start playing to see your scores!</div>`;
            }
            
            totals.innerHTML = totalsHTML;
            
            // Show the modal directly
            console.log('Showing modal directly...');
            modal.style.display = 'block';
            console.log('Modal shown successfully');
        };
        
        window.hideScorecardRobust = function() {
            console.log('hideScorecardRobust called');
            
            const modal = document.getElementById('scorecard-modal');
            if (modal) {
                console.log('Hiding modal directly...');
                modal.style.display = 'none';
                console.log('Modal hidden successfully');
            } else {
                console.error('Modal not found for hiding');
            }
        };
        

        
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

        // Level switching
        const levelsButton = document.getElementById('levels-button');
        const levelsDropdown = document.getElementById('levels-dropdown');
        const levelOptions = document.querySelectorAll('.level-option');

        // Toggle dropdown visibility
        levelsButton.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('Levels button clicked!');
            levelsDropdown.classList.toggle('show');
            console.log('Dropdown classes:', levelsDropdown.className);
        });

        // Close dropdown when clicking elsewhere
        document.addEventListener('click', () => {
            levelsDropdown.classList.remove('show');
        });

        // Prevent dropdown from closing when clicking inside it
        levelsDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Handle level selection
        levelOptions.forEach(option => {
            option.addEventListener('click', () => {
                const selectedLevel = parseInt(option.dataset.level);
                
                // Update UI
                updateLevelsUI(selectedLevel);
                
                // Switch to selected level
                game.switchToHole(selectedLevel);
            });
        });

        // Function to update levels UI
        function updateLevelsUI(holeNumber) {
            levelOptions.forEach(opt => opt.classList.remove('current'));
            const currentOption = document.querySelector(`[data-level="${holeNumber}"]`);
            if (currentOption) {
                currentOption.classList.add('current');
            }
            levelsDropdown.classList.remove('show');
        }

        // Make updateLevelsUI available globally so game can call it
        window.updateLevelsUI = updateLevelsUI;
        
        // Scorecard functionality now uses direct onclick handlers in HTML
        
        // Start the game
        console.log('Initializing game...');
        game.init();
        console.log('Starting game...');
        game.start();
        console.log('Game started successfully');
    } catch (error) {
        console.error('Error starting game:', error);
        console.error('Error stack:', error.stack);
    }
});
