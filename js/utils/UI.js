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

        this.selectedAnt = null;
    }
    
    // Обновить общую статистику
    updateStats(generation, ants, food, anthill = null, giantSpiders = []) {
        this.generationSpan.textContent = generation;
        
        const aliveAnts = ants.filter(ant => !ant.dead).length;
        this.antCountSpan.textContent = aliveAnts;
        
        const activeFood = food.filter(f => !f.eaten).length;
        this.foodCountSpan.textContent = activeFood;

        if (this.anthillFoodSpan) {
            this.anthillFoodSpan.textContent = anthill ? anthill.foodStorage : 0;
        }

        if (this.spiderCountSpan) {
            this.spiderCountSpan.textContent = giantSpiders.length;
        }
    }
    
    // Показать информацию о муравье
    showAntInfo(ant) {
        this.selectedAnt = ant;
        const info = ant.getInfo();
        
        let html = `<div class="ant-details">`;
        html += `<h4>Муравей #${Math.floor(ant.age + ant.x)}</h4>`;
        html += `<div style="background: #4a4a4a; padding: 10px; border-radius: 3px;">`;
        
        // Прогресс-бары для характеристик
        html += this.createProgressBar('Скорость', info['Скорость'], 3, 3);
        html += this.createProgressBar('Зрение', info['Зрение'], 200, 200);
        html += this.createProgressBar('Осторожность', info['Осторожность'], 100, '%');
        html += this.createProgressBar('Исследование', info['Исследование'], 100, '%');
        
        html += `<hr style="border-color: #666; margin: 10px 0;">`;
        
        // Статистика
        html += `<p>🍎 Съедено: <span style="color: #4caf50; float: right;">${info['Съедено еды']}</span></p>`;
        html += `<p>📊 Фитнес: <span style="color: #ffaa00; float: right;">${info['Фитнес']}</span></p>`;
        html += `<p>👣 Шагов: <span style="color: #888; float: right;">${info['Шагов']}</span></p>`;
        html += `<p>🧠 Память: <span style="color: #888; float: right;">${info['Память']}</span></p>`;
        html += `<p>🫀 Здоровье: <span style="color: #ff8a80; float: right;">${info['Здоровье']}</span></p>`;
        html += `<p>📦 Несу еду: <span style="color: #ffd54f; float: right;">${info['Несу еду']}</span></p>`;
        
        html += `</div></div>`;
        
        this.antInfoDiv.innerHTML = html;
    }
    
    createProgressBar(label, value, max, suffix = '') {
        // Убираем % если он уже есть
        const numericValue = parseFloat(value.toString().replace('%', ''));
        const percent = (numericValue / max) * 100;
        
        return `
            <div style="margin: 8px 0;">
                <div style="display: flex; justify-content: space-between;">
                    <span>${label}:</span>
                    <span style="color: #4caf50;">${value}${suffix}</span>
                </div>
                <div style="background: #2a2a2a; height: 4px; border-radius: 2px; margin-top: 2px;">
                    <div style="background: #4caf50; width: ${percent}%; height: 100%; border-radius: 2px;"></div>
                </div>
            </div>
        `;
    }
    
    // Показать сообщение (например, "Новое поколение!")
    showMessage(text, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = text;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'success' ? '#4caf50' : '#333'};
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
            animation: fadeOut 3s forwards;
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
    
    // Очистить информацию (когда муравей умер)
    clearAntInfo() {
        this.antInfoDiv.innerHTML = 'Кликните на муравья';
        this.selectedAnt = null;
    }
}

// Добавляем стили для анимации
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        0% { opacity: 1; }
        70% { opacity: 1; }
        100% { opacity: 0; }
    }
`;
document.head.appendChild(style);