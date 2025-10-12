// --- DEFINIÇÃO DAS CLASSES ---

class Jogador {
    constructor(nome) {
        this.nome = nome;
        this.pontos = 0;
        this.palavrasAcertadas = [];
    }

    adicionarVitoria(palavra) {
        this.pontos++;
        this.palavrasAcertadas.push(palavra);
    }
}

class Partida {
    constructor(nomesJogadores, config) {
        this.jogadores = nomesJogadores.map(nome => new Jogador(nome));
        this.config = config;
        
        // Filtra o banco de palavras pelo tamanho escolhido
        this.palavrasDisponiveis = PALAVRAS.filter(p => p.length === this.config.wordLength);
        
        this.rodadaAtual = 0;
        this.palavraSecreta = '';
        this.tentativaAtual = 0;
        this.jogadorAtualIndex = 0;
        this.estado = 'jogando';
    }

    // Dentro da classe Partida
iniciarNovaRodada() {
    if (this.rodadaAtual >= this.config.numRounds) {
        this.finalizarPartida();
        return;
    }
    this.rodadaAtual++;
    this.tentativaAtual = 0;
    this.palavraSecreta = this.sortearPalavra().toUpperCase();

    if (this.rodadaAtual === 1) {
        this.jogadorAtualIndex = Math.floor(Math.random() * this.jogadores.length);
    } else {
        this.jogadorAtualIndex = (this.jogadorAtualIndex + 1) % this.jogadores.length;
    }

    // Resetar UI
    desenharTabuleiro(this);
    limparTeclado();
    atualizarUI(); // Para atualizar o indicador de turno
    // Atualiza o painel lateral com os dados da partida
    if(this.rodadaAtual > 1) { // Só mostra a info da "última palavra" a partir da 2ª rodada
        // Esta chamada será feita no final da rodada anterior
    } else {
       atualizarRankingLateral("Nenhuma", null); // Estado inicial
    }
}

    sortearPalavra() {
        const index = Math.floor(Math.random() * this.palavrasDisponiveis.length);
        const palavra = this.palavrasDisponiveis.splice(index, 1)[0]; // Remove a palavra para não repetir
        return palavra || "ERRO"; // Retorna ERRO se acabarem as palavras
    }

    // MÉTODO CORRIGIDO
// Dentro da classe Partida
processarPalpite(palpite) {
    const resultado = this.validarPalpite(palpite);
    const linhaDaJogada = this.tentativaAtual;

    atualizarUI(resultado, linhaDaJogada); // Anima o tabuleiro

    const venceu = palpite.toUpperCase() === this.palavraSecreta;
    const perdeu = this.tentativaAtual >= this.config.numAttempts - 1;

    let vencedorDaRodada = null;

    if (venceu) {
        vencedorDaRodada = this.jogadores[this.jogadorAtualIndex];
        vencedorDaRodada.adicionarVitoria(this.palavraSecreta);
    }

    // Se a rodada acabou (por vitória ou derrota), atualiza o painel e começa a próxima
    if (venceu || perdeu) {
        setTimeout(() => {
            atualizarRankingLateral(this.palavraSecreta, vencedorDaRodada);
            this.iniciarNovaRodada();
        }, 1500); // Espera a animação para mudar de rodada
    }
    // Se a rodada continua, apenas troca o turno
    else {
        this.tentativaAtual++;
        this.jogadorAtualIndex = (this.jogadorAtualIndex + 1) % this.jogadores.length;

        setTimeout(() => {
            atualizarUI(); // Atualiza o indicador "Vez de:"
        }, 1500);
    }
}


    validarPalpite(palpite) {
        const p = palpite.toUpperCase();
        const resultado = [];
        const palavraArray = this.palavraSecreta.split('');
        const palpiteArray = p.split('');
        for (let i = 0; i < palpiteArray.length; i++) {
            if (palpiteArray[i] === palavraArray[i]) {
                resultado[i] = { letra: palpiteArray[i], estado: 'correct' };
                palavraArray[i] = null;
            }
        }
        for (let i = 0; i < palpiteArray.length; i++) {
            if (resultado[i] === undefined) {
                if (palavraArray.includes(palpiteArray[i])) {
                    resultado[i] = { letra: palpiteArray[i], estado: 'misplaced' };
                    palavraArray[palavraArray.indexOf(palpiteArray[i])] = null;
                } else {
                    resultado[i] = { letra: palpiteArray[i], estado: 'wrong' };
                }
            }
        }
        return resultado;
    }

    finalizarPartida() {
        this.estado = 'finalizado';
        document.getElementById('turn-indicator').textContent = "Fim de Jogo!";
        mostrarRanking(this.jogadores);
    }
}

// --- FUNÇÕES GLOBAIS DE UI E CONTROLO ---
let partida;
let palpiteAtual = '';

