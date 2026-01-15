// Sound Manager using AudioContext
class SoundManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    playTone(freq, type, duration, vol = 0.1) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playClick() {
        // Satisfying "pop" / "tick"
        this.playTone(800, 'sine', 0.1, 0.15);
    }

    playDelete() {
        // Quick descending "whoosh"
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.3);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

        osc.type = 'sawtooth';
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }

    playSuccess() {
        // Major chord arpeggio (C-E-G-C)
        const now = this.ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            setTimeout(() => {
                this.playTone(freq, 'sine', 0.6, 0.1);
            }, i * 100);
        });
    }

    playError() {
        this.playTone(150, 'sawtooth', 0.2, 0.1);
    }
}

const sounds = new SoundManager();

const defaultTasks = [];

const elements = {
    taskList: document.getElementById('task-list'),
    newTaskInput: document.getElementById('new-task'),
    addTaskBtn: document.getElementById('add-task-btn'),
    progressBar: document.querySelector('.progress-bar'),
    scoreText: document.getElementById('score'),
    statusText: document.getElementById('status'),
    streakText: document.getElementById('streak'),
    chartContainer: document.getElementById('chart'),
    confettiCanvas: document.getElementById('confetti-canvas'),
    // Modal Elements
    modal: document.getElementById('confirm-modal'),
    modalConfirm: document.getElementById('modal-confirm'),
    modalCancel: document.getElementById('modal-cancel'),
    // Manual Elements
    helpBtn: document.getElementById('help-btn'),
    manualModal: document.getElementById('manual-modal'),
    manualClose: document.getElementById('manual-close'),
    // Logo Elements
    logo: document.querySelector('.logo-svg'),
    tri1: document.getElementById('logo-tri-1'),
    tri2: document.getElementById('logo-tri-2'),
    tri3: document.getElementById('logo-tri-3')
};

const today = new Date().toISOString().slice(0, 10);
let state = {
    tasks: JSON.parse(localStorage.getItem('tasks')) || [...defaultTasks],
    history: JSON.parse(localStorage.getItem('history')) || {},
};

let pendingDeleteTask = null;

// Auto-Theme Logic
function updateTheme() {
    const hour = new Date().getHours();
    const body = document.body;

    // Remove old theme classes
    body.classList.remove('theme-morning', 'theme-noon', 'theme-afternoon', 'theme-evening', 'theme-night');

    let theme = 'theme-night'; // Default

    if (hour >= 5 && hour < 11) {
        theme = 'theme-morning';
    } else if (hour >= 11 && hour < 16) {
        theme = 'theme-noon';
    } else if (hour >= 16 && hour < 19) {
        theme = 'theme-afternoon';
    } else if (hour >= 19 && hour < 22) {
        theme = 'theme-evening';
    }

    body.classList.add(theme);
}

// Initialize
function init() {
    // Event Listeners
    elements.addTaskBtn.addEventListener('click', addTask);
    elements.newTaskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

    renderTasks();
    update();
    renderChart();
    updateTheme();

    // Check theme frequently (every 5s) for responsiveness
    setInterval(updateTheme, 5000);

    // Update immediately when user comes back to tab
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) updateTheme();
    });


    // Delete Modal Listeners
    elements.modalCancel.addEventListener('click', hideModal);
    elements.modalConfirm.addEventListener('click', () => {
        if (pendingDeleteTask) {
            performDelete(pendingDeleteTask);
            hideModal();
        }
    });

    // Manual Modal Listeners
    if (elements.helpBtn) {
        elements.helpBtn.addEventListener('click', () => {
            elements.manualModal.classList.remove('hidden');
            setTimeout(() => elements.manualModal.classList.add('active'), 10);
            sounds.playClick();
        });
    }

    if (elements.manualClose) {
        elements.manualClose.addEventListener('click', () => {
            elements.manualModal.classList.remove('active');
            setTimeout(() => elements.manualModal.classList.add('hidden'), 300);
            sounds.playClick();
        });
    }
}

