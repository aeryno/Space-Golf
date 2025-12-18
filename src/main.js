/**
 * Space Golf - Main Entry Point
 * A space-themed 3D mini-golf game built with Three.js
 * Used copilot to help
 */

import { Game } from './modules/game.js';

// Initialize the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing game...');
    try {
        const canvas = document.getElementById('game-canvas');
        console.log('Canvas element found:', canvas);
        const game = new Game(canvas);
        console.log('Game instance created:', game);
        
        // Make game globally accessible for HTML button handlers
        window.gameInstance = game;
        
        // Robust scorecard function that directly shows modal and populates it
        window.showScorecardRobust = function() {
        
            const modal = document.getElementById('scorecard-modal');
            const content = document.getElementById('scorecard-content');
            const totals = document.getElementById('scorecard-totals');
            
            // Get game data directly from global instance
            if (!window.gameInstance) {
                console.error('No game instance available');
                return;
            }
            
            const game = window.gameInstance;
            
            // Build scorecard content directly
            let scorecardHTML = '<table style="width: 100%; border-collapse: collapse;">';
            scorecardHTML += '<tr style="border-bottom: 2px solid #ff6b35; background: rgba(255, 107, 53, 0.2);">';
            scorecardHTML += '<th style="padding: 10px; text-align: left; color: white;">Hole</th>';
            scorecardHTML += '<th style="padding: 10px; text-align: center; color: white;">Par</th>';
            scorecardHTML += '<th style="padding: 10px; text-align: center; color: white;">Score</th>';
            scorecardHTML += '<th style="padding: 10px; text-align: left; color: white;">Result</th>';
            scorecardHTML += '</tr>';
            
            let totalPar = 0;
            let totalStrokes = 0;
            let completedCount = 0;
            // Assume 9 holes
            for (let hole = 1; hole <= 9; hole++) {
                // Try to get the actual par for the hole, fallback to 3
                let holePar = 3;
                try {
                    if (game.getHoleConfigForScorecard) {
                        const holeConfig = game.getHoleConfigForScorecard(hole);
                        holePar = holeConfig ? holeConfig.par : 3;
                    }
                    // Fallback in case method is not available
                } catch (e) {
                    holePar = 3;
                }
                // Check if hole is completed
                const isCompleted = game.completedHoles && game.completedHoles.has(hole);
                const isCurrent = hole === game.currentHole;
                
                totalPar += holePar;
                // Calculate row style
                let rowStyle = 'padding: 8px; border-bottom: 1px solid rgba(255, 107, 53, 0.3); color: white;';
                if (isCurrent) {
                    rowStyle += 'background: rgba(255, 107, 53, 0.1);';
                }
                // Build row
                scorecardHTML += '<tr>';
                scorecardHTML += `<td style="${rowStyle}">${hole}${isCurrent ? ' (current)' : ''}</td>`;
                scorecardHTML += `<td style="${rowStyle} text-align: center;">${holePar}</td>`;
                // Populate score and result
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
                    // Add score and result cells
                    scorecardHTML += `<td style="${rowStyle} text-align: center; color: ${scoreColor}; font-weight: bold;">${score.strokes}</td>`;
                    scorecardHTML += `<td style="${rowStyle}">${score.score}</td>`;
                } else {
                    scorecardHTML += `<td style="${rowStyle} text-align: center; opacity: 0.5; font-style: italic;">--</td>`;
                    scorecardHTML += `<td style="${rowStyle} opacity: 0.5; font-style: italic;">Not completed</td>`;
                }
                scorecardHTML += '</tr>';
            }
            // Close table
            scorecardHTML += '</table>';
            content.innerHTML = scorecardHTML;
            
            // Update totals
            let totalsHTML = `<div>Course Par: ${totalPar}</div>`;
            totalsHTML += `<div>Holes Completed: ${completedCount} / 9</div>`;
            // Only show current score if at least one hole completed
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
            modal.style.display = 'block';
        };
        // Robust hide scorecard function
        window.hideScorecardRobust = function() {
            // Get modal and content elements
            const modal = document.getElementById('scorecard-modal');
            if (modal) {
                modal.style.display = 'none';
            } else {
                console.error('Modal not found for hiding');
            }
        };
        
        // Mode switching
        const btnPrototype = document.getElementById('btn-prototype');
        const btnFull = document.getElementById('btn-full');
        // Initial active state
        btnPrototype.addEventListener('click', () => {
            btnPrototype.classList.add('active');
            btnFull.classList.remove('active');
            game.setMode('prototype');
        });
        // Full mode button
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
        console.log('Game initialized, starting...');
        game.start();
        console.log('Game started successfully');
    } catch (error) {
        console.error('Error starting game:', error);
        console.error('Error stack:', error.stack);
    }
});
