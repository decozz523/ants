// Ant.js - класс муравья с ДНК и поведением

class Ant {
    constructor(x, y, dna = null, anthill = null) {
        this.x = x;
        this.y = y;

        this.dna = dna || Genetics.createRandomDNA();

        this.vx = 0;
        this.vy = 0;
        this.targetVx = 0;
        this.targetVy = 0;
        this.angle = Math.random() * Math.PI * 2;
        this.heading = this.angle;

        this.dead = false;
        this.health = 100;
        this.maxHealth = 100;

        this.anthill = anthill;
        this.carryingFood = false;
        this.communicationRange = 100;
        this.lastCommunication = 0;
        this.fearTimer = 0;
        this.world = null;

        this.insideAnthill = false;
        this.indoorX = 0;
        this.indoorY = 0;
        this.indoorTargetX = 0;
        this.indoorTargetY = 0;
        this.indoorTimer = 0;

        this.memory = {
            foodPositions: [],
            dangerPositions: [],
            lastFoodTime: 0,
            homePosition: { x, y }
        };

        this.fitness = 0;
        this.foodEaten = 0;
        this.deathEncounters = 0;
        this.distanceTraveled = 0;
        this.stepsSinceLastFood = 0;
        this.age = 0;

        this.size = CONFIG.ANT_SIZE;
        this.selected = false;
        this.color = CONFIG.COLORS.ANT;
    }

    update(food, predators, trees, allAnts, stepCount, anthill = null, env = {}) {
        if (this.dead) return;

        this.anthill = anthill || this.anthill;
        this.world = { trees, waterZones: env.waterZones || [] };

        if (this.insideAnthill) {
            this.updateIndoorMovement();
            this.age++;
            if (this.indoorTimer > 0) this.indoorTimer--;
            if (this.indoorTimer <= 0 && this.anthill) this.exitAnthill();
            return;
        }

        const oldX = this.x;
        const oldY = this.y;

        const visionPenalty = env.weatherEffects?.visionPenalty || 1;
        const perception = this.perceive(food, predators, trees, allAnts, visionPenalty);

        if (this.age - this.lastCommunication > 60) {
            const nearbyAnts = allAnts.filter(ant =>
                ant !== this &&
                !ant.dead &&
                !ant.insideAnthill &&
                Math.hypot(ant.x - this.x, ant.y - this.y) < this.communicationRange
            );

            if (nearbyAnts.length > 0) this.communicate(nearbyAnts, perception);
        }

        this.decide(perception, env.pheromones);
        this.move(env.weatherEffects);
        this.interact(food, predators);

        if (this.anthill && this.carryingFood) {
            const distToAnthill = Math.hypot(this.anthill.x - this.x, this.anthill.y - this.y);
            if (distToAnthill < this.anthill.size) {
                this.enterAnthill();
                this.anthill.addFood(1);
                this.carryingFood = false;
                this.foodEaten++;
                this.stepsSinceLastFood = 0;
            }
        }

        const distMoved = Math.hypot(this.x - oldX, this.y - oldY);
        this.distanceTraveled += distMoved;
        this.stepsSinceLastFood++;
        this.age++;

        if (env.pheromones) {
            if (this.carryingFood) env.pheromones.deposit('food', this.x, this.y, CONFIG.ANT_PHEROMONE_DEPOSIT);
            if (perception.nearestPredator) env.pheromones.deposit('danger', this.x, this.y, 1.6);
        }

        if (this.fearTimer > 0) this.fearTimer--;
        this.updateMemory(perception, stepCount);
    }

    updateIndoorMovement() {
        const dx = this.indoorTargetX - this.indoorX;
        const dy = this.indoorTargetY - this.indoorY;
        const dist = Math.hypot(dx, dy);

        if (dist < 2) {
            this.pickNewIndoorTarget();
            return;
        }

        const indoorSpeed = 1.2;
        this.indoorX += (dx / dist) * indoorSpeed;
        this.indoorY += (dy / dist) * indoorSpeed;
    }