function renderTasks() {
    elements.taskList.innerHTML = '';

    if (state.tasks.length === 0) {
        elements.taskList.innerHTML = '<div class="empty-state">Start by adding a habit above</div>';
        return;
    }

    const todayData = state.history[today] || {};

    state.tasks.forEach(task => {
        const item = document.createElement('div');
        item.className = 'task-item';
        const isChecked = todayData[task] === true;

        item.innerHTML = `
            <input type="checkbox" ${isChecked ? 'checked' : ''} data-task="${task}">
            <span class="task-label">${task}</span>
            <button class="delete-btn" aria-label="delete task">×</button>
        `;

        const checkbox = item.querySelector('input');
        const label = item.querySelector('.task-label');
        const delBtn = item.querySelector('.delete-btn');

        // Toggle on checkbox or label click
        const toggle = () => {
            // Force checkbox state sync if label clicked
            if (event.target !== checkbox) checkbox.checked = !checkbox.checked;
            sounds.playClick();
            toggleTask(task, checkbox.checked);
        };

        checkbox.addEventListener('change', () => {
            sounds.playClick();
            toggleTask(task, checkbox.checked);
        });

        label.addEventListener('click', (e) => {
            e.preventDefault();
            checkbox.checked = !checkbox.checked;
            sounds.playClick();
            toggleTask(task, checkbox.checked);
        });

        delBtn.addEventListener('click', () => showDeleteModal(task));

        elements.taskList.appendChild(item);
    });
}

// Modal Logic
function showDeleteModal(task) {
    pendingDeleteTask = task;
    elements.modal.classList.remove('hidden');
    // Minimal delay to allow CSS transition to capture opacity change if we wanted to animate display:none, 
    // but here we just toggle active class
    setTimeout(() => elements.modal.classList.add('active'), 10);
}

function hideModal() {
    elements.modal.classList.remove('active');
    setTimeout(() => {
        elements.modal.classList.add('hidden');
        pendingDeleteTask = null;
    }, 300);
}

function performDelete(task) {
    sounds.playDelete();
    state.tasks = state.tasks.filter(t => t !== task);
    localStorage.setItem('tasks', JSON.stringify(state.tasks));
    renderTasks();
    update();
}

function addTask() {
    const task = elements.newTaskInput.value.trim();
    if (task && !state.tasks.includes(task)) {
        state.tasks.push(task);
        localStorage.setItem('tasks', JSON.stringify(state.tasks));
        elements.newTaskInput.value = '';
        sounds.playClick(); // Sound feedback
        renderTasks();
        update();
    } else {
        sounds.playError();
    }
}

function toggleTask(task, completed) {
    if (!state.history[today]) state.history[today] = {};
    state.history[today][task] = completed;
    saveHistory();
    update();
}

function saveHistory() {
    localStorage.setItem('history', JSON.stringify(state.history));
}

function update() {
    const todayData = state.history[today] || {};
    const completedCount = state.tasks.filter(t => todayData[t]).length;
    const totalCount = state.tasks.length;
    const percent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

    // Update Score
    elements.progressBar.style.width = `${percent}%`;
    elements.scoreText.textContent = `${percent}%`;
    elements.statusText.textContent = percent >= 85 ? "Excellent execution" : "Keep pushing";

    // Update Logo Evolution
    updateLogo(percent);

    // Update Streak
    updateStreak();

    // Confetti & Success
    if (percent === 100 && totalCount > 0) {
        fireConfetti();
        if (!window.celebratedToday) {
            sounds.playSuccess();
            window.celebratedToday = true;
        }
    } else {
        window.celebratedToday = false;
    }

    renderChart();
}

function updateLogo(percent) {
    // Reset
    elements.tri1.classList.remove('active');
    elements.tri2.classList.remove('active');
    elements.tri3.classList.remove('active');
    elements.logo.classList.remove('shiver');

    // < 50% -> 1 Triangle
    if (percent >= 0) elements.tri1.classList.add('active');

    // 50-84% -> 2 Triangles
    if (percent >= 50) elements.tri2.classList.add('active');

    // 85-99% -> 3 Triangles
    if (percent >= 85) elements.tri3.classList.add('active');

    // 100% -> Shiver Effect
    if (percent === 100) elements.logo.classList.add('shiver');
}

function updateStreak() {
    let streak = 0;
    let d = new Date();
    while (true) {
        const key = d.toISOString().slice(0, 10);
        const dayData = state.history[key];

        if (!dayData) {
            if (key !== today) break;
        } else {
            const completed = state.tasks.filter(t => dayData[t]).length;
            const pct = state.tasks.length ? completed / state.tasks.length : 0;
            if (pct >= 0.85) {
                streak++;
            } else if (key !== today) {
                break;
            }
        }
        d.setDate(d.getDate() - 1);
    }
    elements.streakText.textContent = `${streak} days`;
}

