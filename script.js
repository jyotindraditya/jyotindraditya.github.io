/* ============================
   Portfolio — Interactive Scripts
   ============================ */

(function () {
    'use strict';

    // ── Preloader ────────────────────────────────────────────────────
    const preloader = document.getElementById('preloader');
    window.addEventListener('load', () => {
        setTimeout(() => {
            preloader.classList.add('hidden');
            setTimeout(() => preloader.remove(), 600);
        }, 1500);
    });

    // ── Particle Canvas (Enhanced) ──────────────────────────────────
    const canvas = document.getElementById('particleCanvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let shootingStars = [];
    let nebulaClouds = [];
    let mouse = { x: null, y: null };
    let time = 0;

    // Palette
    const COLORS = [
        { r: 0, g: 240, b: 255 },   // cyan
        { r: 168, g: 85, b: 247 },   // purple
        { r: 244, g: 114, b: 182 },  // pink
        { r: 52, g: 211, b: 153 },   // green
        { r: 99, g: 102, b: 241 },   // indigo
    ];

    // Depth layers: far = slow/dim/small,  near = fast/bright/big
    const LAYERS = [
        { count: 40, speed: 0.15, sizeRange: [0.5, 1.2], opacityRange: [0.10, 0.25], connectDist: 0 },
        { count: 50, speed: 0.35, sizeRange: [1.0, 2.2], opacityRange: [0.20, 0.50], connectDist: 140 },
        { count: 30, speed: 0.60, sizeRange: [1.8, 3.5], opacityRange: [0.40, 0.75], connectDist: 180 },
    ];

    function resizeCanvas() {
        canvas.width = canvas.parentElement.offsetWidth;
        canvas.height = canvas.parentElement.offsetHeight;
    }

    // ── Particle ──
    class Particle {
        constructor(layer) {
            this.layer = layer;
            this.reset();
        }
        reset() {
            const L = LAYERS[this.layer];
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            const angle = Math.random() * Math.PI * 2;
            this.vx = Math.cos(angle) * L.speed;
            this.vy = Math.sin(angle) * L.speed;
            this.baseRadius = L.sizeRange[0] + Math.random() * (L.sizeRange[1] - L.sizeRange[0]);
            this.radius = this.baseRadius;
            this.baseOpacity = L.opacityRange[0] + Math.random() * (L.opacityRange[1] - L.opacityRange[0]);
            this.opacity = this.baseOpacity;
            this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
            this.pulseOffset = Math.random() * Math.PI * 2;
            this.pulseSpeed = 0.02 + Math.random() * 0.02;
            this.haloRadius = this.baseRadius * (1.8 + Math.random() * 1);
        }
        update() {
            // Pulse
            const pulse = Math.sin(time * this.pulseSpeed + this.pulseOffset);
            this.radius = this.baseRadius * (1 + pulse * 0.25);
            this.opacity = this.baseOpacity * (1 + pulse * 0.2);

            this.x += this.vx;
            this.y += this.vy;

            // Mouse interaction — attract inside 80px, repel between 80-200px
            if (mouse.x !== null) {
                const dx = this.x - mouse.x;
                const dy = this.y - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const layerMult = (this.layer + 1) / LAYERS.length; // deeper layers react more

                if (dist < 80) {
                    // Gentle attract
                    const force = (80 - dist) / 80 * 0.012 * layerMult;
                    this.vx -= dx * force;
                    this.vy -= dy * force;
                } else if (dist < 200) {
                    // Soft repel
                    const force = (200 - dist) / 200 * 0.008 * layerMult;
                    this.vx += dx * force;
                    this.vy += dy * force;
                }
            }

            // Friction
            this.vx *= 0.998;
            this.vy *= 0.998;

            // Min speed (keep drifting)
            const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            const minSpeed = LAYERS[this.layer].speed * 0.4;
            if (speed < minSpeed) {
                const angle = Math.atan2(this.vy, this.vx);
                this.vx = Math.cos(angle) * minSpeed;
                this.vy = Math.sin(angle) * minSpeed;
            }
            // Max speed
            const maxSpeed = LAYERS[this.layer].speed * 3;
            if (speed > maxSpeed) {
                this.vx = (this.vx / speed) * maxSpeed;
                this.vy = (this.vy / speed) * maxSpeed;
            }

            // Wrap
            if (this.x < -10) this.x = canvas.width + 10;
            if (this.x > canvas.width + 10) this.x = -10;
            if (this.y < -10) this.y = canvas.height + 10;
            if (this.y > canvas.height + 10) this.y = -10;
        }
        draw() {
            const { r, g, b } = this.color;
            // Outer halo glow
            const haloGrad = ctx.createRadialGradient(this.x, this.y, this.radius, this.x, this.y, this.haloRadius);
            haloGrad.addColorStop(0, `rgba(${r},${g},${b},${this.opacity * 0.10})`);
            haloGrad.addColorStop(1, `rgba(${r},${g},${b},0)`);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.haloRadius, 0, Math.PI * 2);
            ctx.fillStyle = haloGrad;
            ctx.fill();

            // Core dot
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r},${g},${b},${this.opacity})`;
            ctx.shadowColor = `rgba(${r},${g},${b},0.6)`;
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    // ── Shooting Star ──
    class ShootingStar {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * canvas.width * 1.5;
            this.y = -10;
            const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.3;
            const speed = 6 + Math.random() * 6;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.life = 1;
            this.decay = 0.008 + Math.random() * 0.008;
            this.tailLen = 40 + Math.random() * 60;
            const c = COLORS[Math.floor(Math.random() * 3)]; // cyan/purple/pink
            this.color = c;
            this.active = true;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.life -= this.decay;
            if (this.life <= 0 || this.x > canvas.width + 100 || this.y > canvas.height + 100) {
                this.active = false;
            }
        }
        draw() {
            if (!this.active) return;
            const { r, g, b } = this.color;
            const tailX = this.x - (this.vx / Math.sqrt(this.vx * this.vx + this.vy * this.vy)) * this.tailLen;
            const tailY = this.y - (this.vy / Math.sqrt(this.vx * this.vx + this.vy * this.vy)) * this.tailLen;

            const grad = ctx.createLinearGradient(this.x, this.y, tailX, tailY);
            grad.addColorStop(0, `rgba(${r},${g},${b},${this.life * 0.9})`);
            grad.addColorStop(0.4, `rgba(${r},${g},${b},${this.life * 0.3})`);
            grad.addColorStop(1, `rgba(${r},${g},${b},0)`);

            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(tailX, tailY);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 1.5;
            ctx.lineCap = 'round';
            ctx.stroke();

            // Bright head
            ctx.beginPath();
            ctx.arc(this.x, this.y, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${this.life * 0.9})`;
            ctx.shadowColor = `rgba(${r},${g},${b},0.8)`;
            ctx.shadowBlur = 12;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    // ── Nebula Cloud ──
    class NebulaCloud {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.radius = 100 + Math.random() * 200;
            this.vx = (Math.random() - 0.5) * 0.08;
            this.vy = (Math.random() - 0.5) * 0.04;
            const c = COLORS[Math.floor(Math.random() * COLORS.length)];
            this.color = c;
            this.opacity = 0.012 + Math.random() * 0.018;
            this.pulseOffset = Math.random() * Math.PI * 2;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x < -this.radius) this.x = canvas.width + this.radius;
            if (this.x > canvas.width + this.radius) this.x = -this.radius;
            if (this.y < -this.radius) this.y = canvas.height + this.radius;
            if (this.y > canvas.height + this.radius) this.y = -this.radius;
        }
        draw() {
            const { r, g, b } = this.color;
            const pulse = Math.sin(time * 0.008 + this.pulseOffset) * 0.005;
            const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
            grad.addColorStop(0, `rgba(${r},${g},${b},${this.opacity + pulse})`);
            grad.addColorStop(0.5, `rgba(${r},${g},${b},${(this.opacity + pulse) * 0.4})`);
            grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();
        }
    }

    // ── Connections (gradient lines between same-layer particles) ──
    function drawConnections() {
        for (let layer = 1; layer < LAYERS.length; layer++) {
            const connectDist = LAYERS[layer].connectDist;
            if (!connectDist) continue;
            const layerParticles = particles.filter(p => p.layer === layer);
            for (let i = 0; i < layerParticles.length; i++) {
                let connections = 0;
                for (let j = i + 1; j < layerParticles.length; j++) {
                    if (connections >= 3) break; // limit connections per particle
                    const a = layerParticles[i], b = layerParticles[j];
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < connectDist) {
                        const alpha = (1 - dist / connectDist) * 0.18;
                        const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
                        grad.addColorStop(0, `rgba(${a.color.r},${a.color.g},${a.color.b},${alpha})`);
                        grad.addColorStop(1, `rgba(${b.color.r},${b.color.g},${b.color.b},${alpha})`);
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.strokeStyle = grad;
                        ctx.lineWidth = 0.6;
                        ctx.stroke();
                        connections++;
                    }
                }
            }
        }

        // Mouse constellation — draw lines from cursor to nearby foreground particles
        if (mouse.x !== null) {
            const nearParticles = particles
                .filter(p => p.layer === 2)
                .map(p => ({ p, dist: Math.hypot(p.x - mouse.x, p.y - mouse.y) }))
                .filter(o => o.dist < 200)
                .sort((a, b) => a.dist - b.dist)
                .slice(0, 5);

            nearParticles.forEach(({ p, dist }) => {
                const alpha = (1 - dist / 200) * 0.3;
                const grad = ctx.createLinearGradient(mouse.x, mouse.y, p.x, p.y);
                grad.addColorStop(0, `rgba(255,255,255,${alpha * 0.6})`);
                grad.addColorStop(1, `rgba(${p.color.r},${p.color.g},${p.color.b},${alpha})`);
                ctx.beginPath();
                ctx.moveTo(mouse.x, mouse.y);
                ctx.lineTo(p.x, p.y);
                ctx.strokeStyle = grad;
                ctx.lineWidth = 0.8;
                ctx.stroke();
            });
        }
    }

    // ── Init ──
    function initAll() {
        particles = [];
        LAYERS.forEach((L, layerIdx) => {
            for (let i = 0; i < L.count; i++) particles.push(new Particle(layerIdx));
        });
        nebulaClouds = [];
        for (let i = 0; i < 5; i++) nebulaClouds.push(new NebulaCloud());
        shootingStars = [];
    }

    // ── Main Loop ──
    function animate() {
        time++;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Nebula fog (behind everything)
        nebulaClouds.forEach(c => { c.update(); c.draw(); });

        // Particles by layer (far → near)
        for (let layer = 0; layer < LAYERS.length; layer++) {
            particles.filter(p => p.layer === layer).forEach(p => { p.update(); p.draw(); });
        }

        // Connections
        drawConnections();

        // Shooting stars
        if (Math.random() < 0.006) shootingStars.push(new ShootingStar());
        shootingStars.forEach(s => { s.update(); s.draw(); });
        shootingStars = shootingStars.filter(s => s.active);

        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resizeCanvas);
    canvas.addEventListener('mousemove', e => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });
    canvas.addEventListener('mouseleave', () => { mouse.x = null; mouse.y = null; });

    resizeCanvas();
    initAll();
    animate();

    // ── Cursor Glow ──────────────────────────────────────────────────
    const cursorGlow = document.getElementById('cursorGlow');
    let glowX = 0, glowY = 0, currentX = 0, currentY = 0;

    document.addEventListener('mousemove', e => {
        glowX = e.clientX;
        glowY = e.clientY;
    });

    function updateGlow() {
        currentX += (glowX - currentX) * 0.08;
        currentY += (glowY - currentY) * 0.08;
        cursorGlow.style.left = currentX + 'px';
        cursorGlow.style.top = currentY + 'px';
        requestAnimationFrame(updateGlow);
    }
    updateGlow();

    // ── Typewriter Effect ────────────────────────────────────────────
    const roles = [
        'Machine Learning',
        'Android',
        'Deep Learning',
        'Data Structures',
        'Algorithms',
        'System Design'
    ];
    const typedEl = document.getElementById('typedText');
    let roleIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function typeWriter() {
        const current = roles[roleIndex];
        if (isDeleting) {
            typedEl.textContent = current.substring(0, charIndex - 1);
            charIndex--;
        } else {
            typedEl.textContent = current.substring(0, charIndex + 1);
            charIndex++;
        }

        let speed = isDeleting ? 40 : 80;

        if (!isDeleting && charIndex === current.length) {
            speed = 2000; // Pause at end
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            roleIndex = (roleIndex + 1) % roles.length;
            speed = 400;
        }

        setTimeout(typeWriter, speed);
    }

    setTimeout(typeWriter, 1200);

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

    // ── Scroll Reveal (IntersectionObserver) ─────────────────────────
    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                // Stagger animation for sibling reveals
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, i * 100);
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));

    // ── Project Card Tilt ────────────────────────────────────────────
    const projectCards = document.querySelectorAll('.project-card-inner');
    projectCards.forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / centerY * -6;
            const rotateY = (x - centerX) / centerX * 6;

            card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

            // Move glow to cursor
            const glow = card.querySelector('.project-card-glow');
            if (glow) {
                glow.style.left = x - rect.width + 'px';
                glow.style.top = y - rect.height + 'px';
            }
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });

    // ── Skill Tag Hover Ripple ───────────────────────────────────────
    document.querySelectorAll('.skill-tag').forEach(tag => {
        tag.addEventListener('mouseenter', function () {
            this.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
        });
    });

    // ── Contact Form ─────────────────────────────────────────────────
    const contactForm = document.getElementById('contactForm');
    contactForm.addEventListener('submit', e => {
        e.preventDefault();
        const btn = contactForm.querySelector('.btn-submit');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<span>Sent! ✓</span>';
        btn.style.background = 'var(--accent-green)';
        btn.style.boxShadow = '0 4px 25px rgba(52, 211, 153, 0.3)';

        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.style.background = '';
            btn.style.boxShadow = '';
            contactForm.reset();
        }, 2500);
    });

    // ── Smooth scroll for all anchor links ───────────────────────────
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
