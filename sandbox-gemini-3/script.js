const canvas = document.getElementById('sandCanvas');
const ctx = canvas.getContext('2d');

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
let grid = new Float32Array(width * height).fill(0); // Stores Hue logic
let isMouseDown = false;
let isPaused = false;
let mouseX = 0;
let mouseY = 0;
let hue = 0;
let currentTool = SAND;
let brushSize = 5;
const imgData = ctx.createImageData(width, height);

// Inputs
canvas.addEventListener('mousedown', () => isMouseDown = true);
canvas.addEventListener('mouseup', () => isMouseDown = false);
canvas.addEventListener('mouseout', () => isMouseDown = false);
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    mouseX = Math.floor((e.clientX - rect.left) * scaleX);
    mouseY = Math.floor((e.clientY - rect.top) * scaleY);
});

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
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
});

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
    'source': 'Source: Generates elements. Touch an element to configure.',
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
    document.querySelectorAll('button').forEach(b => b.classList.remove('active')); // clear all
    document.getElementById(`btn-${toolName}`)?.classList.add('active');
    
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

function resetGrid() {
    grid.fill(0);
    types.fill(EMPTY);
}

function getInitialData(type) {
    if (type === FIRE) return 100 + Math.random() * 50;
    if (type === WOOD) return 20 + Math.random() * 10;
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
    if (type === PLASMA) return 50 + Math.random() * 100;
    if (type === SAND || type === ACID) return hue;
    if (type === THUNDER) return 255;
    if (type === NUKE) return 200 + Math.random() * 100;
    return 0;
}

