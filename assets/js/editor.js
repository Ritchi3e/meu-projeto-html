/* =========================================================
   EDITOR DA AULA
   Abre o arquivo da aula, deixa escrever com a barra de
   ferramentas e salva de volta pelo servidor local.

   Precisa do servidor rodando (iniciar.bat). Sem ele o
   navegador nao tem como gravar no disco.
   ========================================================= */

const editor = document.getElementById("editor");
const estadoSalvo = document.getElementById("estado-salvo");

let caminhoArquivo = "";
let tituloCompleto = "";
let resumoAula = "";
let temMudanca = false;
let salvando = false;

/* ---------------------------------------------------------
   AJUDANTES
   --------------------------------------------------------- */

function escaparHtml(texto) {
    const div = document.createElement("div");
    div.textContent = texto;
    return div.innerHTML;
}

function mostrarRecado(tipo, titulo, linhas) {
    const alvo = document.getElementById("recado");
    let html = '<p class="recado-titulo">' + escaparHtml(titulo) + "</p><ul>";
    linhas.forEach(function (linha) {
        html += "<li>" + escaparHtml(linha) + "</li>";
    });
    alvo.className = "recado recado-" + tipo;
    alvo.innerHTML = html + "</ul>";
    alvo.hidden = false;
}

function esconderRecado() {
    document.getElementById("recado").hidden = true;
}

function marcarEstado(texto, classe) {
    estadoSalvo.textContent = texto;
    estadoSalvo.className = "estado-salvo " + (classe || "");
}

function marcarMudanca() {
    if (salvando) return;
    temMudanca = true;
    marcarEstado("alterações não salvas", "estado-pendente");
}

/* ---------------------------------------------------------
   CARREGAR A AULA
   --------------------------------------------------------- */

// pega o bloco <main> do arquivo, sem o <h1> (que o servidor remonta)
function corpoDoArquivo(html) {
    const documento = new DOMParser().parseFromString(html, "text/html");
    const principal = documento.querySelector("main");
    if (!principal) return "<p>Comece a escrever aqui.</p>";

    const titulo = principal.querySelector("h1");
    if (titulo) titulo.remove();

    const corpo = principal.innerHTML.trim();
    return corpo === "" ? "<p>Comece a escrever aqui.</p>" : corpo;
}

async function carregar() {
    const parametros = new URLSearchParams(window.location.search);
    caminhoArquivo = parametros.get("arquivo") || "";
    tituloCompleto = parametros.get("titulo") || "";
    resumoAula = parametros.get("resumo") || "";

    if (caminhoArquivo === "") {
        marcarEstado("nenhuma aula aberta", "estado-erro");
        mostrarRecado("erro", "Não sei qual aula abrir.", [
            "Este editor precisa saber qual arquivo editar.",
            "Volte ao índice e clique em Editar em uma das aulas, ou cadastre uma nova."
        ]);
        editor.contentEditable = "false";
        return;
    }

    document.getElementById("caminho-aula").textContent = caminhoArquivo;
    document.getElementById("ver-aula").href = caminhoArquivo;

    try {
        const resposta = await fetch(caminhoArquivo, { cache: "no-store" });
        if (!resposta.ok) throw new Error("não consegui abrir o arquivo (" + resposta.status + ")");
        const html = await resposta.text();

        // o titulo e o resumo vem do proprio arquivo, que e a fonte da verdade
        const documento = new DOMParser().parseFromString(html, "text/html");
        const h1 = documento.querySelector("main h1");
        if (h1) tituloCompleto = h1.textContent.trim();
        const descricao = documento.querySelector('meta[name="description"]');
        if (descricao) resumoAula = descricao.getAttribute("content") || "";

        document.getElementById("titulo-aula").textContent = tituloCompleto || "Sem título";
        document.title = "Editando: " + (tituloCompleto || caminhoArquivo);
        editor.innerHTML = corpoDoArquivo(html);
        marcarEstado("salvo", "estado-ok");
    } catch (erro) {
        marcarEstado("erro ao abrir", "estado-erro");
        mostrarRecado("erro", "Não consegui abrir a aula.", [
            erro.message,
            "Confira se o servidor está rodando (iniciar.bat) e se o arquivo existe."
        ]);
        editor.contentEditable = "false";
    }
}

