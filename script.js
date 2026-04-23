/* ============================
   Hollow Knight Portfolio — Scripts
   Soul particles, atmospheric effects, and interaction
   ============================ */

(function () {
    'use strict';

    // ── Preloader ────────────────────────────────────────────────────
    const preloader = document.getElementById('preloader');
    window.addEventListener('load', () => {
        setTimeout(() => {
            preloader.classList.add('hidden');
            setTimeout(() => preloader.remove(), 1000);
        }, 2000);
    });

    // ── Soul Particle Canvas ─────────────────────────────────────────
    const canvas = document.getElementById('soulCanvas');
    const ctx = canvas.getContext('2d');
    let soulParticles = [];
    let driftMotes = [];
    let time = 0;
    let mouseX = null, mouseY = null;

    // Hallownest color palette
    const SOUL_COLORS = [
        { r: 184, g: 212, b: 240 }, // soul glow
        { r: 220, g: 232, b: 255 }, // soul core
        { r: 160, g: 190, b: 220 }, // pale soul
        { r: 78, g: 196, b: 212 },  // lifeblood
        { r: 130, g: 170, b: 220 }, // blue soul
        { r: 200, g: 220, b: 255 }, // bright soul
    ];

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    // ── Soul Particle (floating orbs like soul totems) ──
    class SoulParticle {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.baseRadius = 1.2 + Math.random() * 3;
            this.radius = this.baseRadius;
            this.color = SOUL_COLORS[Math.floor(Math.random() * SOUL_COLORS.length)];
            this.baseOpacity = 0.12 + Math.random() * 0.28;
            this.opacity = this.baseOpacity;
            this.vx = (Math.random() - 0.5) * 0.15;
            this.vy = -0.05 - Math.random() * 0.2; // Drift upward like souls
            this.pulseOffset = Math.random() * Math.PI * 2;
            this.pulseSpeed = 0.008 + Math.random() * 0.012;
            this.haloSize = 4 + Math.random() * 7;
            this.drift = Math.random() * Math.PI * 2;
            this.driftSpeed = 0.002 + Math.random() * 0.004;
            this.driftAmount = 0.3 + Math.random() * 0.6;
        }
        update() {
            // Gentle pulse
            const pulse = Math.sin(time * this.pulseSpeed + this.pulseOffset);
            this.radius = this.baseRadius * (1 + pulse * 0.3);
            this.opacity = this.baseOpacity * (0.7 + pulse * 0.3);

            // Drift sideways like floating in air
            this.drift += this.driftSpeed;
            this.x += this.vx + Math.sin(this.drift) * this.driftAmount * 0.1;
            this.y += this.vy;

            // Mouse interaction — souls gently flee
            if (mouseX !== null) {
                const dx = this.x - mouseX;
                const dy = this.y - mouseY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) {
                    const force = (150 - dist) / 150 * 0.3;
                    this.x += dx * force * 0.02;
                    this.y += dy * force * 0.02;
                    // Brighten near mouse
                    this.opacity = Math.min(this.opacity + 0.1, 0.6);
                }
            }

            // Wrap around screen
            if (this.y < -20) {
                this.y = canvas.height + 20;
                this.x = Math.random() * canvas.width;
            }
            if (this.x < -20) this.x = canvas.width + 20;
            if (this.x > canvas.width + 20) this.x = -20;
        }
        draw() {
            const { r, g, b } = this.color;

            // Outer soul halo
            const haloGrad = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, this.radius * this.haloSize
            );
            haloGrad.addColorStop(0, `rgba(${r},${g},${b},${this.opacity * 0.15})`);
            haloGrad.addColorStop(0.4, `rgba(${r},${g},${b},${this.opacity * 0.05})`);
            haloGrad.addColorStop(1, `rgba(${r},${g},${b},0)`);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * this.haloSize, 0, Math.PI * 2);
            ctx.fillStyle = haloGrad;
            ctx.fill();

            // Inner core
            const coreGrad = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, this.radius
            );
            coreGrad.addColorStop(0, `rgba(${Math.min(r + 40, 255)},${Math.min(g + 30, 255)},${Math.min(b + 20, 255)},${this.opacity * 0.8})`);
            coreGrad.addColorStop(1, `rgba(${r},${g},${b},${this.opacity * 0.2})`);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = coreGrad;
            ctx.fill();
        }
    }

    // ── Rain Drop (City of Tears effect) ──
    let rainDrops = [];
    class RainDrop {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = -10 - Math.random() * 200;
            this.length = 8 + Math.random() * 18;
            this.speed = 2 + Math.random() * 3;
            this.opacity = 0.03 + Math.random() * 0.06;
            this.width = 0.3 + Math.random() * 0.5;
        }
        update() {
            this.y += this.speed;
            this.x += 0.2; // Slight wind
            if (this.y > canvas.height + 20) this.reset();
        }
        draw() {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + 0.5, this.y + this.length);
            ctx.strokeStyle = `rgba(160, 190, 230, ${this.opacity})`;
            ctx.lineWidth = this.width;
            ctx.stroke();
        }
    }

    // ── Drift Mote (tiny dust-like particles, very faint) ──
    class DriftMote {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = 0.3 + Math.random() * 0.8;
            this.opacity = 0.04 + Math.random() * 0.10;
            this.vx = (Math.random() - 0.5) * 0.08;
            this.vy = (Math.random() - 0.5) * 0.08;
            this.drift = Math.random() * Math.PI * 2;
        }
        update() {
            this.drift += 0.003;
            this.x += this.vx + Math.sin(this.drift) * 0.05;
            this.y += this.vy + Math.cos(this.drift * 0.7) * 0.03;

            if (this.x < -10) this.x = canvas.width + 10;
            if (this.x > canvas.width + 10) this.x = -10;
            if (this.y < -10) this.y = canvas.height + 10;
            if (this.y > canvas.height + 10) this.y = -10;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(184, 212, 240, ${this.opacity})`;
            ctx.fill();
        }
    }

    // ── Occasional soul wisp (rare, ethereal streak) ──
    let wisps = [];
    class SoulWisp {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = canvas.height + 20;
            this.targetY = -50;
            this.speed = 0.5 + Math.random() * 1;
            this.amplitude = 30 + Math.random() * 60;
            this.frequency = 0.01 + Math.random() * 0.02;
            this.phase = Math.random() * Math.PI * 2;
            this.opacity = 0.1 + Math.random() * 0.15;
            this.size = 1 + Math.random() * 1.5;
            this.trail = [];
            this.maxTrail = 30 + Math.floor(Math.random() * 20);
            this.color = SOUL_COLORS[Math.floor(Math.random() * 3)];
            this.active = true;
        }
        update() {
            this.phase += this.frequency;
            this.y -= this.speed;
            this.x += Math.sin(this.phase) * 0.8;

            this.trail.unshift({ x: this.x, y: this.y, opacity: this.opacity });
            if (this.trail.length > this.maxTrail) this.trail.pop();

            if (this.y < this.targetY) this.active = false;
        }
        draw() {
            const { r, g, b } = this.color;
            // Draw trail
            for (let i = 0; i < this.trail.length; i++) {
                const t = this.trail[i];
                const alpha = (1 - i / this.trail.length) * this.opacity * 0.5;
                const size = this.size * (1 - i / this.trail.length * 0.7);
                ctx.beginPath();
                ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
                ctx.fill();
            }
            // Head glow
            const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 4);
            grad.addColorStop(0, `rgba(${r},${g},${b},${this.opacity * 0.4})`);
            grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 4, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();
        }
    }

    // ── Initialize Particles ──
    function initParticles() {
        soulParticles = [];
        driftMotes = [];
        // Adjust count based on screen size for performance
        const area = canvas.width * canvas.height;
        const soulCount = Math.min(70, Math.floor(area / 18000));
        const moteCount = Math.min(100, Math.floor(area / 12000));
        const rainCount = Math.min(60, Math.floor(area / 20000));

        for (let i = 0; i < soulCount; i++) soulParticles.push(new SoulParticle());
        for (let i = 0; i < moteCount; i++) driftMotes.push(new DriftMote());
        for (let i = 0; i < rainCount; i++) rainDrops.push(new RainDrop());
    }

    // ── Main Animation Loop ──
    function animate() {
        time++;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw rain (behind everything else)
        rainDrops.forEach(r => { r.update(); r.draw(); });

        // Draw drift motes (background dust)
        driftMotes.forEach(m => { m.update(); m.draw(); });

        // Draw soul particles
        soulParticles.forEach(p => { p.update(); p.draw(); });

        // Soul wisps (more frequent now)
        if (Math.random() < 0.008) wisps.push(new SoulWisp());
        wisps.forEach(w => { w.update(); w.draw(); });
        wisps = wisps.filter(w => w.active);

        // Draw faint connections between close soul particles
        for (let i = 0; i < soulParticles.length; i++) {
            for (let j = i + 1; j < soulParticles.length; j++) {
                const a = soulParticles[i];
                const b = soulParticles[j];
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    const alpha = (1 - dist / 120) * 0.03;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.strokeStyle = `rgba(184, 212, 240, ${alpha})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(animate);
    }

    // Mouse tracking
    document.addEventListener('mousemove', e => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    document.addEventListener('mouseleave', () => {
        mouseX = null;
        mouseY = null;
    });

    window.addEventListener('resize', () => {
        resizeCanvas();
        initParticles();
    });

    resizeCanvas();
    initParticles();
    animate();



    // ── Navbar ───────────────────────────────────────────────────────
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    const navLinkEls = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    });

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('open');
    });

    navLinkEls.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('open');
        });
    });

    // Active link on scroll
    const sections = document.querySelectorAll('.section');
    function updateActiveLink() {
        let current = '';
        sections.forEach(section => {
            const top = section.offsetTop - 150;
            if (window.scrollY >= top) {
                current = section.getAttribute('id');
            }
        });
        navLinkEls.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    }
    window.addEventListener('scroll', updateActiveLink);

    // ── Scroll Reveal ────────────────────────────────────────────────
    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, i * 120);
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -30px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));

    // ── Project Card Hover Shine Effect ──────────────────────────────
    const projectCards = document.querySelectorAll('.project-card-inner');
    projectCards.forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / centerY * -3;
            const rotateY = (x - centerX) / centerX * 3;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });

    // ── Hero Name Glow on Mouse Proximity ────────────────────────────
    const heroName = document.getElementById('heroName');
    if (heroName) {
        document.addEventListener('mousemove', e => {
            const rect = heroName.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const dist = Math.sqrt(
                Math.pow(e.clientX - centerX, 2) +
                Math.pow(e.clientY - centerY, 2)
            );
            const maxDist = 300;
            if (dist < maxDist) {
                const intensity = 1 - dist / maxDist;
                const glow = 40 + intensity * 60;
                const glow2 = 80 + intensity * 80;
                heroName.style.textShadow = `0 0 ${glow}px rgba(184, 212, 240, ${0.2 + intensity * 0.3}), 0 0 ${glow2}px rgba(184, 212, 240, ${0.08 + intensity * 0.15})`;
            }
        });
    }

    // ── Smooth scroll ────────────────────────────────────────────────
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

})();
