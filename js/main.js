// main.js - главный файл, запускает симуляцию

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const anthillModal = document.getElementById('anthill-modal');
    const anthillCanvas = document.getElementById('anthill-canvas');
    const anthillCtx = anthillCanvas.getContext('2d');
    const anthillCloseBtn = document.getElementById('anthill-close');

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
    let anthillViewOpen = false;

    let ants = [];
    let food = [];
    let predators = [];
    let trees = [];
    let giantSpiders = [];
    let anthill = null;
    let lastRoomExpansionAt = 0;

    function spawnFood(amount = 1) {
        for (let i = 0; i < amount; i++) {
            food.push(new Food(Math.random() * CONFIG.WORLD_WIDTH, Math.random() * CONFIG.WORLD_HEIGHT));
        }
    }

    function initWorld() {
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
            ants.push(new Ant(
                anthill.x + Math.cos(angle) * dist,
                anthill.y + Math.sin(angle) * dist,
                Genetics.createRandomDNA(),
                anthill
            ));
        }

        anthill.population = ants.length;
        camera.x = CONFIG.WORLD_WIDTH / 2;
        camera.y = CONFIG.WORLD_HEIGHT / 2;
        camera.scale = 0.5;
    }

    function updateSpidersAndWebs() {
        giantSpiders.forEach(spider => {
            spider.update(ants);
            spider.webTraps.forEach(web => {
                ants.forEach(ant => {
                    if (ant.dead || ant.insideAnthill) return;
                    const dist = Math.hypot(ant.x - web.x, ant.y - web.y);
                    if (dist < 20) {
                        ant.vx *= 0.85;
                        ant.vy *= 0.85;
                        if (Math.random() < 0.03) ant.takeDamage(1);
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

        ants = ants.filter(ant => !ant.dead);
        anthill.population = ants.length;

        if (ui.selectedAnt && ui.selectedAnt.dead) {
            ui.clearAntInfo();
            camera.followingAnt = null;
        }

        food = food.filter(f => !f.eaten);
        if (food.length < CONFIG.INITIAL_FOOD / 2) spawnFood(3);

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

        ants = Genetics.createNewGeneration(ants, CONFIG.WORLD_WIDTH, CONFIG.WORLD_HEIGHT).map(ant => {
            const angle = Math.random() * Math.PI * 2;
            const dist = 30 + Math.random() * 70;
            ant.x = anthill.x + Math.cos(angle) * dist;
            ant.y = anthill.y + Math.sin(angle) * dist;
            ant.anthill = anthill;
            return ant;
        });

        anthill.population = ants.length;
        generation++;
        stepCount = 0;
        ui.showMessage(`Поколение ${generation}`, 'success');

        if (camera.followingAnt) camera.followingAnt = null;
    }

    function drawMainWorld() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = CONFIG.COLORS.GRASS;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (anthill && camera.isVisible(anthill)) anthill.draw(ctx, camera);

        trees.forEach(obj => { if (camera.isVisible(obj)) obj.draw(ctx, camera); });
        food.forEach(obj => { if (camera.isVisible(obj)) obj.draw(ctx, camera); });
        predators.forEach(obj => { if (camera.isVisible(obj)) obj.draw(ctx, camera); });
        giantSpiders.forEach(obj => { if (camera.isVisible(obj)) obj.draw(ctx, camera); });
        ants.forEach(obj => { if (camera.isVisible(obj)) obj.draw(ctx, camera); });

        ui.updateStats(generation, ants, food, anthill, giantSpiders);

        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText(`Поколение: ${generation}`, 10, 20);
        ctx.fillText(`Запас колонии: ${anthill ? anthill.foodStorage : 0}`, 10, 40);
        ctx.fillText(`Внутри муравейника: ${ants.filter(a => a.insideAnthill).length}`, 10, 60);
    }

    function drawAnthillWorld() {
        if (!anthillViewOpen || !anthill) return;

        anthillCtx.clearRect(0, 0, anthillCanvas.width, anthillCanvas.height);
        anthillCtx.fillStyle = '#101010';
        anthillCtx.fillRect(0, 0, anthillCanvas.width, anthillCanvas.height);

        const bounds = {
            minX: Math.min(...anthill.rooms.map(r => r.x - r.radius)) - 30,
            maxX: Math.max(...anthill.rooms.map(r => r.x + r.radius)) + 30,
            minY: Math.min(...anthill.rooms.map(r => r.y - r.radius)) - 30,
            maxY: Math.max(...anthill.rooms.map(r => r.y + r.radius)) + 30
        };

        const scaleX = anthillCanvas.width / (bounds.maxX - bounds.minX);
        const scaleY = anthillCanvas.height / (bounds.maxY - bounds.minY);
        const scale = Math.min(scaleX, scaleY);

        function toScreen(x, y) {
            return {
                x: (x - bounds.minX) * scale,
                y: (y - bounds.minY) * scale
            };
        }

        anthill.tunnels.forEach(tunnel => {
            anthillCtx.strokeStyle = '#6d4c41';
            anthillCtx.lineWidth = 4;
            anthillCtx.beginPath();
            tunnel.points.forEach((p, i) => {
                const s = toScreen(p.x, p.y);
                if (i === 0) anthillCtx.moveTo(s.x, s.y);
                else anthillCtx.lineTo(s.x, s.y);
            });
            anthillCtx.stroke();
        });

        anthill.rooms.forEach(room => {
            const s = toScreen(room.x, room.y);
            const color = room.type === 'main' ? '#8B4513' : room.type === 'storage' ? '#DAA520' : '#A0522D';
            anthillCtx.fillStyle = color;
            anthillCtx.beginPath();
            anthillCtx.arc(s.x, s.y, room.radius * scale, 0, Math.PI * 2);
            anthillCtx.fill();
            anthillCtx.strokeStyle = '#3e2723';
            anthillCtx.stroke();
        });

        ants.filter(ant => ant.insideAnthill && !ant.dead).forEach(ant => {
            const s = toScreen(ant.indoorX, ant.indoorY);
            anthillCtx.fillStyle = ant.selected ? '#ffff00' : '#ffb300';
            anthillCtx.beginPath();
            anthillCtx.arc(s.x, s.y, 3, 0, Math.PI * 2);
            anthillCtx.fill();
        });

        anthillCtx.fillStyle = 'white';
        anthillCtx.font = '14px Arial';
        anthillCtx.fillText(`Внутри: ${ants.filter(a => a.insideAnthill).length}  Запас еды: ${anthill.foodStorage}`, 12, 20);
    }

    function draw() {
        drawMainWorld();
        drawAnthillWorld();
    }

    function toggleAnthillView(open) {
        anthillViewOpen = open;
        anthillModal.classList.toggle('hidden', !open);
    }

    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const worldPos = camera.screenToWorld(mouseX, mouseY);

        if (anthill) {
            const distToAnthill = Math.hypot(worldPos.x - anthill.x, worldPos.y - anthill.y);
            if (distToAnthill < anthill.size) {
                toggleAnthillView(true);
                return;
            }
        }

        let clickedAnt = null;
        let minDist = 20 / camera.scale;

        ants.forEach(ant => {
            if (ant.insideAnthill) return;
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
        }
    });

    anthillCloseBtn.addEventListener('click', () => toggleAnthillView(false));
    anthillModal.addEventListener('click', (e) => {
        if (e.target === anthillModal) toggleAnthillView(false);
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
        if (e.key === 'Escape' && anthillViewOpen) {
            toggleAnthillView(false);
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
