document.addEventListener('DOMContentLoaded', () => {
    const space = document.getElementById('space');
    
    const screenHome = document.getElementById('screenHome');
    const screenNumPlayers = document.getElementById('screenNumPlayers');
    const screenNames = document.getElementById('screenNames');
    const screenStory = document.getElementById('screenStory');
    const screenGame = document.getElementById('screenGame');

    const startBtn = document.getElementById('startBtn');
    const confirmNumBtn = document.getElementById('confirmNumBtn');
    const confirmNamesBtn = document.getElementById('confirmNamesBtn');
    const startChallengesBtn = document.getElementById('startChallengesBtn');

    const numPlayersInput = document.getElementById('numPlayersInput');
    const namesContainer = document.getElementById('namesContainer');
    const timerDisplay = document.getElementById('timer');

    let players = [];
    let seconds = 0;
    let timerInterval;

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

    const hideAllScreens = () => {
        screenHome.style.display = 'none';
        screenNumPlayers.style.display = 'none';
        screenNames.style.display = 'none';
        screenStory.style.display = 'none';
        screenGame.style.display = 'none';
    };

    const startTimer = () => {
        timerInterval = setInterval(() => {
            seconds++;
            const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
            const secs = (seconds % 60).toString().padStart(2, '0');
            timerDisplay.textContent = `Tempo: ${mins}:${secs}`;
        }, 1000);
    };

    startBtn.addEventListener('click', () => {
        hideAllScreens();
        screenNumPlayers.style.display = 'block';
    });

    confirmNumBtn.addEventListener('click', () => {
        const num = parseInt(numPlayersInput.value);
        if (num > 0) {
            namesContainer.innerHTML = '';
            for (let i = 1; i <= num; i++) {
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'space-input';
                input.placeholder = `Nome Tecnico ${i}`;
                input.id = `playerName${i}`;
                namesContainer.appendChild(input);
            }
            hideAllScreens();
            screenNames.style.display = 'block';
        } else {
            alert("Per favore, inserisci un numero valido di tecnici.");
        }
    });

    confirmNamesBtn.addEventListener('click', () => {
        const num = parseInt(numPlayersInput.value);
        players = [];
        for (let i = 1; i <= num; i++) {
            const name = document.getElementById(`playerName${i}`).value || `Tecnico ${i}`;
            players.push(name);
        }
        hideAllScreens();
        screenStory.style.display = 'block';
    });

    startChallengesBtn.addEventListener('click', () => {
        hideAllScreens();
        screenGame.style.display = 'block';
        startTimer();
    });
});
