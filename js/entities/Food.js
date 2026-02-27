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
        const r = (this.size * camera.scale) / 2;

        const glow = ctx.createRadialGradient(screenPos.x, screenPos.y, r * 0.2, screenPos.x, screenPos.y, r * 1.8);
        glow.addColorStop(0, 'rgba(182, 255, 173, 0.95)');
        glow.addColorStop(1, 'rgba(52, 161, 64, 0.25)');

        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, r * 1.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#7ff58f';
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255,255,255,0.65)';
        ctx.beginPath();
        ctx.arc(screenPos.x - r * 0.25, screenPos.y - r * 0.25, r * 0.25, 0, Math.PI * 2);
        ctx.fill();
    }
}
