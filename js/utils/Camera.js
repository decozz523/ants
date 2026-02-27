// Camera.js - класс для управления камерой

class Camera {
    constructor(canvasWidth, canvasHeight, worldWidth, worldHeight) {
        // Позиция камеры в мире (центр экрана)
        this.x = worldWidth / 2;
        this.y = worldHeight / 2;
        
        // Размеры
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        
        // Масштаб (1 = 1 пиксель мира = 1 пиксель экрана)
        this.scale = 1;
        this.minScale = 0.5;
        this.maxScale = 3;
        
        // Скорость движения камеры
        this.moveSpeed = 10;
        
        // Слежение за муравьем
        this.followingAnt = null;
        
        // Состояние клавиш
        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false
        };
        
        // Инициализация обработчиков клавиш
        this.initControls();
    }
    
    initControls() {
        window.addEventListener('keydown', (e) => {
            switch(e.key.toLowerCase()) {
                case 'w': this.keys.w = true; e.preventDefault(); break;
                case 'a': this.keys.a = true; e.preventDefault(); break;
                case 's': this.keys.s = true; e.preventDefault(); break;
                case 'd': this.keys.d = true; e.preventDefault(); break;
                case ' ': // Пробел - открепить камеру
                    this.followingAnt = null;
                    e.preventDefault();
                    break;
            }
        });
        
        window.addEventListener('keyup', (e) => {
            switch(e.key.toLowerCase()) {
                case 'w': this.keys.w = false; e.preventDefault(); break;
                case 'a': this.keys.a = false; e.preventDefault(); break;
                case 's': this.keys.s = false; e.preventDefault(); break;
                case 'd': this.keys.d = false; e.preventDefault(); break;
            }
        });
        
        // Зум колесиком мыши
        window.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = 0.1;
            const oldScale = this.scale;
            
            if (e.deltaY < 0) {
                // Приблизить
                this.scale = Math.min(this.maxScale, this.scale + zoomFactor);
            } else {
                // Отдалить
                this.scale = Math.max(this.minScale, this.scale - zoomFactor);
            }
            
            // Корректируем позицию, чтобы зум был в точку под курсором
            if (e.deltaY !== 0) {
                const mouseX = e.clientX - document.getElementById('canvas').offsetLeft;
                const mouseY = e.clientY - document.getElementById('canvas').offsetTop;
                
                const worldX = (mouseX / oldScale) + this.x - this.canvasWidth / (2 * oldScale);
                const worldY = (mouseY / oldScale) + this.y - this.canvasHeight / (2 * oldScale);
                
                this.x = worldX + this.canvasWidth / (2 * this.scale) - mouseX / this.scale;
                this.y = worldY + this.canvasHeight / (2 * this.scale) - mouseY / this.scale;
            }
        }, { passive: false });
    }
    
    update() {
        // Если следим за муравьем
        if (this.followingAnt && !this.followingAnt.dead) {
            this.x = this.followingAnt.x;
            this.y = this.followingAnt.y;
            return;
        } else if (this.followingAnt) {
            // Муравей умер, открепляем камеру
            this.followingAnt = null;
        }
        
        // Ручное движение камеры (WASD)
        let moveX = 0;
        let moveY = 0;
        
        if (this.keys.w) moveY -= this.moveSpeed / this.scale;
        if (this.keys.s) moveY += this.moveSpeed / this.scale;
        if (this.keys.a) moveX -= this.moveSpeed / this.scale;
        if (this.keys.d) moveX += this.moveSpeed / this.scale;
        
        if (moveX !== 0 || moveY !== 0) {
            this.x += moveX;
            this.y += moveY;
        }
        
        // Ограничиваем камеру, чтобы не выходить за края мира
        this.x = Math.max(this.canvasWidth / (2 * this.scale), 
                         Math.min(this.worldWidth - this.canvasWidth / (2 * this.scale), this.x));
        this.y = Math.max(this.canvasHeight / (2 * this.scale), 
                         Math.min(this.worldHeight - this.canvasHeight / (2 * this.scale), this.y));
    }
    
    // Конвертировать мировые координаты в экранные
    worldToScreen(worldX, worldY) {
        return {
            x: (worldX - this.x) * this.scale + this.canvasWidth / 2,
            y: (worldY - this.y) * this.scale + this.canvasHeight / 2
        };
    }
    
    // Конвертировать экранные координаты в мировые
    screenToWorld(screenX, screenY) {
        return {
            x: (screenX - this.canvasWidth / 2) / this.scale + this.x,
            y: (screenY - this.canvasHeight / 2) / this.scale + this.y
        };
    }
    
    // Проверить, виден ли объект на экране
    // В Camera.js, метод isVisible:

    isVisible(obj) {
        const screenPos = this.worldToScreen(obj.x, obj.y);
        const margin = 100; // Увеличим запас
        
        // Проверяем, попадает ли объект в экранные координаты
        return screenPos.x > -margin && 
            screenPos.x < this.canvasWidth + margin &&
            screenPos.y > -margin && 
            screenPos.y < this.canvasHeight + margin;
    }
    
    // Начать следить за муравьем
    follow(ant) {
        this.followingAnt = ant;
    }
}