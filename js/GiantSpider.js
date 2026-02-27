// GiantSpider.js - огромный паук

class GiantSpider {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 30;
        this.speed = 1.2;
        this.visionRange = 300;
        this.attackRange = 40;
        this.attackCooldown = 0;
        this.health = 100;
        this.maxHealth = 100;
        this.color = '#8B0000';

        this.state = 'patrol';
        this.target = null;
        this.webTraps = [];

        this.vx = (Math.random() - 0.5) * this.speed;
        this.vy = (Math.random() - 0.5) * this.speed;
        this.behaviorTimer = 0;
    }

    update(ants) {
        this.behaviorTimer++;
        if (this.attackCooldown > 0) this.attackCooldown--;

        let nearestAnt = null;
        let minDist = Infinity;

        ants.forEach(ant => {
            if (ant.dead || ant.insideAnthill) return;
            const dist = Math.hypot(ant.x - this.x, ant.y - this.y);
            if (dist < minDist) {
                minDist = dist;
                nearestAnt = ant;
            }
        });

        if (nearestAnt && minDist < this.visionRange) {
            this.target = nearestAnt;
            this.state = minDist < this.attackRange && this.attackCooldown === 0 ? 'attack' : 'chase';
        } else {
            this.state = 'patrol';
            this.target = null;
        }

        if (this.state === 'chase') this.chase(this.target);
        if (this.state === 'attack') this.attack(this.target);
        if (this.state === 'patrol') this.patrol();

        this.x += this.vx;
        this.y += this.vy;

        this.x = Math.max(this.size, Math.min(CONFIG.WORLD_WIDTH - this.size, this.x));
        this.y = Math.max(this.size, Math.min(CONFIG.WORLD_HEIGHT - this.size, this.y));

        if (this.state === 'patrol' && Math.random() < 0.01) this.placeWeb();
    }

    chase(ant) {
        const dx = ant.x - this.x;
        const dy = ant.y - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0) {
            this.vx = (dx / dist) * this.speed * 1.45;
            this.vy = (dy / dist) * this.speed * 1.45;
        }
    }

    attack(ant) {
        if (ant && !ant.dead) {
            ant.takeDamage(30);
            this.attackCooldown = 50;

            const dx = ant.x - this.x;
            const dy = ant.y - this.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 0) {
                ant.vx = (dx / dist) * 5;
                ant.vy = (dy / dist) * 5;
            }
        }
        this.state = 'chase';
    }

    patrol() {
        if (this.behaviorTimer % 100 === 0) {
            this.vx = (Math.random() - 0.5) * this.speed;
            this.vy = (Math.random() - 0.5) * this.speed;
        }
    }

    placeWeb() {
        this.webTraps.push({
            x: this.x,
            y: this.y,
            active: true,
            timer: 500
        });
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
    }

    draw(ctx, camera) {
        const screenPos = camera.worldToScreen(this.x, this.y);
        const scale = camera.scale;
        const bodyRadius = (this.size / 2) * scale;

        this.webTraps = this.webTraps.filter(web => {
            web.timer--;
            return web.timer > 0;
        });

        this.webTraps.forEach(web => {
            const ws = camera.worldToScreen(web.x, web.y);
            const webRadius = 10 * scale;

            ctx.strokeStyle = 'rgba(214, 226, 255, 0.45)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(ws.x, ws.y, webRadius, 0, Math.PI * 2);
            ctx.moveTo(ws.x - webRadius, ws.y);
            ctx.lineTo(ws.x + webRadius, ws.y);
            ctx.moveTo(ws.x, ws.y - webRadius);
            ctx.lineTo(ws.x, ws.y + webRadius);
            ctx.stroke();
        });

        ctx.save();
        ctx.translate(screenPos.x, screenPos.y);

        ctx.strokeStyle = '#5a0b0b';
        ctx.lineWidth = Math.max(1.2, 2 * scale);
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const legLen = bodyRadius * 1.6;
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * bodyRadius * 0.4, Math.sin(angle) * bodyRadius * 0.4);
            ctx.lineTo(Math.cos(angle) * legLen, Math.sin(angle) * legLen);
            ctx.stroke();
        }

        const gradient = ctx.createRadialGradient(-bodyRadius * 0.3, -bodyRadius * 0.3, bodyRadius * 0.2, 0, 0, bodyRadius * 1.2);
        gradient.addColorStop(0, '#d65555');
        gradient.addColorStop(1, '#630a0a');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, bodyRadius * 1.05, bodyRadius * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-bodyRadius * 0.35, -bodyRadius * 0.1, Math.max(1.5, bodyRadius * 0.18), 0, Math.PI * 2);
        ctx.arc(bodyRadius * 0.35, -bodyRadius * 0.1, Math.max(1.5, bodyRadius * 0.18), 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-bodyRadius * 0.35, -bodyRadius * 0.1, Math.max(1, bodyRadius * 0.08), 0, Math.PI * 2);
        ctx.arc(bodyRadius * 0.35, -bodyRadius * 0.1, Math.max(1, bodyRadius * 0.08), 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        ctx.fillStyle = '#712020';
        ctx.fillRect(screenPos.x - 18 * scale, screenPos.y - 26 * scale, 36 * scale, 4 * scale);
        ctx.fillStyle = '#71de78';
        ctx.fillRect(screenPos.x - 18 * scale, screenPos.y - 26 * scale, 36 * scale * (this.health / this.maxHealth), 4 * scale);
    }
}
