/**
 * NEXUS CORE // Quantum Desktop OS Engine
 * Integrated Audio Synthesis, Particle Physics, Interactive Terminal & Widgets
 */

// ==========================================
// 1. WEB AUDIO PROCEDURAL SYNTHESIZER
// ==========================================
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    playTone(freq = 440, type = 'sine', duration = 0.1, gainVal = 0.15) {
        if (!this.enabled) return;
        try {
            this.init();
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

            gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {
            console.warn('Audio play error', e);
        }
    }

    playClick() {
        this.playTone(800, 'triangle', 0.04, 0.1);
    }

    playLaser() {
        if (!this.enabled) return;
        try {
            this.init();
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(880, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.18);

            gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + 0.18);
        } catch (e) {}
    }

    playChime() {
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
            setTimeout(() => {
                this.playTone(freq, 'sine', 0.4, 0.12);
            }, idx * 70);
        });
    }

    playDrum(type) {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;

        if (type === 'kick') {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.3);
            gain.gain.setValueAtTime(0.5, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.3);
        } else if (type === 'snare') {
            // Noise + tone
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(240, now);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.15);
        } else if (type === 'hihat') {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(8000, now);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.05);
        } else if (type === 'synth') {
            const notes = [329.63, 392.00, 493.88, 587.33, 659.25];
            const randomNote = notes[Math.floor(Math.random() * notes.length)];
            this.playTone(randomNote, 'sawtooth', 0.22, 0.1);
        }
    }
}

const audio = new SoundEngine();

// ==========================================
// 2. THEME & AUDIO CONTROLS
// ==========================================
const themes = ['default', 'synthwave', 'matrix', 'stellar'];
let currentThemeIdx = 0;

document.getElementById('btn-theme-cycle').addEventListener('click', () => {
    currentThemeIdx = (currentThemeIdx + 1) % themes.length;
    const themeName = themes[currentThemeIdx];
    document.body.setAttribute('data-theme', themeName);
    audio.playTone(550, 'sine', 0.1);
    addActivity(`Theme Switched to [${themeName.toUpperCase()}]`);
});

document.getElementById('btn-audio-toggle').addEventListener('click', function () {
    const isEnabled = audio.toggle();
    this.classList.toggle('active', isEnabled);
    if (isEnabled) {
        audio.playChime();
    }
});

// ==========================================
// 3. NAVIGATION & TABS
// ==========================================
const navItems = document.querySelectorAll('.nav-item');
const tabPanes = document.querySelectorAll('.tab-pane');

