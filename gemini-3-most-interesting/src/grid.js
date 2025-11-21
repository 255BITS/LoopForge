class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.resource = null;
        this.amount = 0;
        this.maxAmount = 0;
        this.structure = null;
        this.item = null; // { type, progress }
    }
}

export class Grid {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.cells = new Array(width * height).fill(null).map((_, i) => new Cell(i % width, Math.floor(i / width)));
    }
    get(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
        return this.cells[y * this.width + x];
    }
}
