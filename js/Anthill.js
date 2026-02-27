// Anthill.js - класс муравейника

class Anthill {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 40;
        this.rooms = [];
        this.tunnels = [];
        this.population = 0;
        this.foodStorage = 0;
        this.maxPopulation = 50;

        this.createInitialRooms();
    }

    createInitialRooms() {
        this.rooms.push({
            x: this.x,
            y: this.y,
            radius: 20,
            type: 'main',
            food: 0,
            eggs: []
        });

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

        this.updateTunnels();
    }

    updateTunnels() {
        this.tunnels = [];
        for (let i = 0; i < this.rooms.length; i++) {
            for (let j = i + 1; j < this.rooms.length; j++) {
                const dist = Math.hypot(this.rooms[i].x - this.rooms[j].x, this.rooms[i].y - this.rooms[j].y);
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
        const points = [];
        const steps = 10;

        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            let x = room1.x * (1 - t) + room2.x * t;
            let y = room1.y * (1 - t) + room2.y * t;

            if (i > 0 && i < steps) {
                x += (Math.random() - 0.5) * 10;
                y += (Math.random() - 0.5) * 10;
            }

            points.push({ x, y });
        }

        return points;
    }

    digRoom() {
        if (this.rooms.length >= 10) return null;

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

    addFood(amount) {
        const storage = this.rooms.find(r => r.type === 'storage');
        if (storage) storage.food += amount;
        this.foodStorage += amount;
    }

    draw(ctx, camera) {
        const center = camera.worldToScreen(this.x, this.y);

        ctx.strokeStyle = 'rgba(117, 74, 40, 0.9)';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        this.tunnels.forEach(tunnel => {
            ctx.lineWidth = 5 * camera.scale;
            ctx.beginPath();
            tunnel.points.forEach((point, i) => {
                const s = camera.worldToScreen(point.x, point.y);
                if (i === 0) ctx.moveTo(s.x, s.y);
                else ctx.lineTo(s.x, s.y);
            });
            ctx.stroke();

            ctx.strokeStyle = 'rgba(68, 40, 24, 0.9)';
            ctx.lineWidth = 1.6 * camera.scale;
            ctx.stroke();
            ctx.strokeStyle = 'rgba(117, 74, 40, 0.9)';
        });

        this.rooms.forEach(room => {
            const s = camera.worldToScreen(room.x, room.y);
            const roomRadius = room.radius * camera.scale;
            const palette = room.type === 'main'
                ? ['#d7a66c', '#7a4b2a']
                : room.type === 'storage'
                    ? ['#e5c972', '#9f7430']
                    : ['#c08a58', '#7a5331'];

            const gradient = ctx.createRadialGradient(
                s.x - roomRadius * 0.25,
                s.y - roomRadius * 0.3,
                roomRadius * 0.2,
                s.x,
                s.y,
                roomRadius
            );
            gradient.addColorStop(0, palette[0]);
            gradient.addColorStop(1, palette[1]);

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(s.x, s.y, roomRadius, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = 'rgba(57, 34, 19, 0.85)';
            ctx.lineWidth = 1.2;
            ctx.stroke();

            if (room.food > 0) {
                ctx.fillStyle = '#fff7c2';
                ctx.font = `${Math.max(10, Math.floor(11 * camera.scale))}px Arial`;
                ctx.fillText(`🍎${room.food}`, s.x - roomRadius * 0.8, s.y - roomRadius * 1.2);
            }
        });

        const moundGradient = ctx.createRadialGradient(
            center.x - this.size * camera.scale * 0.25,
            center.y - this.size * camera.scale * 0.25,
            this.size * camera.scale * 0.3,
            center.x,
            center.y,
            this.size * camera.scale
        );
        moundGradient.addColorStop(0, '#94603a');
        moundGradient.addColorStop(1, '#4c2f20');

        ctx.fillStyle = moundGradient;
        ctx.beginPath();
        ctx.ellipse(center.x, center.y, this.size * camera.scale * 0.75, this.size * camera.scale * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#120b07';
        ctx.beginPath();
        ctx.ellipse(center.x, center.y + this.size * camera.scale * 0.05, this.size * camera.scale * 0.2, this.size * camera.scale * 0.13, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}