function switchTab(tabId) {
    navItems.forEach(item => {
        if (item.dataset.tab === tabId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    tabPanes.forEach(pane => {
        if (pane.id === `tab-${tabId}`) {
            pane.classList.add('active');
        } else {
            pane.classList.remove('active');
        }
    });

    audio.playClick();
}

navItems.forEach(item => {
    item.addEventListener('click', () => {
        switchTab(item.dataset.tab);
    });
});

// ==========================================
// 4. DASHBOARD & SYSTEM TELEMETRY
// ==========================================
function welcome() {
    const nameInput = document.getElementById("name");
    const name = nameInput.value.trim() || "Operator";
    
    document.getElementById("hero-heading").innerText = `Welcome, ${name} ⚡`;
    document.getElementById("message").innerHTML = `Quantum Node linked to user <span style="color:var(--neon-pink)">[${name}]</span>. All systems green.`;
    
    audio.playChime();
    triggerParticleExplosion(window.innerWidth / 2, window.innerHeight / 2, 40);
    addActivity(`Operator [${name}] authenticated.`);
}

function addActivity(text, color = '') {
    const feed = document.getElementById('activity-feed');
    if (!feed) return;
    const item = document.createElement('div');
    item.className = `activity-item ${color}`;
    item.innerHTML = `
        <span class="act-title">${text}</span>
        <span class="act-time">JUST NOW</span>
    `;
    feed.insertBefore(item, feed.firstChild);
    if (feed.children.length > 5) {
        feed.removeChild(feed.lastChild);
    }
}

// Live Clock & Stats Telemetry
setInterval(() => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0] + '.' + Math.floor(now.getMilliseconds() / 100);
    document.getElementById('top-clock').innerText = timeStr;

    // Simulated CPU load
    const cpuVal = Math.floor(25 + Math.random() * 45);
    document.getElementById('top-cpu').innerText = `${cpuVal}%`;
    document.getElementById('gauge-cpu-val').innerText = `${cpuVal}%`;
    
    const cpuCircle = document.getElementById('cpu-circle');
    if (cpuCircle) {
        const offset = 251 - (251 * (cpuVal / 100));
        cpuCircle.style.strokeDashoffset = offset;
    }

    // Simulated RAM load
    const ramVal = (3.8 + (Math.random() * 0.8)).toFixed(1);
    document.getElementById('top-ram').innerText = `${ramVal} GB`;

    // Simulated Flux
    const flux = (97 + Math.random() * 2.8).toFixed(1);
    const fluxEl = document.getElementById('flux-percent');
    if (fluxEl) fluxEl.innerText = `${flux}%`;
}, 1000);

// FPS Counter
let lastFrameTime = performance.now();
let frameCount = 0;
let fps = 60;

function calcFPS(now) {
    frameCount++;
    if (now - lastFrameTime >= 1000) {
        fps = Math.round((frameCount * 1000) / (now - lastFrameTime));
        frameCount = 0;
        lastFrameTime = now;
        const fpsEl = document.getElementById('hero-fps');
        if (fpsEl) fpsEl.innerText = fps;
    }
    requestAnimationFrame(calcFPS);
}
requestAnimationFrame(calcFPS);

// Quick Action Triggers
function triggerSupernova() {
    audio.playLaser();
    triggerParticleExplosion(window.innerWidth / 2, window.innerHeight / 2, 70);
    addActivity('Supernova Anomaly triggered!', 'pink');
}

function triggerMatrixPulse() {
    audio.playTone(220, 'sawtooth', 0.4, 0.2);
    document.body.style.filter = 'hue-rotate(90deg) brightness(1.2)';
    setTimeout(() => {
        document.body.style.filter = '';
    }, 400);
    addActivity('Matrix Flux wave pulsed through core.', 'green');
}

function triggerAudioChime() {
    audio.playChime();
    addActivity('Acoustic Resonance synthesized.');
}

// ==========================================
// 5. BACKGROUND PARTICLES & LAB SIMULATOR
// ==========================================
const bgCanvas = document.getElementById('bg-canvas');
const bgCtx = bgCanvas.getContext('2d');

let bgParticles = [];

function resizeBgCanvas() {
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
    initBgParticles();
}

function initBgParticles() {
    bgParticles = [];
    const count = Math.floor(window.innerWidth / 25);
    for (let i = 0; i < count; i++) {
        bgParticles.push({
            x: Math.random() * bgCanvas.width,
            y: Math.random() * bgCanvas.height,
            size: Math.random() * 2 + 0.5,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            alpha: Math.random() * 0.5 + 0.2
        });
    }
}

function animateBg() {
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    bgCtx.fillStyle = '#00f0ff';

    bgParticles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = bgCanvas.width;
        if (p.x > bgCanvas.width) p.x = 0;
        if (p.y < 0) p.y = bgCanvas.height;
        if (p.y > bgCanvas.height) p.y = 0;

        bgCtx.globalAlpha = p.alpha;
        bgCtx.beginPath();
        bgCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        bgCtx.fill();
    });

    requestAnimationFrame(animateBg);
}

window.addEventListener('resize', resizeBgCanvas);
resizeBgCanvas();
animateBg();

// Interactive Lab Canvas
const labCanvas = document.getElementById('lab-canvas');
const labCtx = labCanvas.getContext('2d');

let labParticles = [];
let labMode = 'vortex';
let mouse = { x: null, y: null, active: false };

function resizeLabCanvas() {
    const rect = labCanvas.parentElement.getBoundingClientRect();
    labCanvas.width = rect.width;
    labCanvas.height = rect.height;
}

class LabParticle {
    constructor(x, y) {
        this.x = x || Math.random() * labCanvas.width;
        this.y = y || Math.random() * labCanvas.height;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.radius = Math.random() * 3 + 1.5;
        this.color = ['#00f0ff', '#ff007f', '#9d4edd', '#00ff66'][Math.floor(Math.random() * 4)];
        this.alpha = 1;
        this.life = 1;
        this.decay = Math.random() * 0.003 + 0.001;
    }

