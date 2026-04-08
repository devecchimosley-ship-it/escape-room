// --- Inizializzazione Audio ---
// L'audio richiede un'interazione utente per partire.
let audioCtx;
let sounds = {};
let ambientLoop;

function initAudio() {
    if (audioCtx) return; // Già inizializzato
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    console.log("Audio Centralizzato attivato.");
}

// Genera un tono sintetico semplice
function playTone(freq, duration, type = 'sine', gain = 0.5) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gNode = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gNode.gain.setValueAtTime(gain, audioCtx.currentTime);
    gNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration); // Fade out
    osc.connect(gNode);
    gNode.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

// Effetti sonori predefiniti
function playSoundSuccess() {
    playTone(1000, 0.1, 'sine', 0.2);
    setTimeout(() => playTone(1500, 0.1, 'sine', 0.2), 100);
}

function playSoundError() {
    playTone(300, 0.3, 'square', 0.3);
}

function playSoundType() {
    playTone(Math.random() * 200 + 400, 0.05, 'triangle', 0.05);
}

function playSoundAlarm() {
    playTone(2000, 0.1, 'sawtooth', 0.1);
}

// Crea un rumore d'ambiente
function startAmbient() {
    if (!audioCtx) return;
    ambientLoop = audioCtx.createBufferSource();
    const bufferSize = audioCtx.sampleRate * 5; // 5 secondi di buffer
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1; // Rumore bianco
    }
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(100, audioCtx.currentTime); // Taglia le alte frequenze per un ronzio basso
    
    ambientLoop.buffer = buffer;
    ambientLoop.loop = true;
    ambientLoop.connect(filter);
    filter.connect(audioCtx.destination);
    
    ambientLoop.start();
}

// --- Logica dell'Escape Box ---

const codes = {
    sfida1: "192114", // S(19) U(21) N(14)
    sfida2: "6", // sqrt(36)
    sfida3: "B", // Logicamente B (Cartello VERO, B funzionante)
    sfida4: "780" // (42+6+21+9)*10
};

let currentSate = 'intro';
let currentSfida = 'sfida1';
let o2Minutes = 15;
let timerInterval;

const displayArea = document.getElementById('display-area');
const inputArea = document.getElementById('input-area');
const codeInput = document.getElementById('code-input');
const submitBtn = document.getElementById('submit-code');
const o2Display = document.querySelector('.terminal-header .status');
const timeDisplay = document.querySelector('.terminal-header .time');

// Passaggio di stato
function changeState(newState) {
    const from = document.getElementById(`state-${currentSate}`);
    const to = document.getElementById(`state-${newState}`);
    
    from.classList.remove('active');
    to.classList.add('active');
    
    currentSate = newState;
    typeWriter(to); // Effetto di digitazione per il nuovo testo
    
    // Mostra/Nascondi l'area input
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

    // Effetti speciali per lo stato
    if (newState === 'sfida2') initReactorAnimation();
    if (newState === 'sfida4') initCubeAnimation();
    if (newState === 'vittoria') playSoundSuccess();
    if (newState === 'sconfitta') playSoundError();
}

// Simula la digitazione del testo
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
                if (i % 2 === 0) playSoundType(); // Suono ogni 2 caratteri
                i++;
                setTimeout(typeCharacter, Math.random() * 30 + 10);
            }
        }
        typeCharacter();
    });
}

// Controllo del codice
function checkCode() {
    const submittedCode = codeInput.value.trim().toUpperCase();
    if (submittedCode === codes[currentSfida]) {
        playSoundSuccess();
        
        // Passaggio alla sfida successiva
        if (currentSfida === 'sfida1') changeState('sfida2');
        else if (currentSfida === 'sfida2') changeState('sfida3');
        else if (currentSfida === 'sfida3') changeState('sfida4');
        else if (currentSfida === 'sfida4') {
            clearInterval(timerInterval); // Ferma il timer
            changeState('vittoria');
        }
    } else {
        playSoundError();
        codeInput.classList.add('glitch'); // Effetto glitch input
        setTimeout(() => codeInput.classList.remove('glitch'), 500);
        
        // Penale di tempo (opzionale)
        // o2Minutes = Math.max(0, o2Minutes - 1);
        // updateO2Display();
    }
}