/* ---------------------------------------------------------
   SALVAR
   --------------------------------------------------------- */

async function salvar(automatico) {
    if (salvando || caminhoArquivo === "") return;
    if (automatico && !temMudanca) return;

    salvando = true;
    marcarEstado("salvando…", "");
    limparEstrutura();

    try {
        await chamarApi("/api/salvar", {
            arquivo: caminhoArquivo,
            titulo: tituloCompleto,
            resumo: resumoAula,
            corpo: editor.innerHTML
        });

        temMudanca = false;
        marcarEstado("salvo", "estado-ok");
        esconderRecado();
    } catch (erro) {
        marcarEstado("não salvou", "estado-erro");
        const aviso = explicar(erro);
        mostrarRecado("erro", aviso.titulo,
            aviso.linhas.concat(["Seu texto continua aqui na tela — não feche antes de salvar."]));
    } finally {
        salvando = false;
    }
}

/* ---------------------------------------------------------
   BARRA DE FERRAMENTAS
   --------------------------------------------------------- */

// devolve o bloco (p, h2, li...) onde o cursor esta
function blocoAtual() {
    const selecao = window.getSelection();
    if (!selecao.rangeCount) return null;
    let no = selecao.getRangeAt(0).startContainer;
    if (no.nodeType === 3) no = no.parentNode;
    while (no && no !== editor && !/^(P|H1|H2|H3|H4|H5|H6|PRE|BLOCKQUOTE|LI|DIV|TD|TH)$/.test(no.nodeName)) {
        no = no.parentNode;
    }
    return no === editor ? null : no;
}

/*
   O navegador as vezes produz <p><ul>...</ul></p> ao criar uma lista.
   Isso e HTML invalido: ao reabrir o arquivo, o navegador quebra o
   paragrafo em dois vazios e a estrutura muda sozinha. Aqui o <p> que
   embrulha um bloco e desfeito, deixando o bloco no lugar dele.
*/
function limparEstrutura() {
    editor.querySelectorAll("p").forEach(function (paragrafo) {
        if (!paragrafo.querySelector("ul, ol, pre, blockquote, h1, h2, h3, h4, table, div")) return;
        const pai = paragrafo.parentNode;
        while (paragrafo.firstChild) {
            pai.insertBefore(paragrafo.firstChild, paragrafo);
        }
        pai.removeChild(paragrafo);
    });
}

function comando(nome, valor) {
    editor.focus();
    document.execCommand(nome, false, valor || null);
    limparEstrutura();
    marcarMudanca();
}

function envolverSelecao(tag) {
    const selecao = window.getSelection();
    if (!selecao.rangeCount || selecao.isCollapsed) return;
    const intervalo = selecao.getRangeAt(0);
    const elemento = document.createElement(tag);
    try {
        intervalo.surroundContents(elemento);
        marcarMudanca();
    } catch (erro) {
        // a selecao atravessa varios elementos; execCommand da conta
        document.execCommand("insertHTML", false,
            "<" + tag + ">" + selecao.toString() + "</" + tag + ">");
        marcarMudanca();
    }
}

function aplicarFonte(classe) {
    const bloco = blocoAtual();
    if (!bloco) return;
    bloco.classList.remove("fonte-serifada", "fonte-mono");
    if (classe) bloco.classList.add(classe);
    marcarMudanca();
}

function inserirLink() {
    const selecao = window.getSelection();
    if (selecao.isCollapsed) {
        alert("Selecione primeiro o texto que vai virar link.");
        return;
    }
    const endereco = prompt("Endereço do link:", "https://");
    if (!endereco) return;
    editor.focus();
    document.execCommand("createLink", false, endereco);

    // link externo abre em nova aba, com a protecao contra tabnabbing
    editor.querySelectorAll('a[href^="http"]').forEach(function (a) {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
    });
    marcarMudanca();
}