    update() {
        if (mouse.active && mouse.x !== null) {
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (labMode === 'vortex') {
                const force = Math.min(100 / (dist + 1), 3);
                this.vx += (dx / dist) * force * 0.2 - (dy / dist) * 0.4;
                this.vy += (dy / dist) * force * 0.2 + (dx / dist) * 0.4;
            } else if (labMode === 'repel') {
                if (dist < 140) {
                    const force = (140 - dist) / 140;
                    this.vx -= (dx / dist) * force * 3;
                    this.vy -= (dy / dist) * force * 3;
                }
            } else if (labMode === 'burst') {
                if (dist < 80) {
                    this.vx += (Math.random() - 0.5) * 4;
                    this.vy += (Math.random() - 0.5) * 4;
                }
            }
        }

        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.98;
        this.vy *= 0.98;

        if (this.x < 0 || this.x > labCanvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > labCanvas.height) this.vy *= -1;
    }

    draw() {
        labCtx.save();
        labCtx.globalAlpha = this.alpha;
        labCtx.fillStyle = this.color;
        labCtx.shadowBlur = 10;
        labCtx.shadowColor = this.color;
        labCtx.beginPath();
        labCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        labCtx.fill();
        labCtx.restore();
    }
}

function initLabParticles(count = 80) {
    labParticles = [];
    for (let i = 0; i < count; i++) {
        labParticles.push(new LabParticle());
    }
}

function animateLab() {
    labCtx.fillStyle = 'rgba(5, 8, 17, 0.25)';
    labCtx.fillRect(0, 0, labCanvas.width, labCanvas.height);

    // Connect close particles with neon lines
    for (let i = 0; i < labParticles.length; i++) {
        for (let j = i + 1; j < labParticles.length; j++) {
            const p1 = labParticles[i];
            const p2 = labParticles[j];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 90) {
                labCtx.strokeStyle = 'rgba(0, 240, 255, ' + (1 - dist / 90) * 0.25 + ')';
                labCtx.lineWidth = 0.75;
                labCtx.beginPath();
                labCtx.moveTo(p1.x, p1.y);
                labCtx.lineTo(p2.x, p2.y);
                labCtx.stroke();
            }
        }
    }

    labParticles.forEach(p => {
        p.update();
        p.draw();
    });

    requestAnimationFrame(animateLab);
}

labCanvas.addEventListener('mousemove', e => {
    const rect = labCanvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.active = true;
});

labCanvas.addEventListener('mouseleave', () => {
    mouse.active = false;
});

labCanvas.addEventListener('click', e => {
    const rect = labCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    audio.playLaser();
    for (let i = 0; i < 20; i++) {
        const p = new LabParticle(x, y);
        p.vx = (Math.random() - 0.5) * 8;
        p.vy = (Math.random() - 0.5) * 8;
        labParticles.push(p);
    }
});

function setLabMode(mode) {
    labMode = mode;
    audio.playClick();
    addActivity(`Particle Lab mode: [${mode.toUpperCase()}]`);
}

function clearLabCanvas() {
    initLabParticles(50);
    audio.playTone(300, 'sine', 0.1);
}

function triggerParticleExplosion(x, y, count = 30) {
    for (let i = 0; i < count; i++) {
        const p = new LabParticle(x % (labCanvas.width || 800), y % (labCanvas.height || 400));
        p.vx = (Math.random() - 0.5) * 10;
        p.vy = (Math.random() - 0.5) * 10;
        labParticles.push(p);
    }
}

setTimeout(() => {
    resizeLabCanvas();
    initLabParticles(80);
    animateLab();
}, 200);

// ==========================================
// 6. CYBER MATRIX TERMINAL
// ==========================================
const termInput = document.getElementById('term-input');
const termOutput = document.getElementById('term-output');

function addTermLine(text, className = '') {
    const line = document.createElement('div');
    line.className = `term-line ${className}`;
    line.innerHTML = text;
    termOutput.appendChild(line);
    termOutput.scrollTop = termOutput.scrollHeight;
}

termInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
        const cmd = termInput.value.trim();
        if (!cmd) return;
        termInput.value = '';

        audio.playClick();
        addTermLine(`<span class="term-user">nexus@quantum:~$</span> ${cmd}`, 'muted');
        executeTerminalCommand(cmd.toLowerCase());
    }
});

function executeTerminalCommand(cmd) {
    const parts = cmd.split(' ');
    const mainCmd = parts[0];

    switch (mainCmd) {
        case 'help':
            addTermLine("AVAILABLE COMMANDS:", 'cyan');
            addTermLine("  • <span style='color:#fff'>help</span>     - Display command manual");
            addTermLine("  • <span style='color:#fff'>hack</span>     - Initiate simulated neural bypass");
            addTermLine("  • <span style='color:#fff'>scan</span>     - Scan surrounding quantum sub-nets");
            addTermLine("  • <span style='color:#fff'>matrix</span>   - Trigger digital rain cascade");
            addTermLine("  • <span style='color:#fff'>crypto</span>   - Mine dummy cryptographic tokens");
            addTermLine("  • <span style='color:#fff'>status</span>   - Display core health and metrics");
            addTermLine("  • <span style='color:#fff'>sfx</span>      - Test quantum acoustic synthesizer");
            addTermLine("  • <span style='color:#fff'>clear</span>    - Wipe the active terminal screen");
            break;

        case 'hack':
            addTermLine("Initiating bypass protocols...", 'pink');
            audio.playTone(350, 'sawtooth', 0.15);
            let progress = 0;
            const hackInterval = setInterval(() => {
                progress += 20;
                audio.playTone(400 + progress * 5, 'square', 0.05, 0.05);
                addTermLine(`[DECRYPTING MEMORY CHUNK 0x${Math.floor(Math.random()*999999).toString(16)}] ... ${progress}%`, 'amber');
                if (progress >= 100) {
                    clearInterval(hackInterval);
                    audio.playChime();
                    addTermLine(">>> ACCESS GRANTED: QUANTUM ROOT OBTAINED <<<", 'green');
                }
            }, 250);
            break;

        case 'scan':
            addTermLine("Scanning quantum nodes...", 'cyan');
            setTimeout(() => addTermLine("NODE-1 (192.168.0.42): ACTIVE [LATENCY: 0.8ms]", 'green'), 200);
            setTimeout(() => addTermLine("NODE-2 (10.0.99.12): ACTIVE [LATENCY: 1.2ms]", 'green'), 400);
            setTimeout(() => addTermLine("NODE-3 (172.16.8.99): ANOMALY DETECTED [PORT 8080 FIREWALL UP]", 'pink'), 600);
            break;

        case 'matrix':
            addTermLine("Connecting to the Matrix feed...", 'green');
            for (let i = 0; i < 6; i++) {
                setTimeout(() => {
                    const chars = "01010110 01100101 01111000 01110101 01110011 // 0xDEADBEEF 0xCAFEBABE";
                    addTermLine(chars, 'green');
                }, i * 150);
            }
            break;

        case 'crypto':
            addTermLine("Starting quantum mining rig at 8.4 TH/s...", 'amber');
            setTimeout(() => {
                const btc = (Math.random() * 0.05).toFixed(4);
                addTermLine(`Mined Block #849,201! Reward: +${btc} Q-COIN sent to wallet 0xNEXUS...`, 'cyan');
                audio.playChime();
            }, 800);
            break;

        case 'status':
            addTermLine("CORE STATUS: 100% OPERATIONAL", 'green');
            addTermLine(`OS: NEXUS Electron Desktop // Node.js v${process?.versions?.node || '20'}`);
            addTermLine("ENCRYPTION: AES-256-GCM QUANTUM RESISTANT", 'cyan');
            break;

        case 'sfx':
            audio.playLaser();
            setTimeout(() => audio.playChime(), 200);
            addTermLine("Audio Synthesizer verified.", 'cyan');
            break;

        case 'clear':
            termOutput.innerHTML = '';
            break;

        default:
            addTermLine(`Command not found: '${cmd}'. Type 'help' for command list.`, 'pink');
            audio.playTone(180, 'sawtooth', 0.15);
            break;
    }
}

