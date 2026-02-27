// PheromoneField.js - пространственная карта феромонов

class PheromoneField {
    constructor(worldWidth, worldHeight, cellSize = 40) {
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        this.cellSize = cellSize;
        this.cols = Math.ceil(worldWidth / cellSize);
        this.rows = Math.ceil(worldHeight / cellSize);

        this.foodTrail = new Float32Array(this.cols * this.rows);
        this.dangerTrail = new Float32Array(this.cols * this.rows);
    }

    index(col, row) {
        return row * this.cols + col;
    }

    worldToCell(x, y) {
        const col = Math.max(0, Math.min(this.cols - 1, Math.floor(x / this.cellSize)));
        const row = Math.max(0, Math.min(this.rows - 1, Math.floor(y / this.cellSize)));
        return { col, row };
    }

    deposit(type, x, y, amount = 1) {
        const { col, row } = this.worldToCell(x, y);
        const idx = this.index(col, row);

        if (type === 'food') {
            this.foodTrail[idx] = Math.min(100, this.foodTrail[idx] + amount);
        } else {
            this.dangerTrail[idx] = Math.min(100, this.dangerTrail[idx] + amount);
        }
    }

    sample(type, x, y) {
        const { col, row } = this.worldToCell(x, y);
        const idx = this.index(col, row);
        return type === 'food' ? this.foodTrail[idx] : this.dangerTrail[idx];
    }

    update(decayRate = 0.992) {
        for (let i = 0; i < this.foodTrail.length; i++) {
            this.foodTrail[i] *= decayRate;
            this.dangerTrail[i] *= decayRate;

            if (this.foodTrail[i] < 0.01) this.foodTrail[i] = 0;
            if (this.dangerTrail[i] < 0.01) this.dangerTrail[i] = 0;
        }
    }

    draw(ctx, camera, mode = 'food') {
        const source = mode === 'danger' ? this.dangerTrail : this.foodTrail;
        const color = mode === 'danger' ? '255, 82, 82' : '129, 199, 132';

        const left = camera.x - camera.canvasWidth / (2 * camera.scale);
        const right = camera.x + camera.canvasWidth / (2 * camera.scale);
        const top = camera.y - camera.canvasHeight / (2 * camera.scale);
        const bottom = camera.y + camera.canvasHeight / (2 * camera.scale);

        const startCol = Math.max(0, Math.floor(left / this.cellSize));
        const endCol = Math.min(this.cols - 1, Math.ceil(right / this.cellSize));
        const startRow = Math.max(0, Math.floor(top / this.cellSize));
        const endRow = Math.min(this.rows - 1, Math.ceil(bottom / this.cellSize));

        for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
                const idx = this.index(col, row);
                const value = source[idx];
                if (value < 5) continue;

                const alpha = Math.min(0.2, value / 200);
                const worldX = col * this.cellSize;
                const worldY = row * this.cellSize;
                const screen = camera.worldToScreen(worldX, worldY);

                ctx.fillStyle = `rgba(${color}, ${alpha})`;
                ctx.fillRect(
                    screen.x,
                    screen.y,
                    this.cellSize * camera.scale,
                    this.cellSize * camera.scale
                );
            }
        }
    }
}
