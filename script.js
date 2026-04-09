// --- SISTEMA AUDIO MATRIX ---
let audioCtx;
function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playMatrixSound(freq, type, duration, volume = 0.1) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type; // 'sine', 'square', 'sawtooth', 'triangle'
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

const sfx = {
    type: () => playMatrixSound(Math.random() * 50 + 800, 'square', 0.05, 0.02),
    success: () => {
        playMatrixSound(1000, 'sine', 0.2);
        setTimeout(() => playMatrixSound(1500, 'sine', 0.3), 100);
    },
    error: () => playMatrixSound(150, 'sawtooth', 0.8, 0.2),
    alarm: () => {
        playMatrixSound(2000, 'sine', 0.1);
        setTimeout(() => playMatrixSound(1800, 'sine', 0.1), 150);
    }
};

// --- LOGICA DI GIOCO ---
function checkCode() {
    const input = document.getElementById('code-input');
    const val = input.value.trim().toUpperCase();
    
    // CASO SPECIALE: Protocollo 3 (Le Capsule)
    if (currentState === 'sfida3') {
        if (val === 'A') { // Scelta Corretta
            sfx.success();
            changeState('sfida4');
        } else { // Errore Fatale: Sconfitta Immediata
            sfx.error();
            clearInterval(timerInterval);
            document.getElementById('state-sconfitta').innerHTML = `
                <h2><span class="error-text">ACCESSO NEGATO</span></h2>
                <p>Hai scelto la capsula sbagliata. Integrità strutturale compromessa.</p>
                <p>ESPULSIONE NELLO SPAZIO IN CORSO...</p>`;
            changeState('sconfitta');
        }
        input.value = '';
        return;
    }

    // Altri Protocolli
    if (val === codes[currentState]) {
        sfx.success();
        // ... (passaggio stati standard)
    } else {
        sfx.error();
        input.value = '';
    }
}

// Comparsa scritte stile Matrix (Typing Effect)
function typeWriter(element) {
    const text = element.innerText;
    element.innerText = '';
    let i = 0;
    const timer = setInterval(() => {
        if (i < text.length) {
            element.append(text.charAt(i));
            sfx.type(); // Suono bit-crushed per ogni lettera
            i++;
        } else {
            clearInterval(timer);
        }
    }, 40);
}
