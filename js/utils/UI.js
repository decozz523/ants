// UI.js - управление интерфейсом

class UI {
    constructor() {
        this.infoPanel = document.getElementById('info-panel');
        this.antInfoDiv = document.getElementById('ant-info');
        this.generationSpan = document.getElementById('generation');
        this.antCountSpan = document.getElementById('ant-count');
        this.foodCountSpan = document.getElementById('food-count');
        this.anthillFoodSpan = document.getElementById('anthill-food');
        this.spiderCountSpan = document.getElementById('spider-count');
        this.weatherStateSpan = document.getElementById('weather-state');
        this.selectedAnt = null;
    }

    updateStats(generation, ants, food, anthill = null, giantSpiders = [], weatherState = 'clear') {
        this.generationSpan.textContent = generation;
        this.antCountSpan.textContent = ants.filter(ant => !ant.dead).length;
        this.foodCountSpan.textContent = food.filter(f => !f.eaten).length;

        if (this.anthillFoodSpan) this.anthillFoodSpan.textContent = anthill ? anthill.foodStorage : 0;
        if (this.spiderCountSpan) this.spiderCountSpan.textContent = giantSpiders.length;
        if (this.weatherStateSpan) this.weatherStateSpan.textContent = weatherState;

        if (this.selectedAnt) {
            if (this.selectedAnt.dead) {
                this.clearAntInfo();
            } else {
                this.showAntInfo(this.selectedAnt);
            }
        }
    }

    showAntInfo(ant) {
        this.selectedAnt = ant;
        const info = ant.getInfo();

        this.antInfoDiv.innerHTML = `
            <div class="ant-details">
                <h4>Муравей #${Math.floor(ant.age + ant.x)}</h4>
                <div class="ant-card">
                    ${this.createProgressBar('Скорость', info['Скорость'], 3)}
                    ${this.createProgressBar('Зрение', info['Зрение'], 200)}
                    ${this.createProgressBar('Осторожность', info['Осторожность'], 100)}
                    ${this.createProgressBar('Исследование', info['Исследование'], 100)}
                    <hr>
                    ${this.createRow('🍎 Съедено', info['Съедено еды'], 'green')}
                    ${this.createRow('📊 Фитнес', info['Фитнес'], 'amber')}
                    ${this.createRow('👣 Шагов', info['Шагов'])}
                    ${this.createRow('🧠 Память', info['Память'])}
                    ${this.createRow('🫀 Здоровье', info['Здоровье'], 'red')}
                    ${this.createRow('📦 Несу еду', info['Несу еду'], 'amber')}
                    ${this.createRow('🏠 В муравейнике', info['В муравейнике'], 'blue')}
                </div>
            </div>
        `;
    }

    createProgressBar(label, rawValue, max) {
        const numericValue = parseFloat(String(rawValue).replace('%', ''));
        const percent = Math.max(0, Math.min(100, (numericValue / max) * 100));

        return `
            <div class="bar-item">
                <div class="bar-head">
                    <span>${label}</span>
                    <span class="bar-value">${rawValue}</span>
                </div>
                <div class="bar-track">
                    <div class="bar-fill" style="width:${percent}%"></div>
                </div>
            </div>
        `;
    }

    createRow(label, value, tone = 'default') {
        return `
            <p class="info-row">
                <span>${label}</span>
                <span class="info-value tone-${tone}">${value}</span>
            </p>
        `;
    }

    showMessage(text, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = text;
        document.body.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.remove();
        }, 2800);
    }

    clearAntInfo() {
        this.antInfoDiv.innerHTML = 'Кликните на муравья';
        this.selectedAnt = null;
    }
}
