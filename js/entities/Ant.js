// Ant.js - класс муравья с ДНК и поведением

class Ant {
    constructor(x, y, dna = null) {
        this.x = x;
        this.y = y;
        
        // ДНК (если не передана, создаем случайную)
        this.dna = dna || Genetics.createRandomDNA();
        
        // Состояние
        this.vx = (Math.random() - 0.5) * this.dna.speed;
        this.vy = (Math.random() - 0.5) * this.dna.speed;
        this.angle = Math.random() * Math.PI * 2;
        
        // Память
        this.memory = {
            foodPositions: [],     // Запомненные позиции еды
            dangerPositions: [],   // Опасные места
            lastFoodTime: 0,       // Время последней еды
            homePosition: {x, y}   // Начальная позиция как "дом"
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
    }

    update(food, predators, trees, allAnts, stepCount) {
        const oldX = this.x;
        const oldY = this.y;
        
        // 1. Восприятие окружения
        const perception = this.perceive(food, predators, trees, allAnts);
        
        // 2. Принятие решения на основе ДНК
        this.decide(perception);
        
        // 3. Движение
        this.move();
        
        // 4. Взаимодействие с объектами
        this.interact(food, predators);
        
        // 5. Обновление статистики
        const distMoved = Math.sqrt((this.x - oldX)**2 + (this.y - oldY)**2);
        this.distanceTraveled += distMoved;
        this.stepsSinceLastFood++;
        this.age++;
        
        // 6. Обновление памяти
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
        
        // Поиск еды в радиусе зрения
        food.forEach(f => {
            if (!f.eaten) {
                const dist = Math.sqrt((f.x - this.x)**2 + (f.y - this.y)**2);
                if (dist < this.dna.visionRadius) {
                    perception.foodInVision.push({...f, dist});
                    if (dist < minFoodDist) {
                        minFoodDist = dist;
                        perception.nearestFood = f;
                        perception.foodDistance = dist;
                    }
                }
            }
        });
        
        // Поиск хищников в радиусе зрения
        predators.forEach(p => {
            const dist = Math.sqrt((p.x - this.x)**2 + (p.y - this.y)**2);
            if (dist < this.dna.visionRadius) {
                perception.predatorsInVision.push({...p, dist});
                if (dist < minPredDist) {
                    minPredDist = dist;
                    perception.nearestPredator = p;
                    perception.predatorDistance = dist;
                }
            }
        });
        
        // Поиск ближайшего дерева (препятствие)
        trees.forEach(t => {
            const dist = Math.sqrt((t.x - this.x)**2 + (t.y - this.y)**2);
            if (dist < this.size + t.size) {
                perception.nearestTree = t;
            }
        });
        
        return perception;
    }

    decide(perception) {
        // Решение на основе ДНК и восприятия
        
        // 1. Если рядом хищник - реакция зависит от осторожности
        if (perception.nearestPredator) {
            const dangerLevel = 1 - (perception.predatorDistance / this.dna.visionRadius);
            
            if (dangerLevel * this.dna.cautiousness > 0.3) {
                // Убегаем от хищника
                this.flee(perception.nearestPredator);
                return;
            }
        }
        
        // 2. Если есть еда в зоне видимости
        if (perception.nearestFood) {
            // Идем к еде
            this.seek(perception.nearestFood);
            return;
        }
        
        // 3. Если помним о еде
        if (this.memory.foodPositions.length > 0 && Math.random() < 0.3) {
            const rememberedFood = this.memory.foodPositions[0];
            this.seek(rememberedFood);
            return;
        }
        
        // 4. Случайное исследование (с учетом explorationBias)
        if (Math.random() < this.dna.explorationBias) {
            this.explore();
        } else {
            // Идем к дому
            this.seek(this.memory.homePosition);
        }
    }

    seek(target) {
        // Вектор к цели
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist > 0) {
            // Нормализуем и умножаем на скорость
            this.vx = (dx / dist) * this.dna.speed;
            this.vy = (dy / dist) * this.dna.speed;
        }
    }

