// Ant.js - класс муравья с ДНК и поведением

class Ant {
    constructor(x, y, dna = null, anthill = null) {
        this.x = x;
        this.y = y;

        // ДНК (если не передана, создаем случайную)
        this.dna = dna || Genetics.createRandomDNA();

        // Состояние
        this.vx = (Math.random() - 0.5) * this.dna.speed;
        this.vy = (Math.random() - 0.5) * this.dna.speed;
        this.angle = Math.random() * Math.PI * 2;
        this.dead = false;
        this.health = 100;
        this.maxHealth = 100;

        // V2: взаимодействие с муравейником
        this.anthill = anthill;
        this.carryingFood = false;
        this.communicationRange = 100;
        this.lastCommunication = 0;
        this.fearTimer = 0;

        // Память
        this.memory = {
            foodPositions: [],
            dangerPositions: [],
            lastFoodTime: 0,
            homePosition: { x, y }
        };

        // Статистика для фитнеса
        this.fitness = 0;
        this.foodEaten = 0;
        this.deathEncounters = 0;
        this.distanceTraveled = 0;
        this.stepsSinceLastFood = 0;
        this.age = 0;

        // Визуальные
        this.size = CONFIG.ANT_SIZE;
        this.selected = false;
        this.color = CONFIG.COLORS.ANT;

        // Ссылка на мир для коллизий
        this.world = null;
    }

