// main.js - главный файл, запускает симуляцию

// Ждем загрузки страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('Симуляция запускается...');
    
    // Инициализация
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    
    // Создаем камеру
    const camera = new Camera(
        CONFIG.CANVAS_WIDTH,
        CONFIG.CANVAS_HEIGHT,
        CONFIG.WORLD_WIDTH,
        CONFIG.WORLD_HEIGHT
    );
    
    // Создаем UI
    const ui = new UI();
    
    // Состояние симуляции
    let generation = 1;
    let stepCount = 0;
    let paused = false;
    
    // Массивы для объектов
    let ants = [];
    let food = [];
    let predators = [];
    let trees = [];
    
    // Инициализация мира
    function initWorld() {
        console.log('Инициализация мира...');
        
        // Очищаем массивы
        trees = [];
        food = [];
        predators = [];
        ants = [];
        
        // Создаем деревья
        for (let i = 0; i < CONFIG.INITIAL_TREES; i++) {
            const x = Math.random() * CONFIG.WORLD_WIDTH;
            const y = Math.random() * CONFIG.WORLD_HEIGHT;
            trees.push(new Tree(x, y));
        }
        console.log(`Создано ${trees.length} деревьев`);
        
        // Создаем еду
        for (let i = 0; i < CONFIG.INITIAL_FOOD; i++) {
            const x = Math.random() * CONFIG.WORLD_WIDTH;
            const y = Math.random() * CONFIG.WORLD_HEIGHT;
            food.push(new Food(x, y));
        }
        console.log(`Создано ${food.length} еды`);
        
        // Создаем хищников
        for (let i = 0; i < CONFIG.INITIAL_PREDATORS; i++) {
            const x = Math.random() * CONFIG.WORLD_WIDTH;
            const y = Math.random() * CONFIG.WORLD_HEIGHT;
            predators.push(new Predator(x, y));
        }
        console.log(`Создано ${predators.length} хищников`);
        
        // Создаем муравьев (первое поколение)
        for (let i = 0; i < CONFIG.INITIAL_ANTS; i++) {
            // Стартуем в центре, но с разбросом
            const x = CONFIG.WORLD_WIDTH/2 + (Math.random() - 0.5) * 400;
            const y = CONFIG.WORLD_HEIGHT/2 + (Math.random() - 0.5) * 400;
            const dna = Genetics.createRandomDNA();
            ants.push(new Ant(x, y, dna));
        }
        console.log(`Создано ${ants.length} муравьев`);
        
        // Устанавливаем камеру в центр мира
        camera.x = CONFIG.WORLD_WIDTH / 2;
        camera.y = CONFIG.WORLD_HEIGHT / 2;
        camera.scale = 0.5; // Начинаем с отдалением, чтобы видеть больше
        
        console.log('Мир создан!');
    }
    
    // Обновление симуляции
    function update() {
        if (paused) return;
        
        stepCount++;
        
        // 1. Обновляем муравьев
        ants.forEach(ant => {
            ant.update(food, predators, trees, ants, stepCount);
        });
        
        // 2. Обновляем хищников
        predators.forEach(p => p.update());
        
        // 3. Убираем съеденную еду
        food = food.filter(f => !f.eaten);
        
        // 4. Добавляем новую еду (если мало)
        const activeFood = food.filter(f => !f.eaten).length;
        if (activeFood < CONFIG.INITIAL_FOOD / 2) {
            for (let i = 0; i < 3; i++) {
                const x = Math.random() * CONFIG.WORLD_WIDTH;
                const y = Math.random() * CONFIG.WORLD_HEIGHT;
                food.push(new Food(x, y));
            }
        }
        
        // 5. Проверяем конец поколения
        if (stepCount >= CONFIG.GENERATION_STEPS) {
            endGeneration();
        }
        
        // 6. Обновляем камеру
        camera.update();
    }
    
    // Завершение поколения и эволюция
    function endGeneration() {
        console.log('Поколение', generation, 'завершено!');
        
        // Вычисляем фитнес для всех муравьев
        ants.forEach(ant => {
            ant.fitness = Genetics.calculateFitness(ant);
        });
        
        // Создаем новое поколение
        const newAnts = Genetics.createNewGeneration(ants, CONFIG.WORLD_WIDTH, CONFIG.WORLD_HEIGHT);
        
        // Обновляем статистику
        const bestFitness = Math.max(...ants.map(a => a.fitness));
        const avgFitness = ants.reduce((sum, a) => sum + a.fitness, 0) / ants.length;
        
        console.log(`Лучший фитнес: ${bestFitness.toFixed(0)}, Средний: ${avgFitness.toFixed(0)}`);
        
        // Заменяем муравьев
        ants = newAnts;
        generation++;
        stepCount = 0;
        
        // Показываем сообщение
        ui.showMessage(`Поколение ${generation}`, 'success');
        
        // Если следили за муравьем, сбрасываем
        if (camera.followingAnt) {
            camera.followingAnt = null;
        }
    }
    
    // Отрисовка
    function draw() {
        // Очищаем canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Рисуем фон
        ctx.fillStyle = CONFIG.COLORS.GRASS;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Рисуем сетку для лучшего восприятия масштаба
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        
        const gridSize = 50;
        const startX = Math.floor((camera.x - canvas.width/(2*camera.scale)) / gridSize) * gridSize;
        const startY = Math.floor((camera.y - canvas.height/(2*camera.scale)) / gridSize) * gridSize;
        const endX = camera.x + canvas.width/(2*camera.scale);
        const endY = camera.y + canvas.height/(2*camera.scale);
        
        ctx.beginPath();
        for (let x = startX; x < endX; x += gridSize) {
            const screenX = (x - camera.x) * camera.scale + canvas.width/2;
            if (screenX >= 0 && screenX <= canvas.width) {
                ctx.moveTo(screenX, 0);
                ctx.lineTo(screenX, canvas.height);
            }
        }
        
        for (let y = startY; y < endY; y += gridSize) {
            const screenY = (y - camera.y) * camera.scale + canvas.height/2;
            if (screenY >= 0 && screenY <= canvas.height) {
                ctx.moveTo(0, screenY);
                ctx.lineTo(canvas.width, screenY);
            }
        }
        ctx.stroke();
        
        // Подсчет видимых объектов для отладки
        let visibleCount = 0;
        
        // Рисуем деревья
        trees.forEach(obj => {
            if (camera.isVisible(obj)) {
                obj.draw(ctx, camera);
                visibleCount++;
            }
        });
        
        // Рисуем еду
        food.forEach(obj => {
            if (camera.isVisible(obj)) {
                obj.draw(ctx, camera);
                visibleCount++;
            }
        });
        
        // Рисуем хищников
        predators.forEach(obj => {
            if (camera.isVisible(obj)) {
                obj.draw(ctx, camera);
                visibleCount++;
            }
        });
        
        // Рисуем муравьев
        ants.forEach(obj => {
            if (camera.isVisible(obj)) {
                obj.draw(ctx, camera);
                visibleCount++;
            }
        });
        
        // Обновляем UI статистику
        ui.updateStats(generation, ants, food);
        
        // Отладочная информация
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText(`Объектов видно: ${visibleCount}`, 10, 20);
        ctx.fillText(`Масштаб: ${camera.scale.toFixed(2)}`, 10, 40);
        ctx.fillText(`Позиция: (${Math.floor(camera.x)}, ${Math.floor(camera.y)})`, 10, 60);
    }
    
    // Обработка клика по муравью
    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Конвертируем в мировые координаты
        const worldPos = camera.screenToWorld(mouseX, mouseY);
        
        // Ищем ближайшего муравья
        let clickedAnt = null;
        let minDist = 20 / camera.scale; // Радиус клика в мировых координатах
        
        ants.forEach(ant => {
            const dist = Math.sqrt((ant.x - worldPos.x)**2 + (ant.y - worldPos.y)**2);
            if (dist < minDist) {
                clickedAnt = ant;
                minDist = dist;
            }
        });
        
        if (clickedAnt) {
            // Снимаем выделение с предыдущего
            ants.forEach(ant => ant.selected = false);
            
            // Выделяем нового
            clickedAnt.selected = true;
            camera.follow(clickedAnt);
            ui.showAntInfo(clickedAnt);
        } else {
            // Если кликнули не по муравью, показываем координаты
            console.log('Клик в мире:', worldPos);
        }
    });
    
    // Обработка клавиши паузы (P)
    window.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'p') {
            paused = !paused;
            ui.showMessage(paused ? 'Пауза' : 'Продолжаем');
        }
        // Добавим клавишу R для рестарта
        if (e.key.toLowerCase() === 'r') {
            initWorld();
            ui.showMessage('Мир перезапущен!');
        }
    });
    
    // Запуск симуляции
    console.log('Запускаем initWorld...');
    initWorld();
    
    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
    
    gameLoop();
});
// В main.js добавим новые объекты:

