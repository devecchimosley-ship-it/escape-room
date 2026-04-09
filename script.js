// --- AUDIO ENGINE ---
let audioCtx;
function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playTone(freq, duration, type = 'sine', gain = 0.2) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gNode = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gNode.gain.setValueAtTime(gain, audioCtx.currentTime);
    gNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gNode);
    gNode.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

const sounds = {
    success: () => { playTone(800, 0.1); setTimeout(() => playTone(1200, 0.2), 100); },
    error: () => playTone(200, 0.5, 'square'),
    type: () => playTone(Math.random() * 100 + 500, 0.03, 'triangle', 0.02),
    alarm: () => playTone(1500, 0.2, 'sawtooth', 0.1)
};

// --- GAME LOGIC ---
const codes = { sfida1: "192114", sfida2: "6", sfida3: "A", sfida4: "780" };
let currentState = 'login';
let o2Minutes = 15;
let timerInterval;
let startTime;

function changeState(newState) {
    document.querySelector('.active').classList.remove('active');
    document.getElementById(`state-${newState}`).classList.add('active');
    currentState = newState;

    // Gestione input area
    const inputArea = document.getElementById('input-area');
    if (newState.startsWith('sfida')) {
        inputArea.classList.add('active');
        document.getElementById('code-input').focus();
    } else {
        inputArea.classList.remove('active');
    }

    if (newState === 'sfida2') initReactor();
    if (newState === 'sfida4') initCube();
}

function checkCode() {
    const input = document.getElementById('code-input');
    const val = input.value.trim().toUpperCase();
    
    if (val === codes[currentState]) {
        sounds.success();
        input.value = '';
        
        if (currentState === 'sfida1') changeState('sfida2');
        else if (currentState === 'sfida2') changeState('sfida3');
        else if (currentState === 'sfida3') changeState('sfida4');
        else if (currentState === 'sfida4') {
            clearInterval(timerInterval);
            const timeDiff = Date.now() - startTime;
            saveScore(timeDiff);
            changeState('vittoria');
            setTimeout(() => { renderLeaderboard(); changeState('classifica'); }, 5000);
        }
    } else {
        sounds.error();
        input.value = '';
    }
}

function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(() => {
        o2Minutes--;
        document.querySelector('.status').innerText = `O2 ${o2Minutes}m`;
        if (o2Minutes <= 5) {
            document.querySelector('.status').classList.add('critical');
            sounds.alarm();
        }
        if (o2Minutes <= 0) {
            clearInterval(timerInterval);
            changeState('sconfitta');
        }
    }, 60000);
}

// --- UTILITIES & ANIMATIONS ---
function initReactor() {
    const text = document.querySelector('.reattore-val');
    setInterval(() => { text.innerText = Math.floor(Math.random() * 50 + 100); }, 100);
}

function initCube() {
    const canvas = document.getElementById('cube-canvas');
    const ctx = canvas.getContext('2d');
    let angle = 0;
    function draw() {
        if (currentState !== 'sfida4') return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#33ff33';
        ctx.strokeRect(20 + Math.sin(angle)*10, 20, 50, 50); // Cubo semplificato per performance
        angle += 0.05;
        requestAnimationFrame(draw);
    }
    draw();
}

function saveScore(ms) {
    const name = localStorage.getItem('icarusTeam') || "EQUIPAGGIO";
    const sec = Math.floor(ms / 1000);
    const timeStr = `${Math.floor(sec/60)}m ${sec%60}s`;
    let board = JSON.parse(localStorage.getItem('icarusBoard') || "[]");
    board.push({ name, timeStr, ms });
    board.sort((a,b) => a.ms - b.ms);
    localStorage.setItem('icarusBoard', JSON.stringify(board.slice(0, 5)));
}

function renderLeaderboard() {
    const body = document.querySelector('#leaderboard-table tbody');
    const board = JSON.parse(localStorage.getItem('icarusBoard') || "[]");
    body.innerHTML = board.map((e, i) => `<tr><td>${i+1}</td><td>${e.name}</td><td>-</td><td>${e.timeStr}</td></tr>`).join('');
}

// --- EVENTS ---
document.getElementById('login-btn').addEventListener('click', () => {
    const name = document.getElementById('team-name').value;
    if (!name) return alert("Inserisci nome squadra");
    localStorage.setItem('icarusTeam', name);
    initAudio();
    changeState('intro');
});

document.querySelector('.start-btn').addEventListener('click', () => {
    changeState('sfida1');
    startTimer();
});

document.getElementById('submit-code').addEventListener('click', checkCode);
document.getElementById('code-input').addEventListener('keypress', (e) => { if(e.key === 'Enter') checkCode(); });
