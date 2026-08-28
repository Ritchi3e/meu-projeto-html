/* =========================================================
   MOTOR DO INDICE
   Le a lista AULAS (definida em dados/aulas.js) e monta a
   pagina: busca, filtro por materia e os cartoes agrupados.

   Nada aqui precisa ser editado para cadastrar uma aula
   nova - so o arquivo dados/aulas.js.
   ========================================================= */

// guarda o que o usuario escolheu no momento
const estado = {
    busca: "",
    materia: "todas"
};

/* ---------------------------------------------------------
   AJUDANTES
   --------------------------------------------------------- */

// tira acentos e deixa minusculo, para que buscar por
// "enderecamento" tambem encontre "Enderecamento"
function normalizar(texto) {
    return String(texto)
        .normalize("NFD")
        .replace(/\p{Mn}/gu, "")
        .toLowerCase();
}

// impede que um texto do catalogo seja interpretado como HTML
function escapar(texto) {
    const div = document.createElement("div");
    div.textContent = texto;
    return div.innerHTML;
}

// "2026-08-26" -> "26/08/2026"
function formatarData(iso) {
    const partes = String(iso).split("-");
    if (partes.length !== 3) return iso;
    return partes[2] + "/" + partes[1] + "/" + partes[0];
}

// ordena por materia e, dentro dela, pelo numero da aula
function porMateriaEAula(a, b) {
    if (a.materia !== b.materia) return a.materia.localeCompare(b.materia, "pt-BR");
    return a.aula - b.aula;
}

/* ---------------------------------------------------------
   FILTRO
   --------------------------------------------------------- */

function filtrar(aulas) {
    const termo = normalizar(estado.busca).trim();

    return aulas.filter(function (aula) {
        if (estado.materia !== "todas" && aula.materia !== estado.materia) {
            return false;
        }
        if (termo === "") return true;

        // procura o termo no titulo, resumo, materia e tags
        const alvo = normalizar([
            aula.titulo,
            aula.resumo,
            aula.materia,
            aula.tags.join(" ")
        ].join(" "));

        // cada palavra digitada precisa aparecer em algum lugar
        return termo.split(/\s+/).every(function (palavra) {
            return alvo.includes(palavra);
        });
    });
}

/* ---------------------------------------------------------
   DESENHO DA TELA
   --------------------------------------------------------- */

function cartaoDaAula(aula) {
    const rascunho = aula.status === "rascunho"
        ? '<span class="etiqueta etiqueta-rascunho">rascunho</span>'
        : "";

    const tags = aula.tags.map(function (tag) {
        return '<span class="tag">' + escapar(tag) + "</span>";
    }).join("");

    // o link de editar fica fora do cartao: um <a> nao pode conter outro
    return '' +
        '<li>' +
            '<a class="cartao-link" href="' + escapar(aula.arquivo) + '">' +
                '<span class="cartao-topo">' +
                    '<span class="cartao-titulo">Aula ' +
                        String(aula.aula).padStart(2, "0") + ' - ' +
                        escapar(aula.titulo) +
                    '</span>' +
                    rascunho +
                '</span>' +
                '<span class="cartao-resumo">' + escapar(aula.resumo) + '</span>' +
                '<span class="cartao-rodape">' +
                    '<span class="cartao-data">' + formatarData(aula.data) + '</span>' +
                    '<span class="tags">' + tags + '</span>' +
                '</span>' +
            '</a>' +
            '<a class="cartao-editar" href="editor.html?arquivo=' +
                encodeURIComponent(aula.arquivo) + '">Editar</a>' +
        '</li>';
}

function desenharAulas(aulas) {
    const alvo = document.getElementById("lista-aulas");
    const vazio = document.getElementById("nenhum-resultado");

    if (aulas.length === 0) {
        alvo.innerHTML = "";
        vazio.hidden = false;
        return;
    }
    vazio.hidden = true;

    // agrupa por materia, mantendo a ordem
    const grupos = new Map();
    aulas.slice().sort(porMateriaEAula).forEach(function (aula) {
        if (!grupos.has(aula.materia)) grupos.set(aula.materia, []);
        grupos.get(aula.materia).push(aula);
    });

    let html = "";
    grupos.forEach(function (doGrupo, materia) {
        html += "<section>";
        html += "<h2>" + escapar(materia) +
                ' <span class="contador-materia">' + doGrupo.length + "</span></h2>";
        html += '<ul class="aulas-list">';
        html += doGrupo.map(cartaoDaAula).join("");
        html += "</ul></section>";
    });

    alvo.innerHTML = html;
}

function desenharContador(quantidade, total) {
    const alvo = document.getElementById("contador");
    if (quantidade === total) {
        alvo.textContent = total + (total === 1 ? " aula cadastrada" : " aulas cadastradas");
    } else {
        alvo.textContent = quantidade + " de " + total + " aulas";
    }
}

function desenharFiltros(aulas) {
    const alvo = document.getElementById("filtros");
    const materias = ["todas"].concat(
        Array.from(new Set(aulas.map(function (a) { return a.materia; })))
            .sort(function (a, b) { return a.localeCompare(b, "pt-BR"); })
    );

    alvo.innerHTML = materias.map(function (materia) {
        const ativo = materia === estado.materia ? " ativo" : "";
        const rotulo = materia === "todas" ? "Todas" : materia;
        return '<button type="button" class="chip' + ativo + '" data-materia="' +
               escapar(materia) + '">' + escapar(rotulo) + "</button>";
    }).join("");
}

function render() {
    const visiveis = filtrar(AULAS);
    desenharFiltros(AULAS);
    desenharAulas(visiveis);
    desenharContador(visiveis.length, AULAS.length);
}

/* ---------------------------------------------------------
   LIGACOES COM A PAGINA
   --------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", function () {
    const campoBusca = document.getElementById("busca");
    const limpar = document.getElementById("limpar-busca");

    campoBusca.addEventListener("input", function () {
        estado.busca = campoBusca.value;
        limpar.hidden = estado.busca === "";
        render();
    });

    // Esc limpa a busca
    campoBusca.addEventListener("keydown", function (evento) {
        if (evento.key === "Escape") {
            campoBusca.value = "";
            estado.busca = "";
            limpar.hidden = true;
            render();
        }
    });

    limpar.addEventListener("click", function () {
        campoBusca.value = "";
        estado.busca = "";
        limpar.hidden = true;
        campoBusca.focus();
        render();
    });

    // um unico ouvinte para todos os chips, inclusive os que
    // ainda serao criados quando surgir uma materia nova
    document.getElementById("filtros").addEventListener("click", function (evento) {
        const chip = evento.target.closest(".chip");
        if (!chip) return;
        estado.materia = chip.dataset.materia;
        render();
    });

    render();
});
