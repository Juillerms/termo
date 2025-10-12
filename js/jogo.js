// --- DEFINIÇÃO DAS CLASSES ---

class Jogador {
    constructor(nome) {
        this.nome = nome;
        this.pontos = 0;
        this.palavrasAcertadas = [];
        this.acertou = false; // Adicionado para jogos de 1 rodada
    }

    adicionarVitoria(palavra) {
        this.pontos++;
        this.palavrasAcertadas.push(palavra);
        this.acertou = true;
    }
}

class Partida {
    constructor(nomesJogadores, config) {
        this.jogadores = nomesJogadores.map(nome => new Jogador(nome));
        this.config = config;
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

    if (this.config.numRounds > 1) {
        document.getElementById('round-progress').textContent = `(Rodada ${this.rodadaAtual} de ${this.config.numRounds})`;
        
        // Se for a primeira rodada, define a mensagem inicial diretamente
        if (this.rodadaAtual === 1) {
            document.getElementById('last-word-info').textContent = "Aguardando 1ª rodada...";
            // Atualiza a tabela de ranking apenas com os nomes e pontos iniciais
            atualizarRankingLateral(null, null);
        }
    }

    desenharTabuleiro(this);
    limparTeclado();
    atualizarUI();
}

    sortearPalavra() {
        const index = Math.floor(Math.random() * this.palavrasDisponiveis.length);
        const palavra = this.palavrasDisponiveis.splice(index, 1)[0];
        return palavra || "ERRO";
    }

    processarPalpite(palpite) {
        const resultado = this.validarPalpite(palpite);
        const linhaDaJogada = this.tentativaAtual;

        atualizarUI(resultado, linhaDaJogada);

        const venceu = palpite.toUpperCase() === this.palavraSecreta;
        const perdeu = this.tentativaAtual >= this.config.numAttempts - 1;
        let vencedorDaRodada = null;

        if (venceu) {
            vencedorDaRodada = this.jogadores[this.jogadorAtualIndex];
            vencedorDaRodada.adicionarVitoria(this.palavraSecreta);
        }

        if (venceu || perdeu) {
            if (this.config.numRounds === 1) {
                setTimeout(() => this.finalizarPartida(), 1500);
            } else {
                setTimeout(() => {
                    atualizarRankingLateral(this.palavraSecreta, vencedorDaRodada);
                    this.iniciarNovaRodada();
                }, 1500);
            }
        } else {
            this.tentativaAtual++;
            this.jogadorAtualIndex = (this.jogadorAtualIndex + 1) % this.jogadores.length;
            setTimeout(() => atualizarUI(), 1500);
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

    // Dentro da classe Partida
    finalizarPartida() {
        this.estado = 'finalizado';
        document.getElementById('turn-indicator').textContent = "Fim de Jogo!";
        
        // --- LÓGICA ADICIONADA PARA DETERMINAR O VENCEDOR ---
        const jogadoresOrdenados = [...this.jogadores].sort((a, b) => b.pontos - a.pontos);
        const vencedor = jogadoresOrdenados[0];
        const segundoLugar = jogadoresOrdenados[1];
        const modalTitle = document.querySelector('#ranking-modal h2');
        
        // Cria o elemento para a mensagem do vencedor
        const winnerMessage = document.createElement('p');
        winnerMessage.style.fontWeight = 'bold';
        winnerMessage.style.fontSize = '1.2em';
        winnerMessage.style.margin = '10px 0 20px 0';
        
        // Verifica se houve um vencedor ou empate
        if (vencedor.pontos > segundoLugar.pontos) {
            winnerMessage.textContent = `O jogador ${vencedor.nome} venceu!!`;
            winnerMessage.style.color = 'var(--cor-correta)'; // Cor verde
        } else if (vencedor.pontos === 0) {
            winnerMessage.textContent = 'A partida terminou em empate, sem vencedores.';
        }
        else {
            winnerMessage.textContent = 'A partida terminou em empate!';
        }
        
        // Insere a mensagem logo após o título "Fim de Jogo!"
        modalTitle.insertAdjacentElement('afterend', winnerMessage);

        // Lógica para o caso de 1 rodada (que já existia)
        if (this.config.numRounds === 1) {
            const rankingTable = document.getElementById('ranking-table');
            if (!vencedor.acertou) { // Se ninguém acertou
                rankingTable.style.display = 'none';
                const p = document.createElement('p');
                p.textContent = `Ninguém acertou, a palavra era: ${this.palavraSecreta}`;
                winnerMessage.insertAdjacentElement('afterend', p);
            }
        }
        
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
    if (partida.estado === 'jogando') {
        const jogadorAtual = partida.jogadores[partida.jogadorAtualIndex];
        document.getElementById('turn-indicator').textContent = `Vez de: ${jogadorAtual.nome}`;
    }

    if (resultado) {
        resultado.forEach((item, index) => {
            const tile = document.getElementById(`tile-${linhaParaAtualizar}-${index}`);
            const tileBack = tile.querySelector('.tile-back');
            tileBack.textContent = item.letra;
            tileBack.classList.add(item.estado);
            setTimeout(() => tile.classList.add('flip'), index * 200);
            const keyButton = document.querySelector(`.keyboard-row button[data-key="${item.letra}"]`);
            if (keyButton) {
                keyButton.classList.add(item.estado);
            }
        });
    }
}

// Substitua a sua função 'atualizarRankingLateral' por esta versão
function atualizarRankingLateral(ultimaPalavra, vencedor) {
    const lastWordInfo = document.getElementById('last-word-info');
    const tableBody = document.getElementById('live-ranking-body');

    // Esta função agora SÓ atualiza a informação da última palavra
    // se uma palavra tiver sido de facto jogada.
    if (ultimaPalavra) {
        if (vencedor) {
            lastWordInfo.innerHTML = `Palavra Anterior: <strong>${ultimaPalavra}</strong><br><small>(${vencedor.nome} acertou)</small>`;
        } else {
            lastWordInfo.innerHTML = `Palavra Anterior: <strong>${ultimaPalavra}</strong><br><small>&nbsp;&nbsp;(Não descoberta)</small>`;
        }
    }

    // A lógica de atualizar a tabela de pontos continua a mesma
    const jogadoresOrdenados = [...partida.jogadores].sort((a, b) => b.pontos - a.pontos);
    
    tableBody.innerHTML = '';
    jogadoresOrdenados.forEach((jogador, index) => {
        const tr = document.createElement('tr');
        const pos = index + 1;
        tr.innerHTML = `<td>${pos}º</td><td>${jogador.nome}</td><td>${jogador.pontos}</td>`;
        tableBody.appendChild(tr);
    });
}

function mostrarRanking(jogadores) {
    const tableBody = document.getElementById('ranking-table-body');
    tableBody.innerHTML = '';

    const jogadoresOrdenados = [...jogadores].sort((a, b) => b.pontos - a.pontos);

    jogadoresOrdenados.forEach(jogador => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${jogador.nome}</td><td>${jogador.pontos}</td><td>${jogador.palavrasAcertadas.join(', ') || '-'}</td>`;
        tableBody.appendChild(tr);
    });

    document.getElementById('ranking-modal-overlay').classList.remove('hidden');
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
        return;
    }

    partida = new Partida(nomesJogadores, config);

    if (partida.config.numRounds === 1) {
        document.getElementById('ranking-panel').classList.add('hidden');
        document.querySelector('.game-wrapper').classList.add('center-game');
    } else {
        document.getElementById('ranking-panel').classList.remove('hidden');
    }

    partida.iniciarNovaRodada();

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