// Simple Chart Logic
function renderChart() {
    elements.chartContainer.innerHTML = '';
    const days = 7;

    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayKey = d.toISOString().slice(0, 10);
        const dayLabel = d.toLocaleDateString('en-US', { weekday: 'narrow' });

        const dayData = state.history[dayKey] || {};
        const completed = state.tasks.filter(t => dayData[t]).length;
        const total = state.tasks.length || 1;
        const pct = Math.round((completed / total) * 100);

        const bar = document.createElement('div');
        bar.className = 'chart-bar' + (pct >= 85 ? ' filled' : '');
        bar.style.height = `${pct}%`;
        bar.title = `${dayKey}: ${pct}%`;

        const label = document.createElement('div');
        label.className = 'chart-label';
        label.textContent = dayLabel;

        bar.appendChild(label);
        elements.chartContainer.appendChild(bar);
    }
}

// Confetti Effect
function fireConfetti() {
    if (window.confettiFired) return;
    window.confettiFired = true;
    setTimeout(() => window.confettiFired = false, 5000);

    const ctx = elements.confettiCanvas.getContext('2d');
    elements.confettiCanvas.width = window.innerWidth;
    elements.confettiCanvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#f59e0b', '#34d399', '#ef4444', '#f472b6', '#fbbf24'];

    for (let i = 0; i < 100; i++) {
        particles.push({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            vx: (Math.random() - 0.5) * 12,
            vy: (Math.random() - 0.5) * 12 - 6,
            c: colors[Math.floor(Math.random() * colors.length)],
            s: Math.random() * 6 + 4,
            g: 0.2 // gravity
        });
    }

    function animate() {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        let active = false;

        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.g;
            p.s *= 0.98;

            // Bounce off bottom
            if (p.y > window.innerHeight && p.vy > 0) {
                p.vy *= -0.5;
            }

            if (p.s > 0.5 && p.y < window.innerHeight + 50) {
                ctx.fillStyle = p.c;
                ctx.fillRect(p.x, p.y, p.s, p.s);
                active = true;
            }
        });

        if (active) requestAnimationFrame(animate);
        else ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
    animate();
}

function exportCSV() {
    let csv = "Date,Task,Completed\n";
    for (const [date, tasks] of Object.entries(state.history)) {
        for (const [taskName, isDone] of Object.entries(tasks)) {
            csv += `${date},"${taskName}",${isDone ? 'Yes' : 'No'}\n`;
        }
    }
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "discipline_tracker.csv";
    a.click();
}

window.exportCSV = exportCSV;

init();

// Splash Screen Logic
window.addEventListener('load', () => {
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) {
            splash.classList.add('hidden');
            // Remove from DOM after transition (0.8s) to free memory
            setTimeout(() => splash.remove(), 800);
        }
    }, 3500); // Wait for 3.5s (animation cycle)
});

// --- MOTIVATIONAL NOTIFICATIONS ---
const quotes = [
    "Discipline is freedom.",
    "The only easy day was yesterday.",
    "Don't wish it were easier. Wish you were better.",
    "Suffer the pain of discipline, or suffer the pain of regret.",
    "Success is the sum of small efforts, repeated day in and day out.",
    "You are what you consistently do.",
    "Motivation gets you started. Habit keeps you going.",
    "Your future is created by what you do today, not tomorrow.",
    "Excuses don't burn calories.",
    "Focus on the process, not the outcome."
];

function requestNotificationPermission() {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
    }
}

function sendNotification() {
    if (Notification.permission === "granted") {
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        // Check progress
        const todayData = state.history[today] || {};
        const completedCount = state.tasks.filter(t => todayData[t]).length;
        const totalCount = state.tasks.length;
        const percent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

        if (percent < 100 && totalCount > 0) {
            new Notification("Ascend: Reminder", {
                body: `${randomQuote}\n(Current Status: ${percent}%)`,
                icon: "logo.png"
            });
            sounds.playClick(); // Subtle chime
        }
    }
}

// Request permission on first interaction (e.g., clicking anywhere)
document.addEventListener('click', requestNotificationPermission, { once: true });

// Check every hour (3600000ms) - set to shorter (e.g. 10s) for testing if needed
// For prod: 1 hour. For user testing now: I'll set it to 60 seconds so they see it.
setInterval(sendNotification, 3600000);

// Also trigger one 5 seconds after load if not 100% (Motivational Nudge)
setTimeout(sendNotification, 5000);
