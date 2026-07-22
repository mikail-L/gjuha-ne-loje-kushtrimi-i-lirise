// assets/fireworks.js
window.startFireworks = function() {
    // Prevent multiple canvases
    if (document.getElementById('fireworks-canvas')) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'fireworks-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });

    const rockets = [];
    const trailParticles = [];
    const explosionParticles = [];
    const colors = ['#FF1461', '#18FF92', '#5A87FF', '#FBF38C', '#FF8E53', '#d67d60', '#FF33FF'];

    // --- 1. CONTINUOUS TRAIL SPARKS (Replaces the "bullet" line) ---
    class RocketSpark {
        constructor(x, y, angle) {
            this.x = x;
            this.y = y;
            // Spread sparks backwards away from rocket heading
            const spread = angle + Math.PI + (Math.random() - 0.5) * 0.6;
            const speed = Math.random() * 1.8 + 0.4;
            
            this.vx = Math.cos(spread) * speed;
            this.vy = Math.sin(spread) * speed;
            this.radius = Math.random() * 1.8 + 0.8;
            this.alpha = 1;
            this.decay = Math.random() * 0.035 + 0.02; // Spark lifespan
            this.color = Math.random() > 0.3 ? '#FFE17D' : '#FF8E53';
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.alpha -= this.decay;
        }

        draw(ctx) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, this.alpha);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.restore();
        }
    }

    // --- 2. ROCKET CLASS (Slower, elegant ascent) ---
    class Rocket {
        constructor(startX, startY, targetX, targetY) {
            this.x = startX;
            this.y = startY;
            this.startX = startX;
            this.startY = startY;
            this.targetX = targetX;
            this.targetY = targetY;

            this.distanceToTarget = Math.hypot(targetX - startX, targetY - startY);
            this.distanceTraveled = 0;

            this.angle = Math.atan2(targetY - startY, targetX - startX);
            
            // Controlled, smoother rocket speed (down from 12+)
            this.speed = Math.random() * 1.5 + 5.5; 
            this.scale = Math.random() * 1.4 + 0.7;
        }

        update() {
            const vx = Math.cos(this.angle) * this.speed;
            const vy = Math.sin(this.angle) * this.speed;

            this.x += vx;
            this.y += vy;
            this.distanceTraveled = Math.hypot(this.x - this.startX, this.y - this.startY);

            // Continuously emit trailing sparks every frame
            for (let i = 0; i < 3; i++) {
                trailParticles.push(new RocketSpark(this.x, this.y, this.angle));
            }

            // Reached target apex -> BOOM!
            if (this.distanceTraveled >= this.distanceToTarget) {
                explode(this.targetX, this.targetY, this.scale);
                return true; 
            }
            return false;
        }

        draw(ctx) {
            // Bright tip of the rising firework
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.x, this.y, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowColor = '#FFE17D';
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.restore();
        }
    }

    // --- 3. EXPLOSION PARTICLE CLASS ---
    class Particle {
        constructor(x, y, color, scale) {
            this.x = x;
            this.y = y;
            this.color = color;
            
            this.coordinates = [];
            this.coordinateCount = 4;
            while (this.coordinateCount--) {
                this.coordinates.push([this.x, this.y]);
            }
            
            const angle = Math.random() * Math.PI * 2;
            // Slower, more graceful expansion speed
            const speed = (Math.random() * 7 + 2) * scale;
            
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            
            this.friction = 0.94; // Smooth, soft deceleration
            this.gravity = 0.05;  // Soft drop
            this.alpha = 1;
            this.decay = Math.random() * 0.015 + 0.008; // Slower fade out
            this.lineWidth = Math.random() * 2.5 + 1;
        }
        
        update() {
            this.coordinates.pop();
            this.coordinates.unshift([this.x, this.y]);

            this.vx *= this.friction;
            this.vy *= this.friction;
            this.vy += this.gravity;
            this.x += this.vx;
            this.y += this.vy;
            this.alpha -= this.decay;
        }
        
        draw(ctx) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, this.alpha);
            ctx.beginPath();
            
            const lastCoord = this.coordinates[this.coordinates.length - 1];
            ctx.moveTo(lastCoord[0], lastCoord[1]);
            ctx.lineTo(this.x, this.y);
            
            ctx.lineWidth = this.lineWidth;
            ctx.strokeStyle = this.color;
            ctx.lineCap = 'round';
            ctx.stroke();
            ctx.restore();
        }
    }

    function explode(x, y, scale) {
        const particleCount = Math.floor((Math.random() * 120 + 90) * scale);
        const color1 = colors[Math.floor(Math.random() * colors.length)];
        const color2 = colors[Math.floor(Math.random() * colors.length)];
        
        for (let i = 0; i < particleCount; i++) {
            const finalColor = Math.random() > 0.5 ? color1 : color2;
            explosionParticles.push(new Particle(x, y, finalColor, scale));
        }
    }

    // --- 4. LAUNCH LOOP ---
    function launchRocket() {
        const targetX = Math.random() * (canvas.width * 0.8) + canvas.width * 0.1;
        const targetY = Math.random() * (canvas.height * 0.45) + canvas.height * 0.1;

        const startX = canvas.width / 2 + (Math.random() * (canvas.width * 0.6) - canvas.width * 0.3);
        const startY = canvas.height;

        rockets.push(new Rocket(startX, startY, targetX, targetY));

        // Relaxed timing between launches (600ms - 1200ms)
        setTimeout(launchRocket, Math.random() * 600 + 600);
    }

    launchRocket();

    // --- 5. RENDER LOOP ---
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 1. Draw rocket trailing sparks
        for (let i = trailParticles.length - 1; i >= 0; i--) {
            const spark = trailParticles[i];
            spark.update();
            spark.draw(ctx);
            if (spark.alpha <= 0) trailParticles.splice(i, 1);
        }

        // 2. Draw rising rockets
        for (let i = rockets.length - 1; i >= 0; i--) {
            const r = rockets[i];
            if (r.update()) {
                rockets.splice(i, 1);
            } else {
                r.draw(ctx);
            }
        }

        // 3. Draw explosion bursts
        for (let i = explosionParticles.length - 1; i >= 0; i--) {
            const p = explosionParticles[i];
            p.update();
            p.draw(ctx);
            if (p.alpha <= 0) explosionParticles.splice(i, 1);
        }
        
        requestAnimationFrame(animate);
    }
    
    animate();
};