// ==========================================
// 7. BEAT SYNTHESIZER SEQUENCER
// ==========================================
const drumRows = [
    { name: 'KICK', type: 'kick', class: '' },
    { name: 'SNARE', type: 'snare', class: 'row-2' },
    { name: 'HI-HAT', type: 'hihat', class: 'row-3' },
    { name: 'SYNTH', type: 'synth', class: 'row-4' }
];

const totalSteps = 8;
let seqGrid = [
    [true, false, false, false, true, false, false, false],
    [false, false, true, false, false, false, true, false],
    [true, true, true, true, true, true, true, true],
    [false, true, false, false, false, true, false, true]
];

let isPlaying = false;
let currentStep = 0;
let seqInterval = null;
let bpm = 125;

function renderSequencer() {
    const container = document.getElementById('seq-grid');
    if (!container) return;
    container.innerHTML = '';

    drumRows.forEach((row, rowIdx) => {
        const rowEl = document.createElement('div');
        rowEl.className = 'seq-row';

        const label = document.createElement('div');
        label.className = 'seq-label';
        label.innerText = row.name;
        rowEl.appendChild(label);

        const stepsEl = document.createElement('div');
        stepsEl.className = 'seq-steps';

        for (let step = 0; step < totalSteps; step++) {
            const btn = document.createElement('button');
            btn.className = `step-btn ${row.class} ${seqGrid[rowIdx][step] ? 'active' : ''}`;
            btn.dataset.row = rowIdx;
            btn.dataset.step = step;
            btn.addEventListener('click', () => {
                seqGrid[rowIdx][step] = !seqGrid[rowIdx][step];
                btn.classList.toggle('active');
                if (seqGrid[rowIdx][step]) {
                    audio.playDrum(row.type);
                }
            });
            stepsEl.appendChild(btn);
        }

        rowEl.appendChild(stepsEl);
        container.appendChild(rowEl);
    });
}

function toggleSequencer() {
    isPlaying = !isPlaying;
    const btn = document.getElementById('seq-play-btn');
    if (isPlaying) {
        btn.innerText = '⏹ Stop Sequencer';
        btn.style.background = 'linear-gradient(135deg, var(--neon-pink), #ff0055)';
        startSequencerLoop();
    } else {
        btn.innerText = '▶ Start Sequencer';
        btn.style.background = '';
        clearInterval(seqInterval);
        clearStepHighlights();
    }
}

function startSequencerLoop() {
    clearInterval(seqInterval);
    const intervalMs = (60 / bpm / 2) * 1000;
    seqInterval = setInterval(() => {
        clearStepHighlights();
        
        drumRows.forEach((row, rowIdx) => {
            const btn = document.querySelector(`.step-btn[data-row="${rowIdx}"][data-step="${currentStep}"]`);
            if (btn) btn.classList.add('playing');

            if (seqGrid[rowIdx][currentStep]) {
                audio.playDrum(row.type);
            }
        });

        currentStep = (currentStep + 1) % totalSteps;
    }, intervalMs);
}

function clearStepHighlights() {
    document.querySelectorAll('.step-btn.playing').forEach(b => b.classList.remove('playing'));
}

function updateBPM(val) {
    bpm = parseInt(val);
    document.getElementById('bpm-val').innerText = bpm;
    if (isPlaying) {
        startSequencerLoop();
    }
}

function randomizeBeat() {
    for (let r = 0; r < 4; r++) {
        for (let s = 0; s < totalSteps; s++) {
            seqGrid[r][s] = Math.random() > 0.65;
        }
    }
    renderSequencer();
    audio.playChime();
}

function clearBeat() {
    for (let r = 0; r < 4; r++) {
        for (let s = 0; s < totalSteps; s++) {
            seqGrid[r][s] = false;
        }
    }
    renderSequencer();
}

renderSequencer();

// ==========================================
// 8. SPEED HACKER REFLEX MINI-GAME
// ==========================================
let gameActive = false;
let gameScore = 0;
let gameStreak = 0;
let gameTimer = 30;
let gameTimerInterval = null;
let targetTimeout = null;
let highScore = localStorage.getItem('nexus_high_score') || 0;
document.getElementById('game-highscore').innerText = highScore;

