import { Structure } from './structure.js';

export class Wall extends Structure {
    constructor(x, y) {
        super('wall', x, y, 0);
        this.hp = 400; this.maxHp = 400;
    }
}
