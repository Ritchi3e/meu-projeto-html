/* =========================================================
   PAGINA DE CADASTRO
   Le o formulario e grava dois arquivos direto na pasta do
   projeto:
     1. o cadastro, acrescentado em dados/aulas.js
     2. a pagina da aula, em materias/<materia>/

   A gravacao usa a File System Access API. Ela so existe no
   Chrome e no Edge; nos outros navegadores a pagina cai no
   modo manual (copiar e colar), que funciona em qualquer um.
   ========================================================= */

const TEM_GRAVACAO = "showDirectoryPicker" in window;

// pasta do projeto escolhida pelo usuario, guardada enquanto
// a aba estiver aberta
let pastaRaiz = null;

/* ---------------------------------------------------------
   AJUDANTES DE TEXTO
   --------------------------------------------------------- */

// "Endereçamento IPv6!" -> "enderecamento-ipv6"
function slug(texto) {
    return String(texto)
        .normalize("NFD")
        .replace(/\p{Mn}/gu, "")      // tira os acentos
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")  // tudo que nao e letra/numero vira hifen
        .replace(/^-+|-+$/g, "");     // sem hifen sobrando nas pontas
}

// escapa aspas e barras para o texto caber dentro de "..."
function comAspas(texto) {
    return '"' + String(texto).replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
}

function doisDigitos(numero) {
    return String(numero).padStart(2, "0");
}

function escaparHtml(texto) {
    const div = document.createElement("div");
    div.textContent = texto;
    return div.innerHTML;
}

/* ---------------------------------------------------------
   LEITURA DO FORMULARIO
   --------------------------------------------------------- */

function lerFormulario() {
    const titulo = document.getElementById("titulo").value.trim();
    const materia = document.getElementById("materia").value.trim();
    const numero = parseInt(document.getElementById("numero").value, 10) || 1;
    const data = document.getElementById("data").value;
    const status = document.getElementById("status").value;
    const resumo = document.getElementById("resumo").value.trim();
    const tags = document.getElementById("tags").value
        .split(",")
        .map(function (t) { return slug(t); })
        .filter(function (t) { return t !== ""; });

    const pastaMateria = slug(materia) || "materia";
    const apelido = slug(titulo) || "sem-titulo";
    const nomeArquivo = "aula-" + doisDigitos(numero) + "-" + apelido + ".html";

    return {
        id: pastaMateria + "-" + doisDigitos(numero) + "-" + apelido,
        titulo: titulo,
        materia: materia,
        aula: numero,
        data: data,
        tags: tags,
        resumo: resumo,
        arquivo: "materias/" + pastaMateria + "/" + nomeArquivo,
        status: status,
        // usados so na hora de gravar
        pastaMateria: pastaMateria,
        nomeArquivo: nomeArquivo
    };
}

// devolve uma lista de problemas; vazia significa tudo certo
function validar(aula) {
    const problemas = [];
    if (aula.titulo === "") problemas.push("O título da aula está vazio.");
    if (aula.materia === "") problemas.push("A matéria está vazia.");
    if (aula.resumo === "") problemas.push("O resumo está vazio.");
    if (aula.data === "") problemas.push("A data está vazia.");
    if (aula.aula < 1) problemas.push("O número da aula precisa ser 1 ou maior.");

    if (AULAS.some(function (a) { return a.id === aula.id; })) {
        problemas.push("Já existe uma aula com o identificador " + aula.id +
                       ". Mude o título ou o número da aula.");
    }
    if (AULAS.some(function (a) { return a.arquivo === aula.arquivo; })) {
        problemas.push("Já existe uma aula cadastrada no arquivo " + aula.arquivo + ".");
    }
    return problemas;
}

/* ---------------------------------------------------------
   OS DOIS TEXTOS GERADOS
   --------------------------------------------------------- */

function blocoDoCatalogo(aula) {
    const tags = aula.tags.map(comAspas).join(", ");
    return [
        "  {",
        "    id: " + comAspas(aula.id) + ",",
        "    titulo: " + comAspas(aula.titulo) + ",",
        "    materia: " + comAspas(aula.materia) + ",",
        "    aula: " + aula.aula + ",",
        "    data: " + comAspas(aula.data) + ",",
        "    tags: [" + tags + "],",
        "    resumo: " + comAspas(aula.resumo) + ",",
        "    arquivo: " + comAspas(aula.arquivo) + ",",
        "    status: " + comAspas(aula.status),
        "  }"
    ].join("\n");
}

