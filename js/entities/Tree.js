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
        
        ctx.fillStyle = this.color;
        ctx.fillRect(
            screenPos.x - this.size/2,
            screenPos.y - this.size/2,
            this.size,
            this.size
        );
        
        // Добавим немного текстуры
        ctx.fillStyle = '#5a3e1a';
        ctx.fillRect(
            screenPos.x - this.size/3,
            screenPos.y - this.size/3,
            this.size/1.5,
            this.size/1.5
        );
    }
}