// main.js - главный файл, запускает симуляцию

document.addEventListener('DOMContentLoaded', () => {
    console.log('Симуляция запускается...');

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const camera = new Camera(
        CONFIG.CANVAS_WIDTH,
        CONFIG.CANVAS_HEIGHT,
        CONFIG.WORLD_WIDTH,
        CONFIG.WORLD_HEIGHT
    );

    const ui = new UI();

    let generation = 1;
    let stepCount = 0;
    let paused = false;

    let ants = [];
    let food = [];
    let predators = [];
    let trees = [];
    let giantSpiders = [];
    let anthill = null;
    let lastRoomExpansionAt = 0;

    function spawnFood(amount = 1) {
        for (let i = 0; i < amount; i++) {
            const x = Math.random() * CONFIG.WORLD_WIDTH;
            const y = Math.random() * CONFIG.WORLD_HEIGHT;
            food.push(new Food(x, y));
        }
    }

    function initWorld() {
        console.log('Инициализация мира V2...');

        trees = [];
        food = [];
        predators = [];
        giantSpiders = [];
        ants = [];

        anthill = new Anthill(CONFIG.WORLD_WIDTH / 2, CONFIG.WORLD_HEIGHT / 2);
        lastRoomExpansionAt = 0;

        for (let i = 0; i < CONFIG.INITIAL_TREES; i++) {
            trees.push(new Tree(Math.random() * CONFIG.WORLD_WIDTH, Math.random() * CONFIG.WORLD_HEIGHT));
        }

        spawnFood(CONFIG.INITIAL_FOOD);

        for (let i = 0; i < CONFIG.INITIAL_PREDATORS; i++) {
            predators.push(new Predator(Math.random() * CONFIG.WORLD_WIDTH, Math.random() * CONFIG.WORLD_HEIGHT));
        }

        for (let i = 0; i < CONFIG.INITIAL_GIANT_SPIDERS; i++) {
            const margin = 300;
            giantSpiders.push(new GiantSpider(
                margin + Math.random() * (CONFIG.WORLD_WIDTH - margin * 2),
                margin + Math.random() * (CONFIG.WORLD_HEIGHT - margin * 2)
            ));
        }

        for (let i = 0; i < CONFIG.INITIAL_ANTS; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 40 + Math.random() * 80;
            const x = anthill.x + Math.cos(angle) * dist;
            const y = anthill.y + Math.sin(angle) * dist;
            const ant = new Ant(x, y, Genetics.createRandomDNA(), anthill);
            ants.push(ant);
        }

        anthill.population = ants.length;

        camera.x = CONFIG.WORLD_WIDTH / 2;
        camera.y = CONFIG.WORLD_HEIGHT / 2;
        camera.scale = 0.5;

        console.log('Мир V2 создан');
    }

    function updateSpidersAndWebs() {
        giantSpiders.forEach(spider => {
            spider.update(ants);

            // Дополнительная деталь: паутина замедляет и наносит небольшой урон муравьям
            spider.webTraps.forEach(web => {
                ants.forEach(ant => {
                    if (ant.dead) return;
                    const dist = Math.hypot(ant.x - web.x, ant.y - web.y);
                    if (dist < 20) {
                        ant.vx *= 0.85;
                        ant.vy *= 0.85;
                        if (Math.random() < 0.03) {
                            ant.takeDamage(1);
                        }
                    }
                });
            });
        });
    }

    function update() {
        if (paused) return;

        stepCount++;

        ants.forEach(ant => {
            ant.update(food, predators.concat(giantSpiders), trees, ants, stepCount, anthill);
        });

        predators.forEach(p => p.update());
        updateSpidersAndWebs();

        const beforeCount = ants.length;
        ants = ants.filter(ant => !ant.dead);
        anthill.population = ants.length;

        if (beforeCount !== ants.length && ui.selectedAnt && ui.selectedAnt.dead) {
            ui.clearAntInfo();
            camera.followingAnt = null;
        }

        food = food.filter(f => !f.eaten);

        if (food.length < CONFIG.INITIAL_FOOD / 2) {
            spawnFood(3);
        }

        // Дополнительная деталь: за накопленную еду муравейник расширяется
        if (anthill.foodStorage >= lastRoomExpansionAt + 8 && anthill.rooms.length < 10) {
            anthill.digRoom();
            lastRoomExpansionAt = anthill.foodStorage;
        }

        if (stepCount >= CONFIG.GENERATION_STEPS || ants.length === 0) {
            endGeneration();
        }

        camera.update();
    }

    function endGeneration() {
        console.log('Поколение', generation, 'завершено');

        if (ants.length === 0) {
            initWorld();
            generation++;
            stepCount = 0;
            ui.showMessage(`Колония погибла — перезапуск поколения ${generation}`);
            return;
        }

        ants.forEach(ant => {
            ant.fitness = Genetics.calculateFitness(ant) + ant.foodEaten * 20;
        });

        const newAnts = Genetics.createNewGeneration(ants, CONFIG.WORLD_WIDTH, CONFIG.WORLD_HEIGHT)
            .map(ant => {
                const angle = Math.random() * Math.PI * 2;
                const dist = 30 + Math.random() * 70;
                ant.x = anthill.x + Math.cos(angle) * dist;
                ant.y = anthill.y + Math.sin(angle) * dist;
                ant.anthill = anthill;
                return ant;
            });

        const bestFitness = Math.max(...ants.map(a => a.fitness));
        const avgFitness = ants.reduce((sum, a) => sum + a.fitness, 0) / ants.length;
        console.log(`Лучший фитнес: ${bestFitness.toFixed(0)}, Средний: ${avgFitness.toFixed(0)}`);

        ants = newAnts;
        anthill.population = ants.length;
        generation++;
        stepCount = 0;

        ui.showMessage(`Поколение ${generation}`, 'success');

        if (camera.followingAnt) {
            camera.followingAnt = null;
        }
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = CONFIG.COLORS.GRASS;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;

        const gridSize = 50;
        const startX = Math.floor((camera.x - canvas.width / (2 * camera.scale)) / gridSize) * gridSize;
        const startY = Math.floor((camera.y - canvas.height / (2 * camera.scale)) / gridSize) * gridSize;
        const endX = camera.x + canvas.width / (2 * camera.scale);
        const endY = camera.y + canvas.height / (2 * camera.scale);

        ctx.beginPath();
        for (let x = startX; x < endX; x += gridSize) {
            const screenX = (x - camera.x) * camera.scale + canvas.width / 2;
            if (screenX >= 0 && screenX <= canvas.width) {
                ctx.moveTo(screenX, 0);
                ctx.lineTo(screenX, canvas.height);
            }
        }
        for (let y = startY; y < endY; y += gridSize) {
            const screenY = (y - camera.y) * camera.scale + canvas.height / 2;
            if (screenY >= 0 && screenY <= canvas.height) {
                ctx.moveTo(0, screenY);
                ctx.lineTo(canvas.width, screenY);
            }
        }
        ctx.stroke();

        let visibleCount = 0;

        if (anthill && camera.isVisible(anthill)) {
            anthill.draw(ctx, camera);
            visibleCount++;
        }

        trees.forEach(obj => {
            if (camera.isVisible(obj)) {
                obj.draw(ctx, camera);
                visibleCount++;
            }
        });

        food.forEach(obj => {
            if (camera.isVisible(obj)) {
                obj.draw(ctx, camera);
                visibleCount++;
            }
        });

        predators.forEach(obj => {
            if (camera.isVisible(obj)) {
                obj.draw(ctx, camera);
                visibleCount++;
            }
        });

        giantSpiders.forEach(obj => {
            if (camera.isVisible(obj)) {
                obj.draw(ctx, camera);
                visibleCount++;
            }
        });

        ants.forEach(obj => {
            if (camera.isVisible(obj)) {
                obj.draw(ctx, camera);
                visibleCount++;
            }
        });

        ui.updateStats(generation, ants, food, anthill, giantSpiders);

        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText(`Объектов видно: ${visibleCount}`, 10, 20);
        ctx.fillText(`Масштаб: ${camera.scale.toFixed(2)}`, 10, 40);
        ctx.fillText(`Позиция: (${Math.floor(camera.x)}, ${Math.floor(camera.y)})`, 10, 60);
        ctx.fillText(`Запас колонии: ${anthill ? anthill.foodStorage : 0}`, 10, 80);
    }

    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const worldPos = camera.screenToWorld(mouseX, mouseY);

        let clickedAnt = null;
        let minDist = 20 / camera.scale;

        ants.forEach(ant => {
            const dist = Math.hypot(ant.x - worldPos.x, ant.y - worldPos.y);
            if (dist < minDist) {
                clickedAnt = ant;
                minDist = dist;
            }
        });

        if (clickedAnt) {
            ants.forEach(ant => { ant.selected = false; });
            clickedAnt.selected = true;
            camera.follow(clickedAnt);
            ui.showAntInfo(clickedAnt);
        } else {
            console.log('Клик в мире:', worldPos);
        }
    });

    window.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'p') {
            paused = !paused;
            ui.showMessage(paused ? 'Пауза' : 'Продолжаем');
        }
        if (e.key.toLowerCase() === 'r') {
            initWorld();
            generation = 1;
            stepCount = 0;
            ui.showMessage('Мир V2 перезапущен!');
        }
    });

    initWorld();

    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    gameLoop();
});
