const canvas = document.getElementById('sandCanvas');
const ctx = canvas.getContext('2d');
const cursorOutline = document.getElementById('cursor-outline');

// Configuration
const width = 150; // Low internal resolution for performance
const height = 150;

// Data types
const EMPTY = 0;
const SAND = 1;
const WATER = 2;
const STONE = 3;
const ACID = 4;
const WOOD = 5;
const FIRE = 6;
const GUNPOWDER = 7;
const STEAM = 8;
const SMOKE = 9;
const LAVA = 10;
const OIL = 11;
const PLANT = 12;
const ICE = 13;
const METHANE = 14;
const VIRUS = 15;
const FUSE = 16;
const C4 = 17;
const EMBER = 18;
const SOURCE = 19;
const WALL = 20;
const PLASMA = 21;
const GLASS = 22;
const THUNDER = 23;
const VOID = 24;
const NUKE = 25;

// State
let types = new Uint8Array(width * height).fill(0);
let processed = new Uint8Array(width * height).fill(0); // Prevent double-moving in one frame
let grid = new Float32Array(width * height).fill(0); // Stores Hue logic
let isMouseDown = false;
let mouseButton = 0; // 0: Left, 2: Right
let isPaused = false;
let isShiftHeld = false;
let mouseX = 0;
let mouseY = 0;
let lastMouseX = 0;
let lastMouseY = 0;
let startMouseX = 0; // For straight line constraint
let startMouseY = 0;
let hue = 0;
let currentTool = SAND;
let currentToolName = 'sand'; // Store string name for UI restoration
let brushSize = 5;
let frameCount = 0;
const imgData = ctx.createImageData(width, height);

function updateCursor(e) {
    // Calculate dynamic scale based on current display size
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / width;
    
    cursorOutline.style.width = cursorOutline.style.height = (brushSize * scaleX) + 'px';
    
    if (e) {
        // If shift is held and mouse is down, snap the visual cursor to the axis
        let clientX = e.clientX;
        let clientY = e.clientY;
        if (isMouseDown && isShiftHeld) {
            // Logic is handled in 'renderCursorPosition' mostly, but kept here for sizing updates
        }
        renderCursorPosition(clientX, clientY);
    }
    // Color update moved to setTool for efficiency
}

// Inputs
canvas.addEventListener('mousedown', (e) => {
    isMouseDown = true;
    mouseButton = e.button;
    if (e.button === 1) pickMaterial(e);
    updateMouseCoords(e);
    lastMouseX = mouseX;
    lastMouseY = mouseY;
    startMouseX = mouseX;
    startMouseY = mouseY;
    if (e.altKey) pickMaterial(e); // Alt+Click alternative for picking
    
    // Visual feedback for Right-Click Eraser
    if (e.button === 2) cursorOutline.style.borderColor = '#ffffff';
});
canvas.addEventListener('contextmenu', e => e.preventDefault()); // Disable context menu for right-click erase
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    let newSize = brushSize + (e.deltaY < 0 ? 1 : -1);
    newSize = Math.max(1, Math.min(15, newSize));
    updateBrush(newSize);
    document.getElementById('brushSize').value = newSize;
}, { passive: false });
canvas.addEventListener('mouseup', () => {
    isMouseDown = false;
    // Restore cursor color
    cursorOutline.style.borderColor = toolColors[currentToolName] || 'rgba(255, 255, 255, 0.5)';
});
canvas.addEventListener('mouseout', () => isMouseDown = false);
canvas.addEventListener('mousemove', (e) => {
    updateMouseCoords(e);
    renderCursorVisuals(e);
});
window.addEventListener('resize', () => updateCursor()); // Fix cursor size on window resize

// Touch Support
function handleTouch(e) {
    e.preventDefault(); // Stop scrolling
    if (e.touches.length > 0) {
        const t = e.touches[0];
        const fakeEvent = { clientX: t.clientX, clientY: t.clientY };
        
        if (e.type === 'touchstart') {
            isMouseDown = true;
            mouseButton = 0; // Treat as left click
            lastMouseX = mouseX; lastMouseY = mouseY; // Prevent jumping
            startMouseX = mouseX; startMouseY = mouseY;
        }
        
        updateMouseCoords(fakeEvent);
        renderCursorVisuals(fakeEvent);
        if (e.type === 'touchmove') spawnSand(); // Ensure smooth drawing on touch
    } else {
        isMouseDown = false;
    }
}
canvas.addEventListener('touchstart', handleTouch, { passive: false });
canvas.addEventListener('touchmove', handleTouch, { passive: false });
canvas.addEventListener('touchend', handleTouch);

function renderCursorVisuals(e) {
    // Determine visual position (handling Shift-lock)
    let visualX = e.clientX;
    let visualY = e.clientY;

    if (isMouseDown && isShiftHeld) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = rect.width / width;
        const scaleY = rect.height / height;

        // Calculate where the cursor "actually" is for physics
        // If X distance > Y distance, lock Y to startY
        if (Math.abs(mouseX - startMouseX) > Math.abs(mouseY - startMouseY)) {
            // Locked to Y axis (horizontal line)
            // Convert grid Y back to screen Y
            visualY = rect.top + (startMouseY * scaleY) + (scaleY / 2); 
        } else {
            // Locked to X axis (vertical line)
            visualX = rect.left + (startMouseX * scaleX) + (scaleX / 2);
        }
    }
    renderCursorPosition(visualX, visualY);
}

function renderCursorPosition(cx, cy) {
    // Update cursor visually immediately
    cursorOutline.style.display = 'block';
    // Use transform for better performance (gpu composition)
    cursorOutline.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
}

function updateMouseCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    mouseX = Math.floor((e.clientX - rect.left) * scaleX);
    mouseY = Math.floor((e.clientY - rect.top) * scaleY);
}