    pickNewIndoorTarget() {
        if (!this.anthill || this.anthill.rooms.length === 0) return;

        const room = this.anthill.rooms[Math.floor(Math.random() * this.anthill.rooms.length)];
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * room.radius;
        this.indoorTargetX = room.x + Math.cos(angle) * radius;
        this.indoorTargetY = room.y + Math.sin(angle) * radius;
    }

    enterAnthill() {
        if (!this.anthill) return;

        this.insideAnthill = true;
        this.indoorTimer = 120 + Math.floor(Math.random() * 120);
        this.indoorX = this.anthill.x;
        this.indoorY = this.anthill.y;
        this.pickNewIndoorTarget();
    }

    exitAnthill() {
        if (!this.anthill) return;

        this.insideAnthill = false;
        const angle = Math.random() * Math.PI * 2;
        const dist = this.anthill.size + 12;
        this.x = this.anthill.x + Math.cos(angle) * dist;
        this.y = this.anthill.y + Math.sin(angle) * dist;
    }

    perceive(food, predators, trees, allAnts, visionPenalty = 1) {
        const perception = {
            nearestFood: null,
            nearestPredator: null,
            nearestTree: null,
            foodInVision: [],
            predatorsInVision: [],
            foodDistance: Infinity,
            predatorDistance: Infinity
        };

        const visionRadius = this.dna.visionRadius * visionPenalty;
        let minFoodDist = visionRadius;
        let minPredDist = visionRadius;

        food.forEach(f => {
            if (f.eaten) return;

            const dist = Math.hypot(f.x - this.x, f.y - this.y);
            if (dist < visionRadius) {
                perception.foodInVision.push({ ...f, dist });
                if (dist < minFoodDist) {
                    minFoodDist = dist;
                    perception.nearestFood = f;
                    perception.foodDistance = dist;
                }
            }
        });

        predators.forEach(p => {
            const dist = Math.hypot(p.x - this.x, p.y - this.y);
            if (dist < visionRadius) {
                perception.predatorsInVision.push({ ...p, dist });
                if (dist < minPredDist) {
                    minPredDist = dist;
                    perception.nearestPredator = p;
                    perception.predatorDistance = dist;
                }
            }
        });

        trees.forEach(t => {
            const dist = Math.hypot(t.x - this.x, t.y - this.y);
            if (dist < this.size + t.size) perception.nearestTree = t;
        });

        return perception;
    }

    decide(perception, pheromones = null) {
        if (perception.nearestPredator) {
            const dangerLevel = 1 - (perception.predatorDistance / this.dna.visionRadius);
            const cautionBoost = this.fearTimer > 0 ? 1.3 : 1;
            if (dangerLevel * this.dna.cautiousness * cautionBoost > 0.3) {
                this.flee(perception.nearestPredator);
                return;
            }
        }

        if (this.carryingFood && this.anthill) {
            this.seek(this.anthill);
            return;
        }

        if (perception.nearestFood) {
            this.seek(perception.nearestFood);
            return;
        }

        if (this.memory.foodPositions.length > 0 && Math.random() < 0.35) {
            this.seek(this.memory.foodPositions[0]);
            return;
        }

        if (!perception.nearestFood && pheromones && !this.carryingFood) {
            const foodSignal = pheromones.sample('food', this.x, this.y);
            const dangerSignal = pheromones.sample('danger', this.x, this.y);
            if (foodSignal > 8 && dangerSignal < 25) {
                this.angle += (Math.random() - 0.5) * 0.2;
                this.targetVx += Math.cos(this.angle) * 0.2;
                this.targetVy += Math.sin(this.angle) * 0.2;
                return;
            }
        }

        if (Math.random() < this.dna.explorationBias) {
            this.explore();
        } else if (this.anthill) {
            this.seek(this.anthill);
        } else {
            this.seek(this.memory.homePosition);
        }
    }

