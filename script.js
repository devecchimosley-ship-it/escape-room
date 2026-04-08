// --- Inizializzazione Audio ---
let audioCtx;

function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playTone(freq, duration, type = 'sine', gain = 0.5) {
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

function playSoundSuccess() {
    playTone(1000, 0.1, 'sine', 0.2);
    setTimeout(() => playTone(1500, 0.1, 'sine', 0.2), 100);
}
function playSoundError() { playTone(300, 0.3, 'square', 0.3); }
function playSoundType() { playTone(Math.random() * 200 + 400, 0.05, 'triangle', 0.05); }
function playSoundAlarm() { playTone(2000, 0.1, 'sawtooth', 0.1); }

let ambientLoop;
function startAmbient() {
    if (!audioCtx || ambientLoop) return;
    ambientLoop = audioCtx.createBufferSource();
    const bufferSize = audioCtx.sampleRate * 5; 
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(100, audioCtx.currentTime);
    
    ambientLoop.buffer = buffer;
    ambientLoop.loop = true;
    ambientLoop.connect(filter);
    filter.connect(audioCtx.destination);
    ambientLoop.start();
}

// --- Logica dell'Escape Box ---

const codes = {
    sfida1: "192114",
    sfida2: "6",
    sfida3: "A", // <--- AGGIORNATO ALLA RISPOSTA "A"
    sfida4: "780" 
};

let currentSate = 'login';
let currentSfida = '';
let o2Minutes = 15;
let timerInterval;
let exactStartTime; // Variabile per calcolare il tempo preciso in ms

const displayArea = document.getElementById('display-area');
const inputArea = document.getElementById('input-area');
const codeInput = document.getElementById('code-input');
const submitBtn = document.getElementById('submit-code');
const o2Display = document.querySelector('.terminal-header .status');
const timeDisplay = document.querySelector('.terminal-header .time');

function changeState(newState) {
    document.getElementById(`state-${currentSate}`).classList.remove('active');
    document.getElementById(`state-${newState}`).classList.add('active');
    currentSate = newState;
    
    typeWriter(document.getElementById(`state-${newState}`));
    
    if (newState.startsWith('sfida')) {
        currentSfida = newState;
        inputArea.classList.add('active');
        codeInput.value = '';
        codeInput.placeholder = (newState === 'sfida3' ? '_' : '_______');
        codeInput.maxLength = (newState === 'sfida3' ? 1 : 10);
        codeInput.focus();
    } else {
        inputArea.classList.remove('active');
    }

    if (newState === 'sfida2') initReactorAnimation();
    if (newState === 'sfida4') initCubeAnimation();
    if (newState === 'vittoria') playSoundSuccess();
    if (newState === 'sconfitta') playSoundError();
}

function typeWriter(element) {
    const textNodes = element.querySelectorAll('p, h2, h3, li');
    textNodes.forEach(node => {
        const fullText = node.getAttribute('data-full-text') || node.innerText;
        node.setAttribute('data-full-text', fullText);
        node.innerText = '';
        let i = 0;
        function typeCharacter() {
            if (i < fullText.length) {
                node.innerText += fullText.charAt(i);
                if (i % 2 === 0) playSoundType();
                i++;
                setTimeout(typeCharacter, Math.random() * 30 + 10);
            }
        }
        typeCharacter();
    });
}

function checkCode() {
    const submittedCode = codeInput.value.trim().toUpperCase();
    if (submittedCode === codes[currentSfida]) {
        playSoundSuccess();
        
        if (currentSfida === 'sfida1') changeState('sfida2');
        else if (currentSfida === 'sfida2') changeState('sfida3');
        else if (currentSfida === 'sfida3') changeState('sfida4');
        else if (currentSfida === 'sfida4') {
            clearInterval(timerInterval);
            
            // Calcolo del tempo finale
            const endTime = Date.now();
            const timeDiff = endTime - exactStartTime;
            saveToLeaderboard(timeDiff); // Salva in locale
            
            changeState('vittoria');
            
            // Aspetta 6 secondi, poi mostra la classifica
            setTimeout(() => {
                renderLeaderboard();
                changeState('classifica');
            }, 6000);
        }
    } else {
        playSoundError();
        codeInput.value = '';
    }
}

// Timer O2
function startTimer() {
    timerInterval = setInterval(() => {
        o2Minutes--;
        updateO2Display();
        if (o2Minutes <= 0) {
            clearInterval(timerInterval);
            changeState('sconfitta');
        }
        if (o2Minutes <= 5) playSoundAlarm();
    }, 60000); // 1 minuto
}

function updateO2Display() {
    o2Display.innerText = `O2 ${o2Minutes < 10 ? '0' : ''}${o2Minutes}m`;
    if (o2Minutes <= 5) o2Display.classList.add('critical');
    else o2Display.classList.remove('critical');
}

// --- Animazioni ---
let reactorInterval;
function initReactorAnimation() {
    if (reactorInterval) clearInterval(reactorInterval);
    const valText = document.querySelector('#state-sfida2 .reattore-val');
    reactorInterval = setInterval(() => {
        valText.innerText = Math.floor(Math.random() * 10 + 2);
    }, 100);
}

let cubeCanvas, cubeCtx, cubeRotation;
function initCubeAnimation() {
    cubeCanvas = document.getElementById('cube-canvas');
    cubeCtx = cubeCanvas.getContext('2d');
    cubeRotation = { x: 0, y: 0 };
    animateCube();
}

function drawCube(ctx, width, height, rotation) {
    const nodes = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
    const edges = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
    const scale = Math.min(width, height) * 0.2;
    const projectedNodes = [];
    
    nodes.forEach(node => {
        let x1 = node[0] * Math.cos(rotation.y) - node[2] * Math.sin(rotation.y);
        let z1 = node[0] * Math.sin(rotation.y) + node[2] * Math.cos(rotation.y);
        let y1 = node[1] * Math.cos(rotation.x) - z1 * Math.sin(rotation.x);
        projectedNodes.push({ x: x1 * scale + width / 2, y: y1 * scale + height / 2 });
    });
    
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = '#33ff33';
    ctx.lineWidth = 1;
    ctx.beginPath();
    edges.forEach(edge => {
        ctx.moveTo(projectedNodes[edge[0]].x, projectedNodes[edge[0]].y);
        ctx.lineTo(projectedNodes[edge[1]].x, projectedNodes[edge[1]].y);
    });
    ctx.stroke();
}

function animateCube() {
    if (currentSate !== 'sfida4') return;
    cubeRotation.x += 0.01; cubeRotation.y += 0.015;
    drawCube(cubeCtx, cubeCanvas.width, cubeCanvas.height, cubeRotation);
    requestAnimationFrame(animateCube);
}

// --- LOGICA CLASSIFICA (Leaderboard) ---

function saveToLeaderboard(timeMs) {
    const tName = localStorage.getItem('icarusTeamName') || "SCONOSCIUTO";
    const tSize = localStorage.getItem('icarusTeamSize') || "1";

    // Calcola i minuti e i secondi esatti impiegati
    let totalSeconds = Math.floor(timeMs / 1000);
    let mins = Math.floor(totalSeconds / 60);
    let secs = totalSeconds % 60;
    let timeStr = `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;

    let board = JSON.parse(localStorage.getItem('icarusLeaderboard') || "[]");
    board.push({ name: tName, players: tSize, timeMs: timeMs, timeStr: timeStr });
    
    // Ordina dal più veloce (minor tempo) al più lento
    board.sort((a, b) => a.timeMs - b.timeMs);
    
    localStorage.setItem('icarusLeaderboard', JSON.stringify(board));
}

function renderLeaderboard() {
    const tbody = document.querySelector('#leaderboard-table tbody');
    tbody.innerHTML = "";
    let board = JSON.parse(localStorage.getItem('icarusLeaderboard') || "[]");

    // Mostra solo i migliori 8 gruppi
    board.slice(0, 8).forEach((entry, index) => {
        let tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${entry.name}</td>
            <td>${entry.players}</td>
            <td>${entry.timeStr}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Pulsante Reset Classifica Globale (Nascosto ma utile per te)
document.getElementById('reset-board-btn').addEventListener('click', () => {
    if(confirm("Sei sicuro di voler cancellare tutta la classifica di tutti i gruppi?")) {
        localStorage.removeItem('icarusLeaderboard');
        alert("Classifica azzerata.");
    }
});

// --- Eventi ---

// 1. Schermata Login
document.getElementById('login-btn').addEventListener('click', () => {
    const tName = document.getElementById('team-name').value.trim().toUpperCase();
    const tSize = document.getElementById('team-size').value;

    if (!tName || !tSize) {
        alert("Inserire Nome Squadra e Numero Membri per procedere.");
        return;
    }

    // L'audio ha bisogno del primo click dell'utente per sbloccarsi nei browser
    initAudio();
    startAmbient();
    playSoundSuccess();

    // Salva i dati correnti
    localStorage.setItem('icarusTeamName', tName);
    localStorage.setItem('icarusTeamSize', tSize);

    // Passa all'introduzione
    changeState('intro');
});

// 2. Inizia la vera sfida e avvia i timer
document.querySelector('.start-btn').addEventListener('click', () => {
    playSoundSuccess();
    
    exactStartTime = Date.now(); // Segna il tempo esatto di partenza
    
    changeState('sfida1');
    startTimer();
    updateO2Display();
    
    const now = new Date();
    timeDisplay.innerText = `${now.getHours()}:${now.getMinutes() < 10 ? '0' : ''}${now.getMinutes()}`;
});

// 3. Invio Codici Enigmi
submitBtn.addEventListener('click', checkCode);
codeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkCode();
});
