// WeatherSystem.js - экосистемные состояния среды

class WeatherSystem {
    constructor() {
        this.states = ['clear', 'rain', 'heatwave', 'fog'];
        this.current = 'clear';
        this.timer = 0;
        this.duration = 500;
    }

    randomNext() {
        return this.states[Math.floor(Math.random() * this.states.length)];
    }

    update() {
        this.timer++;
        if (this.timer >= this.duration) {
            this.timer = 0;
            this.current = this.randomNext();
            this.duration = 400 + Math.floor(Math.random() * 500);
        }
    }

    getEffects() {
        switch (this.current) {
            case 'rain':
                return { antSpeedMultiplier: 0.9, foodSpawnBonus: 1.25, predatorSpeedMultiplier: 0.95 };
            case 'heatwave':
                return { antSpeedMultiplier: 1.08, foodSpawnBonus: 0.75, predatorSpeedMultiplier: 1.1 };
            case 'fog':
                return { antSpeedMultiplier: 0.96, foodSpawnBonus: 1.0, predatorSpeedMultiplier: 0.9, visionPenalty: 0.85 };
            default:
                return { antSpeedMultiplier: 1, foodSpawnBonus: 1, predatorSpeedMultiplier: 1, visionPenalty: 1 };
        }
    }

    drawOverlay(ctx, canvas) {
        if (this.current === 'clear') return;

        if (this.current === 'rain') {
            ctx.fillStyle = 'rgba(120, 170, 255, 0.08)';
        } else if (this.current === 'heatwave') {
            ctx.fillStyle = 'rgba(255, 160, 0, 0.07)';
        } else {
            ctx.fillStyle = 'rgba(200, 200, 200, 0.09)';
        }

        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}