function desenharTabuleiro(partida) {
    const container = document.getElementById('game-board-container');
    container.innerHTML = '';
    const table = document.createElement('table');
    table.className = 'game-board';
    for (let i = 0; i < partida.config.numAttempts; i++) {
        const tr = document.createElement('tr');
        for (let j = 0; j < partida.config.wordLength; j++) {
            const td = document.createElement('td');
            td.className = 'tile-container';
            const tileDiv = document.createElement('div');
            tileDiv.className = 'tile';
            tileDiv.id = `tile-${i}-${j}`;
            tileDiv.innerHTML = `<div class="tile-front"></div><div class="tile-back"></div>`;
            td.appendChild(tileDiv);
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }
    container.appendChild(table);
}

function limparTeclado() {
    document.querySelectorAll('#keyboard-container button').forEach(btn => {
        btn.classList.remove('correct', 'misplaced', 'wrong');
    });
}

function atualizarUI(resultado, linhaParaAtualizar) {
    // Atualiza placar e indicador de turno
    if (partida.estado === 'jogando') {
        const jogadorAtual = partida.jogadores[partida.jogadorAtualIndex];
        document.getElementById('turn-indicator').textContent = `Vez de: ${jogadorAtual.nome}`;
    }

    // Se houver um resultado de palpite, anima o tabuleiro
    if (resultado) {
        resultado.forEach((item, index) => {
            // Usa a linha que foi passada como parâmetro
            const tile = document.getElementById(`tile-${linhaParaAtualizar}-${index}`);
            const tileBack = tile.querySelector('.tile-back');
            
            // Coloca a letra na face de trás para a animação
            tileBack.textContent = item.letra;
            tileBack.classList.add(item.estado);

            setTimeout(() => tile.classList.add('flip'), index * 200);

            // Atualiza o teclado virtual
            const keyButton = document.querySelector(`.keyboard-row button[data-key="${item.letra}"]`);
            if (keyButton) { // Adiciona verificação para segurança
                keyButton.classList.add(item.estado);
            }
        });
    }
}


// Nova função para mostrar notificações
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;

    // Remove classes antigas e adiciona as novas
    notification.classList.remove('success', 'failure', 'hidden');
    notification.classList.add(type); // 'success' ou 'failure'

    // Mostra a notificação
    notification.classList.add('show');

    // Esconde a notificação após 3 segundos
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Nova função para atualizar o painel lateral
function atualizarRankingLateral(ultimaPalavra, vencedor) {
    const panel = document.getElementById('ranking-panel');
    const lastWordInfo = document.getElementById('last-word-info');
    const tableBody = document.getElementById('live-ranking-body');

    // Atualiza a informação da última rodada
    if (vencedor) {
        lastWordInfo.innerHTML = `<strong>${vencedor.nome}</strong> acertou a palavra <strong>${ultimaPalavra}</strong>!`;
    } else {
        lastWordInfo.innerHTML = `A palavra <strong>${ultimaPalavra}</strong> não foi descoberta.`;
    }

    // Ordena os jogadores por pontos
    const jogadoresOrdenados = [...partida.jogadores].sort((a, b) => b.pontos - a.pontos);
    
    // Limpa e recria a tabela de ranking
    tableBody.innerHTML = '';
    jogadoresOrdenados.forEach((jogador, index) => {
        const tr = document.createElement('tr');
        const pos = index + 1;

        tr.innerHTML = `<td>${pos}º</td><td>${jogador.nome}</td><td>${jogador.pontos}</td>`;
        tableBody.appendChild(tr);
    });
}


function handleKeyPress(key) {
    if (partida.estado !== 'jogando') return;

    if (key === 'ENTER') {
        if (palpiteAtual.length === partida.config.wordLength) {
            partida.processarPalpite(palpiteAtual);
            palpiteAtual = '';
        }
    } else if (key === 'BACKSPACE') {
        if (palpiteAtual.length > 0) {
            palpiteAtual = palpiteAtual.slice(0, -1);
            const tile = document.getElementById(`tile-${partida.tentativaAtual}-${palpiteAtual.length}`);
            tile.querySelector('.tile-front').textContent = '';
            tile.querySelector('.tile-front').classList.remove('filled');
        }
    } else if (palpiteAtual.length < partida.config.wordLength && /^[A-Z]$/.test(key)) {
        const tile = document.getElementById(`tile-${partida.tentativaAtual}-${palpiteAtual.length}`);
        const tileFront = tile.querySelector('.tile-front');
        tileFront.textContent = key;
        tileFront.classList.add('filled');
        palpiteAtual += key;
    }
}


// --- INICIALIZAÇÃO DA PARTIDA ---
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const nomesJogadores = [params.get('jogador1'), params.get('jogador2')]; 
    const config = {
        wordLength: parseInt(params.get('wordLength'), 10),
        numAttempts: parseInt(params.get('numAttempts'), 10),
        numRounds: parseInt(params.get('numRounds'), 10)
    };

    if (!nomesJogadores[0] || !config.wordLength) {
        // Não estamos na página do jogo, não faz nada
        return;
    }
    
    partida = new Partida(nomesJogadores, config);
    partida.iniciarNovaRodada();

    // Event Listeners
    document.getElementById('keyboard-container').addEventListener('click', (event) => {
        if (event.target.tagName === 'BUTTON') handleKeyPress(event.target.getAttribute('data-key'));
    });
    document.addEventListener('keydown', (event) => {
        let key = event.key.toUpperCase();
        if (key === 'BACKSPACE' || key === 'ENTER' || /^[A-Z]$/.test(key)) handleKeyPress(key);
    });

    document.getElementById('ranking-play-again-btn').addEventListener('click', () => {
        window.location.href = 'index.html';
    });
});