    update(food, predators, trees, allAnts, stepCount, anthill = null) {
        if (this.dead) return;

        this.anthill = anthill || this.anthill;
        this.world = { trees };

        const oldX = this.x;
        const oldY = this.y;

        const perception = this.perceive(food, predators, trees, allAnts);

        // Коммуникация между муравьями
        if (this.age - this.lastCommunication > 60) {
            const nearbyAnts = allAnts.filter(ant =>
                ant !== this &&
                !ant.dead &&
                Math.hypot(ant.x - this.x, ant.y - this.y) < this.communicationRange
            );
            if (nearbyAnts.length > 0) {
                this.communicate(nearbyAnts, perception);
            }
        }

        this.decide(perception);
        this.move();
        this.interact(food, predators);

        // Если несем еду — возвращаем в муравейник
        if (this.anthill && this.carryingFood) {
            const distToAnthill = Math.hypot(this.anthill.x - this.x, this.anthill.y - this.y);
            if (distToAnthill < this.anthill.size) {
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

        if (this.fearTimer > 0) {
            this.fearTimer--;
        }

        this.updateMemory(perception, stepCount);
    }

    perceive(food, predators, trees, allAnts) {
        const perception = {
            nearestFood: null,
            nearestPredator: null,
            nearestTree: null,
            nearestAnt: null,
            foodInVision: [],
            predatorsInVision: [],
            foodDistance: Infinity,
            predatorDistance: Infinity
        };

        let minFoodDist = this.dna.visionRadius;
        let minPredDist = this.dna.visionRadius;

        food.forEach(f => {
            if (!f.eaten) {
                const dist = Math.hypot(f.x - this.x, f.y - this.y);
                if (dist < this.dna.visionRadius) {
                    perception.foodInVision.push({ ...f, dist });
                    if (dist < minFoodDist) {
                        minFoodDist = dist;
                        perception.nearestFood = f;
                        perception.foodDistance = dist;
                    }
                }
            }
        });

        predators.forEach(p => {
            const dist = Math.hypot(p.x - this.x, p.y - this.y);
            if (dist < this.dna.visionRadius) {
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
            if (dist < this.size + t.size) {
                perception.nearestTree = t;
            }
        });

        return perception;
    }

    decide(perception) {
        if (perception.nearestPredator) {
            const dangerLevel = 1 - (perception.predatorDistance / this.dna.visionRadius);
            const cautionBoost = this.fearTimer > 0 ? 1.3 : 1;
            if (dangerLevel * this.dna.cautiousness * cautionBoost > 0.3) {
                this.flee(perception.nearestPredator);
                return;
            }
        }

        // V2: при переноске еды всегда возвращаемся домой
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
            this.vx = (dx / dist) * this.dna.speed;
            this.vy = (dy / dist) * this.dna.speed;
        }
    }

    flee(predator) {
        const dx = this.x - predator.x;
        const dy = this.y - predator.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0) {
            const fleeSpeed = this.dna.speed * (1 + this.dna.cautiousness);
            this.vx = (dx / dist) * fleeSpeed;
            this.vy = (dy / dist) * fleeSpeed;
        }
    }

    explore() {
        this.angle += (Math.random() - 0.5) * 0.5;
        this.vx = Math.cos(this.angle) * this.dna.speed;
        this.vy = Math.sin(this.angle) * this.dna.speed;
    }

    move() {
        const newX = this.x + this.vx;
        const newY = this.y + this.vy;

        if (this.checkCollision(newX, newY)) {
            this.vx *= -0.5;
            this.vy *= -0.5;
        } else {
            this.x = newX;
            this.y = newY;
        }

        this.x = Math.max(this.size, Math.min(CONFIG.WORLD_WIDTH - this.size, this.x));
        this.y = Math.max(this.size, Math.min(CONFIG.WORLD_HEIGHT - this.size, this.y));
    }

    checkCollision(newX, newY) {
        if (this.world && this.world.trees) {
            for (const tree of this.world.trees) {
                const dist = Math.hypot(newX - tree.x, newY - tree.y);
                if (dist < this.size + tree.size) {
                    return true;
                }
            }
        }
        return false;
    }

    interact(food, predators) {
        food.forEach(f => {
            if (!f.eaten && !this.carryingFood) {
                const dist = Math.hypot(f.x - this.x, f.y - this.y);
                if (dist < this.size + f.size / 2) {
                    f.eaten = true;
                    this.carryingFood = true;

                    this.memory.foodPositions.push({ x: f.x, y: f.y });
                    if (this.memory.foodPositions.length > this.dna.memorySize) {
                        this.memory.foodPositions.shift();
                    }
                }
            }
        });

        predators.forEach(p => {
            const dist = Math.hypot(p.x - this.x, p.y - this.y);
            if (dist < this.size + p.size / 2) {
                this.deathEncounters++;
                this.memory.dangerPositions.push({ x: p.x, y: p.y });
                if (this.memory.dangerPositions.length > 3) {
                    this.memory.dangerPositions.shift();
                }
                this.takeDamage(p.attackRange ? 12 : 5);
            }
        });
    }

    communicate(nearbyAnts, perception) {
        nearbyAnts.forEach(ant => {
            if (this.carryingFood) {
                ant.rememberFood(this.x, this.y);
            }

            if (perception.nearestPredator && perception.predatorDistance < 70) {
                ant.fleeFrom(perception.nearestPredator);
            }
        });

        this.lastCommunication = this.age;
    }

    rememberFood(x, y) {
        this.memory.foodPositions.unshift({ x, y });
        if (this.memory.foodPositions.length > this.dna.memorySize) {
            this.memory.foodPositions.pop();
        }
    }

    fleeFrom(predator) {
        this.fearTimer = 80;
        this.flee(predator);
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.dead = true;
        this.selected = false;
    }

    updateMemory(perception, stepCount) {
        if (stepCount % 100 === 0 && this.memory.foodPositions.length > 0 && Math.random() < 0.1) {
            this.memory.foodPositions.shift();
        }

        if (perception.nearestFood) {
            this.memory.lastFoodTime = stepCount;
        }
    }

    draw(ctx, camera) {
        if (this.dead) return;

        const screenPos = camera.worldToScreen(this.x, this.y);

        if (this.selected) {
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, this.dna.visionRadius * camera.scale, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.save();
        ctx.translate(screenPos.x, screenPos.y);
        ctx.rotate(Math.atan2(this.vy, this.vx));

        if (this.selected) {
            ctx.fillStyle = CONFIG.COLORS.SELECTED_ANT;
        } else if (this.carryingFood) {
            ctx.fillStyle = '#ffd54f';
        } else {
            const intensity = 0.5 + this.dna.cautiousness * 0.5;
            ctx.fillStyle = `rgb(255, ${Math.floor(170 * intensity)}, 0)`;
        }

        ctx.beginPath();
        ctx.moveTo(this.size * 2, 0);
        ctx.lineTo(-this.size, -this.size);
        ctx.lineTo(-this.size, this.size);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.size, -this.size / 2, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        if (this.foodEaten > 0) {
            ctx.fillStyle = '#00ff00';
            ctx.font = '10px Arial';
            ctx.fillText('🍎' + this.foodEaten, screenPos.x - 10, screenPos.y - 20);
        }
    }

    getInfo() {
        return {
            'Скорость': this.dna.speed.toFixed(2),
            'Зрение': Math.floor(this.dna.visionRadius),
            'Осторожность': (this.dna.cautiousness * 100).toFixed(0) + '%',
            'Исследование': (this.dna.explorationBias * 100).toFixed(0) + '%',
            'Память': this.dna.memorySize,
            'Съедено еды': this.foodEaten,
            'Несу еду': this.carryingFood ? 'да' : 'нет',
            'Здоровье': Math.max(0, Math.floor(this.health)),
            'Шагов': this.age,
            'Фитнес': Math.floor(this.fitness)
        };
    }
}
