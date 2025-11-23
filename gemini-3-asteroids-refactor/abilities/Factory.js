import { Nova } from './types/Nova.js';
import { Railgun } from './types/Railgun.js';
import { Tesla } from './types/Tesla.js';
import { Regen } from './types/Regen.js';
import { Orbitals } from './types/Orbitals.js';
import { Buzzsaw } from './types/Buzzsaw.js';

const types = {
    nova: Nova,
    railgun: Railgun,
    tesla: Tesla,
    regen: Regen,
    orbitals: Orbitals,
    saws: Buzzsaw
};

export function createAbility(type, player) {
    return new (types[type] || Nova)(player);
}
