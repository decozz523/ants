// Food.js - класс еды
class Food {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = CONFIG.FOOD_SIZE;
        this.energy = CONFIG.FOOD_ENERGY;
        this.color = CONFIG.COLORS.FOOD;
        this.eaten = false;
    }
    
    draw(ctx, camera) {
        if (this.eaten) return;
        
        const screenPos = camera.worldToScreen(this.x, this.y);
        
        ctx.fillStyle = this.color;
        ctx.fillRect(
            screenPos.x - this.size/2,
            screenPos.y - this.size/2,
            this.size,
            this.size
        );
        
        // Блик
        ctx.fillStyle = '#aaffaa';
        ctx.fillRect(
            screenPos.x - this.size/4,
            screenPos.y - this.size/4,
            this.size/6,
            this.size/6
        );
    }
}