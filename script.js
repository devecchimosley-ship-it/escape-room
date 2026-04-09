let audioCtx;
const codes = { sfida1: "192114", sfida2: "6", sfida4: "750" };
let currentState = 'login';
let o2 = 15;
let timer;

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
    type: () => playSfx(Math.random() * 100 + 400, 'square', 0.05, 0.02),
    success: () => { playSfx(800, 'sine', 0.2); setTimeout(() => playSfx(1200, 0.3), 100); },
    error: () => playSfx(150, 'sawtooth', 0.6, 0.2),
    alarm: () => { playSfx(1000, 'sine', 0.1); setTimeout(() => playSfx(800, 0.1), 150); }
};

// --- CORE LOGIC ---
function changeState(newState) {
    const current = document.querySelector('.terminal-state.active');
    if (current) current.classList.remove('active');
    
    const next = document.getElementById(`state-${newState}`);
    next.classList.add('active');
    currentState = newState;

    // Effetto Typewriter sui paragrafi
    const paragraphs = next.querySelectorAll('.typewriter');
    paragraphs.forEach(p => typeText(p));

    document.getElementById('input-area').className = newState.startsWith('sfida') ? 'active' : '';
}

function typeText(element) {
    const text = element.innerText;
    element.innerText = '';
    let i = 0;
    const interval = setInterval(() => {
        if (i < text.length) {
            element.append(text.charAt(i));
            sounds.type();
            i++;
        } else { clearInterval(interval); }
    }, 40);
}

// GESTIONE CAPSULE (MORTE ISTANTANEA)
function selectCapsule(choice) {
    if (choice === 'A') {
        sounds.success();
        changeState('sfida4');
    } else {
        sounds.error();
        clearInterval(timer);
        document.getElementById('death-reason').innerText = `ERRORE FATALE: La capsula ${choice} era una trappola neurale.`;
        changeState('sconfitta');
    }
}

function checkCode() {
    const val = document.getElementById('code-input').value.trim();
    if (val === codes[currentState]) {
        sounds.success();
        document.getElementById('code-input').value = '';
        if (currentState === 'sfida1') changeState('sfida2');
        else if (currentState === 'sfida2') changeState('sfida3');
        else if (currentState === 'sfida4') changeState('vittoria');
    } else {
        sounds.error();
        document.getElementById('code-input').value = '';
    }
}

// TIMER E ALLARMI
function startTimer() {
    timer = setInterval(() => {
        o2--;
        const display = document.querySelector('.status');
        display.innerText = `O2_LEVEL: ${Math.max(0, Math.floor((o2/15)*100))}%`;
        if (o2 <= 5) {
            display.classList.add('critical');
            sounds.alarm();
        }
        if (o2 <= 0) {
            clearInterval(timer);
            changeState('sconfitta');
        }
    }, 60000);
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
