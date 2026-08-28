/* =========================================================
   BOTAO EXCLUIR DENTRO DA PAGINA DA AULA
   O botao Editar e so um link, nao precisa de codigo. Aqui
   fica o Excluir, que pede confirmacao, manda o pedido ao
   servidor e volta para o indice quando termina.
   ========================================================= */

// cria a caixa de recado na hora, para nao precisar de HTML extra
// em toda aula
function caixaDeRecado() {
    let caixa = document.getElementById("recado");
    if (caixa) return caixa;

    caixa = document.createElement("div");
    caixa.id = "recado";
    caixa.className = "recado";
    caixa.hidden = true;

    const principal = document.querySelector("main");
    principal.parentNode.insertBefore(caixa, principal);
    return caixa;
}

function avisar(tipo, titulo, linhas) {
    const caixa = caixaDeRecado();
    const seguro = function (texto) {
        const div = document.createElement("div");
        div.textContent = texto;
        return div.innerHTML;
    };

    let html = '<p class="recado-titulo">' + seguro(titulo) + "</p><ul>";
    linhas.forEach(function (linha) {
        html += "<li>" + seguro(linha) + "</li>";
    });

    caixa.className = "recado recado-" + tipo;
    caixa.innerHTML = html + "</ul>";
    caixa.hidden = false;
    caixa.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

document.addEventListener("DOMContentLoaded", function () {
    const botao = document.querySelector(".nav-excluir");
    if (!botao) return;

    botao.addEventListener("click", async function () {
        const arquivo = botao.dataset.arquivo;
        const titulo = document.querySelector("main h1");
        const nome = titulo ? titulo.textContent.trim() : arquivo;

        const certeza = window.confirm(
            'Excluir "' + nome + '"?\n\n' +
            "O arquivo vai para a pasta lixeira/ do projeto, então dá para " +
            "recuperar depois arrastando de volta."
        );
        if (!certeza) return;

        botao.disabled = true;
        botao.textContent = "Excluindo…";

        try {
            await chamarApi("/api/excluir", { arquivo: arquivo });
            // a aula deixou de existir: nao faz sentido continuar nela
            window.location.href = "../../index.html";
        } catch (erro) {
            botao.disabled = false;
            botao.textContent = "Excluir";
            const aviso = explicar(erro);
            avisar("erro", aviso.titulo, aviso.linhas);
        }
    });
});
