// main.js - расширенная песочница муравьиной эволюции

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const anthillModal = document.getElementById('anthill-modal');
    const anthillCanvas = document.getElementById('anthill-canvas');
    const anthillCtx = anthillCanvas.getContext('2d');
    const anthillCloseBtn = document.getElementById('anthill-close');

    const camera = new Camera(CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT, CONFIG.WORLD_WIDTH, CONFIG.WORLD_HEIGHT);
    const ui = new UI();
    const weather = new WeatherSystem();
    const oxfordLab = new OxfordLab();
    const pheromones = new PheromoneField(CONFIG.WORLD_WIDTH, CONFIG.WORLD_HEIGHT, 40);

    let generation = 1;
    let stepCount = 0;
    let paused = false;
    let anthillViewOpen = false;
    let debugPheromones = false;

    let ants = [];
    let food = [];
    let predators = [];
    let trees = [];
    let waterZones = [];
    let giantSpiders = [];
    let anthill = null;
    let lastRoomExpansionAt = 0;

    const terrainSeed = Array.from({ length: 90 }, () => ({
        x: Math.random() * CONFIG.WORLD_WIDTH,
        y: Math.random() * CONFIG.WORLD_HEIGHT,
        radius: 90 + Math.random() * 170,
        hue: 95 + Math.random() * 35,
        alpha: 0.06 + Math.random() * 0.08
    }));

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
        waterZones = [];

        anthill = new Anthill(CONFIG.WORLD_WIDTH / 2, CONFIG.WORLD_HEIGHT / 2);
        lastRoomExpansionAt = 0;

        for (let i = 0; i < CONFIG.INITIAL_TREES; i++) {
            trees.push(new Tree(Math.random() * CONFIG.WORLD_WIDTH, Math.random() * CONFIG.WORLD_HEIGHT));
        }

        for (let i = 0; i < CONFIG.INITIAL_WATER_ZONES; i++) {
            waterZones.push(new WaterZone(
                200 + Math.random() * (CONFIG.WORLD_WIDTH - 400),
                200 + Math.random() * (CONFIG.WORLD_HEIGHT - 400),
                70 + Math.random() * 60
            ));
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
        const effects = weather.getEffects();

        giantSpiders.forEach(spider => {
            const base = spider.speed;
            spider.speed = base * effects.predatorSpeedMultiplier;
            spider.update(ants);
            spider.speed = base;

            spider.webTraps.forEach(web => {
                ants.forEach(ant => {
                    if (ant.dead || ant.insideAnthill) return;
                    const dist = Math.hypot(ant.x - web.x, ant.y - web.y);
                    if (dist < 20) {
                        ant.vx *= 0.85;
                        ant.vy *= 0.85;
                        if (Math.random() < 0.03) ant.takeDamage(1);
                        pheromones.deposit('danger', ant.x, ant.y, 2.5);
                    }
                });
            });
        });
    }

    function update() {
        if (paused) return;
        stepCount++;

        weather.update();
        const weatherEffects = weather.getEffects();

        ants.forEach(ant => {
            ant.update(
                food,
                predators.concat(giantSpiders),
                trees,
                ants,
                stepCount,
                anthill,
                { pheromones, weatherEffects, waterZones }
            );
        });

        predators.forEach(p => p.update());
        updateSpidersAndWebs();
        pheromones.update();

        ants = ants.filter(ant => !ant.dead);
        anthill.population = ants.length;

        if (ui.selectedAnt?.dead) {
            ui.clearAntInfo();
            camera.followingAnt = null;
        }

        food = food.filter(f => !f.eaten);
        if (food.length < CONFIG.INITIAL_FOOD / 2) {
            spawnFood(Math.max(1, Math.round(3 * weatherEffects.foodSpawnBonus)));
        }

        if (anthill.foodStorage >= lastRoomExpansionAt + 8 && anthill.rooms.length < 16) {
            anthill.digRoom();
            lastRoomExpansionAt = anthill.foodStorage;
        }

        oxfordLab.updateLive({ ants, pheromones, weather });

        if (stepCount >= CONFIG.GENERATION_STEPS || ants.length === 0) endGeneration();
        camera.update();
    }

    function endGeneration() {
        if (ants.length === 0) {
            initWorld();
            generation++;
            stepCount = 0;
            ui.showMessage(`Колония погибла — поколение ${generation} перезапущено`);
            return;
        }

        ants.forEach(ant => {
            ant.fitness = Genetics.calculateFitness(ant) + ant.foodEaten * 20 + (ant.insideAnthill ? 5 : 0);
        });

        oxfordLab.logGeneration({ generation, ants, anthill, weather });

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
        ui.showMessage(`Поколение ${generation}: данные сохранены в OxfordLab`, 'success');
        camera.followingAnt = null;
    }

    function drawWorldBackground() {
        const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bgGradient.addColorStop(0, '#28492c');
        bgGradient.addColorStop(1, '#1f3b25');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        terrainSeed.forEach(spot => {
            const s = camera.worldToScreen(spot.x, spot.y);
            const radius = spot.radius * camera.scale;
            if (radius < 8 || s.x < -radius || s.y < -radius || s.x > canvas.width + radius || s.y > canvas.height + radius) return;
            ctx.fillStyle = `hsla(${spot.hue}, 45%, 42%, ${spot.alpha})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    function drawLabOverlay() {
        ctx.fillStyle = 'rgba(8, 12, 20, 0.45)';
        ctx.fillRect(8, 8, 250, 128);
        ctx.strokeStyle = 'rgba(128, 179, 255, 0.45)';
        ctx.strokeRect(8, 8, 250, 128);

        ctx.fillStyle = '#d7e8ff';
        ctx.font = '12px Arial';
        const lines = oxfordLab.getSummaryLines();
        lines.forEach((line, i) => ctx.fillText(line, 16, 26 + i * 16));

        ctx.fillStyle = '#cff9ff';
        ctx.fillText(`Внутри муравейника: ${ants.filter(a => a.insideAnthill).length}`, 16, 110);
        ctx.fillText(`Режим феромонов (F): ${debugPheromones ? 'ON' : 'OFF'}`, 16, 126);
    }

    function drawMainWorld() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawWorldBackground();

        waterZones.forEach(zone => { if (camera.isVisible(zone)) zone.draw(ctx, camera); });

        if (debugPheromones) {
            pheromones.draw(ctx, camera, 'food');
            pheromones.draw(ctx, camera, 'danger');
        }

        if (anthill && camera.isVisible(anthill)) anthill.draw(ctx, camera);

        trees.forEach(obj => { if (camera.isVisible(obj)) obj.draw(ctx, camera); });
        food.forEach(obj => { if (camera.isVisible(obj)) obj.draw(ctx, camera); });
        predators.forEach(obj => { if (camera.isVisible(obj)) obj.draw(ctx, camera); });
        giantSpiders.forEach(obj => { if (camera.isVisible(obj)) obj.draw(ctx, camera); });
        ants.forEach(obj => { if (camera.isVisible(obj)) obj.draw(ctx, camera); });

        weather.drawOverlay(ctx, canvas);
        drawLabOverlay();

        ui.updateStats(generation, ants, food, anthill, giantSpiders, weather.current);
    }

    function drawAnthillWorld() {
        if (!anthillViewOpen || !anthill || anthill.rooms.length === 0) return;

        anthillCtx.clearRect(0, 0, anthillCanvas.width, anthillCanvas.height);
        const bg = anthillCtx.createLinearGradient(0, 0, 0, anthillCanvas.height);
        bg.addColorStop(0, '#1e1a14');
        bg.addColorStop(1, '#120f0b');
        anthillCtx.fillStyle = bg;
        anthillCtx.fillRect(0, 0, anthillCanvas.width, anthillCanvas.height);

        const bounds = {
            minX: Math.min(...anthill.rooms.map(r => r.x - r.radius)) - 30,
            maxX: Math.max(...anthill.rooms.map(r => r.x + r.radius)) + 30,
            minY: Math.min(...anthill.rooms.map(r => r.y - r.radius)) - 30,
            maxY: Math.max(...anthill.rooms.map(r => r.y + r.radius)) + 30
        };

        const scale = Math.min(
            anthillCanvas.width / (bounds.maxX - bounds.minX),
            anthillCanvas.height / (bounds.maxY - bounds.minY)
        );

        const toScreen = (x, y) => ({ x: (x - bounds.minX) * scale, y: (y - bounds.minY) * scale });

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
            const roomColor = room.type === 'main' ? '#8B4513' : room.type === 'storage' ? '#D4A935' : '#A16F47';

            const roomGradient = anthillCtx.createRadialGradient(s.x - 4, s.y - 4, 2, s.x, s.y, room.radius * scale);
            roomGradient.addColorStop(0, '#f0c089');
            roomGradient.addColorStop(1, roomColor);

            anthillCtx.fillStyle = roomGradient;
            anthillCtx.beginPath();
            anthillCtx.arc(s.x, s.y, room.radius * scale, 0, Math.PI * 2);
            anthillCtx.fill();

            anthillCtx.strokeStyle = '#3e2723';
            anthillCtx.lineWidth = 1;
            anthillCtx.stroke();
        });

        ants.filter(ant => ant.insideAnthill && !ant.dead).forEach(ant => {
            const s = toScreen(ant.indoorX, ant.indoorY);
            anthillCtx.fillStyle = ant.selected ? '#fff176' : '#ffb74d';
            anthillCtx.beginPath();
            anthillCtx.arc(s.x, s.y, 3, 0, Math.PI * 2);
            anthillCtx.fill();
        });

        anthillCtx.fillStyle = '#fff8e1';
        anthillCtx.font = '14px Arial';
        anthillCtx.fillText(`Внутри: ${ants.filter(a => a.insideAnthill).length} | Еда: ${anthill.foodStorage}`, 12, 20);
    }

    function draw() {
        drawMainWorld();
        drawAnthillWorld();
    }

    function toggleAnthillView(open) {
        anthillViewOpen = open;
        anthillModal.classList.toggle('hidden', !open);
    }

    canvas.addEventListener('click', e => {
        const rect = canvas.getBoundingClientRect();
        const worldPos = camera.screenToWorld(e.clientX - rect.left, e.clientY - rect.top);

        if (anthill && Math.hypot(worldPos.x - anthill.x, worldPos.y - anthill.y) < anthill.size) {
            toggleAnthillView(true);
            return;
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
    anthillModal.addEventListener('click', e => {
        if (e.target === anthillModal) toggleAnthillView(false);
    });

    window.addEventListener('keydown', e => {
        const key = e.key.toLowerCase();

        if (key === 'p') {
            paused = !paused;
            ui.showMessage(paused ? 'Пауза' : 'Продолжаем');
        }

        if (key === 'r') {
            initWorld();
            generation = 1;
            stepCount = 0;
            ui.showMessage('Мир перезапущен');
        }

        if (key === 'f') {
            debugPheromones = !debugPheromones;
            ui.showMessage(`Феромоны: ${debugPheromones ? 'ON' : 'OFF'}`);
        }

        if (e.key === 'Escape' && anthillViewOpen) toggleAnthillView(false);
    });

    initWorld();

    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    gameLoop();
});