function esqueletoDaPagina(aula) {
    const tituloCompleto = "Aula " + doisDigitos(aula.aula) + " - " + aula.titulo;
    return [
        '<!DOCTYPE html>',
        '<html lang="pt-BR">',
        '<head>',
        '<meta charset="UTF-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
        "<title>" + tituloCompleto + "</title>",
        '<meta name="description" content="' + aula.resumo.replace(/"/g, "&quot;") + '">',
        '<link rel="stylesheet" href="../../assets/css/style.css">',
        '</head>',
        '<body>',
        '<nav><a href="../../index.html">&larr; Voltar para o início</a></nav>',
        '<main>',
        '',
        "<h1>" + tituloCompleto + "</h1>",
        '',
        '<h2>Nesta aula</h2>',
        '<ul>',
        '<li>Primeiro tópico</li>',
        '<li>Segundo tópico</li>',
        '</ul>',
        '',
        '<h2>Minhas anotações</h2>',
        '<p>Escreva aqui.</p>',
        '',
        '</main>',
        '</body>',
        '</html>',
        ''
    ].join("\n");
}

// acrescenta o bloco novo antes do "];" que fecha a lista
function catalogoAtualizado(textoAtual, bloco) {
    const fim = textoAtual.lastIndexOf("];");
    if (fim === -1) {
        throw new Error("Nao encontrei o ']; ' que fecha a lista AULAS em dados/aulas.js.");
    }
    const antes = textoAtual.slice(0, fim).replace(/\s+$/, "");
    const depois = textoAtual.slice(fim);
    // se ja existe uma aula antes, precisa de virgula
    const virgula = /\}$/.test(antes) ? "," : "";
    return antes + virgula + "\n" + bloco + "\n" + depois;
}

/* ---------------------------------------------------------
   PASTA DO PROJETO
   O navegador guarda a pasta escolhida (IndexedDB), entao nas
   proximas vezes basta reconfirmar a permissao.
   --------------------------------------------------------- */

function abrirBanco() {
    return new Promise(function (ok, falhou) {
        const pedido = indexedDB.open("biblioteca-cadastro", 1);
        pedido.onupgradeneeded = function () {
            pedido.result.createObjectStore("pastas");
        };
        pedido.onsuccess = function () { ok(pedido.result); };
        pedido.onerror = function () { falhou(pedido.error); };
    });
}

async function guardarPasta(handle) {
    try {
        const banco = await abrirBanco();
        await new Promise(function (ok, falhou) {
            const transacao = banco.transaction("pastas", "readwrite");
            transacao.objectStore("pastas").put(handle, "raiz");
            transacao.oncomplete = ok;
            transacao.onerror = function () { falhou(transacao.error); };
        });
    } catch (erro) {
        // lembrar a pasta e conforto, nao requisito: seguir sem isso
    }
}

async function pastaLembrada() {
    try {
        const banco = await abrirBanco();
        return await new Promise(function (ok) {
            const transacao = banco.transaction("pastas", "readonly");
            const pedido = transacao.objectStore("pastas").get("raiz");
            pedido.onsuccess = function () { ok(pedido.result || null); };
            pedido.onerror = function () { ok(null); };
        });
    } catch (erro) {
        return null;
    }
}

// confere se a pasta escolhida e mesmo a do projeto
async function pareceOProjeto(raiz) {
    try {
        const dados = await raiz.getDirectoryHandle("dados");
        await dados.getFileHandle("aulas.js");
        return true;
    } catch (erro) {
        return false;
    }
}

// pede a pasta, reaproveitando a lembrada quando possivel.
// precisa ser chamada a partir de um clique, senao o navegador
// recusa o pedido de permissao.
async function obterPasta() {
    if (pastaRaiz) return pastaRaiz;

    const lembrada = await pastaLembrada();
    if (lembrada) {
        const jaTem = await lembrada.queryPermission({ mode: "readwrite" });
        const permissao = jaTem === "granted"
            ? "granted"
            : await lembrada.requestPermission({ mode: "readwrite" });
        if (permissao === "granted" && await pareceOProjeto(lembrada)) {
            pastaRaiz = lembrada;
            return pastaRaiz;
        }
    }

    const escolhida = await window.showDirectoryPicker({ mode: "readwrite" });
    if (!await pareceOProjeto(escolhida)) {
        throw new Error(
            "Essa pasta não parece a do projeto: não encontrei dados/aulas.js dentro dela. " +
            "Escolha a pasta meu-projeto-html, aquela que tem o index.html."
        );
    }
    pastaRaiz = escolhida;
    await guardarPasta(escolhida);
    return pastaRaiz;
}

/* ---------------------------------------------------------
   ESCRITA DOS ARQUIVOS
   --------------------------------------------------------- */

