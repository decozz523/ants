// Genetics.js - Генетика и эволюция муравьев

class Genetics {
    static roundToTenth(value) {
        return Math.round(value * 10) / 10;
    }

    static createRandomDNA() {
        return {
            speed: this.roundToTenth(CONFIG.ANT_SPEED_MIN + Math.random() * (CONFIG.ANT_SPEED_MAX - CONFIG.ANT_SPEED_MIN)),
            visionRadius: Math.round(CONFIG.ANT_VISION_MIN + Math.random() * (CONFIG.ANT_VISION_MAX - CONFIG.ANT_VISION_MIN)),
            cautiousness: this.roundToTenth(CONFIG.ANT_CAUTIOUS_MIN + Math.random() * (CONFIG.ANT_CAUTIOUS_MAX - CONFIG.ANT_CAUTIOUS_MIN)),
            explorationBias: this.roundToTenth(Math.random()),
            memorySize: Math.floor(Math.random() * 5) + 3
        };
    }

    static selectBest(ants, percent) {
        const sorted = [...ants].sort((a, b) => b.fitness - a.fitness);
        const survivorCount = Math.max(2, Math.floor(ants.length * percent));
        return sorted.slice(0, survivorCount);
    }

    static crossover(parent1, parent2) {
        const childDNA = {};
        const genes = Object.keys(parent1.dna);

        genes.forEach(gene => {
            childDNA[gene] = Math.random() < 0.5 ? parent1.dna[gene] : parent2.dna[gene];
        });

        return childDNA;
    }

    static mutate(dna) {
        const mutatedDNA = { ...dna };
        const genes = Object.keys(dna);

        genes.forEach(gene => {
            if (Math.random() < CONFIG.MUTATION_RATE) {
                switch (gene) {
                    case 'speed':
                    case 'cautiousness':
                    case 'explorationBias': {
                        const direction = Math.random() < 0.5 ? -1 : 1;
                        mutatedDNA[gene] = this.roundToTenth(mutatedDNA[gene] + direction * 0.1);
                        break;
                    }
                    case 'visionRadius': {
                        const direction = Math.random() < 0.5 ? -1 : 1;
                        mutatedDNA.visionRadius = Math.round(mutatedDNA.visionRadius + direction * 5);
                        break;
                    }
                    case 'memorySize': {
                        const direction = Math.random() < 0.5 ? -1 : 1;
                        mutatedDNA.memorySize = Math.round(mutatedDNA.memorySize + direction);
                        break;
                    }
                }

                this.clampGene(mutatedDNA, gene);
            }
        });

        return mutatedDNA;
    }

    static clampGene(dna, gene) {
        switch (gene) {
            case 'speed':
                dna.speed = this.roundToTenth(Math.max(CONFIG.ANT_SPEED_MIN, Math.min(CONFIG.ANT_SPEED_MAX, dna.speed)));
                break;
            case 'visionRadius':
                dna.visionRadius = Math.round(Math.max(CONFIG.ANT_VISION_MIN, Math.min(CONFIG.ANT_VISION_MAX, dna.visionRadius)));
                break;
            case 'cautiousness':
                dna.cautiousness = this.roundToTenth(Math.max(CONFIG.ANT_CAUTIOUS_MIN, Math.min(CONFIG.ANT_CAUTIOUS_MAX, dna.cautiousness)));
                break;
            case 'explorationBias':
                dna.explorationBias = this.roundToTenth(Math.max(0, Math.min(1, dna.explorationBias)));
                break;
            case 'memorySize':
                dna.memorySize = Math.max(3, Math.min(7, Math.round(dna.memorySize)));
                break;
        }
    }

    static createNewGeneration(oldAnts, worldWidth, worldHeight) {
        const survivors = this.selectBest(oldAnts, CONFIG.SURVIVOR_PERCENT);
        const newAnts = [];

        if (survivors.length > 0) {
            const bestAnt = survivors[0];
            newAnts.push(new Ant(bestAnt.x, bestAnt.y, { ...bestAnt.dna }));
        }

        while (newAnts.length < CONFIG.INITIAL_ANTS) {
            const parent1 = survivors[Math.floor(Math.random() * survivors.length)];
            const parent2 = survivors[Math.floor(Math.random() * survivors.length)];

            let childDNA = this.crossover(parent1, parent2);
            childDNA = this.mutate(childDNA);

            const x = 100 + Math.random() * (worldWidth - 200);
            const y = 100 + Math.random() * (worldHeight - 200);
            newAnts.push(new Ant(x, y, childDNA));
        }

        return newAnts;
    }

    static calculateFitness(ant) {
        let fitness = ant.foodEaten * 100;
        fitness -= ant.deathEncounters * 50;
        fitness += ant.distanceTraveled / 10;

        if (ant.stepsSinceLastFood > 500) {
            fitness -= 20;
        }

        return Math.max(0, fitness);
    }
}