// Timer Ossigeno
function startTimer() {
    timerInterval = setInterval(() => {
        o2Minutes--;
        updateO2Display();
        if (o2Minutes <= 0) {
            clearInterval(timerInterval);
            changeState('sconfitta');
        }
        if (o2Minutes <= 5) playSoundAlarm(); // Allarme sonoro
    }, 60000); // 1 minuto
}

function updateO2Display() {
    o2Display.innerText = `O2 ${o2Minutes < 10 ? '0' : ''}${o2Minutes}m`;
    if (o2Minutes <= 5) o2Display.classList.add('critical');
    else o2Display.classList.remove('critical');
}

// --- Animazioni Enigmi ---

// Sfida 2: Reattore
let reactorInterval;
function initReactorAnimation() {
    if (reactorInterval) clearInterval(reactorInterval);
    const valText = document.querySelector('#state-sfida2 .reattore-val');
    reactorInterval = setInterval(() => {
        valText.innerText = Math.floor(Math.random() * 10 + 2); // Simula instabilità
    }, 100);
}

// Sfida 4: Cubo
let cubeCanvas, cubeCtx, cubeRotation;
function initCubeAnimation() {
    cubeCanvas = document.getElementById('cube-canvas');
    cubeCtx = cubeCanvas.getContext('2d');
    cubeRotation = { x: 0, y: 0 };
    animateCube();
}

function drawCube(ctx, width, height, rotation) {
    const nodes = [
        [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
        [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
    ];
    const edges = [
        [0, 1], [1, 2], [2, 3], [3, 0], // Faccia Posteriore
        [4, 5], [5, 6], [6, 7], [7, 4], // Faccia Anteriore
        [0, 4], [1, 5], [2, 6], [3, 7]  // Lati
    ];
    
    const scale = Math.min(width, height) * 0.2;
    const projectedNodes = [];
    
    // Rotazione e Proiezione
    nodes.forEach(node => {
        // Rotazione Y
        let x1 = node[0] * Math.cos(rotation.y) - node[2] * Math.sin(rotation.y);
        let z1 = node[0] * Math.sin(rotation.y) + node[2] * Math.cos(rotation.y);
        // Rotazione X
        let y1 = node[1] * Math.cos(rotation.x) - z1 * Math.sin(rotation.x);
        let z2 = node[1] * Math.sin(rotation.x) + z1 * Math.cos(rotation.x);
        
        projectedNodes.push({
            x: x1 * scale + width / 2,
            y: y1 * scale + height / 2
        });
    });
    
    // Disegno
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = '#33ff33'; // Colore terminale
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
    cubeRotation.x += 0.01;
    cubeRotation.y += 0.015;
    drawCube(cubeCtx, cubeCanvas.width, cubeCanvas.height, cubeRotation);
    requestAnimationFrame(animateCube);
}

// --- Eventi ---

// Inizia l'escape room
document.querySelector('.start-btn').addEventListener('click', () => {
    initAudio();
    startAmbient();
    playSoundSuccess();
    
    changeState('sfida1');
    startTimer();
    updateO2Display();
    // Aggiorna l'ora corrente
    const now = new Date();
    timeDisplay.innerText = `${now.getHours()}:${now.getMinutes()}`;
});

// Invia codice (clic o tasto Invio)
submitBtn.addEventListener('click', checkCode);
codeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkCode();
});

// Debug: Salta sfida (per test)
// window.addEventListener('keypress', (e) => {
//     if (e.key === 'n') checkCode(); // 'n' per next
// });
