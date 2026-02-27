// Genetics.js - Генетика и эволюция муравьев

class Genetics {
    // Создание случайной ДНК для нового муравья
    static createRandomDNA() {
        return {
            speed: CONFIG.ANT_SPEED_MIN + Math.random() * (CONFIG.ANT_SPEED_MAX - CONFIG.ANT_SPEED_MIN),
            visionRadius: CONFIG.ANT_VISION_MIN + Math.random() * (CONFIG.ANT_VISION_MAX - CONFIG.ANT_VISION_MIN),
            cautiousness: CONFIG.ANT_CAUTIOUS_MIN + Math.random() * (CONFIG.ANT_CAUTIOUS_MAX - CONFIG.ANT_CAUTIOUS_MIN),
            // Дополнительные гены для разнообразия поведения
            explorationBias: Math.random(), // 0-1: склонность к исследованию
            memorySize: Math.floor(Math.random() * 5) + 3 // 3-7: размер памяти
        };
    }

    // Отбор лучших муравьев по фитнесу
    static selectBest(ants, percent) {
        // Сортируем по фитнесу (от лучшего к худшему)
        const sorted = [...ants].sort((a, b) => b.fitness - a.fitness);
        const survivorCount = Math.max(2, Math.floor(ants.length * percent));
        return sorted.slice(0, survivorCount);
    }

    // Скрещивание двух родителей (Uniform Crossover)
    static crossover(parent1, parent2) {
        const childDNA = {};
        
        // Для каждого гена случайно выбираем от одного из родителей
        const genes = Object.keys(parent1.dna);
        genes.forEach(gene => {
            if (Math.random() < 0.5) {
                childDNA[gene] = parent1.dna[gene];
            } else {
                childDNA[gene] = parent2.dna[gene];
            }
        });
        
        return childDNA;
    }

    // Мутация ДНК
    static mutate(dna) {
        const mutatedDNA = {...dna};
        const genes = Object.keys(dna);
        
        genes.forEach(gene => {
            // Мутирует только часть генов
            if (Math.random() < CONFIG.MUTATION_RATE) {
                // Добавляем случайное изменение
                const mutation = (Math.random() - 0.5) * CONFIG.MUTATION_STRENGTH * 2;
                
                if (typeof dna[gene] === 'number') {
                    mutatedDNA[gene] = dna[gene] * (1 + mutation);
                    
                    // Ограничиваем значения в допустимых пределах
                    this.clampGene(mutatedDNA, gene);
                }
            }
        });
        
        return mutatedDNA;
    }

    // Ограничение генов допустимыми значениями
    static clampGene(dna, gene) {
        switch(gene) {
            case 'speed':
                dna.speed = Math.max(CONFIG.ANT_SPEED_MIN, Math.min(CONFIG.ANT_SPEED_MAX, dna.speed));
                break;
            case 'visionRadius':
                dna.visionRadius = Math.max(CONFIG.ANT_VISION_MIN, Math.min(CONFIG.ANT_VISION_MAX, dna.visionRadius));
                break;
            case 'cautiousness':
                dna.cautiousness = Math.max(CONFIG.ANT_CAUTIOUS_MIN, Math.min(CONFIG.ANT_CAUTIOUS_MAX, dna.cautiousness));
                break;
            case 'explorationBias':
                dna.explorationBias = Math.max(0, Math.min(1, dna.explorationBias));
                break;
            case 'memorySize':
                dna.memorySize = Math.max(3, Math.min(7, Math.floor(dna.memorySize)));
                break;
        }
    }

    // Создание нового поколения
    static createNewGeneration(oldAnts, worldWidth, worldHeight) {
        // Отбираем лучших
        const survivors = this.selectBest(oldAnts, CONFIG.SURVIVOR_PERCENT);
        const newAnts = [];
        
        // Лучший муравей остается без изменений (элитизм)
        if (survivors.length > 0) {
            const bestAnt = survivors[0];
            newAnts.push(new Ant(
                bestAnt.x, bestAnt.y,
                {...bestAnt.dna}
            ));
        }
        
        // Создаем остальных через скрещивание
        while (newAnts.length < CONFIG.INITIAL_ANTS) {
            // Выбираем двух случайных родителей из лучших
            const parent1 = survivors[Math.floor(Math.random() * survivors.length)];
            const parent2 = survivors[Math.floor(Math.random() * survivors.length)];
            
            // Скрещиваем
            let childDNA = this.crossover(parent1, parent2);
            
            // Мутируем
            childDNA = this.mutate(childDNA);
            
            // Случайная позиция (не слишком близко к краям)
            const x = 100 + Math.random() * (worldWidth - 200);
            const y = 100 + Math.random() * (worldHeight - 200);
            
            newAnts.push(new Ant(x, y, childDNA));
        }
        
        return newAnts;
    }

    // Вычисление фитнеса для муравья
    static calculateFitness(ant) {
        // Фитнес = съеденная еда * 100 - смертельные встречи * 50 + пройденный путь / 10
        let fitness = ant.foodEaten * 100;
        fitness -= ant.deathEncounters * 50;
        fitness += ant.distanceTraveled / 10;
        
        // Штраф за бездействие
        if (ant.stepsSinceLastFood > 500) {
            fitness -= 20;
        }
        
        return Math.max(0, fitness);
    }
}