async function lerArquivo(pasta, nome) {
    const handle = await pasta.getFileHandle(nome);
    const arquivo = await handle.getFile();
    return await arquivo.text();
}

async function escreverArquivo(pasta, nome, conteudo) {
    const handle = await pasta.getFileHandle(nome, { create: true });
    const fluxo = await handle.createWritable();
    await fluxo.write(conteudo);
    await fluxo.close();
}

async function arquivoExiste(pasta, nome) {
    try {
        await pasta.getFileHandle(nome);
        return true;
    } catch (erro) {
        return false;
    }
}

/* ---------------------------------------------------------
   O SALVAMENTO
   --------------------------------------------------------- */

async function salvar() {
    const aula = lerFormulario();

    const problemas = validar(aula);
    if (problemas.length > 0) {
        mostrarRecado("erro", "Faltou ajustar antes de salvar:", problemas);
        return;
    }

    const raiz = await obterPasta();

    // 1. a pagina da aula - nunca sobrescreve nota existente
    const pastaMaterias = await raiz.getDirectoryHandle("materias", { create: true });
    const pastaDaMateria = await pastaMaterias.getDirectoryHandle(aula.pastaMateria, { create: true });

    if (await arquivoExiste(pastaDaMateria, aula.nomeArquivo)) {
        mostrarRecado("erro", "Nada foi gravado.", [
            "O arquivo " + aula.arquivo + " já existe.",
            "Para não apagar uma anotação sua, a página não sobrescreve arquivos. " +
            "Mude o número ou o título da aula, ou apague o arquivo antigo você mesmo."
        ]);
        return;
    }

    // 2. o catalogo - le, acrescenta e regrava
    const pastaDados = await raiz.getDirectoryHandle("dados");
    const catalogoAntigo = await lerArquivo(pastaDados, "aulas.js");
    const catalogoNovo = catalogoAtualizado(catalogoAntigo, blocoDoCatalogo(aula));

    // grava a pagina primeiro: se algo falhar no catalogo, sobra um
    // arquivo orfao (inofensivo) em vez de um cadastro apontando
    // para um arquivo que nao existe (link quebrado)
    await escreverArquivo(pastaDaMateria, aula.nomeArquivo, esqueletoDaPagina(aula));
    await escreverArquivo(pastaDados, "aulas.js", catalogoNovo);

    // mantem a lista da memoria em dia, para que o proximo cadastro
    // feito sem recarregar a pagina ainda detecte duplicidade
    AULAS.push({
        id: aula.id,
        titulo: aula.titulo,
        materia: aula.materia,
        aula: aula.aula,
        data: aula.data,
        tags: aula.tags,
        resumo: aula.resumo,
        arquivo: aula.arquivo,
        status: aula.status
    });
    preencherMaterias();

    mostrarRecado("certo", "Aula cadastrada.", [
        "Criado: " + aula.arquivo,
        "Atualizado: dados/aulas.js"
    ], aula);
}

/* ---------------------------------------------------------
   MENSAGENS NA TELA
   --------------------------------------------------------- */

function mostrarRecado(tipo, titulo, linhas, aula) {
    const alvo = document.getElementById("recado");
    let html = '<p class="recado-titulo">' + escaparHtml(titulo) + "</p><ul>";
    linhas.forEach(function (linha) {
        html += "<li>" + escaparHtml(linha) + "</li>";
    });
    html += "</ul>";

    if (aula) {
        html += '<p><a href="' + escaparHtml(aula.arquivo) + '">Abrir a aula nova</a> ' +
                '&middot; <a href="index.html">Ver no índice</a></p>';
    }

    alvo.className = "recado recado-" + tipo;
    alvo.innerHTML = html;
    alvo.hidden = false;
    alvo.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function esconderRecado() {
    document.getElementById("recado").hidden = true;
}

/* ---------------------------------------------------------
   COPIAR (modo manual)
   --------------------------------------------------------- */

function copiar(texto, elemento) {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(texto);
    }
    return new Promise(function (ok, falhou) {
        const area = document.createElement("textarea");
        area.value = texto;
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        let deuCerto = false;
        try {
            deuCerto = document.execCommand("copy");
        } catch (e) {
            deuCerto = false;
        }
        document.body.removeChild(area);
        if (deuCerto) {
            ok();
        } else {
            selecionar(elemento);
            falhou();
        }
    });
}

// deixa o bloco selecionado para o usuario apertar Ctrl+C
function selecionar(elemento) {
    const intervalo = document.createRange();
    intervalo.selectNodeContents(elemento);
    const selecao = window.getSelection();
    selecao.removeAllRanges();
    selecao.addRange(intervalo);
}

