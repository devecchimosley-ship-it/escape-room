let audioCtx;

// Le 30 risposte corrette
const codes = {
    sfida1: "NERO", sfida2: "RESPIRO", sfida3: "TELESCOPIO", sfida4: "REATTORE",
    sfida5: "GUANTO", sfida6: "ACQUA", sfida7: "ORBITA", sfida8: "VUOTO",
    sfida9: "STELLA", sfida10: "ECLISSI", sfida11: "TEMPO", sfida12: "ASTEROIDE",
    sfida13: "COMETA", sfida14: "GRAVITA", sfida15: "LASER", sfida16: "SPECCHIO",
    sfida17: "ECO", sfida18: "OMBRA", sfida19: "MAGNETE", sfida20: "INERZIA",
    sfida21: "ATOMO", sfida22: "DNA", sfida23: "VIRUS", sfida24: "SONAR",
    sfida25: "ZERO", sfida26: "MEMORIA", sfida27: "SONNO", sfida28: "SILENZIO",
    sfida29: "SANGUE", sfida30: "NOME"
};

let currentState = 'login';
let o2 = 60; // 25 minuti iniziali
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
async function triggerStateTyping(stateId) {
    const paragraphs = document.querySelectorAll(`#${stateId} .typewriter`);
    
    paragraphs.forEach(p => {
        if (!p.getAttribute('data-text')) {
            p.setAttribute('data-text', p.innerText); 
        }
        p.innerText = ''; 
    });

    for (let p of paragraphs) {
        await typeText(p);
    }
}

async function typeText(element) {
    isTyping = true;
    const text = element.getAttribute('data-text');
    
    for (let i = 0; i < text.length; i++) {
        const char = text.charAt(i);
        if (char === '\n') {
            element.innerHTML += '<br>';
        } else {
            element.innerHTML += char;
            if (char !== ' ') sounds.type();
        }
        await new Promise(r => setTimeout(r, 20)); // Velocità
    }
    isTyping = false;
}

// --- CORE LOGIC AUTOMATIZZATA ---
function changeState(newState) {
    const current = document.querySelector('.terminal-state.active');
    if (current) current.classList.remove('active');
    
    const next = document.getElementById(`state-${newState}`);
    next.classList.add('active');
    currentState = newState;

    triggerStateTyping(`state-${newState}`);

    // Mostra barra di input solo se siamo in una "sfida"
    const inputArea = document.getElementById('input-area');
    if (newState.startsWith('sfida')) {
        inputArea.classList.add('active');
        document.getElementById('code-input').focus();
    } else {
        inputArea.classList.remove('active');
    }
}

function checkCode() {
    if (isTyping) return;

    const val = document.getElementById('code-input').value.trim().toUpperCase();
    
    if (val === codes[currentState]) {
        sounds.success();
        document.getElementById('code-input').value = '';
        
        // Estrazione dinamica del numero di livello
        let currentNum = parseInt(currentState.replace('sfida', ''));
        
        if (currentNum < 30) {
            changeState('sfida' + (currentNum + 1));
        } else {
            clearInterval(timer);
            changeState('vittoria');
        }
    } else {
        sounds.error();
        document.getElementById('code-input').value = '';
        
        // Penalità di O2 per ogni errore
        o2 -= 1;
        updateTimerDisplay();
    }
}

// TIMER E ALLARMI
function updateTimerDisplay() {
    const display = document.querySelector('.status');
    display.innerText = `O2_LEVEL: ${Math.max(0, Math.floor((o2/60)*100))}%`;
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
            const deathReason = document.getElementById('death-reason');
            deathReason.setAttribute('data-text', "Livello di ossigeno a zero. Asfissia dell'equipaggio confermata.");
            changeState('sconfitta');
        }
    }, 60000); // 1 minuto per ciclo
}

// EVENTI DI GIOCO
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