function inserirTabela() {
    const colunas = parseInt(prompt("Quantas colunas?", "3"), 10);
    const linhas = parseInt(prompt("Quantas linhas (sem contar o cabeçalho)?", "2"), 10);
    if (!colunas || !linhas || colunas < 1 || linhas < 1) return;

    let html = '<div class="tabela-rolavel"><table><thead><tr>';
    for (let c = 0; c < colunas; c++) html += "<th>Coluna " + (c + 1) + "</th>";
    html += "</tr></thead><tbody>";
    for (let l = 0; l < linhas; l++) {
        html += "<tr>";
        for (let c = 0; c < colunas; c++) html += "<td>&nbsp;</td>";
        html += "</tr>";
    }
    html += "</tbody></table></div><p><br></p>";

    editor.focus();
    document.execCommand("insertHTML", false, html);
    marcarMudanca();
}

// deixa os selects mostrando o formato do trecho onde o cursor esta
function atualizarBarra() {
    const bloco = blocoAtual();
    const nome = bloco ? bloco.nodeName.toLowerCase() : "p";
    const seletorFormato = document.getElementById("formato");
    const existe = Array.from(seletorFormato.options).some(function (o) { return o.value === nome; });
    seletorFormato.value = existe ? nome : "p";

    const seletorFonte = document.getElementById("fonte");
    if (bloco && bloco.classList.contains("fonte-serifada")) seletorFonte.value = "fonte-serifada";
    else if (bloco && bloco.classList.contains("fonte-mono")) seletorFonte.value = "fonte-mono";
    else seletorFonte.value = "";

    document.querySelectorAll("[data-comando]").forEach(function (botao) {
        const nomeComando = botao.dataset.comando;
        if (["bold", "italic", "underline"].indexOf(nomeComando) === -1) return;
        try {
            botao.classList.toggle("ativo", document.queryCommandState(nomeComando));
        } catch (erro) {
            // alguns navegadores nao respondem a queryCommandState
        }
    });
}

/* ---------------------------------------------------------
   LIGACOES COM A PAGINA
   --------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", async function () {

    // gera <b> e <i> em vez de <span style>, deixando o HTML limpo
    try {
        document.execCommand("styleWithCSS", false, false);
    } catch (erro) {
        // navegador antigo: segue sem isso
    }

    await carregar();

    document.querySelectorAll("[data-comando]").forEach(function (botao) {
        botao.addEventListener("click", function () {
            comando(botao.dataset.comando);
            atualizarBarra();
        });
    });

    document.querySelector('[data-acao="destaque"]').addEventListener("click", function () {
        envolverSelecao("mark");
    });
    document.querySelector('[data-acao="codigo"]').addEventListener("click", function () {
        envolverSelecao("code");
    });
    document.querySelector('[data-acao="link"]').addEventListener("click", inserirLink);
    document.querySelector('[data-acao="tabela"]').addEventListener("click", inserirTabela);

    document.getElementById("formato").addEventListener("change", function (evento) {
        comando("formatBlock", "<" + evento.target.value + ">");
    });

    document.getElementById("fonte").addEventListener("change", function (evento) {
        aplicarFonte(evento.target.value);
    });

    editor.addEventListener("input", marcarMudanca);
    editor.addEventListener("keyup", atualizarBarra);
    editor.addEventListener("mouseup", atualizarBarra);

    // cola sempre como texto simples, para nao trazer o CSS do site de origem
    editor.addEventListener("paste", function (evento) {
        evento.preventDefault();
        const texto = (evento.clipboardData || window.clipboardData).getData("text/plain");
        document.execCommand("insertText", false, texto);
    });

    document.getElementById("salvar").addEventListener("click", function () { salvar(false); });

    document.addEventListener("keydown", function (evento) {
        if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === "s") {
            evento.preventDefault();
            salvar(false);
        }
    });

    // rede de seguranca: salva sozinho e avisa antes de perder texto
    setInterval(function () { salvar(true); }, 30000);

    window.addEventListener("beforeunload", function (evento) {
        if (temMudanca) {
            evento.preventDefault();
            evento.returnValue = "";
        }
    });
});
