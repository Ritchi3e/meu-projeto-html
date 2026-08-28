/* =========================================================
   PAGINA DE CADASTRO
   Le o que voce digita no formulario e monta dois textos
   prontos para copiar:
     1. o bloco do catalogo, para colar em dados/aulas.js
     2. o esqueleto do arquivo HTML da aula

   Nada e salvo automaticamente: este site e estatico, entao
   quem grava os arquivos e voce (ou o commit no git).
   ========================================================= */

/* ---------------------------------------------------------
   AJUDANTES
   --------------------------------------------------------- */

// "Endereçamento IPv6!" -> "enderecamento-ipv6"
function slug(texto) {
    return String(texto)
        .normalize("NFD")
        .replace(/\p{Mn}/gu, "")   // tira os acentos
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

// le o formulario inteiro de uma vez
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
    const nomeArquivo = "aula-" + doisDigitos(numero) + "-" + (slug(titulo) || "sem-titulo") + ".html";
    const caminho = "materias/" + pastaMateria + "/" + nomeArquivo;

    return {
        id: pastaMateria + "-" + doisDigitos(numero) + "-" + (slug(titulo) || "sem-titulo"),
        titulo: titulo,
        materia: materia,
        aula: numero,
        data: data,
        tags: tags,
        resumo: resumo,
        arquivo: caminho,
        status: status
    };
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
        '</html>'
    ].join("\n");
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

/* ---------------------------------------------------------
   COPIAR
   O clipboard moderno so funciona em https ou localhost.
   Abrindo o arquivo direto (file://) ele costuma falhar,
   entao existe um plano B e, se nem ele funcionar, o texto
   fica selecionado para voce apertar Ctrl+C.
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
   LIGACOES COM A PAGINA
   --------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", function () {

    // sugere as materias que ja existem no catalogo
    const datalist = document.getElementById("materias-existentes");
    Array.from(new Set(AULAS.map(function (a) { return a.materia; })))
        .sort(function (a, b) { return a.localeCompare(b, "pt-BR"); })
        .forEach(function (materia) {
            const opcao = document.createElement("option");
            opcao.value = materia;
            datalist.appendChild(opcao);
        });

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

    document.getElementById("form-aula").addEventListener("input", atualizar);

    // nao existe servidor para receber o envio: o resultado
    // e o texto gerado, entao o Enter nao deve recarregar a pagina
    document.getElementById("form-aula").addEventListener("submit", function (evento) {
        evento.preventDefault();
    });

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