function pickMaterial(e) {
    e.preventDefault();
    updateMouseCoords(e);
    const idx = (mouseX >= 0 && mouseX < width && mouseY >= 0 && mouseY < height) ? mouseX + mouseY * width : -1;
    if (idx >= 0 && idx < types.length) {
        let t = types[idx];
        if (t === EMPTY) return;
        
        // Intelligent Pick: If picking a Source, pick what it spawns
        if (t === SOURCE && grid[idx] !== 0) {
             const spawned = grid[idx];
             t = spawned;
        }
        
        // Reverse lookup for UI (simple map)
        const typeMap = {
            1: 'sand', 2: 'water', 3: 'stone', 4: 'acid', 5: 'wood', 6: 'fire', 
            7: 'gunpowder', 10: 'lava', 11: 'oil', 12: 'plant', 13: 'ice', 
            14: 'methane', 15: 'virus', 16: 'fuse', 17: 'c4', 19: 'source', 
            20: 'wall', 21: 'plasma', 22: 'glass', 23: 'thunder', 24: 'void', 25: 'nuke'
        };
        if (typeMap[t]) setTool(typeMap[t]);
    }
}

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Shift') {
        isShiftHeld = true;
        // Trigger a reflow of the cursor to snap it immediately
        // We need the last mouse position, strictly speaking, but we can wait for next move
        // or store last event. For now, the next micro-movement will snap it.
        cursorOutline.style.borderStyle = 'dashed'; // Visual cue
    }
    
    if (e.key === '1') setTool('eraser');
    if (e.key === '2') setTool('sand');
    if (e.key === '3') setTool('stone');
    if (e.key === '4') setTool('wood');
    if (e.key === '5') setTool('water');
    if (e.key === '6') setTool('fire');
    if (e.key === '7') setTool('acid');
    if (e.key === '8') setTool('gunpowder');
    if (e.key === '9') setTool('thunder');
    if (e.key === '0') resetGrid();
    if (e.code === 'Space') togglePause();
    
    // Improved Shortcuts
    if (e.key === '[') updateBrush(brushSize - 1);
    if (e.key === ']') updateBrush(brushSize + 1);
    if (e.key.toLowerCase() === 'e') setTool('eraser');
    if (e.key.toLowerCase() === 'p') togglePause();
});
document.addEventListener('keyup', (e) => {
    if (e.key === 'Shift') isShiftHeld = false;
    cursorOutline.style.borderStyle = 'solid';
});

const toolColors = {
    'sand': '#f4d03f',
    'water': '#1e90ff',
    'stone': '#aaa',
    'acid': '#32cd32',
    'wood': '#d2691e',
    'fire': '#ff4500',
    'lava': '#cf1020',
    'oil': '#bab020',
    'eraser': '#ffffff',
    'gunpowder': '#ccc',
    'plant': '#2ecc71',
    'ice': '#aaddff',
    'methane': '#9b59b6',
    'virus': '#d84294',
    'fuse': '#556b2f',
    'c4': '#d3d3d3',
    'wall': '#888',
    'plasma': '#d0f',
    'glass': '#8af',
    'source': '#f0f',
    'thunder': '#ffd700',
    'void': '#9370db',
    'nuke': '#39ff14',
};

const descriptions = {
    'sand': 'Sand: Simple particles that pile up.',
    'water': 'Water: Flows downwards and displaces other liquids.',
    'stone': 'Stone: Solid and immovable. Blocks acid for a while.',
    'acid': 'Acid: Dissolves stone, sand, wood and organic matter.',
    'wood': 'Wood: Stationary solid. Flammable.',
    'fire': 'Fire: Ignites wood, oil, and gas. Emits smoke.',
    'lava': 'Lava: Heavy liquid. Melts ice, ignites wood.',
    'oil': 'Oil: Flammable liquid. Floats on water.',
    'eraser': 'Eraser: Removes particles from the grid.',
    'gunpowder': 'Gunpowder/TNT: Explodes violently when ignited.',
    'plant': 'Plant: Grows when touching water. Flammable.',
    'ice': 'Ice: Solid. Turns to water when heated.',
    'methane': 'Methane: Flammable gas. Rises and floats.',
    'virus': 'Virus: Infects organics (Plant, Wood, Oil) turning them into Virus.',
    'fuse': 'Fuse: Burns slowly and ignites explosives. Stationary.',
    'c4': 'C4: High explosive. Sticks to walls.',
    'wall': 'Wall: Indestructible barrier.',
    'plasma': 'Plasma: Extremely hot ionized matter. Melts everything.',
    'glass': 'Glass: Melted sand. Static transparent solid.',
    'source': 'Source: Generates elements. Paint onto it with another element to configure.',
    'thunder': 'Thunder: Erratic electricity. Turns sand to glass, explodes stuff.',
    'void': 'Void: Absorbs and annihilates matter.',
    'nuke': 'Nuke: Radioactive gas. Mutates plants, sours water, vitrifies sand.',
};

function togglePause() {
    isPaused = !isPaused;
    document.getElementById('btn-pause').innerText = isPaused ? "Play" : "Pause";
    document.getElementById('btn-pause').classList.toggle('active');
}

function setTool(toolName) {
    currentToolName = toolName;
    document.querySelectorAll('button').forEach(b => b.classList.remove('active')); // clear all
    document.getElementById(`btn-${toolName}`)?.classList.add('active');
    
    cursorOutline.style.borderColor = toolColors[toolName] || 'rgba(255, 255, 255, 0.5)';
    
    document.getElementById('infoText').innerText = descriptions[toolName] || "";

    if (toolName === 'sand') currentTool = SAND;
    else if (toolName === 'water') currentTool = WATER;
    else if (toolName === 'stone') currentTool = STONE;
    else if (toolName === 'acid') currentTool = ACID;
    else if (toolName === 'wood') currentTool = WOOD;
    else if (toolName === 'fire') currentTool = FIRE;
    else if (toolName === 'lava') currentTool = LAVA;
    else if (toolName === 'oil') currentTool = OIL;
    else if (toolName === 'eraser') currentTool = EMPTY;
    else if (toolName === 'gunpowder') currentTool = GUNPOWDER;
    else if (toolName === 'plant') currentTool = PLANT;
    else if (toolName === 'ice') currentTool = ICE;
    else if (toolName === 'methane') currentTool = METHANE;
    else if (toolName === 'virus') currentTool = VIRUS;
    else if (toolName === 'fuse') currentTool = FUSE;
    else if (toolName === 'c4') currentTool = C4;
    else if (toolName === 'wall') currentTool = WALL;
    else if (toolName === 'plasma') currentTool = PLASMA;
    else if (toolName === 'glass') currentTool = GLASS;
    else if (toolName === 'source') currentTool = SOURCE;
    else if (toolName === 'thunder') currentTool = THUNDER;
    else if (toolName === 'void') currentTool = VOID;
    else if (toolName === 'nuke') currentTool = NUKE;
}