function updatePhysics() {
    // Iterate from bottom to top to avoid double-moving particles in one frame
    for (let y = height - 1; y >= 0; y--) {
        for (let x = 0; x < width; x++) {
            const idx = x + y * width;
            const type = types[idx];

            // Gas Logic (Steam, Smoke, Methane)
            if (type === STEAM || type === SMOKE || type === METHANE || type === NUKE) {
                // Methane Ignition check (highly flammable gas)
                if (type === METHANE) {
                    const neighbors = [idx-1, idx+1, idx-width, idx+width];
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
                    const neighbors = [idx-1, idx+1, idx-width, idx+width];
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
                
                if (grid[idx] <= 0 && type !== METHANE && type !== SMOKE) { // Condensate or die
                    if (type === STEAM && Math.random() < 0.05) {
                         types[idx] = WATER;
                         grid[idx] = 0;
                    } else {
                        types[idx] = EMPTY;
                        grid[idx] = 0;
                    }
                    continue;
                }
                if (grid[idx] <= 0 && (type === METHANE || type === SMOKE)) {
                     types[idx] = EMPTY; 
                     continue;
                }

                // Rise (with throttling to prevent instant teleportation in bottom-up loop)
                if (Math.random() < 0.3) {
                    const above = idx - width;
                    const dir = Math.random() < 0.5 ? -1 : 1;
                    const aboveSide = above + dir;

                    // Try move up
                    if (y > 0 && types[above] === EMPTY) {
                        types[above] = type;
                        grid[above] = grid[idx];
                        types[idx] = EMPTY;
                        grid[idx] = 0;
                    } 
                    // Try move up-diagonal (dispersion)
                    else if (y > 0 && aboveSide >= 0 && aboveSide < types.length && types[aboveSide] === EMPTY) {
                        types[aboveSide] = type;
                        grid[aboveSide] = grid[idx];
                        types[idx] = EMPTY;
                        grid[idx] = 0;
                    }
                     // Move horizontal (spread)
                    else {
                         const side = idx + dir;
                         if (side >= 0 && side < types.length && types[side] === EMPTY) {
                            types[side] = type;
                            grid[side] = grid[idx];
                            types[idx] = EMPTY;
                            grid[idx] = 0;
                         }
                    }
                }
            }
            else if (type === SOURCE) {
                // Source Logic
                let spawnType = grid[idx];
                const neighbors = [idx-1, idx+1, idx-width, idx+width];

                if (spawnType === 0) {
                    // Unconfigured: Absorb type from neighbor
                    for (let n of neighbors) {
                        if (n >= 0 && n < types.length && types[n] !== EMPTY && types[n] !== SOURCE && types[n] !== WALL) {
                            grid[idx] = types[n];
                            break;
                        }
                    }
                } else {
                    // Configured: Spawn type
                    // Only spawn in one random empty direction per frame to control flow
                    const target = neighbors[Math.floor(Math.random()*neighbors.length)];
                    if (target >= 0 && target < types.length && types[target] === EMPTY) {
                        types[target] = spawnType;
                        grid[target] = getInitialData(spawnType);
                    }
                }
            }
            else if (type === VOID) {
                // Void Logic: Eat neighbors
                const neighbors = [idx-1, idx+1, idx-width, idx+width];
                for (let n of neighbors) {
                    if (n >= 0 && n < types.length && types[n] !== EMPTY && types[n] !== VOID && types[n] !== WALL) {
                        types[n] = EMPTY;
                        grid[n] = 0;
                    }
                }
            }
            else if (type === THUNDER) {
                // Thunder Logic: Short lived, erratic, destructive
                grid[idx] -= 10 + Math.random() * 10; // Decays fast
                
                // Check for interaction before moving
                const nearby = [idx-1, idx+1, idx-width, idx+width, idx+width+1, idx+width-1, idx-width+1, idx-width-1];
                for (let n of nearby) {
                    if (n >= 0 && n < types.length) {
                        const t = types[n];
                        if (t === SAND) { types[n] = GLASS; grid[n] = 0; } // Fulgurite
                        else if (t === WATER) { types[n] = STEAM; grid[n] = 255; } // Flash boil
                        else if (t === GUNPOWDER || t === C4 || t === METHANE) { 
                            types[n] = FIRE; grid[n] = 255; // Detonate
                        }
                        else if (t === WOOD || t === PLANT) { types[n] = FIRE; grid[n] = 255; }
                        else if (t === STONE) { types[n] = SAND; grid[n] = 0; } // Pulverize
                    }
                }

                if (grid[idx] <= 0) {
                    types[idx] = EMPTY;
                    continue;
                }

                // Move wildly
                const maxJumps = 2;
                for(let j=0; j<maxJumps; j++) {
                    const moveOffset = (Math.floor(Math.random()*3)-1) + (Math.floor(Math.random()*3)-1) * width;
                    const dest = idx + moveOffset;
                    if (dest >= 0 && dest < types.length && types[dest] === EMPTY) {
                        types[dest] = THUNDER;
                        grid[dest] = grid[idx];
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
                const neighbors = [idx-1, idx+1, idx-width, idx+width];
                for (let n of neighbors) {
                    if (n >= 0 && n < types.length) {
                        if (types[n] === FUSE) {
                            types[n] = EMBER; // Ignite fuse
                            grid[n] = 100 + Math.random() * 20;
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
                    if (above >= 0 && types[above] === EMPTY) {
                        types[above] = SMOKE;
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
                                grid[dest] = 100 + Math.random() * 50; // Ignite new fire
                            }
                            if (types[dest] === OIL) {
                                types[dest] = FIRE;
                                grid[dest] = 200 + Math.random() * 100; // Oil ignites
                            }
                            if (types[dest] === C4) {
                                types[dest] = FIRE;
                                grid[dest] = 100;
                                // Big explosion radius
                                for(let ex = -3; ex <= 3; ex++) {
                                    for(let ey = -3; ey <= 3; ey++) {
                                        if (ex*ex + ey*ey <= 12) {
                                            const blastIdx = dest + ex + ey * width;
                                            if (blastIdx >= 0 && blastIdx < types.length && types[blastIdx] !== STONE && types[blastIdx] !== WALL) {
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
                                // Simple explosion radius
                                for(let ex = -1; ex <= 1; ex++) {
                                    for(let ey = -1; ey <= 1; ey++) {
                                        const blastIdx = dest + ex + ey * width;
                                        if (blastIdx >= 0 && blastIdx < types.length && types[blastIdx] === EMPTY) {
                                            types[blastIdx] = FIRE;
                                            grid[blastIdx] = 100;
                                        }
                                    }
                                }
                            }
                            if (types[dest] === ICE && Math.random() < 0.05) {
                                types[dest] = WATER; // Melt ice
                            }
                        }
                    }

                    // Move movement
                    const dest = above + (Math.random() < 0.5 ? 0 : (Math.random() < 0.5 ? -1 : 1));
                    if (dest >= 0 && types[dest] === EMPTY) {
                         // To prevent infinite rising in one frame in a bottom-up loop,
                         // we swap but we know the loop goes UP y, so we won't process 'dest' again this frame.
                         types[dest] = FIRE;
                         grid[dest] = grid[idx];
                         types[idx] = EMPTY;
                         grid[idx] = 0;
                    } else if (types[dest] === WATER) {
                        // Turn into Steam
                        types[dest] = STEAM;
                        grid[dest] = 200 + Math.random() * 50; // Steam life
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
                        types[idx] = EMPTY; grid[idx] = 0;
                        moved = true; break;
                    }
                }
            }
            else if (type === SAND || type === WATER || type === ACID || type === GUNPOWDER || type === LAVA || type === OIL || type === VIRUS) {
                // Acid Reaction: Dissolve Stone, Sand, and even Wood if we had it
                if (type === ACID) {
                    let reacted = false;
                    const neighbors = [idx + width, idx - 1, idx + 1, idx - width];
                    for (let nIdx of neighbors) {
                        if (nIdx >= 0 && nIdx < types.length) {
                            const t = types[nIdx];
                            if (t === STONE || t === SAND || t === WOOD || t === PLANT || t === GUNPOWDER || t === C4 || t === FUSE || t === VIRUS) {
                                if (t === STONE) {
                                    grid[nIdx] -= 10; // Damage stone (darkens it)
                                    if (grid[nIdx] < 20) { types[nIdx] = EMPTY; grid[nIdx] = 0; }
                                } else {
                                    types[nIdx] = EMPTY; grid[nIdx] = 0; // Instant dissolve
                                }
                                if (Math.random() < 0.1) { types[idx] = EMPTY; grid[idx] = 0; reacted = true; break; }
                            }
                        }
                    }
                    if (reacted || types[idx] === EMPTY) continue;
                }

                // Virus Infection Logic
                if (type === VIRUS) {
                    const neighbors = [idx - 1, idx + 1, idx - width, idx + width];
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
                    // Check neighbors for interactions
                    const neighborOffsets = [-width, width, -1, 1];
                    for (let offset of neighborOffsets) {
                        const neighborIndex = idx + offset;
                        if (neighborIndex >= 0 && neighborIndex < types.length) {
                            const nType = types[neighborIndex];
                            if (nType === WATER || nType === ICE) {
                                types[idx] = STONE; // Lava cools
                                types[neighborIndex] = (nType === ICE) ? WATER : STEAM; // Water boils or Ice melts
                                grid[neighborIndex] = 200 + Math.random() * 50;
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


                const below = idx + width;
                const belowLeft = below - 1;
                const belowRight = below + 1;
                const left = idx - 1;
                const right = idx + 1;

                // Get particle states below
                // Randomize left/right preference to prevent stacking bias
                const dir = Math.random() < 0.5 ? 1 : -1;
                
                // Check boundaries and types
                const isBelowEmpty = y < height - 1 && types[below] === EMPTY;
                const isBelowWater = y < height - 1 && types[below] === WATER;
                const isBelowOil = y < height - 1 && types[below] === OIL;
                const canGoBelow = isBelowEmpty || ((type === SAND || type === ACID || type === GUNPOWDER) && isBelowWater) ||
                                     ((type === SAND || type === ACID || type === GUNPOWDER || type === WATER || type === VIRUS) && isBelowOil);

                if (canGoBelow) {
                    // Move down or swap sand/water
                    const targetType = types[below];
                    const targetHue = grid[below];
                    
                    types[below] = type;
                    grid[below] = grid[idx];
                    
                    types[idx] = targetType;
                    grid[idx] = targetHue;
                } else {
                    // Diagonal movement (Sand & Water)
                    let moved = false;
                    const checkLeft = x > 0;
                    const checkRight = x < width - 1;
                    
                    // Simple random shuffle for diagonals
                    const candidates = [];
                    if (checkLeft) candidates.push(belowLeft);
                    if (checkRight) candidates.push(belowRight);
                    if (checkLeft && checkRight && Math.random() < 0.5) candidates.reverse();
                    
                    for (let target of candidates) {
                        if (types[target] === EMPTY || 
                            ((type === SAND || type === ACID || type === GUNPOWDER || type === VIRUS) && types[target] === WATER) ||
                            ((type === SAND || type === ACID || type === GUNPOWDER || type === WATER || type === VIRUS) && types[target] === OIL)) {
                            const tType = types[target];
                            const tHue = grid[target];
                            types[target] = type;
                            grid[target] = grid[idx];
                            types[idx] = tType;
                            grid[idx] = tHue;
                            moved = true;
                            break;
                        }
                    }

                    // Horizontal movement (Water only)
                    if (!moved && (type === WATER || type === ACID || type === LAVA || type === OIL)) {
                        const sides = [];
                        if (x > 0) sides.push(left);
                        if (x < width - 1) sides.push(right);
                        if (sides.length > 1 && Math.random() < 0.5) sides.reverse();

                        for (let target of sides) {
                            if (types[target] === EMPTY) {
                                types[target] = type;
                                // Lava viscosity: Only move 10% of the time horizontally
                                if (type === LAVA && Math.random() > 0.1) {
                                    break; 
                                }
                                grid[target] = grid[idx];
                                types[idx] = EMPTY;
                                grid[idx] = 0;
                                break;
                            }
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
        
        for (let i = -extent; i <= extent; i++) {
            for (let j = -extent; j <= extent; j++) {
                if (i*i + j*j > extent*extent) continue; // Circular brush
                if (Math.random() > 0.1) { // Density
                    const c = mouseX + i;
                    const r = mouseY + j;
                    
                    if (c >= 0 && c < width && r >= 0 && r < height) {
                        const idx = c + r * width;
                        // Overwrite unless stone is there (optional rule) or if eraser
                        if ((types[idx] !== STONE && types[idx] !== WALL && types[idx] !== GLASS) || currentTool === EMPTY || currentTool === ACID) {
                            if (currentTool === EMPTY) {
                                types[idx] = EMPTY;
                                grid[idx] = 0;
                            } else if (types[idx] === EMPTY || (currentTool !== SAND && currentTool !== WATER && currentTool !== ACID && currentTool !== OIL)) {
                                types[idx] = currentTool;
                                grid[idx] = getInitialData(currentTool);
                            }
                        }
                    }
                }
            }
        }
        hue = (hue + 1) % 360;
    }
}

function draw() {
    // Render using ImageData for high performance
    const data = imgData.data;
    data.fill(0); // Clear buffer (black)

    for (let i = 0; i < grid.length; i++) {
        let type = types[i];
        if (type === SOURCE && grid[i] !== 0) type = grid[i]; // Render source as its product
        if (type !== EMPTY) {
            const idx = i * 4;
            let r = 0, g = 0, b = 0;
            
            if (type === SAND) {
                // HSL to RGB conversion simplified or approximation
                // For speed in demo, we'll do a simple tint based on hue
                const h = grid[i];
                // Creating a rainbow effect manually for performance
                // Simple cycle colors
                r = Math.max(0, Math.min(255, Math.abs((h % 360) - 180) * 3 - 100));
                g = Math.max(0, Math.min(255, 255 - Math.abs((h % 360) - 120) * 3));
                b = Math.max(0, Math.min(255, 255 - Math.abs((h % 360) - 240) * 3));
            } else if (type === WATER) {
                r = 30; g = 144; b = 255;
            } else if (type === STONE) {
                const shade = grid[i]; // Use stored texture, no shimmering
                r = shade; g = shade; b = shade;
            } else if (type === ACID) {
                r = 50; g = 205; b = 50;
            } else if (type === WOOD) {
                const shade = grid[i]; // varied brown
                r = 139 + shade; g = 69 + shade; b = 19 + shade;
            } else if (type === FIRE) {
                const life = grid[i];
                r = 255;
                g = Math.min(255, life * 2); 
                b = 0;
            } else if (type === GUNPOWDER) {
                const val = 60 + grid[i];
                r = val; g = val; b = val;
            } else if (type === STEAM) {
                const val = grid[i]; // fade out
                r = 230; g = 230; b = 255;
                // Alpha fade based on life could be simulated by darkening
                if (val < 50) { r*=0.5; g*=0.5; b*=0.5; }
            } else if (type === SMOKE) {
                const val = 50 + (grid[i] / 4);
                r = val; g = val; b = val;
            } else if (type === OIL) {
                r = 186; g = 176; b = 32; // Olive gold
            } else if (type === LAVA) {
                r = grid[i]; // stored red value
                g = (r - 200) * 1.5; // derivation for orange/yellow
                b = 0;
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
                 r = 100; g = 200; b = 220; // Simple Blueish Cyan
                 // Add simple "shine" pattern
                 if ((i/width + i%width) % 20 < 2) { r=200; g=255; b=255; }
            } else if (type === SOURCE) {
                // Unconfigured Source
                r = 255; g = 0; b = 255; 
                if (Math.random() < 0.5) { r=255; g=255; b=255; }
            } else if (type === THUNDER) {
                r = 255; g = 255; b = 0;
                if (Math.random() < 0.5) { r = 255; g = 255; b = 255; } // Flicker white
            } else if (type === NUKE) {
                r = 57; g = 255; b = 20; // Neon Green
                if (Math.random() < 0.2) { r=200; b=240; }
            } else if (type === VOID) {
                r = 40; g = 0; b = 60; // Dark purple
                if ((i % 9) === 0 && Math.random() < 0.1) { r=75; b=130; } // Subtle sparkle
            }
            
            data[idx] = r;
            data[idx+1] = g;
            data[idx+2] = b;
            data[idx+3] = 255; // Alpha
        }
    }
    ctx.putImageData(imgData, 0, 0);
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

loop();
