document.addEventListener('DOMContentLoaded', () => {
    const configForm = document.getElementById('config-form');
    const wordLengthSelect = document.getElementById('word-length');

    // Validação para garantir que existem palavras do tamanho selecionado
    wordLengthSelect.addEventListener('change', () => {
        const length = parseInt(wordLengthSelect.value, 10);
        const wordsOfLength = PALAVRAS.filter(p => p.length === length);
        if (wordsOfLength.length === 0) {
            alert(`Aviso: Não há palavras de ${length} letras no banco de palavras.`);
        }
    });

    configForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const player1 = document.getElementById('player1').value;
        const player2 = document.getElementById('player2').value;
        const wordLength = document.getElementById('word-length').value;
        const numAttempts = document.getElementById('num-attempts').value;
        const numRounds = document.getElementById('num-rounds').value;
        
        // Verifica se existem palavras com o tamanho escolhido antes de iniciar
        const wordsOfLength = PALAVRAS.filter(p => p.length === parseInt(wordLength, 10));
        if (wordsOfLength.length === 0) {
            alert(`Não é possível iniciar: Não há palavras de ${wordLength} letras no banco de palavras.`);
            return;
        }

        const params = new URLSearchParams({
            jogador1: player1, // Sem encodeURIComponent
            jogador2: player2, // Sem encodeURIComponent
            wordLength,
            numAttempts,
            numRounds
        });

        window.location.href = `jogo.html?${params.toString()}`;
    });
});