function startGame() {
    gameActive = true;
    gameScore = 0;
    gameStreak = 0;
    gameTimer = 30;

    document.getElementById('game-score').innerText = '0';
    document.getElementById('game-streak').innerText = '0x';
    document.getElementById('game-timer').innerText = '30s';
    document.getElementById('game-overlay').style.display = 'none';

    audio.playChime();
    spawnTarget();

    clearInterval(gameTimerInterval);
    gameTimerInterval = setInterval(() => {
        gameTimer--;
        document.getElementById('game-timer').innerText = `${gameTimer}s`;

        if (gameTimer <= 0) {
            endGame();
        }
    }, 1000);
}

function spawnTarget() {
    if (!gameActive) return;
    const target = document.getElementById('game-target');
    const arena = document.getElementById('game-arena');
    const arenaRect = arena.getBoundingClientRect();

    const padding = 70;
    const x = Math.random() * (arenaRect.width - padding * 2) + padding;
    const y = Math.random() * (arenaRect.height - padding * 2) + padding;

    target.style.left = `${x}px`;
    target.style.top = `${y}px`;
    target.style.display = 'block';

    clearTimeout(targetTimeout);
    targetTimeout = setTimeout(() => {
        if (gameActive) {
            gameStreak = 0;
            document.getElementById('game-streak').innerText = '0x';
            audio.playTone(150, 'sawtooth', 0.1);
            spawnTarget();
        }
    }, 1200);
}

function hitTarget() {
    if (!gameActive) return;
    clearTimeout(targetTimeout);
    audio.playLaser();

    gameStreak++;
    const points = 100 * gameStreak;
    gameScore += points;

    document.getElementById('game-score').innerText = gameScore;
    document.getElementById('game-streak').innerText = `${gameStreak}x`;

    const target = document.getElementById('game-target');
    target.style.display = 'none';

    setTimeout(spawnTarget, 100);
}

function endGame() {
    gameActive = false;
    clearInterval(gameTimerInterval);
    clearTimeout(targetTimeout);
    document.getElementById('game-target').style.display = 'none';

    if (gameScore > highScore) {
        highScore = gameScore;
        localStorage.setItem('nexus_high_score', highScore);
        document.getElementById('game-highscore').innerText = highScore;
    }

    const overlay = document.getElementById('game-overlay');
    overlay.style.display = 'block';
    overlay.innerHTML = `
        <h3>SIMULATION COMPLETE</h3>
        <p>Final Score: <span style="color:var(--neon-cyan); font-weight:bold; font-size:1.4rem;">${gameScore}</span> (Streak: ${gameStreak}x)</p>
        <button class="neon-btn" onclick="startGame()">⚡ Retry Simulation</button>
    `;
    audio.playChime();
    addActivity(`Reflex matrix completed with score: ${gameScore}`, 'pink');
}

// ==========================================
// 9. CYBER NOTES / SCRATCHPAD
// ==========================================
let notes = JSON.parse(localStorage.getItem('nexus_notes') || '[]');

if (notes.length === 0) {
    notes = [
        { id: 1, text: 'Deploy quantum sub-routine to production cluster Alpha.', time: '14:20' },
        { id: 2, text: 'Optimize Web Audio buffer size to reduce latency to <5ms.', time: '14:22' }
    ];
}

function renderNotes() {
    const grid = document.getElementById('notes-grid');
    if (!grid) return;
    grid.innerHTML = '';

    notes.forEach(note => {
        const card = document.createElement('div');
        card.className = 'note-card';
        card.innerHTML = `
            <div class="note-text">${escapeHtml(note.text)}</div>
            <div class="note-footer">
                <span>⏱ ${note.time}</span>
                <button class="note-del" onclick="deleteNote(${note.id})">DELETE</button>
            </div>
        `;
        grid.appendChild(card);
    });

    localStorage.setItem('nexus_notes', JSON.stringify(notes));
}

function addNote() {
    const input = document.getElementById('new-note-input');
    const text = input.value.trim();
    if (!text) return;

    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    notes.unshift({
        id: Date.now(),
        text: text,
        time: time
    });

    input.value = '';
    renderNotes();
    audio.playClick();
    addActivity('New mission note encrypted and stored.');
}

document.getElementById('new-note-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') addNote();
});

function deleteNote(id) {
    notes = notes.filter(n => n.id !== id);
    renderNotes();
    audio.playTone(250, 'sine', 0.08);
}

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

renderNotes();
