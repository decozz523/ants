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
        
        this.state = 'patrol'; // patrol, chase, attack
        this.target = null;
        this.webTraps = [];
        
        // Случайное направление
        this.vx = (Math.random() - 0.5) * this.speed;
        this.vy = (Math.random() - 0.5) * this.speed;
        
        // Таймер для смены поведения
        this.behaviorTimer = 0;
    }
    
    update(ants, world) {
        this.behaviorTimer++;
        
        // Обновляем кулдаун атаки
        if (this.attackCooldown > 0) {
            this.attackCooldown--;
        }
        
        // Ищем ближайшего муравья
        let nearestAnt = null;
        let minDist = Infinity;
        
        ants.forEach(ant => {
            if (!ant.dead) {
                const dist = Math.sqrt((ant.x - this.x)**2 + (ant.y - this.y)**2);
                if (dist < minDist) {
                    minDist = dist;
                    nearestAnt = ant;
                }
            }
        });
        
        // Принимаем решение на основе расстояния до муравья
        if (nearestAnt && minDist < this.visionRange) {
            if (minDist < this.attackRange && this.attackCooldown === 0) {
                this.state = 'attack';
                this.target = nearestAnt;
            } else {
                this.state = 'chase';
                this.target = nearestAnt;
            }
        } else {
            this.state = 'patrol';
            this.target = null;
        }
        
        // Действуем согласно состоянию
        switch(this.state) {
            case 'chase':
                this.chase(this.target);
                break;
            case 'attack':
                this.attack(this.target);
                break;
            case 'patrol':
                this.patrol();
                break;
        }
        
        // Двигаемся
        this.x += this.vx;
        this.y += this.vy;
        
        // Не выходим за границы
        this.x = Math.max(this.size, Math.min(CONFIG.WORLD_WIDTH - this.size, this.x));
        this.y = Math.max(this.size, Math.min(CONFIG.WORLD_HEIGHT - this.size, this.y));
        
        // Иногда ставим паутину
        if (this.state === 'patrol' && Math.random() < 0.01) {
            this.placeWeb();
        }
    }
    
    chase(ant) {
        const dx = ant.x - this.x;
        const dy = ant.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist > 0) {
            this.vx = (dx / dist) * this.speed * 1.5; // Быстрее при погоне
            this.vy = (dy / dist) * this.speed * 1.5;
        }
    }
    
    attack(ant) {
        if (ant && !ant.dead) {
            // Кусаем муравья
            ant.takeDamage(30);
            this.attackCooldown = 50; // Пауза между атаками
            
            // Отбрасываем муравья
            const dx = ant.x - this.x;
            const dy = ant.y - this.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist > 0) {
                ant.vx = (dx / dist) * 5;
                ant.vy = (dy / dist) * 5;
            }
        }
        this.state = 'chase';
    }
    
    patrol() {
        // Медленно меняем направление
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
            timer: 500 // Исчезнет через 500 шагов
        });
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health < 0) this.health = 0;
    }
    
    draw(ctx, camera) {
        const screenPos = camera.worldToScreen(this.x, this.y);
        const scale = camera.scale;
        
        // Рисуем паутины
        this.webTraps = this.webTraps.filter(web => {
            web.timer--;
            return web.timer > 0;
        });
        
        this.webTraps.forEach(web => {
            const webScreen = camera.worldToScreen(web.x, web.y);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            
            // Рисуем паутину (крест)
            ctx.beginPath();
            ctx.moveTo(webScreen.x - 10, webScreen.y);
            ctx.lineTo(webScreen.x + 10, webScreen.y);
            ctx.moveTo(webScreen.x, webScreen.y - 10);
            ctx.lineTo(webScreen.x, webScreen.y + 10);
            ctx.stroke();
            
            // Круг
            ctx.beginPath();
            ctx.arc(webScreen.x, webScreen.y, 10, 0, Math.PI * 2);
            ctx.stroke();
        });
        
        // Рисуем паука
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, this.size/2 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Глаза
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(screenPos.x - 5, screenPos.y - 3, 3, 0, Math.PI * 2);
        ctx.arc(screenPos.x + 5, screenPos.y - 3, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(screenPos.x - 5, screenPos.y - 3, 1.5, 0, Math.PI * 2);
        ctx.arc(screenPos.x + 5, screenPos.y - 3, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Ноги
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(screenPos.x, screenPos.y);
            ctx.lineTo(
                screenPos.x + Math.cos(angle) * 20,
                screenPos.y + Math.sin(angle) * 20
            );
            ctx.stroke();
        }
        
        // Полоска здоровья
        ctx.fillStyle = 'red';
        ctx.fillRect(screenPos.x - 15, screenPos.y - 25, 30, 4);
        ctx.fillStyle = 'green';
        ctx.fillRect(screenPos.x - 15, screenPos.y - 25, 30 * (this.health/this.maxHealth), 4);
    }
}