    seek(target) {
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0) {
            this.targetVx = (dx / dist) * this.dna.speed;
            this.targetVy = (dy / dist) * this.dna.speed;
        }
    }

    flee(predator) {
        const dx = this.x - predator.x;
        const dy = this.y - predator.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0) {
            const fleeSpeed = this.dna.speed * (1 + this.dna.cautiousness);
            this.targetVx = (dx / dist) * fleeSpeed;
            this.targetVy = (dy / dist) * fleeSpeed;
        }
    }

    explore() {
        this.angle += (Math.random() - 0.5) * 0.4;
        this.targetVx = Math.cos(this.angle) * this.dna.speed;
        this.targetVy = Math.sin(this.angle) * this.dna.speed;
    }

    move(weatherEffects = null) {
        const smoothing = 0.15;
        this.vx += (this.targetVx - this.vx) * smoothing;
        this.vy += (this.targetVy - this.vy) * smoothing;

        const speedMultiplier = weatherEffects?.antSpeedMultiplier || 1;
        const maxSpeed = this.dna.speed * 1.4 * speedMultiplier;
        const currentSpeed = Math.hypot(this.vx, this.vy);

        if (currentSpeed > maxSpeed) {
            const scale = maxSpeed / currentSpeed;
            this.vx *= scale;
            this.vy *= scale;
        }

        const newX = this.x + this.vx;
        const newY = this.y + this.vy;

        if (this.checkCollision(newX, newY)) {
            this.targetVx *= -0.35;
            this.targetVy *= -0.35;
            this.vx *= -0.25;
            this.vy *= -0.25;
        } else {
            this.x = newX;
            this.y = newY;
        }

        if (this.world?.waterZones) {
            for (const zone of this.world.waterZones) {
                if (zone.contains(this.x, this.y)) {
                    this.vx *= 0.84;
                    this.vy *= 0.84;
                }
            }
        }

        this.x = Math.max(this.size, Math.min(CONFIG.WORLD_WIDTH - this.size, this.x));
        this.y = Math.max(this.size, Math.min(CONFIG.WORLD_HEIGHT - this.size, this.y));

        if (Math.hypot(this.vx, this.vy) > 0.06) {
            this.heading = Math.atan2(this.vy, this.vx);
        }
    }

    checkCollision(newX, newY) {
        if (this.world?.trees) {
            for (const tree of this.world.trees) {
                const dist = Math.hypot(newX - tree.x, newY - tree.y);
                if (dist < this.size + tree.size) return true;
            }
        }
        return false;
    }

    interact(food, predators) {
        food.forEach(f => {
            if (f.eaten || this.carryingFood) return;

            const dist = Math.hypot(f.x - this.x, f.y - this.y);
            if (dist < this.size + f.size / 2) {
                f.eaten = true;
                this.carryingFood = true;
                this.memory.foodPositions.push({ x: f.x, y: f.y });
                if (this.memory.foodPositions.length > this.dna.memorySize) {
                    this.memory.foodPositions.shift();
                }
            }
        });

        predators.forEach(p => {
            const dist = Math.hypot(p.x - this.x, p.y - this.y);
            if (dist < this.size + p.size / 2) {
                this.deathEncounters++;
                this.memory.dangerPositions.push({ x: p.x, y: p.y });
                if (this.memory.dangerPositions.length > 3) this.memory.dangerPositions.shift();
                this.takeDamage(p.attackRange ? 12 : 5);
            }
        });
    }

    communicate(nearbyAnts, perception) {
        nearbyAnts.forEach(ant => {
            if (this.carryingFood) ant.rememberFood(this.x, this.y);
            if (perception.nearestPredator && perception.predatorDistance < 70) {
                ant.fleeFrom(perception.nearestPredator);
            }
        });
        this.lastCommunication = this.age;
    }

    rememberFood(x, y) {
        this.memory.foodPositions.unshift({ x, y });
        if (this.memory.foodPositions.length > this.dna.memorySize) this.memory.foodPositions.pop();
    }

    fleeFrom(predator) {
        this.fearTimer = 80;
        this.flee(predator);
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) this.die();
    }

    die() {
        this.dead = true;
        this.selected = false;
    }

    updateMemory(perception, stepCount) {
        if (stepCount % 100 === 0 && this.memory.foodPositions.length > 0 && Math.random() < 0.1) {
            this.memory.foodPositions.shift();
        }
        if (perception.nearestFood) this.memory.lastFoodTime = stepCount;
    }

    draw(ctx, camera) {
        if (this.dead || this.insideAnthill) return;

        const screenPos = camera.worldToScreen(this.x, this.y);
        const scale = camera.scale;
        const bodyLength = this.size * 1.8 * scale;
        const bodyWidth = this.size * 1.15 * scale;

        if (this.selected) {
            ctx.strokeStyle = 'rgba(255, 255, 120, 0.35)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, this.dna.visionRadius * scale, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.save();
        ctx.translate(screenPos.x, screenPos.y);
        ctx.rotate(this.heading);

        for (let i = -1; i <= 1; i += 2) {
            ctx.strokeStyle = 'rgba(70, 36, 12, 0.9)';
            ctx.lineWidth = Math.max(1, 1.2 * scale);
            ctx.beginPath();
            ctx.moveTo(-bodyLength * 0.2, i * bodyWidth * 0.2);
            ctx.lineTo(-bodyLength * 0.8, i * bodyWidth * 0.9);
            ctx.moveTo(bodyLength * 0.05, i * bodyWidth * 0.25);
            ctx.lineTo(-bodyLength * 0.35, i * bodyWidth * 1.05);
            ctx.stroke();
        }

        const bodyGradient = ctx.createLinearGradient(-bodyLength, 0, bodyLength, 0);
        bodyGradient.addColorStop(0, this.carryingFood ? '#c0811f' : '#ab5215');
        bodyGradient.addColorStop(1, this.selected ? '#ffe26d' : '#f79a1f');

        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.ellipse(-bodyLength * 0.38, 0, bodyLength * 0.28, bodyWidth * 0.58, 0, 0, Math.PI * 2);
        ctx.ellipse(0, 0, bodyLength * 0.3, bodyWidth * 0.5, 0, 0, Math.PI * 2);
        ctx.ellipse(bodyLength * 0.4, 0, bodyLength * 0.34, bodyWidth * 0.44, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#23170f';
        ctx.beginPath();
        ctx.arc(bodyLength * 0.55, -bodyWidth * 0.15, Math.max(1, 1.4 * scale), 0, Math.PI * 2);
        ctx.arc(bodyLength * 0.55, bodyWidth * 0.15, Math.max(1, 1.4 * scale), 0, Math.PI * 2);
        ctx.fill();

        if (this.carryingFood) {
            ctx.fillStyle = '#7dff8e';
            ctx.beginPath();
            ctx.arc(bodyLength * 0.95, 0, bodyWidth * 0.2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    getInfo() {
        return {
            'Скорость': this.dna.speed.toFixed(1),
            'Зрение': Math.round(this.dna.visionRadius),
            'Осторожность': (this.dna.cautiousness * 100).toFixed(0) + '%',
            'Исследование': (this.dna.explorationBias * 100).toFixed(0) + '%',
            'Память': this.dna.memorySize,
            'Съедено еды': this.foodEaten,
            'Несу еду': this.carryingFood ? 'да' : 'нет',
            'Здоровье': Math.max(0, Math.floor(this.health)),
            'В муравейнике': this.insideAnthill ? 'да' : 'нет',
            'Шагов': this.age,
            'Фитнес': Math.floor(this.fitness)
        };
    }
}
