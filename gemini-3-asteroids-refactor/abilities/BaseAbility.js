export class BaseAbility {
    constructor(player) {
        this.player = player;
        this.level = 0;
    }
    upgrade() { this.level++; }
    update(dt, context) {}
    draw(ctx) {}
}