// После инициализации массивов:
let anthill = null;
let giantSpiders = [];

// В initWorld():
function initWorld() {
    console.log('Инициализация мира V2...');
    
    // Очищаем массивы
    trees = [];
    food = [];
    predators = [];
    giantSpiders = [];
    ants = [];
    
    // Создаем муравейник в центре
    anthill = new Anthill(CONFIG.WORLD_WIDTH/2, CONFIG.WORLD_HEIGHT/2);
    
    // Создаем деревья
    for (let i = 0; i < CONFIG.INITIAL_TREES; i++) {
        const x = Math.random() * CONFIG.WORLD_WIDTH;
        const y = Math.random() * CONFIG.WORLD_HEIGHT;
        trees.push(new Tree(x, y));
    }
    
    // Создаем еду
    for (let i = 0; i < CONFIG.INITIAL_FOOD; i++) {
        const x = Math.random() * CONFIG.WORLD_WIDTH;
        const y = Math.random() * CONFIG.WORLD_HEIGHT;
        food.push(new Food(x, y));
    }
    
    // Создаем обычных хищников (поменьше)
    for (let i = 0; i < 2; i++) {
        const x = Math.random() * CONFIG.WORLD_WIDTH;
        const y = Math.random() * CONFIG.WORLD_HEIGHT;
        predators.push(new Predator(x, y));
    }
    
    // Создаем гигантских пауков (2-3)
    for (let i = 0; i < 2; i++) {
        const x = 500 + Math.random() * (CONFIG.WORLD_WIDTH - 1000);
        const y = 500 + Math.random() * (CONFIG.WORLD_HEIGHT - 1000);
        giantSpiders.push(new GiantSpider(x, y));
    }
    
    // Создаем муравьев
    for (let i = 0; i < CONFIG.INITIAL_ANTS; i++) {
        // Стартуем возле муравейника
        const angle = Math.random() * Math.PI * 2;
        const dist = 30 + Math.random() * 50;
        const x = anthill.x + Math.cos(angle) * dist;
        const y = anthill.y + Math.sin(angle) * dist;
        const dna = Genetics.createRandomDNA();
        const ant = new Ant(x, y, dna);
        ant.anthill = anthill; // Даем ссылку на муравейник
        ants.push(ant);
        anthill.population++;
    }
    
    console.log('Мир V2 создан! Муравейник в центре');
}

