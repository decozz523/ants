// Tree.js - класс дерева (препятствие)
class Tree {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = CONFIG.TREE_SIZE;
        this.color = CONFIG.COLORS.TREE;
    }

    draw(ctx, camera) {
        const screenPos = camera.worldToScreen(this.x, this.y);
        const r = (this.size * camera.scale) / 2;

        ctx.fillStyle = '#4f2f16';
        ctx.fillRect(screenPos.x - r * 0.2, screenPos.y - r * 0.2, r * 0.4, r * 1.6);

        const canopy = ctx.createRadialGradient(screenPos.x, screenPos.y - r * 0.5, r * 0.2, screenPos.x, screenPos.y - r * 0.5, r * 1.6);
        canopy.addColorStop(0, '#6ecf6e');
        canopy.addColorStop(1, '#2f7e3b');

        ctx.fillStyle = canopy;
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y - r * 0.45, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.beginPath();
        ctx.arc(screenPos.x - r * 0.3, screenPos.y - r * 0.7, r * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }
}