function avisar(botao, mensagem) {
    const original = botao.dataset.rotulo || botao.textContent;
    botao.dataset.rotulo = original;
    botao.textContent = mensagem;
    setTimeout(function () {
        botao.textContent = botao.dataset.rotulo;
    }, 1800);
}

/* ---------------------------------------------------------
   ATUALIZACAO DA TELA
   --------------------------------------------------------- */

function atualizar() {
    const aula = lerFormulario();
    document.getElementById("saida-catalogo").textContent = blocoDoCatalogo(aula);
    document.getElementById("saida-pagina").textContent = esqueletoDaPagina(aula);
    document.getElementById("saida-caminho").textContent = aula.arquivo;
}

function preencherMaterias() {
    const datalist = document.getElementById("materias-existentes");
    datalist.innerHTML = "";
    Array.from(new Set(AULAS.map(function (a) { return a.materia; })))
        .sort(function (a, b) { return a.localeCompare(b, "pt-BR"); })
        .forEach(function (materia) {
            const opcao = document.createElement("option");
            opcao.value = materia;
            datalist.appendChild(opcao);
        });
}

/* ---------------------------------------------------------
   LIGACOES COM A PAGINA
   --------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", function () {

    preencherMaterias();

    // data de hoje ja preenchida
    const campoData = document.getElementById("data");
    const hoje = new Date();
    campoData.value = hoje.getFullYear() + "-" +
        doisDigitos(hoje.getMonth() + 1) + "-" +
        doisDigitos(hoje.getDate());

    // sugere o proximo numero quando a materia ja existe
    document.getElementById("materia").addEventListener("change", function (evento) {
        const daMateria = AULAS.filter(function (a) { return a.materia === evento.target.value; });
        if (daMateria.length > 0) {
            const maior = Math.max.apply(null, daMateria.map(function (a) { return a.aula; }));
            document.getElementById("numero").value = maior + 1;
        }
        atualizar();
    });

    document.getElementById("form-aula").addEventListener("input", function () {
        esconderRecado();
        atualizar();
    });

    // nao existe servidor para receber o envio do formulario
    document.getElementById("form-aula").addEventListener("submit", function (evento) {
        evento.preventDefault();
    });

    // botao principal
    const botaoSalvar = document.getElementById("salvar");
    const estadoPasta = document.getElementById("estado-pasta");

    if (!TEM_GRAVACAO) {
        botaoSalvar.hidden = true;
        document.getElementById("sem-suporte").hidden = false;
        document.getElementById("modo-manual").open = true;
    } else {
        estadoPasta.textContent = "na primeira vez o navegador vai pedir a pasta do projeto";

        botaoSalvar.addEventListener("click", async function () {
            botaoSalvar.disabled = true;
            const rotulo = botaoSalvar.textContent;
            botaoSalvar.textContent = "Salvando...";
            try {
                await salvar();
            } catch (erro) {
                if (erro && erro.name === "AbortError") {
                    // o usuario fechou a janela de escolha da pasta
                    mostrarRecado("aviso", "Escolha da pasta cancelada.", [
                        "Nada foi gravado. Clique em salvar de novo quando quiser."
                    ]);
                } else if (erro && erro.name === "SecurityError") {
                    // alguns navegadores nao deixam escolher pasta quando a
                    // pagina foi aberta direto do disco (endereco file://)
                    mostrarRecado("aviso", "O navegador não deixou escolher a pasta.", [
                        "Isso costuma acontecer quando a página é aberta com duplo clique (endereço file://).",
                        "Abra o projeto por um servidor local - o Live Server do VS Code, ou " +
                        "'python -m http.server 8000' na pasta do projeto - e use " +
                        "http://localhost:8000/novo.html.",
                        "Se preferir não usar servidor, o modo manual logo abaixo funciona sempre."
                    ]);
                    document.getElementById("modo-manual").open = true;
                } else {
                    mostrarRecado("erro", "Não consegui gravar.", [
                        (erro && erro.message) ? erro.message : String(erro)
                    ]);
                }
            } finally {
                botaoSalvar.disabled = false;
                botaoSalvar.textContent = rotulo;
                if (pastaRaiz) {
                    estadoPasta.textContent = "pasta liberada: " + pastaRaiz.name;
                }
            }
        });
    }

    document.querySelectorAll(".botao-copiar").forEach(function (botao) {
        botao.addEventListener("click", function () {
            const alvo = document.getElementById(botao.dataset.copiar);
            copiar(alvo.textContent, alvo).then(
                function () { avisar(botao, "Copiado!"); },
                function () { avisar(botao, "Selecionado - Ctrl+C"); }
            );
        });
    });

    atualizar();
});
