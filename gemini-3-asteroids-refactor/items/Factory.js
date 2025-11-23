import { Experience } from './types/Experience.js';
import { Health } from './types/Health.js';
import { Magnet } from './types/Magnet.js';
import { Nuke } from './types/Nuke.js';
import { Freeze } from './types/Freeze.js';

export function createItem(x, y, value, type = 'xp') {
    switch(type) {
        case 'heal': return new Health(x, y);
        case 'magnet': return new Magnet(x, y);
        case 'nuke': return new Nuke(x, y);
        case 'freeze': return new Freeze(x, y);
        default: return new Experience(x, y, value);
    }
}
