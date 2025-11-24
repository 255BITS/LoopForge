import { Nova } from './types/Nova.js';
import { Railgun } from './types/Railgun.js';
import { Tesla } from './types/Tesla.js';
import { Regen } from './types/Regen.js';
import { Orbitals } from './types/Orbitals.js';
import { Buzzsaw } from './types/Buzzsaw.js';
import { GravityWell } from './types/GravityWell.js';
import { Inferno } from './types/Inferno.js';
import { Boomerang } from './types/Boomerang.js';
import { Mines } from './types/Mines.js';
import { OrbitalLaser } from './types/OrbitalLaser.js';
import { Hive } from './types/Hive.js';
import { Reflector } from './types/Reflector.js';
import { Adrenaline } from './types/Adrenaline.js';
import { Clone } from './types/Clone.js';
import { Repulsor } from './types/Repulsor.js';
import { IonStorm } from './types/IonStorm.js';
import { SporeCloud } from './types/SporeCloud.js';
import { DeathRay } from './types/DeathRay.js';
import { SeekerSwarm } from './types/SeekerSwarm.js';
import { ChronoBreaker } from './types/ChronoBreaker.js';

const types = {
    nova: Nova,
    railgun: Railgun,
    tesla: Tesla,
    regen: Regen,
    orbitals: Orbitals,
    saws: Buzzsaw,
    gravity: GravityWell,
    inferno: Inferno,
    boomerang: Boomerang,
    mines: Mines,
    orbital_strike: OrbitalLaser,
    hive: Hive,
    reflector: Reflector,
    adrenaline: Adrenaline,
    clone: Clone,
    repulsor: Repulsor,
    ion: IonStorm,
    spores: SporeCloud,
    deathray: DeathRay,
    swarm: SeekerSwarm,
    chrono: ChronoBreaker
};

export function createAbility(type, player) {
    return new (types[type] || Nova)(player);
}
