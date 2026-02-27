// Predator.js - класс хищника
class Predator {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = CONFIG.PREDATOR_SIZE;
        this.speed = CONFIG.PREDATOR_SPEED;
        this.color = CONFIG.COLORS.PREDATOR;
        
        // Случайное направление
        this.vx = (Math.random() - 0.5) * this.speed;
        this.vy = (Math.random() - 0.5) * this.speed;
    }
    
    update() {
        // Простое движение - случайное блуждание
        this.x += this.vx;
        this.y += this.vy;
        
        // Меняем направление при столкновении с границами
        if (this.x < 0 || this.x > CONFIG.WORLD_WIDTH) {
            this.vx *= -1;
        }
        if (this.y < 0 || this.y > CONFIG.WORLD_HEIGHT) {
            this.vy *= -1;
        }
        
        // Иногда меняем направление случайно
        if (Math.random() < 0.02) {
            this.vx = (Math.random() - 0.5) * this.speed;
            this.vy = (Math.random() - 0.5) * this.speed;
        }
    }
    
    draw(ctx, camera) {
        const screenPos = camera.worldToScreen(this.x, this.y);
        
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, this.size/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Глаза
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(screenPos.x - 3, screenPos.y - 2, 2, 0, Math.PI * 2);
        ctx.arc(screenPos.x + 3, screenPos.y - 2, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}