function previewTool(toolName) {
    document.getElementById('infoText').innerText = descriptions[toolName] || "";
}

function resetPreview() {
    document.getElementById('infoText').innerText = descriptions[currentToolName] || "";
}

function updateBrush(val) {
    brushSize = Math.max(1, Math.min(15, parseInt(val)));
    document.getElementById('brushSize').value = brushSize;
    document.getElementById('brushVal').innerText = brushSize;
    updateCursor();
}

function resetGrid() {
    grid.fill(0);
    processed.fill(0);
    types.fill(EMPTY);
    // Visual flash to indicate clear
    ctx.fillStyle = '#222';
    ctx.fillRect(0,0,canvas.width, canvas.height);
    setTimeout(() => {
         // allow next draw to clear
    }, 50);
}

function getInitialData(type) {
    if (type === FIRE) return 100 + Math.random() * 50;
    if (type === WOOD) return 30 + Math.random() * 20;
    if (type === STONE) return 136 + Math.random() * 20;
    if (type === LAVA) return 200 + Math.random() * 55;
    if (type === GUNPOWDER) return Math.random() * 30;
    if (type === PLANT) return Math.random() * 50;
    if (type === ICE) return Math.random() * 20;
    if (type === METHANE) return 300 + Math.random() * 50;
    if (type === VIRUS) return Math.random() * 40;
    if (type === FUSE) return Math.random() * 20;
    if (type === C4) return Math.random() * 20;
    if (type === WALL) return 50 + Math.random() * 20;
    if (type === PLASMA) return 100 + Math.random() * 100;
    if (type === ACID) return hue;
    if (type === SAND) return Math.random() * 50; // Natural variation
    if (type === THUNDER) return 255;
    if (type === NUKE) return 200 + Math.random() * 100;
    return 0;
}

// 0: Gas/Empty, 1: Liquid_Light, 2: Liquid_Heavy, 3: Solid, 4: Immovable
function getDensity(t) {
    if (t === ICE) return 1; // Ice floats on water
    if (t === WALL || t === WOOD || t === PLANT || t === STONE || t === FUSE || t === SOURCE) return 4;
    if (t === SAND || t === GUNPOWDER || t === C4 || t === EMBER || t === VIRUS || t === THUNDER || t === GLASS) return 3;
    if (t === WATER || t === ACID || t === LAVA) return 2;
    if (t === OIL) return 1;
    return 0; // Gas or Empty
}

// Helper to determine if something is a liquid for spreading
function isLiquid(t) {
    return t === WATER || t === ACID || t === LAVA || t === OIL;
}

