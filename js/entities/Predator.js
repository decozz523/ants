// Predator.js - класс хищника
class Predator {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = CONFIG.PREDATOR_SIZE;
        this.speed = CONFIG.PREDATOR_SPEED;
        this.color = CONFIG.COLORS.PREDATOR;

        this.vx = (Math.random() - 0.5) * this.speed;
        this.vy = (Math.random() - 0.5) * this.speed;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > CONFIG.WORLD_WIDTH) this.vx *= -1;
        if (this.y < 0 || this.y > CONFIG.WORLD_HEIGHT) this.vy *= -1;

        if (Math.random() < 0.02) {
            this.vx = (Math.random() - 0.5) * this.speed;
            this.vy = (Math.random() - 0.5) * this.speed;
        }
    }

    draw(ctx, camera) {
        const screenPos = camera.worldToScreen(this.x, this.y);
        const r = (this.size * camera.scale) / 2;

        const bodyGradient = ctx.createRadialGradient(screenPos.x - r * 0.2, screenPos.y - r * 0.2, r * 0.3, screenPos.x, screenPos.y, r * 1.2);
        bodyGradient.addColorStop(0, '#ff8a80');
        bodyGradient.addColorStop(1, '#a61f1f');

        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#2b0d0d';
        ctx.beginPath();
        ctx.arc(screenPos.x - r * 0.3, screenPos.y - r * 0.15, Math.max(1, r * 0.2), 0, Math.PI * 2);
        ctx.arc(screenPos.x + r * 0.3, screenPos.y - r * 0.15, Math.max(1, r * 0.2), 0, Math.PI * 2);
        ctx.fill();
    }
}