// В update():
function update() {
    if (paused) return;
    
    stepCount++;
    
    // 1. Обновляем муравьев с ссылкой на муравейник
    ants.forEach(ant => {
        if (!ant.dead) {
            ant.update(food, predators.concat(giantSpiders), trees, ants.filter(a => !a.dead), stepCount, anthill);
        }
    });
    
    // Убираем мертвых муравьев
    ants = ants.filter(ant => {
        if (ant.dead) {
            if (anthill) anthill.population--;
            return false;
        }
        return true;
    });
    
    // 2. Обновляем хищников
    predators.forEach(p => p.update());
    giantSpiders.forEach(s => s.update(ants));
    
    // 3. Убираем съеденную еду
    food = food.filter(f => !f.eaten);
    
    // 4. Добавляем новую еду
    if (food.length < CONFIG.INITIAL_FOOD / 2) {
        for (let i = 0; i < 3; i++) {
            const x = Math.random() * CONFIG.WORLD_WIDTH;
            const y = Math.random() * CONFIG.WORLD_HEIGHT;
            food.push(new Food(x, y));
        }
    }
    
    // 5. Проверяем конец поколения
    if (stepCount >= CONFIG.GENERATION_STEPS) {
        endGeneration();
    }
    
    // 6. Обновляем камеру
    camera.update();
}

// В draw() добавим отрисовку муравейника и пауков:
function draw() {
    // ... существующий код ...
    
    // Рисуем муравейник (он должен быть под муравьями)
    if (anthill) {
        anthill.draw(ctx, camera);
    }
    
    // Рисуем деревья
    trees.forEach(obj => {
        if (camera.isVisible(obj)) obj.draw(ctx, camera);
    });
    
    // Рисуем еду
    food.forEach(obj => {
        if (camera.isVisible(obj)) obj.draw(ctx, camera);
    });
    
    // Рисуем хищников (обычных)
    predators.forEach(obj => {
        if (camera.isVisible(obj)) obj.draw(ctx, camera);
    });
    
    // Рисуем гигантских пауков
    giantSpiders.forEach(obj => {
        if (camera.isVisible(obj)) obj.draw(ctx, camera);
    });
    
    // Рисуем муравьев (поверх всего)
    ants.forEach(obj => {
        if (!obj.dead && camera.isVisible(obj)) obj.draw(ctx, camera);
    });
    
    // ... остальной код ...
}