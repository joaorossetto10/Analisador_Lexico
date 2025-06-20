// Arquivo JavaScript principal do Analisador Léxico
// Responsável por armazenar as palavras, montar o AFD, validar palavras digitadas e gerar a tabela visual

let palavras = [];          // Lista de palavras adicionadas
let afd = {};               // Objeto que representa o autômato (transições)
let finais = new Set();     // Conjunto de estados finais
const alfabeto = 'abcdefghijklmnopqrstuvwxyz'.split(''); // Alfabeto considerado (a-z)

// Função chamada ao adicionar manualmente uma palavra no array
function adicionarPalavraManual(palavra) {
  if (!palavra || palavras.includes(palavra)) return;
  palavras.push(palavra);
  atualizarAFD(); // Reconstrói o AFD com a nova palavra
}

// Recupera o valor digitado no campo e chama o método de adicionar
function adicionarPalavra() {
  const entrada = document.getElementById('entrada-palavra');
  const palavra = entrada.value.trim().toLowerCase();
  entrada.value = '';
  adicionarPalavraManual(palavra);
}

// Permite adicionar uma palavra pressionando Enter ou Espaço
// no campo de entrada de palavras

document.getElementById('entrada-palavra').addEventListener('keydown', function(e) {
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
    adicionarPalavra();
  }
});

// Constrói o AFD com base nas palavras armazenadas no array
function atualizarAFD() {
  afd = {};
  finais.clear();
  let contadorEstado = 1;
  for (let palavra of palavras) {
    let estado = 'q0';
    if (!afd[estado]) afd[estado] = {};
    for (let i = 0; i < palavra.length; i++) {
      const letra = palavra[i];
      const proximo = afd[estado][letra] || `q${contadorEstado++}`;
      afd[estado][letra] = proximo;
      estado = proximo;
      if (!afd[estado]) afd[estado] = {};
    }
    finais.add(estado); // O último estado vira final
  }
  atualizarListaPalavras();
  desenharTabela();
}

// Atualiza a lista visual das palavras adicionadas
function atualizarListaPalavras() {
  const ul = document.getElementById('lista-palavras');
  ul.innerHTML = '';
  for (let palavra of palavras) {
    const li = document.createElement('li');
    li.classList.add('adicionada');
    li.appendChild(document.createTextNode(palavra));

    const botao = document.createElement('button');
    botao.textContent = '❌';
    botao.onclick = function () {
      palavras = palavras.filter(p => p !== palavra);
      atualizarAFD();
    };
    li.appendChild(botao);
    ul.appendChild(li);
  }
}

// Desenha a tabela de transições com base no AFD construído
function desenharTabela() {
  const tabela = document.getElementById('tabela-estados');
  tabela.innerHTML = '';

  const thRow = document.createElement('tr');
  thRow.innerHTML = '<th>Estado</th>' + alfabeto.map(s => `<th>${s}</th>`).join('');
  tabela.appendChild(thRow);

  for (let estado in afd) {
    const tr = document.createElement('tr');
    const ehFinal = finais.has(estado);
    tr.innerHTML = `<td${ehFinal ? ' style="font-weight:bold;color:green;"' : ''}>${estado}</td>` +
      alfabeto.map(s => {
        const destino = afd[estado][s];
        return `<td data-estado="${estado}" data-letra="${s}">${destino ? destino : ''}</td>`;
      }).join('');
    tabela.appendChild(tr);
  }
}

// Atualiza dinamicamente o caminho e destaca células à medida que o usuário digita

document.getElementById('campo-validar').addEventListener('input', function () {
  const entrada = this.value.trim().toLowerCase();
  const caminhoSpan = document.getElementById('caminho-resultado');
  caminhoSpan.textContent = '';

  // Remove cores anteriores da tabela
  document.querySelectorAll('td').forEach(td => {
    td.classList.remove('cell-final-ok', 'cell-final-erro');
  });

  if (!entrada || Object.keys(afd).length === 0) return;

  let estado = 'q0';
  let caminho = [{ nome: estado, erro: false }];
  let reconhecida = true;

  for (let i = 0; i < entrada.length; i++) {
    const letra = entrada[i];
    const prox = afd[estado]?.[letra];
    const celula = document.querySelector(`td[data-estado="${estado}"][data-letra="${letra}"]`);
    if (prox) {
      if (celula) celula.classList.add('cell-final-ok');
      estado = prox;
      caminho.push({ nome: estado, erro: false });
    } else {
      if (celula) celula.classList.add('cell-final-erro');
      caminho.push({ nome: '?', erro: true });
      reconhecida = false;
      break;
    }
  }

  // Exibe caminho com estados vermelhos em caso de erro
  const caminhoHtml = caminho.map(item =>
    `<span style="color:${item.erro ? 'red' : 'inherit'}">${item.nome}</span>`
  ).join(' → ');
  document.getElementById('caminho-resultado').innerHTML = caminhoHtml;
});

// Validação final com Enter ou Espaço (confirmação e exibição)
document.getElementById('campo-validar').addEventListener('keydown', function (e) {
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
    const entrada = this.value.trim().toLowerCase();
    if (!entrada) return;

    const caminho = [];
    let estado = 'q0';
    let reconhecida = true;
    caminho.push(estado);
    for (let letra of entrada) {
      if (afd[estado] && afd[estado][letra]) {
        estado = afd[estado][letra];
        caminho.push(estado);
      } else {
        caminho.push('?');
        reconhecida = false;
        break;
      }
    }
    if (!finais.has(estado)) reconhecida = false;

    const resultado = document.getElementById('resultado-validacao');
    resultado.textContent = reconhecida ? '✅ Palavra reconhecida' : '❌ Palavra rejeitada';
    resultado.className = 'resultado-validacao ' + (reconhecida ? 'ok' : 'erro');

    const ul = document.getElementById(reconhecida ? 'validadas' : 'rejeitadas');
    const li = document.createElement('li');
    li.textContent = entrada;
    li.classList.add(reconhecida ? 'reconhecida' : 'rejeitada');

    const botao = document.createElement('button');
    botao.textContent = '❌';
    botao.onclick = () => li.remove();
    li.appendChild(botao);
    ul.appendChild(li);

    this.value = '';
  }
});

// Limpa tudo: palavras, AFD, tabelas, resultados e listas
function limparPalavras() {
  palavras = [];
  afd = {};
  finais.clear();
  document.getElementById('lista-palavras').innerHTML = '';
  document.getElementById('validadas').innerHTML = '';
  document.getElementById('rejeitadas').innerHTML = '';
  document.getElementById('tabela-estados').innerHTML = '';
  document.getElementById('caminho-resultado').textContent = '';
  document.getElementById('resultado-validacao').textContent = '';
}
