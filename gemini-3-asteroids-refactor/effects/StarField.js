export class StarField {
    constructor(count = 30) {
        this.stars = Array.from({length: count}, () => ({
            x: Math.random() * window.innerWidth, 
            y: Math.random() * window.innerHeight, 
            s: Math.random() * 2 + 0.5
        }));
    }

    update(player, width, height) {
        this.stars.forEach(s => {
            s.x -= player.vx * (s.s * 0.1);
            s.y -= player.vy * (s.s * 0.1);
            if (s.x < 0) s.x += width;
            else if (s.x > width) s.x -= width;
            if (s.y < 0) s.y += height;
            else if (s.y > height) s.y -= height;
        });
    }

    draw(ctx) {
        ctx.fillStyle = '#fff';
        this.stars.forEach(s => {
            ctx.globalAlpha = 0.2 + Math.random() * 0.5;
            ctx.fillRect(s.x, s.y, s.s, s.s);
        });
        ctx.globalAlpha = 1;
    }
}
