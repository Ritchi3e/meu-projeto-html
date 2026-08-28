/* =========================================================
   CADASTRO DE AULA NOVA
   Manda os dados para o servidor local, que cria o arquivo da
   aula e acrescenta o cadastro em dados/aulas.js. Em seguida
   abre o editor para escrever o conteudo.

   Precisa do servidor rodando (iniciar.bat).
   ========================================================= */

/* ---------------------------------------------------------
   AJUDANTES
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

function doisDigitos(numero) {
    return String(numero).padStart(2, "0");
}

function escaparHtml(texto) {
    const div = document.createElement("div");
    div.textContent = texto;
    return div.innerHTML;
}

function lerFormulario() {
    const titulo = document.getElementById("titulo").value.trim();
    const materia = document.getElementById("materia").value.trim();
    const numero = parseInt(document.getElementById("numero").value, 10) || 1;

    return {
        titulo: titulo,
        materia: materia,
        aula: numero,
        data: document.getElementById("data").value,
        status: document.getElementById("status").value,
        resumo: document.getElementById("resumo").value.trim(),
        tags: document.getElementById("tags").value
            .split(",")
            .map(function (t) { return slug(t); })
            .filter(function (t) { return t !== ""; }),
        // so para mostrar a previa; quem decide o caminho e o servidor
        caminhoPrevisto: "materias/" + (slug(materia) || "materia") + "/aula-" +
            doisDigitos(numero) + "-" + (slug(titulo) || "sem-titulo") + ".html"
    };
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
    alvo.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function atualizarPrevia() {
    document.getElementById("saida-caminho").textContent = lerFormulario().caminhoPrevisto;
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
   CRIAR
   --------------------------------------------------------- */

async function criar() {
    const aula = lerFormulario();
    const botao = document.getElementById("criar");

    botao.disabled = true;
    botao.textContent = "Criando…";

    try {
        const resultado = await chamarApi("/api/criar", aula);
        // aula criada: vai direto escrever
        window.location.href = "editor.html?arquivo=" + encodeURIComponent(resultado.arquivo);
    } catch (erro) {
        botao.disabled = false;
        botao.textContent = "Criar e escrever";
        const aviso = explicar(erro);
        mostrarRecado("erro", aviso.titulo, aviso.linhas);
    }
}

/* ---------------------------------------------------------
   LIGACOES COM A PAGINA
   --------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", async function () {

    preencherMaterias();

    // avisa logo, antes de o usuario preencher tudo a toa
    if (!await servidorNoAr()) {
        mostrarRecado("aviso", "O servidor da biblioteca não está no ar.", [
            "Você consegue preencher, mas o botão de criar vai falhar.",
            "Na pasta do projeto, clique duas vezes em iniciar.bat e recarregue esta página."
        ]);
    }

    // data de hoje ja preenchida
    const hoje = new Date();
    document.getElementById("data").value = hoje.getFullYear() + "-" +
        doisDigitos(hoje.getMonth() + 1) + "-" +
        doisDigitos(hoje.getDate());

    // sugere o proximo numero quando a materia ja existe
    document.getElementById("materia").addEventListener("change", function (evento) {
        const daMateria = AULAS.filter(function (a) { return a.materia === evento.target.value; });
        if (daMateria.length > 0) {
            const maior = Math.max.apply(null, daMateria.map(function (a) { return a.aula; }));
            document.getElementById("numero").value = maior + 1;
        }
        atualizarPrevia();
    });

    document.getElementById("form-aula").addEventListener("input", atualizarPrevia);

    document.getElementById("form-aula").addEventListener("submit", function (evento) {
        evento.preventDefault();
        criar();
    });

    atualizarPrevia();
});
