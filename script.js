let audioCtx;
const codes = { sfida1: "192114", sfida2: "6", sfida4: "750" };
let currentState = 'login';
let o2 = 15;
let timer;
let isTyping = false;

// --- AUDIO ENGINE ---
function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playSfx(freq, type, dur, vol = 0.1) {
    if(!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + dur);
}

const sounds = {
    type: () => playSfx(Math.random() * 100 + 600, 'square', 0.05, 0.01),
    success: () => { playSfx(800, 'sine', 0.2); setTimeout(() => playSfx(1200, 0.3), 100); },
    error: () => playSfx(150, 'sawtooth', 0.6, 0.3),
    alarm: () => { playSfx(1000, 'square', 0.1, 0.05); setTimeout(() => playSfx(800, 'square', 0.1, 0.05), 150); },
    death: () => playSfx(50, 'sawtooth', 2.0, 0.5)
};

// --- TYPEWRITER EFFECT ---
async function typeText(element) {
    isTyping = true;
    const text = element.getAttribute('data-text') || element.innerText;
    element.setAttribute('data-text', text); // Salva il testo originale
    element.innerText = '';
    
    for (let i = 0; i < text.length; i++) {
        element.innerHTML += text.charAt(i);
        if (text.charAt(i) !== ' ') sounds.type();
        await new Promise(r => setTimeout(r, 25)); // Velocità digitazione
    }
    isTyping = false;
}

async function triggerStateTyping(stateId) {
    const paragraphs = document.querySelectorAll(`#${stateId} .typewriter`);
    for (let p of paragraphs) {
        await typeText(p);
    }
}

// --- CORE LOGIC ---
function changeState(newState) {
    const current = document.querySelector('.terminal-state.active');
    if (current) current.classList.remove('active');
    
    const next = document.getElementById(`state-${newState}`);
    next.classList.add('active');
    currentState = newState;

    // Attiva la digitazione per i testi narrativi
    triggerStateTyping(`state-${newState}`);

    // Mostra/Nascondi la barra di input
    const inputArea = document.getElementById('input-area');
    if (newState === 'sfida1' || newState === 'sfida2' || newState === 'sfida4') {
        inputArea.classList.add('active');
        document.getElementById('code-input').focus();
    } else {
        inputArea.classList.remove('active');
    }

    if (newState === 'sfida2') simulateReactor();
}

// GESTIONE CAPSULE (MORTE ISTANTANEA P3)
function selectCapsule(choice) {
    if (isTyping) return; // Impedisce di cliccare mentre il testo appare

    if (choice === 'A') {
        sounds.success();
        changeState('sfida4');
    } else {
        sounds.death();
        clearInterval(timer);
        document.getElementById('death-reason').innerText = `ERRORE CRITICO: La capsula ${choice} era compromessa. Decompressione hangar avvenuta. Equipaggio eliminato.`;
        document.getElementById('death-reason').classList.add('typewriter');
        changeState('sconfitta');
    }
}

function checkCode() {
    if (isTyping) return;

    const val = document.getElementById('code-input').value.trim().toUpperCase();
    if (val === codes[currentState]) {
        sounds.success();
        document.getElementById('code-input').value = '';
        
        if (currentState === 'sfida1') changeState('sfida2');
        else if (currentState === 'sfida2') changeState('sfida3');
        else if (currentState === 'sfida4') {
            clearInterval(timer);
            changeState('vittoria');
        }
    } else {
        sounds.error();
        document.getElementById('code-input').value = '';
        
        // Penalità di tempo per errore
        o2 -= 1;
        updateTimerDisplay();
    }
}

// TIMER E ALLARMI
function updateTimerDisplay() {
    const display = document.querySelector('.status');
    display.innerText = `O2_LEVEL: ${Math.max(0, Math.floor((o2/15)*100))}%`;
    if (o2 <= 5) {
        display.classList.add('critical');
        sounds.alarm();
    }
}

function startTimer() {
    timer = setInterval(() => {
        o2--;
        updateTimerDisplay();
        if (o2 <= 0) {
            clearInterval(timer);
            sounds.death();
            changeState('sconfitta');
        }
    }, 60000); // 1 minuto reale
}

function simulateReactor() {
    const el = document.querySelector('.reattore-val');
    if(el) {
        setInterval(() => { if(currentState === 'sfida2') el.innerText = Math.floor(Math.random() * 900 + 100); }, 100);
    }
}

// EVENTS
document.getElementById('login-btn').addEventListener('click', () => {
    initAudio();
    changeState('intro');
});

document.querySelector('.start-btn').addEventListener('click', () => {
    changeState('sfida1');
    startTimer();
});

document.getElementById('submit-code').addEventListener('click', checkCode);
document.getElementById('code-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkCode();
});
