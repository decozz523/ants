// Anthill.js - класс муравейника

class Anthill {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 40; // Размер муравейника
        this.rooms = [];
        this.tunnels = [];
        this.population = 0;
        this.foodStorage = 0;
        this.maxPopulation = 50;
        
        // Создаем начальные комнаты
        this.createInitialRooms();
    }
    
    createInitialRooms() {
        // Главная камера
        this.rooms.push({
            x: this.x,
            y: this.y,
            radius: 20,
            type: 'main',
            food: 0,
            eggs: []
        });
        
        // Несколько маленьких комнат вокруг
        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2;
            const dist = 30;
            this.rooms.push({
                x: this.x + Math.cos(angle) * dist,
                y: this.y + Math.sin(angle) * dist,
                radius: 12,
                type: 'storage',
                food: 0
            });
        }
        
        // Туннели между комнатами
        this.updateTunnels();
    }
    
    updateTunnels() {
        this.tunnels = [];
        // Соединяем все комнаты туннелями
        for (let i = 0; i < this.rooms.length; i++) {
            for (let j = i + 1; j < this.rooms.length; j++) {
                // Соединяем только ближайшие комнаты
                const dist = Math.sqrt(
                    (this.rooms[i].x - this.rooms[j].x)**2 + 
                    (this.rooms[i].y - this.rooms[j].y)**2
                );
                if (dist < 100) {
                    this.tunnels.push({
                        from: i,
                        to: j,
                        points: this.createTunnel(this.rooms[i], this.rooms[j])
                    });
                }
            }
        }
    }
    
    createTunnel(room1, room2) {
        // Создаем извилистый туннель между комнатами
        const points = [];
        const steps = 10;
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            // Прямая линия
            let x = room1.x * (1 - t) + room2.x * t;
            let y = room1.y * (1 - t) + room2.y * t;
            
            // Добавляем случайные изгибы
            if (i > 0 && i < steps) {
                x += (Math.random() - 0.5) * 10;
                y += (Math.random() - 0.5) * 10;
            }
            
            points.push({x, y});
        }
        
        return points;
    }
    
    // Копание новой комнаты
    digRoom(ant) {
        if (this.rooms.length >= 10) return null; // Максимум комнат
        
        // Новая комната недалеко от существующих
        const baseRoom = this.rooms[Math.floor(Math.random() * this.rooms.length)];
        const angle = Math.random() * Math.PI * 2;
        const dist = 40 + Math.random() * 30;
        
        const newRoom = {
            x: baseRoom.x + Math.cos(angle) * dist,
            y: baseRoom.y + Math.sin(angle) * dist,
            radius: 10 + Math.floor(Math.random() * 10),
            type: Math.random() < 0.3 ? 'storage' : 'living',
            food: 0,
            eggs: []
        };
        
        this.rooms.push(newRoom);
        this.updateTunnels();
        
        return newRoom;
    }
    
    // Добавить еду в хранилище
    addFood(amount) {
        // Ищем комнату-хранилище
        const storage = this.rooms.find(r => r.type === 'storage');
        if (storage) {
            storage.food += amount;
        }
        this.foodStorage += amount;
    }
    
    draw(ctx, camera) {
        const screenPos = camera.worldToScreen(this.x, this.y);
        
        // Рисуем туннели
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 6;
        this.tunnels.forEach(tunnel => {
            ctx.beginPath();
            tunnel.points.forEach((point, i) => {
                const screen = camera.worldToScreen(point.x, point.y);
                if (i === 0) {
                    ctx.moveTo(screen.x, screen.y);
                } else {
                    ctx.lineTo(screen.x, screen.y);
                }
            });
            ctx.stroke();
        });
        
        // Рисуем комнаты
        this.rooms.forEach(room => {
            const roomScreen = camera.worldToScreen(room.x, room.y);
            
            // Цвет зависит от типа комнаты
            let color;
            switch(room.type) {
                case 'main': color = '#8B4513'; break;
                case 'storage': color = '#DAA520'; break;
                default: color = '#A0522D';
            }
            
            // Рисуем комнату
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(roomScreen.x, roomScreen.y, room.radius * camera.scale, 0, Math.PI * 2);
            ctx.fill();
            
            // Обводка
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Если есть еда, показываем
            if (room.food > 0) {
                ctx.fillStyle = '#FFD700';
                ctx.font = '10px Arial';
                ctx.fillText('🍎' + room.food, roomScreen.x - 10, roomScreen.y - 15);
            }
        });
        
        // Рисуем вход в муравейник
        ctx.fillStyle = '#654321';
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, this.size/2 * camera.scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Население
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText('👥 ' + this.population + '/' + this.maxPopulation, 
                    screenPos.x - 20, screenPos.y - 30);
    }
}