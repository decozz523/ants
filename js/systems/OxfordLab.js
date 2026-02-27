// OxfordLab.js - исследовательский журнал эксперимента

class OxfordLab {
    constructor() {
        this.generationLogs = [];
        this.liveMetrics = {
            antsInsideAnthill: 0,
            pheromoneFoodIntensity: 0,
            pheromoneDangerIntensity: 0,
            weatherState: 'clear'
        };
    }

    updateLive({ ants, pheromones, weather }) {
        this.liveMetrics.antsInsideAnthill = ants.filter(a => a.insideAnthill && !a.dead).length;
        this.liveMetrics.weatherState = weather.current;

        // Берем средние по сетке как грубую «плотность сигналов»
        let f = 0;
        let d = 0;
        for (let i = 0; i < pheromones.foodTrail.length; i++) {
            f += pheromones.foodTrail[i];
            d += pheromones.dangerTrail[i];
        }

        this.liveMetrics.pheromoneFoodIntensity = (f / pheromones.foodTrail.length).toFixed(2);
        this.liveMetrics.pheromoneDangerIntensity = (d / pheromones.dangerTrail.length).toFixed(2);
    }

    logGeneration({ generation, ants, anthill, weather }) {
        const avgFitness = ants.length ? ants.reduce((sum, a) => sum + a.fitness, 0) / ants.length : 0;
        const avgFood = ants.length ? ants.reduce((sum, a) => sum + a.foodEaten, 0) / ants.length : 0;

        this.generationLogs.push({
            generation,
            survivors: ants.length,
            anthillFood: anthill.foodStorage,
            avgFitness: Math.round(avgFitness),
            avgFood: Number(avgFood.toFixed(1)),
            weather: weather.current
        });

        if (this.generationLogs.length > 12) {
            this.generationLogs.shift();
        }
    }

    getSummaryLines() {
        const last = this.generationLogs[this.generationLogs.length - 1];
        if (!last) return ['Лаборатория: сбор данных...'];

        return [
            `OxfordLab | Gen ${last.generation}`,
            `Выжившие: ${last.survivors} | Еда колонии: ${last.anthillFood}`,
            `Средний фитнес: ${last.avgFitness} | Ср. еда: ${last.avgFood}`,
            `Погода: ${this.liveMetrics.weatherState}`,
            `Феромоны food/danger: ${this.liveMetrics.pheromoneFoodIntensity} / ${this.liveMetrics.pheromoneDangerIntensity}`
        ];
    }
}
