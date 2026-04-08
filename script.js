document.addEventListener('DOMContentLoaded', () => {
    const space = document.getElementById('space');
    const startBtn = document.getElementById('startBtn');
    const timerDisplay = document.getElementById('timer');

    const createStars = (count) => {
        for (let i = 0; i < count; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            
            const size = Math.random() * 2 + 0.5;
            
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            star.style.top = `${Math.random() * 100}%`;
            star.style.left = `${Math.random() * 100}%`;
            
            const duration = 2 + Math.random() * 3;
            const delay = Math.random() * 5;
            star.style.animation = `twinkle ${duration}s ${delay}s infinite`;
            
            space.appendChild(star);
        }
    };

    createStars(70);

    let seconds = 0;
    let timerInterval;

    const startTimer = () => {
        timerDisplay.style.display = 'block';
        timerInterval = setInterval(() => {
            seconds++;
            const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
            const secs = (seconds % 60).toString().padStart(2, '0');
            timerDisplay.textContent = `Tempo: ${mins}:${secs}`;
        }, 1000);
    };

    startBtn.addEventListener('click', () => {
        startBtn.style.display = 'none';
        alert("🚨 Allarme! La missione sta per iniziare. Preparati al decollo!");
        startTimer();
    });
});
