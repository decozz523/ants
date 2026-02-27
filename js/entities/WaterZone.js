// WaterZone.js - водная зона, осложняющая передвижение

class WaterZone {
    constructor(x, y, radius = 80) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.size = radius * 2;
    }

    contains(px, py) {
        return Math.hypot(px - this.x, py - this.y) <= this.radius;
    }

    draw(ctx, camera) {
        const pos = camera.worldToScreen(this.x, this.y);

        const gradient = ctx.createRadialGradient(
            pos.x,
            pos.y,
            this.radius * camera.scale * 0.2,
            pos.x,
            pos.y,
            this.radius * camera.scale
        );
        gradient.addColorStop(0, 'rgba(33, 150, 243, 0.55)');
        gradient.addColorStop(1, 'rgba(3, 89, 145, 0.3)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, this.radius * camera.scale, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(173, 216, 230, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
}
