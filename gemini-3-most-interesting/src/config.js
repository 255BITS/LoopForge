export const TILE_SIZE = 32;
export const GRID_W = 45;
export const GRID_H = 30;
export const TICK_RATE = 60; 
export const BUILD_RANGE = 6;

export const PLAYER_SPEED = 0.55; // Snappier movement for better responsiveness
export const PLAYER_DASH_SPEED = 0.65;
export const POLLUTION_DECAY = 0.15; // Lower decay makes pollution persistent (Strategy required)
export const POLLUTION_TRIGGER = 500; 
export const BOOST_DURATION = 300; 
export const MAX_HEAT = 100;
 
// Resources
// Infinite resources for permanent automation building
export const RESOURCE_DENSITY = { min: 50000, max: 100000 };

export const COLORS = {
    bg: '#12121e',
    grid: '#16213e',
    player: '#e94560',
    ore_redium: '#b53737',
    ore_bluestone: '#2d5f9e',
    belt: '#533483',
    miner: '#c11a60',   
    miner_boost: '#ff0055',
    processor: '#ff6f00',
    turret: '#00adb5',
    enemy: '#ff2e63',
    nexus: '#e94560',
    hp_bar_bg: '#000',
    hp_bar_fg: '#0f0',
    item_redium: '#ff6b6b', // Ore
    item_alloy: '#ffeb3b',  // Ingot
    item_bluestone: '#4ecca3',
    item_plate: '#00fff5',
    item_ammo: '#ffeb3b', 
    item_battery: '#d602ee',
    wall: '#455a64',
    splitter: '#ffb74d',
    storage: '#8d6e63',
    jammed: '#d50000',
    explosion: '#ff5722'
};

export const RECIPES = {
    'redium': { out: 'alloy', color: COLORS.item_alloy, desc: 'Smelt Ore', time: 60 },
    'bluestone': { out: 'plate', color: COLORS.item_plate, desc: 'Press Stone', time: 60 },
    'alloy': { out: 'ammo', color: COLORS.item_ammo, desc: 'Assembler', time: 80 },
    'plate': { out: 'battery', color: COLORS.item_battery, desc: 'Refinery', time: 120 }
};

// REBALANCE: Belt reduced to 1 to encourage large builds.
// STRATEGY: Miners cheaper to start logic faster.
// UPDATE: Costs tweaked. Turrets expensive to force logistic prioritization.
export const COSTS = {
    belt: 1, miner: 20, processor: 40, turret: 75, wall: 5, splitter: 15, storage: 10
};

export const LEVEL_REQS = {
    belt: 1, miner: 1, wall: 1, processor: 2, splitter: 2, storage: 2, turret: 2 
};

export const DESCRIPTIONS = {
    belt: "Transport. Drag to paint paths. Rotates auto.", miner: "Extractor. Needs Ore. Outputs to Front.", processor: "Smelter/Assembler. In: Back/Sides. Out: Front.", turret: "Defensive. Input ANY item for ammo.", wall: "High HP barrier. Blocks enemies.", splitter: "Distributes items. 1 Input -> 3 Outputs.", storage: "Buffers items. Auto-outputs the Front."
};

export const COORDS = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }];
