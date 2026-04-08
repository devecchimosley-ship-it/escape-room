document.addEventListener('DOMContentLoaded', () => {
    const space = document.getElementById('space');
    const startBtn = document.getElementById('startBtn');

    // 1. Generazione dinamica delle stelle
    const createStars = (count) => {
        for (let i = 0; i < count; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            
            // Dimensioni casuali
            const size = Math.random() * 2 + 0.5;
            
            // Posizione e animazione casuale
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            star.style.top = `${Math.random() * 100}%`;
            star.style.left = `${Math.random() * 100}%`;
            
            // Durata del luccichio casuale
            const duration = 2 + Math.random() * 3;
            const delay = Math.random() * 5;
            star.style.animation = `twinkle ${duration}s ${delay}s infinite`;
            
            space.appendChild(star);
        }
    };

    createStars(70);

    // 2. Gestione Click Inizia Missione
    startBtn.addEventListener('click', () => {
        console.log("Inizializzazione protocollo di fuga...");
        alert("🚨 Allarme! La missione sta per iniziare. Preparati al decollo!");
        // Qui potresti aggiungere la logica per cambiare scena o caricare il gioco vero e proprio
    });
});
