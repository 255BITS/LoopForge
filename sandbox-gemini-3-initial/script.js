const canvas = document.getElementById('sandCanvas');
const ctx = canvas.getContext('2d');

// Configuration
const size = 600; // Canvas dimension
const pixelSize = 4; // Size of one 'grain' of sand
const width = size / pixelSize;
const height = size / pixelSize;

canvas.width = size;
canvas.height = size;
ctx.imageSmoothingEnabled = false;

// State
let grid = new Array(width * height).fill(0);
let isMouseDown = false;
let mouseX = 0;
let mouseY = 0;
let hue = 0;

// Inputs
canvas.addEventListener('mousedown', () => isMouseDown = true);
canvas.addEventListener('mouseup', () => isMouseDown = false);
canvas.addEventListener('mouseout', () => isMouseDown = false);
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = Math.floor((e.clientX - rect.left) / pixelSize);
    mouseY = Math.floor((e.clientY - rect.top) / pixelSize);
});

function resetGrid() {
    grid.fill(0);
}

function updatePhysics() {
    // Iterate from bottom to top to avoid double-moving particles in one frame
    for (let y = height - 2; y >= 0; y--) {
        for (let x = 0; x < width; x++) {
            const idx = x + y * width;
            const state = grid[idx];

            if (state > 0) {
                const below = idx + width;
                const belowLeft = below - 1;
                const belowRight = below + 1;

                const emptyBelow = grid[below] === 0;
                // Randomize left/right preference to prevent stacking bias
                const dir = Math.random() < 0.5 ? 1 : -1;
                const emptyLeft = x > 0 && grid[belowLeft] === 0;
                const emptyRight = x < width - 1 && grid[belowRight] === 0;

                if (emptyBelow) {
                    grid[below] = state;
                    grid[idx] = 0;
                } else if (emptyLeft && emptyRight) {
                    if (dir === 1) {
                        grid[belowRight] = state;
                    } else {
                        grid[belowLeft] = state;
                    }
                    grid[idx] = 0;
                } else if (emptyLeft) {
                    grid[belowLeft] = state;
                    grid[idx] = 0;
                } else if (emptyRight) {
                    grid[belowRight] = state;
                    grid[idx] = 0;
                }
            }
        }
    }
}

function spawnSand() {
    if (isMouseDown) {
        const matrix = 3; // Brush size
        const extent = Math.floor(matrix / 2);
        
        for (let i = -extent; i <= extent; i++) {
            for (let j = -extent; j <= extent; j++) {
                if (Math.random() > 0.3) { // Sprinkle effect
                    const c = mouseX + i;
                    const r = mouseY + j;
                    
                    if (c >= 0 && c < width && r >= 0 && r < height) {
                        const idx = c + r * width;
                        if (grid[idx] === 0) {
                            grid[idx] = hue;
                        }
                    }
                }
            }
        }
        hue = (hue + 1) % 360;
    }
}

function draw() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < grid.length; i++) {
        if (grid[i] > 0) {
            const x = (i % width) * pixelSize;
            const y = Math.floor(i / width) * pixelSize;
            ctx.fillStyle = `hsl(${grid[i]}, 100%, 50%)`;
            ctx.fillRect(x, y, pixelSize, pixelSize);
        }
    }
}

function loop() {
    spawnSand();
    updatePhysics();
    draw();
    requestAnimationFrame(loop);
}

loop();