    flee(predator) {
        // Вектор от хищника
        const dx = this.x - predator.x;
        const dy = this.y - predator.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist > 0) {
            // Убегаем с максимальной скоростью
            const fleeSpeed = this.dna.speed * (1 + this.dna.cautiousness);
            this.vx = (dx / dist) * fleeSpeed;
            this.vy = (dy / dist) * fleeSpeed;
        }
    }

    explore() {
        // Случайное изменение направления
        this.angle += (Math.random() - 0.5) * 0.5;
        
        this.vx = Math.cos(this.angle) * this.dna.speed;
        this.vy = Math.sin(this.angle) * this.dna.speed;
    }

    // В Ant.js, заменим метод move() на этот:

    move() {
        // Плавное движение без резких дерганий
        // Добавляем небольшую инерцию
        const inertia = 0.1;
        
        // Целевая скорость на основе решения
        let targetVx = this.vx;
        let targetVy = this.vy;
        
        // Плавно меняем скорость (сглаживание)
        this.vx = this.vx * (1 - inertia) + targetVx * inertia;
        this.vy = this.vy * (1 - inertia) + targetVy * inertia;
        
        // Ограничиваем скорость
        const currentSpeed = Math.sqrt(this.vx*this.vx + this.vy*this.vy);
        if (currentSpeed > this.dna.speed) {
            this.vx = (this.vx / currentSpeed) * this.dna.speed;
            this.vy = (this.vy / currentSpeed) * this.dna.speed;
        }
        
        // Минимальная скорость, чтобы не останавливались полностью
        if (currentSpeed < 0.5 && Math.random() < 0.01) {
            this.vx += (Math.random() - 0.5) * 0.5;
            this.vy += (Math.random() - 0.5) * 0.5;
        }
        
        // Обновляем позицию
        const newX = this.x + this.vx;
        const newY = this.y + this.vy;
        
        // Проверяем столкновения с деревьями и границами
        if (this.checkCollision(newX, newY)) {
            // Если столкновение, отталкиваемся
            this.vx *= -0.5;
            this.vy *= -0.5;
        } else {
            this.x = newX;
            this.y = newY;
        }
        
        // Остаемся в пределах мира
        this.x = Math.max(this.size, Math.min(CONFIG.WORLD_WIDTH - this.size, this.x));
        this.y = Math.max(this.size, Math.min(CONFIG.WORLD_HEIGHT - this.size, this.y));
    }

// Добавим метод проверки столкновений
checkCollision(newX, newY) {
    // С деревьями
    if (this.world && this.world.trees) {
        for (let tree of this.world.trees) {
            const dist = Math.sqrt((newX - tree.x)**2 + (newY - tree.y)**2);
            if (dist < this.size + tree.size) {
                return true;
            }
        }
    }
    return false;
}

    interact(food, predators) {
        // Взаимодействие с едой
        food.forEach(f => {
            if (!f.eaten) {
                const dist = Math.sqrt((f.x - this.x)**2 + (f.y - this.y)**2);
                if (dist < this.size + f.size/2) {
                    f.eaten = true;
                    this.foodEaten++;
                    this.stepsSinceLastFood = 0;
                    
                    // Запоминаем где была еда
                    this.memory.foodPositions.push({x: f.x, y: f.y});
                    if (this.memory.foodPositions.length > this.dna.memorySize) {
                        this.memory.foodPositions.shift();
                    }
                }
            }
        });
        
        // Взаимодействие с хищниками
        predators.forEach(p => {
            const dist = Math.sqrt((p.x - this.x)**2 + (p.y - this.y)**2);
            if (dist < this.size + p.size/2) {
                this.deathEncounters++;
                
                // Запоминаем опасное место
                this.memory.dangerPositions.push({x: p.x, y: p.y});
                if (this.memory.dangerPositions.length > 3) {
                    this.memory.dangerPositions.shift();
                }
            }
        });
    }

    updateMemory(perception, stepCount) {
        // Забываем старую информацию
        if (stepCount % 100 === 0) {
            if (this.memory.foodPositions.length > 0 && Math.random() < 0.1) {
                this.memory.foodPositions.shift();
            }
        }
        
        // Обновляем время последней еды
        if (perception.nearestFood) {
            this.memory.lastFoodTime = stepCount;
        }
    }

    draw(ctx, camera) {
        const screenPos = camera.worldToScreen(this.x, this.y);
        
        // Рисуем радиус зрения если муравей выбран
        if (this.selected) {
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, this.dna.visionRadius * camera.scale, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Рисуем муравья (треугольник)
        ctx.save();
        ctx.translate(screenPos.x, screenPos.y);
        ctx.rotate(Math.atan2(this.vy, this.vx));
        
        // Цвет зависит от состояния
        if (this.selected) {
            ctx.fillStyle = CONFIG.COLORS.SELECTED_ANT;
        } else {
            // Цвет зависит от осторожности (более осторожные - светлее)
            const intensity = 0.5 + this.dna.cautiousness * 0.5;
            ctx.fillStyle = `rgb(255, ${Math.floor(170 * intensity)}, 0)`;
        }
        
        // Рисуем треугольник
        ctx.beginPath();
        ctx.moveTo(this.size * 2, 0);
        ctx.lineTo(-this.size, -this.size);
        ctx.lineTo(-this.size, this.size);
        ctx.closePath();
        ctx.fill();
        
        // Глаз
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.size, -this.size/2, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // Рисуем "энергию" (количество съеденной еды)
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
            'Шагов': this.age,
            'Фитнес': Math.floor(this.fitness)
        };
    }
}
// Добавим в класс Ant новые свойства в конструктор:

constructor(x, y, dna = null, anthill = null) {
    // ... существующий код ...
    
    // Новые свойства для взаимодействия
    this.anthill = anthill; // Ссылка на муравейник
    this.role = 'worker'; // worker, soldier, scout
    this.carryingFood = false;
    this.communicationRange = 100;
    this.nestmates = []; // Сородичи поблизости
    this.lastCommunication = 0;
    this.dead = false;
}

// Новые методы для взаимодействия:

communicate(nearbyAnts) {
    // Общаемся с другими муравьями
    nearbyAnts.forEach(ant => {
        if (ant !== this && !ant.dead) {
            // Если нашли еду, сообщаем другим
            if (this.carryingFood && !ant.carryingFood) {
                ant.rememberFood(this.x, this.y);
            }
            
            // Если видим опасность, предупреждаем
            if (this.perception.nearestPredator && 
                this.perception.predatorDistance < 50) {
                ant.fleeFrom(this.perception.nearestPredator);
            }
        }
    });
    
    this.lastCommunication = this.age;
}

rememberFood(x, y) {
    this.memory.foodPositions.push({x, y});
    if (this.memory.foodPositions.length > this.dna.memorySize) {
        this.memory.foodPositions.shift();
    }
}

fleeFrom(predator) {
    // Временно увеличиваем осторожность
    this.temporaryFear = 100; // На 100 шагов
    this.fleeTarget = predator;
}

takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
        this.die();
    }
}

die() {
    this.dead = true;
    if (this.anthill) {
        this.anthill.population--;
    }
}

// Обновим метод update для включения коммуникации
update(food, predators, trees, allAnts, stepCount, anthill) {
    if (this.dead) return;
    
    this.anthill = anthill; // Обновляем ссылку
    
    // Находим ближайших сородичей
    const nearbyAnts = allAnts.filter(ant => 
        ant !== this && 
        !ant.dead &&
        Math.sqrt((ant.x - this.x)**2 + (ant.y - this.y)**2) < this.communicationRange
    );
    
    // Общаемся
    if (nearbyAnts.length > 0 && this.age - this.lastCommunication > 50) {
        this.communicate(nearbyAnts);
    }
    
    // ... остальной код update ...
    
    // Если рядом муравейник, несем еду туда
    if (this.anthill && this.carryingFood) {
        const distToAnthill = Math.sqrt(
            (this.anthill.x - this.x)**2 + 
            (this.anthill.y - this.y)**2
        );
        
        if (distToAnthill < 50) {
            // Сдали еду в муравейник
            this.anthill.addFood(1);
            this.carryingFood = false;
            this.foodEaten++; // Считаем как съеденную
        } else {
            // Идем к муравейнику
            this.seek(this.anthill);
        }
    }
}

// Изменим метод interact:
interact(food, predators) {
    // Взаимодействие с едой
    food.forEach(f => {
        if (!f.eaten && !this.carryingFood) {
            const dist = Math.sqrt((f.x - this.x)**2 + (f.y - this.y)**2);
            if (dist < this.size + f.size/2) {
                f.eaten = true;
                this.carryingFood = true; // Не съедаем, а несем в муравейник
                this.stepsSinceLastFood = 0;
                
                // Запоминаем где была еда
                this.memory.foodPositions.push({x: f.x, y: f.y});
                if (this.memory.foodPositions.length > this.dna.memorySize) {
                    this.memory.foodPositions.shift();
                }
            }
        }
    });
    
    // Взаимодействие с хищниками (урон)
    predators.forEach(p => {
        const dist = Math.sqrt((p.x - this.x)**2 + (p.y - this.y)**2);
        if (dist < this.size + p.size/2) {
            this.deathEncounters++;
            
            // Получаем урон
            if (p.attack) { // Для паука
                this.takeDamage(10);
            }
            
            // Запоминаем опасное место
            this.memory.dangerPositions.push({x: p.x, y: p.y});
            if (this.memory.dangerPositions.length > 3) {
                this.memory.dangerPositions.shift();
            }
        }
    });
}