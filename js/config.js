// config.js - Все настройки симуляции
const CONFIG = {
    // Размеры мира
    WORLD_WIDTH: 2000,
    WORLD_HEIGHT: 2000,
    
    // Настройки canvas
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    
    // Количество объектов
    INITIAL_ANTS: 20,
    INITIAL_FOOD: 30,
    INITIAL_PREDATORS: 3,
    INITIAL_GIANT_SPIDERS: 2,
    INITIAL_TREES: 10,
    INITIAL_WATER_ZONES: 3,
    
    // Параметры эволюции
    GENERATION_STEPS: 1500,        // Шагов на поколение
    SURVIVOR_PERCENT: 0.3,         // 30% лучших выживает
    MUTATION_RATE: 0.1,            // 10% генов мутируют
    MUTATION_STRENGTH: 0.2,        // Сила мутации (±20%)
    
    // Параметры муравьев
    ANT_SIZE: 6,
    ANT_SPEED_MIN: 1,
    ANT_SPEED_MAX: 3,
    ANT_VISION_MIN: 50,
    ANT_VISION_MAX: 200,
    ANT_CAUTIOUS_MIN: 0,
    ANT_CAUTIOUS_MAX: 1,
    ANT_PHEROMONE_DEPOSIT: 1.2,
    
    // Параметры еды
    FOOD_SIZE: 8,
    FOOD_ENERGY: 50,               // Сколько энергии дает еда
    
    // Параметры хищников
    PREDATOR_SIZE: 10,
    PREDATOR_SPEED: 1.5,
    
    // Параметры деревьев (препятствия)
    TREE_SIZE: 15,
    
    // Цвета
    COLORS: {
        ANT: '#ffaa00',
        SELECTED_ANT: '#ffff00',
        FOOD: '#00ff00',
        PREDATOR: '#ff4444',
        TREE: '#8B4513',
        GRASS: '#2a5a2a'
    }
};