function updatePhysics() {
    frameCount++;
    processed.fill(0); // Reset processed status

    // Iterate from bottom to top to avoid double-moving particles in one frame
    const isLeft = frameCount % 2 === 0; // Alternate horizontal scan to prevent liquid bias
    for (let y = height - 1; y >= 0; y--) {
        for (let i = 0; i < width; i++) {
            const x = isLeft ? i : (width - 1 - i);
            const idx = x + y * width;
            if (processed[idx]) continue; // Skip if already moved this frame
            const type = types[idx];

            let rDx = 0, rDy = 0; // Moves for this particle

            // Gas Logic (Steam, Smoke, Methane)
            if (type === STEAM || type === SMOKE || type === METHANE || type === NUKE) {
                // Randomize flow direction per particle for more natural diffusion
                const flowDir = Math.random() < 0.5 ? 1 : -1;
                // Ceiling Logic: Condensation and Dissipation
                if (y === 0) {
                    if (type === STEAM) { 
                        // Water cycle: Form "clouds" by hanging at the top, then rain randomly
                        if (Math.random() < 0.02) { types[idx] = WATER; grid[idx] = 0; } 
                    }
                    else if (type === NUKE) { types[idx] = ACID; grid[idx] = 0; processed[idx] = 1; } // Radioactive rain
                    else { types[idx] = EMPTY; grid[idx] = 0; processed[idx] = 1; } // Vent other gases into atmosphere
                    continue;
                }
                // If life <= 0 but not at ceiling, just die
                if (grid[idx] <= 0 && y > 0) { types[idx] = EMPTY; continue; }

                // Methane Ignition check (highly flammable gas)
                if (type === METHANE) {
                    // Boundary-safe neighbor check
                    const neighbors = [];
                    if (x > 0) neighbors.push(idx - 1);
                    if (x < width - 1) neighbors.push(idx + 1);
                    neighbors.push(idx - width, idx + width);
                    
                    for (let n of neighbors) {
                        if (n >= 0 && n < types.length) {
                            if (types[n] === FIRE || types[n] === LAVA || types[n] === EMBER) {
                                types[idx] = FIRE;
                                grid[idx] = 150 + Math.random() * 50; // Ignite self
                                grid[idx] += 1; // Mark as processed if needed, though loop continues
                                break; // Break neighbor loop, continue physics
                            }
                        }
                    }
                    if (types[idx] === FIRE) continue; // Stop processing as gas if ignited
                }

                if (type === NUKE) {
                    const neighbors = [idx-width, idx+width];
                    if (x > 0) neighbors.push(idx - 1);
                    if (x < width - 1) neighbors.push(idx + 1);
                    
                    const nIdx = neighbors[Math.floor(Math.random() * neighbors.length)];
                    if (nIdx >= 0 && nIdx < types.length) {
                        const t = types[nIdx];
                        if (t === WATER) types[nIdx] = ACID;
                        else if (t === PLANT || t === WOOD) types[nIdx] = VIRUS;
                        else if (t === SAND || t === STONE) { types[nIdx] = GLASS; grid[nIdx] = 0; }
                    }
                }

                grid[idx] -= 1; // Life decay
                // Methane lasts longer
                if (type === METHANE && grid[idx] < 10) grid[idx] = 0;
                
                // Logic moved up: Condensation checks handle life <= 0 now
 
                // Rise (with throttling to prevent instant teleportation in bottom-up loop)
                if (Math.random() < 0.3) {
                    const above = idx - width;
                    const dir = flowDir;
                    const aboveSide = above + dir;
                    // Check X boundaries for diagonal movement
                    const safeSide = (dir === -1 && x > 0) || (dir === 1 && x < width - 1);

                    // Try move up
                    if (y > 0 && above >= 0 && types[above] === EMPTY) {
                        types[above] = type;
                        grid[above] = grid[idx];
                        processed[above] = 1;
                        types[idx] = EMPTY;
                        grid[idx] = 0;
                        
                    } 
                    // Try move up-diagonal (dispersion)
                    else if (y > 0 && safeSide && aboveSide >= 0 && aboveSide < types.length && types[aboveSide] === EMPTY && above >= 0) {
                        types[aboveSide] = type;
                        grid[aboveSide] = grid[idx];
                        processed[aboveSide] = 1;
                        types[idx] = EMPTY;
                        grid[idx] = 0;
                    }
                     // Move horizontal (spread)
                    else {
                         const side = idx + dir;
                         if (side >= 0 && side < types.length && types[side] === EMPTY) {
                            types[side] = type;
                            grid[side] = grid[idx];
                            processed[side] = 1;
                            types[idx] = EMPTY;
                            grid[idx] = 0;
                         }
                    }
                }
            }
            else if (type === SOURCE) {
                // Source Logic
                let spawnType = grid[idx];
                const neighbors = [idx-width, idx+width];
                if (x > 0) { neighbors.push(idx - 1); if(types[idx-1]===EMPTY) neighbors.push(idx-1); } // Double chance for sides
                if (x < width - 1) { neighbors.push(idx + 1); if(types[idx+1]===EMPTY) neighbors.push(idx+1); }

                if (spawnType === 0) {
                    // Unconfigured: Absorb type from neighbor
                    for (let n of neighbors) {
                        if (n >= 0 && n < types.length && types[n] !== EMPTY && types[n] !== SOURCE && types[n] !== WALL) {
                            grid[idx] = types[n];
                            break;
                        }
                    }
                } else {
                    // Configured: High pressure spawn (check all neighbors)
                    for (let target of neighbors) {
                        if (target >= 0 && target < types.length && types[target] === EMPTY) {
                            types[target] = spawnType;
                            grid[target] = getInitialData(spawnType);
                            processed[target] = 1; // Fix: Prevent "beam" effect by stopping immediate fall
                        }
                    }
                }
            }
            else if (type === VOID) {
                // Void Logic: Gravity well + Eat neighbors
                const neighbors = [idx-1, idx+1, idx-width, idx+width];
                for (let n of neighbors) {
                    // Void shouldn't eat walls or itself
                    if (n >= 0 && n < types.length && types[n] !== EMPTY && types[n] !== VOID && types[n] !== WALL) {
                         // Visual flair: sparkles when eating
                        if (Math.random() < 0.1) {
                            grid[idx] = 255; // Flash the void
                        }
                        types[n] = EMPTY;
                        grid[n] = 0;
                    }
                }
                // Gravity Pull (sucks nearby particles in)
                if (Math.random() < 0.05) {
                    const range = 3;
                    for (let dy = -range; dy <= range; dy++) {
                        for (let dx = -range; dx <= range; dx++) {
                            const dist = Math.sqrt(dx*dx + dy*dy);
                            if (dist <= 1 || dist > range) continue;
                            const tx = x + dx;
                            const ty = y + dy;
                            if (tx>=0 && tx<width && ty>=0 && ty<height) {
                                const tidx = tx + ty*width;
                                if (types[tidx] !== EMPTY && types[tidx] !== WALL && types[tidx] !== VOID) {
                                    // Swap closer to void (simple inverse move)
                                    const pullX = x + Math.round(dx/2);
                                    const pullY = y + Math.round(dy/2);
                                    const pullIdx = pullX + pullY * width;
                                    if (types[pullIdx] === EMPTY) {
                                        types[pullIdx] = types[tidx];
                                        grid[pullIdx] = grid[tidx];
                                        types[tidx] = EMPTY;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            else if (type === THUNDER) {
                // Thunder Logic: Short lived, erratic, destructive
                grid[idx] -= 10 + Math.random() * 10; // Decays fast
                
                // Check for interaction before moving
                const nearby = [idx-1, idx+1, idx+width, idx+width+1, idx+width-1];
                let attractionX = 0;
                let attractionY = 1; // Naturally biased down

                for (let n of nearby) { // Check contact
                    if (n >= 0 && n < types.length) {
                        const t = types[n];
                        // Attraction physics (search ahead)
                         if (isLiquid(t) || t === GUNPOWDER || t === C4 || t === SOURCE) {
                             if (n === idx-1) attractionX = -1;
                             if (n === idx+1) attractionX = 1;
                         }

                        // Damage physics
                        if (t === SAND) { types[n] = GLASS; grid[n] = 0; } // Fulgurite
                        else if (t === WATER) { types[n] = STEAM; grid[n] = 255; } // Flash boil
                        else if (t === GUNPOWDER || t === C4 || t === METHANE) { 
                            types[n] = FIRE; grid[n] = 255; // Detonate
                        }
                        else if (t === WOOD || t === PLANT) { types[n] = FIRE; grid[n] = 255; }
                        else if (t === STONE) { types[n] = SAND; grid[n] = 0; } // Pulverize
                    }
                }

                // Thunder hits bottom or runs out of energy
                if (grid[idx] <= 0 || y >= height - 1) {
                    types[idx] = EMPTY;
                    // Impact flash
                    if (y >= height - 5) {
                         for(let n of nearby) if (n>=0 && n<types.length && types[n]===EMPTY) { types[n]=SMOKE; grid[n]=50; }
                    }
                    continue;
                }

                // Move wildly
                const maxJumps = 3;
                for(let j=0; j<maxJumps; j++) {
                    // Bias movement towards conductive materials or down
                    const dx = (Math.random() < 0.3) ? attractionX : (Math.floor(Math.random()*3)-1);
                    const dy = (Math.random() < 0.3) ? attractionY : (Math.floor(Math.random()*3)-1);
                    const destX = x + dx;
                    const destY = y + dy;
                    const dest = destX + destY * width;
                    
                    if (destX >= 0 && destX < width && destY >= 0 && destY < height && types[dest] === EMPTY) {
                        types[dest] = THUNDER;
                        grid[dest] = grid[idx];
                        processed[dest] = 1;
                        types[idx] = EMPTY;
                        grid[idx] = 0;
                        break; // Move once per frame effectively, but checks range
                    }
                }
            }
            else if (type === EMBER) {
                // Ember Logic: Walking fire for fuses
                grid[idx] -= 2; // Burns steadily
                if (grid[idx] <= 0) {
                    types[idx] = EMPTY;
                    if (Math.random() < 0.3) { types[idx] = SMOKE; grid[idx] = 60; }
                    continue;
                }
                // Ignite neighbors
                const neighbors = [idx-width, idx+width];
                if (x > 0) neighbors.push(idx - 1);
                if (x < width - 1) neighbors.push(idx + 1);
                
                for (let n of neighbors) {
                    if (n >= 0 && n < types.length) {
                        if (types[n] === FUSE) {
                            types[n] = EMBER; // Ignite fuse
                            grid[n] = 100 + Math.random() * 20;
                            processed[n] = 1;
                        } else if (types[n] === C4 || types[n] === GUNPOWDER || types[n] === METHANE) {
                            types[n] = FIRE; // Detonate
                            grid[n] = 100; 
                        } else if (types[n] === WOOD && Math.random() < 0.05) {
                            types[n] = FIRE;
                            grid[n] = 100;
                        }
                    }
                }
            }
            else if (type === FIRE) {
                // Fire Logic: Rises, flickers, dies, burns wood
                grid[idx] -= Math.random() * 1.5; // Decrease life

                // Chance to emit smoke
                if (Math.random() < 0.05) {
                    const above = idx - width;
                    if (above >= 0 && (types[above] === EMPTY || types[above] === FIRE)) {
                        types[above] = (Math.random() < 0.5 ? SMOKE : EMPTY);
                        grid[above] = 100 + Math.random() * 100;
                    }
                }

                if (grid[idx] <= 0) {
                    types[idx] = EMPTY;
                    continue;
                }

                // Rise
                const above = idx - width;
                if (y > 0) {
                    // Check for wood to burn
                    const destinations = [above, above - 1, above + 1, idx - 1, idx + 1];
                    for (let dest of destinations) {
                        if (dest >= 0 && dest < types.length) {
                            if (types[dest] === METHANE) {
                                types[dest] = FIRE;
                                grid[dest] = 150 + Math.random() * 50; // Explosive spread
                            } else if (types[dest] === WOOD && Math.random() < 0.05) {
                                types[dest] = FIRE;
                                grid[dest] = 200 + Math.random() * 50; // Ignite new fire (rarely)
                            }
                            if (types[dest] === OIL) {
                                types[dest] = FIRE;
                                grid[dest] = 200 + Math.random() * 100; // Oil ignites
                            }
                            if (types[dest] === C4) {
                                types[dest] = FIRE;
                                grid[dest] = 100;
                                types[dest] = PLASMA; // Hot center
                                // Big Circular Explosion
                                const radius = 6;
                                for(let ex = -radius; ex <= radius; ex++) {
                                    for(let ey = -radius; ey <= radius; ey++) {
                                        if (ex*ex + ey*ey <= radius*radius) {
                                            const blastIdx = dest + ex + ey * width;
                                            if (blastIdx >= 0 && blastIdx < types.length && types[blastIdx] !== WALL) {
                                                types[blastIdx] = FIRE;
                                                grid[blastIdx] = 120;
                                            }
                                        }
                                    }
                                }
                            }
                            if (types[dest] === FUSE) {
                                types[dest] = EMBER; // Light fuse
                                grid[dest] = 100 + Math.random() * 20;
                            }
                            if (types[dest] === GUNPOWDER) {
                                types[dest] = FIRE;
                                grid[dest] = 100 + Math.random() * 50; // Explode
                                // Small Circular Explosion
                                const radius = 3;
                                for(let ex = -radius; ex <= radius; ex++) {
                                    for(let ey = -radius; ey <= radius; ey++) {
                                        if (ex*ex + ey*ey <= radius*radius) {
                                            const blastIdx = dest + ex + ey * width;
                                            if (blastIdx >= 0 && blastIdx < types.length && types[blastIdx] !== WALL && types[blastIdx] !== STONE) {
                                                types[blastIdx] = FIRE;
                                                grid[blastIdx] = 100;
                                            }
                                        }
                                    }
                                }
                            }
                            if (types[dest] === ICE && Math.random() < 0.05) {
                                types[dest] = WATER; // Melt ice
                            }
                        }
                    }

                    // Charring effect: Turn touching wood into Ember (better visuals)
                    if (types[above] === WOOD) {
                         types[above] = EMBER;
                         grid[above] = 250; // Glowing hot charcoal
                    } else if (Math.random() < 0.5) {
                        // Check sides for wood to char
                        const sides = [idx-1, idx+1];
                        for (let s of sides) {
                            if (s >=0 && types[s] === WOOD) { types[s] = EMBER; grid[s] = 250; }
                        }
                    }

                    // Move movement
                    const dest = above + (Math.random() < 0.2 ? 0 : (Math.random() < 0.5 ? -1 : 1));
                    if (dest >= 0 && types[dest] === EMPTY) {
                         // To prevent infinite rising in one frame in a bottom-up loop,
                         // we swap but we know the loop goes UP y, so we won't process 'dest' again this frame.
                         types[dest] = FIRE;
                         grid[dest] = grid[idx];
                         processed[dest] = 1;
                         types[idx] = EMPTY;
                         grid[idx] = 0;
                    } else if (types[dest] === WATER) {
                        // Turn into Steam
                        types[dest] = STEAM;
                        grid[dest] = 200 + Math.random() * 50; // Steam life
                        processed[dest] = 1;
                        types[idx] = EMPTY; // Fire Extinguished
                        grid[idx] = 0;
                    }
                }
            }
            else if (type === PLANT) {
                // Plant Logic: Static, drinks water to grow, flammable
                const neighbors = [idx - 1, idx + 1, idx - width, idx + width];
                
                for (let nIdx of neighbors) {
                    if (nIdx >= 0 && nIdx < types.length) {
                        const nType = types[nIdx];
                        if (nType === WATER) {
                            // Drink water and grow
                            types[nIdx] = PLANT;
                            grid[nIdx] = grid[idx]; // Pass on color variations
                        } else if (nType === FIRE || nType === LAVA) {
                            // Catch fire easily
                            types[idx] = FIRE;
                            grid[idx] = 150 + Math.random() * 50;
                        }
                    }
                }
            }
            else if (type === PLASMA) {
                // Plasma Logic
                grid[idx] -= 1; // Decay
                if (grid[idx] <= 0) { types[idx] = EMPTY; continue; }
                
                // Heat / Destruction interactions
                const neighbors = [idx-1, idx+1, idx-width, idx+width];
                for (let n of neighbors) {
                    if (n >= 0 && n < types.length && types[n] !== EMPTY && types[n] !== PLASMA) {
                         if (types[n] === WATER || types[n] === ICE) { types[n] = STEAM; grid[n] = 255; }
                         else if (types[n] === SAND) { types[n] = GLASS; grid[n] = 0; }
                         else if (types[n] === STONE || types[n] === WALL || types[n] === GLASS) {
                             if (Math.random() < 0.05) { types[n] = LAVA; grid[n] = 250; } // Melt stone/glass
                         }
                         else { types[n] = FIRE; grid[n] = 100; } // Burn everything else
                    }
                }
                // Move chaotically (like very light liquid)
                const dests = [idx + width, idx + width - 1, idx + width + 1, idx - 1, idx + 1];
                let moved = false;
                for (let d of dests) {
                    if (d >= 0 && d < types.length && types[d] === EMPTY) {
                        types[d] = PLASMA; grid[d] = grid[idx];
                        processed[d] = 1;
                        types[idx] = EMPTY; grid[idx] = 0;
                        moved = true; break;
                    }
                }
            }
            else if (type === SAND || type === WATER || type === ACID || type === GUNPOWDER || type === LAVA || type === OIL || type === VIRUS) {
                // Acid Reaction: Dissolve Stone, Sand, and even Wood if we had it
                if (type === ACID) {
                    let reacted = false;
                    const neighbors = [idx + width, idx - width];
                    if (x > 0) neighbors.push(idx - 1);
                    if (x < width - 1) neighbors.push(idx + 1);

                    for (let nIdx of neighbors) {
                        if (nIdx >= 0 && nIdx < types.length) {
                            const t = types[nIdx];
                            const resistant = (t === GLASS || t === WALL || t === ACID || t === SOURCE);
                            
                            if (!resistant && types[nIdx] !== EMPTY) {
                                if (t === STONE) {
                                    grid[nIdx] -= 10; // Damage stone (darkens it)
                                    if (grid[nIdx] < 20) { types[nIdx] = EMPTY; grid[nIdx] = 0; }
                                } else {
                                    // Visual Effect: Chemical Smoke when dissolving
                                    if (types[nIdx] !== WATER && Math.random() < 0.3) {
                                        const above = nIdx - width;
                                        if (above >= 0 && types[above] === EMPTY) {
                                            types[above] = (Math.random() < 0.5) ? SMOKE : METHANE; // Toxic fumes
                                            grid[above] = 60; 
                                        }
                                    }
                                    types[nIdx] = EMPTY; grid[nIdx] = 0; // Instant dissolve
                                }
                                if (Math.random() < 0.33) { types[idx] = EMPTY; grid[idx] = 0; reacted = true; break; } // Increased consumption rate
                            }
                        }
                    }
                    if (reacted || types[idx] === EMPTY) continue;
                }

                // Virus Infection Logic
                if (type === VIRUS) {
                    const neighbors = [idx-width, idx+width];
                    if (x > 0) neighbors.push(idx - 1);
                    if (x < width - 1) neighbors.push(idx + 1);

                    for (let nIdx of neighbors) {
                        if (nIdx >= 0 && nIdx < types.length) {
                            const nType = types[nIdx];
                            // Infect susceptible materials
                            if (nType === WATER || nType === PLANT || nType === WOOD || nType === OIL || nType === GUNPOWDER) {
                                types[nIdx] = VIRUS;
                                grid[nIdx] = grid[idx]; // Duplicate strain color
                            } else if (nType === FIRE || nType === LAVA || nType === ACID) {
                                types[idx] = FIRE; // Virus dies/burns easily
                                grid[idx] = 100;
                            }
                        }
                    }
                }

                // Lava Logic: Hot interactions
                if (type === LAVA) {
                    // Generate steam if near water
                    const above = idx - width;
                    if (above >= 0 && types[above] === EMPTY && Math.random() < 0.05) {
                         // Only if neighbors are water
                         const neighbors = [idx-1, idx+1, idx+width];
                         for(let n of neighbors) { 
                             if(n>=0 && types[n]===WATER) { types[above] = STEAM; grid[above] = 200; break; }
                         }
                    }
                    // Check neighbors for interactions
                    const neighborOffsets = [-width, width];
                    if (x > 0) neighborOffsets.push(-1);
                    if (x < width - 1) neighborOffsets.push(1);

                    for (let offset of neighborOffsets) {
                        const neighborIndex = idx + offset;
                        if (neighborIndex >= 0 && neighborIndex < types.length) {
                            const nType = types[neighborIndex];
                            if (nType === WATER || nType === ICE || nType === ACID) {
                                types[idx] = STONE; // Lava cools
                                types[neighborIndex] = (nType === ICE) ? WATER : STEAM; // Water boils or Ice melts
                                grid[neighborIndex] = 200 + Math.random() * 50;
                                processed[idx] = 1; processed[neighborIndex] = 1;
                                break; // solidified
                            } else if (nType === WOOD || nType === GUNPOWDER || nType === OIL || nType === FUSE || nType === C4) {
                                if (Math.random() < 0.1) {
                                    types[neighborIndex] = FIRE; // Ignite
                                    grid[neighborIndex] = 100 + Math.random() * 50;
                                }
                            } else if (nType === SAND) {
                                types[neighborIndex] = GLASS; // Melt Sand
                                grid[neighborIndex] = 0;
                            }
                        }
                    }
                    // If lava turned to stone in the loop above, skip movement
                    if (types[idx] === STONE) continue;
                }
                
                
                // -- Unified Density Movement Logic --
                const below = idx + width;
                const belowLeft = below - 1;
                const belowRight = below + 1;
                const left = idx - 1;
                const right = idx + 1;

                const myDensity = getDensity(type);

                // 1. Try Move Down
                // We can move down if the target is empty OR if the target has lower density (and isn't immovable)
                let moved = false;
                if (y < height - 1) {
                    const tBelow = types[below];
                    const densityBelow = getDensity(tBelow);
                    
                    if (tBelow === EMPTY || (densityBelow < myDensity && tBelow !== WALL && tBelow !== GLASS)) {
                        // Move down or swap sand/water
                        const targetType = types[below];
                        const targetHue = grid[below];
                        
                        types[below] = type;
                        grid[below] = grid[idx];
                        
                        processed[below] = 1; // Mark destination as processed
                        processed[idx] = 1;   // Mark source as processed (though it's now empty/swapped)
                        
                        types[idx] = targetType;
                        grid[idx] = targetHue;
                        moved = true;
                    }
                }
                
                // 2. Try Diagonal (if didn't move down)
                if (!moved && y < height - 1) {
                    // Randomize diagonal checking order to prevent directional bias
                    const checkLeft = x > 0;
                    const checkRight = x < width - 1;
                    
                    // Simple random shuffle for diagonals
                    const candidates = [];
                    if (checkLeft) candidates.push({i: belowLeft, safe: true});
                    if (checkRight) candidates.push({i: belowRight, safe: true});
                    if (checkLeft && checkRight && Math.random() < 0.5) candidates.reverse();
                    
                    for (let op of candidates) {
                        const target = op.i;
                        const tType = types[target];
                        const densityTarget = getDensity(tType);

                        if (tType === EMPTY || (densityTarget < myDensity && tType !== WALL && tType !== GLASS)) {
                            const tHue = grid[target];
                            types[target] = type;
                            grid[target] = grid[idx];
                            processed[target] = 1;
                            
                            types[idx] = tType;
                            grid[idx] = tHue;
                            moved = true;
                            break;
                        }
                    }
                }

                // 3. Horizontal movement (Liquids)
                if (!moved && isLiquid(type)) {
                    const sides = [];
                    if (x > 0) sides.push(left);
                    if (x < width - 1) sides.push(right);
                    if (sides.length > 1 && Math.random() < 0.5) sides.reverse();

                    for (let target of sides) {
                        if (target >= 0 && target < types.length && types[target] === EMPTY) {
                            types[target] = type;
                            
                            // Viscosity / Slip control
                            if (type === LAVA && Math.random() > 0.1) break; // Lava moves slow
                            if (type === WATER || type === OIL) {
                                // Liquids move faster if they are on top of other liquids (slip)
                                // If the pixel below is also liquid, we slide easier
                                if (y < height-1 && isLiquid(types[idx+width])) {
                                    // allow double move? handled by logic loop speed, 
                                    // but we ensure we don't break early to allow "far" checks if we added them.
                                } 
                            }
                            
                            grid[target] = grid[idx];
                            processed[target] = 1;
                            types[idx] = EMPTY;
                            grid[idx] = 0;
                            if(Math.random() > 0.2) break; // Enable faster flow (viscosity)
                        }
                    }
                }
            }
        }
    }
}

function spawnSand() {
    if (isMouseDown) {
        const extent = Math.floor(brushSize / 2);
        
        let targetX = mouseX;
        let targetY = mouseY;

        // Shift key constraint (Straight lines)
        if (isShiftHeld) {
            if (Math.abs(mouseX - startMouseX) > Math.abs(mouseY - startMouseY)) {
                targetY = startMouseY; // Lock Y, move X
            } else {
                targetX = startMouseX; // Lock X, move Y
            }
        }

        // Interpolate mouse movement to fill gaps
        const dx = targetX - lastMouseX;
        const dy = targetY - lastMouseY;
        const distance = Math.sqrt(dx*dx + dy*dy);
        const steps = Math.max(1, Math.round(distance));

        for (let s = 0; s < steps; s++) {
            const t = steps === 1 ? 1 : s / steps;
            // Add slight jitter for organic feel
            const jitterX = (Math.random() - 0.5) * 0.5;
            const jitterY = (Math.random() - 0.5) * 0.5;
            const lerpX = Math.round(lastMouseX + dx * t);
            const lerpY = Math.round(lastMouseY + dy * t);
            paintStroke(lerpX, lerpY, extent);
        }
        // Right click acts as Eraser (Empty)
        const effectiveTool = (mouseButton === 2) ? EMPTY : currentTool;
        
        // Ensure the final point is drawn (handles click without move)
        if (steps > 0) paintStroke(targetX, targetY, extent, effectiveTool);
        
        lastMouseX = targetX;
        lastMouseY = targetY;
        hue = (hue + 1) % 360;
    } else {
        // Reset last positions to current to prevent jumping on next click
        lastMouseX = mouseX;
        lastMouseY = mouseY;
    }
}

function paintStroke(cx, cy, extent, toolVal = currentTool) {
    for (let i = -extent; i <= extent; i++) {
        for (let j = -extent; j <= extent; j++) {
            if (i*i + j*j > extent*extent) continue; // Circular brush
            if (Math.random() > 0.1) { // Density
                const c = cx + i;
                const r = cy + j;
                
                if (c >= 0 && c < width && r >= 0 && r < height) {
                    const idx = c + r * width;

                    // Feature: Configure Source by painting into it
                    if (types[idx] === SOURCE && toolVal !== EMPTY && toolVal !== WALL) {
                        if (toolVal === SOURCE) continue; // Prevent self-sourcing
                        grid[idx] = toolVal;
                        continue;
                    }

                    // Normal Painting
                    if ((types[idx] !== WALL) || toolVal === EMPTY || toolVal === WALL) {
                        if (toolVal === EMPTY) {
                            types[idx] = EMPTY;
                            grid[idx] = 0;
                        } 
                        else if (types[idx] === EMPTY || types[idx] !== toolVal) {
                            types[idx] = toolVal;
                            grid[idx] = getInitialData(toolVal);
                            processed[idx] = 1; // Don't fall immediately in this frame
                        }
                    }
                }
            }
        }
    }
}

function draw() {
    // Render using ImageData for high performance
    const data = imgData.data;
    data.fill(0); // Clear buffer (black)
    let hasThunder = false;

    for (let i = 0; i < grid.length; i++) {
        let type = types[i];
        // Removal of bug: Don't overwrite 'type' for Source, handle it explicitly below to display correctly.
        
        if (type !== EMPTY) {
            const idx = i * 4;
            if (type === THUNDER) hasThunder = true;
            let alpha = 255;
            let r = 0, g = 0, b = 0;
            
            if (type === SAND) {
                // Natural Sand Color (Tan/Gold variations)
                const val = grid[i]; 
                r = 230 - val; 
                g = 196 - val; 
                b = 120 - (val * 0.5);
            } else if (type === WATER) {
                r = 30; g = 144; b = 255;
            } else if (type === STONE) {
                const shade = grid[i]; // Use stored texture, no shimmering
                r = shade; g = shade; b = shade;
            } else if (type === ACID) {
                // Use hue calculation for acid or standard Green
                r = 60 + Math.sin(grid[i] * 0.1) * 20; g = 220; b = 60;
            } else if (type === WOOD) {
                const shade = grid[i]; // varied brown
                r = 139 + shade; g = 69 + shade; b = 19 + shade;
            } else if (type === FIRE) {
                const life = grid[i];
                if (life > 230) { r=255; g=255; b=200; } // White hot
                else if (life > 150) { r=255; g=200; b=0; } // Yellow
                r = 255;
                g = life > 200 ? 255 : (life > 100 ? life : 0);
                b = life > 220 ? life : 0;
            } else if (type === GUNPOWDER) {
                const val = 60 + grid[i];
                r = val; g = val; b = val;
            } else if (type === STEAM) {
                const val = grid[i]; // fade out
                r = 230; g = 230; b = 255;
                alpha = Math.max(0, Math.min(255, val)); // Real alpha
            } else if (type === SMOKE) {
                const val = 30 + (grid[i] / 4);
                r = val; g = val; b = val;
            } else if (type === OIL) {
                r = 186; g = 176; b = 32; // Olive gold
            } else if (type === LAVA) {
                r = grid[i]; // stored red value
                g = (r - 200) * 1.5; // derivation for orange/yellow
                b = 0;
                if (r > 240) { g += 50; b += 20; } // Bright glow spots
            } else if (type === PLANT) {
                r = 34; 
                g = 139 + grid[i]; 
                b = 34; 
            } else if (type === ICE) {
                r = 220 + grid[i];
                g = 240 + grid[i];
                b = 255;
            } else if (type === METHANE) {
                const val = 60 + (grid[i] % 20); // Faint variation
                r = 100 + val; g = 80 + val; b = 120 + val; // Pale purple gas
            } else if (type === VIRUS) {
                const val = grid[i];
                r = 216 + val; g = 66; b = 148; // Hot pink/Magenta
            } else if (type === FUSE) {
                r = 85 + (grid[i] % 20); g = 107 + (grid[i] % 20); b = 47; // Dark Green
            } else if (type === C4) {
                const val = 200 + grid[i];
                r = val; g = val; b = val - 20; // Off-white/gray
            } else if (type === EMBER) {
                r = 255;
                g = 140 + Math.random()*60;
                b = 0;
            } else if (type === WALL) {
                let shade = grid[i];
                r = shade; g = shade; b = shade;
            } else if (type === PLASMA) {
                 r = 200 + (grid[i]%55); g = 0; b = 255; // Purple pulse
                 if (Math.random() < 0.2) { r=255; g=255; b=255; } // Flicker
            } else if (type === GLASS) {
                 r = 200; g = 240; b = 255; // Bright glass
                 alpha = 100; // More transparent
                 // Add simple "shine" pattern
                 if ((i/width + i%width) % 20 < 2) { r=200; g=255; b=255; }
            } else if (type === SOURCE) {
                const product = grid[i];
                
                if (!product || product === 0) {
                     // Unconfigured Source Pulse
                     const phase = (i/width + frameCount) * 0.1;
                      const intensity = 128 + Math.sin(phase) * 100;
                       r = intensity; g = 0; b = intensity; // Unconfigured: Magenta
                } else {
                    // Configured: Glows the color of the content, but draw a solid block with a border
                    const x = i % width;
                    const y = Math.floor(i / width);
                    
                    if (product === WATER) { r=30; g=144; b=255; }
                    else if (product === FIRE) { r=200; g=50; b=0; }
                    else if (product === SAND) { r=230; g=196; b=120; }
                    else if (product === ACID) { r=50; g=205; b=50; }
                    else if (product === LAVA) { r=200; g=40; b=0; }
                    else if (product === OIL) { r=186; g=176; b=32; }
                    else if (product === PLASMA) { r=200; g=0; b=255; }
                    else if (product === PLANT) { r=34; g=139; b=34; }
                    else if (product === GUNPOWDER) { r=180; g=180; b=180; }
                    else if (product === C4) { r=220; g=220; b=200; }
                    else if (product === ICE) { r=220; g=240; b=255; }
                    else if (product === THUNDER) { r=255; g=255; b=0; }
                    else { r=128; g=128; b=128; }
                    
                    // Add a pulse to the whole block
                    const pulse = 0.8 + Math.sin(frameCount * 0.1) * 0.2;
                    r *= pulse; g *= pulse; b *= pulse;

                    // Border for clarity
                    const isEdge = (x > 0 && types[i-1] !== SOURCE) || (x < width-1 && types[i+1] !== SOURCE) || (y>0 && types[i-width]!==SOURCE);
                    if (isEdge) { r=255; g=255; b=255; }
                }
            } else if (type === THUNDER) {
                r = 255; g = 255; b = 0;
                if (Math.random() < 0.5) { r = 255; g = 255; b = 255; } // Flicker white
            } else if (type === NUKE) {
                r = 57; g = 255; b = 20; // Neon Green
                if (Math.random() < 0.2) { r=200; b=240; }
            } else if (type === VOID) {
                // Void Logic: flashes when eating
                const val = grid[i]; // temporary flash
                r = 20 + val; g = val/2; b = 40 + val; // Visible dark purple base
                if (grid[i] > 0) grid[i] -= 25; // Fade flash
                if ((i % 9) === 0 && Math.random() < 0.05) { r+=40; b+=80; } // Subtle sparkle
            }
            
            data[idx] = r;
            data[idx+1] = g;
            data[idx+2] = b;
            data[idx+3] = alpha; 
        }
    }
    ctx.putImageData(imgData, 0, 0);

    // Visual effects overlay for Thunder
    if (hasThunder && Math.random() < 0.2) {
         ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
         ctx.fillRect(0, 0, width, height);
    }
}

function loop() {
    spawnSand();
    if (!isPaused) {
        updatePhysics();
        updatePhysics();
        updatePhysics();
    }
    draw();
    requestAnimationFrame(loop);
}

updateCursor();
loop();
