/* =========================================================
   CONVERSA COM O SERVIDOR
   Todo pedido ao servidor passa por aqui, para que qualquer
   falha vire uma explicacao util em vez de erro tecnico.

   O motivo: resposta.json() estoura com "Unexpected end of
   JSON input" quando o corpo vem vazio, e com "Unexpected
   token '<'" quando vem HTML. Nos dois casos a mensagem nao
   diz nada sobre o que realmente aconteceu.
   ========================================================= */

// erro que ja vem com as linhas prontas para mostrar na tela
class ErroDoServidor extends Error {
    constructor(titulo, linhas) {
        super(titulo);
        this.titulo = titulo;
        this.linhas = linhas;
    }
}

const AJUDA_SERVIDOR = [
    "Na pasta do projeto, clique duas vezes em iniciar.bat.",
    "Espere a janela preta abrir e use o endereço http://localhost:8000/",
    "Deixe a janela preta aberta enquanto estiver escrevendo."
];

async function chamarApi(rota, dados) {
    let resposta;

    try {
        resposta = await fetch(rota, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados)
        });
    } catch (erro) {
        throw new ErroDoServidor(
            "O servidor da biblioteca não respondeu.",
            ["Sem ele não dá para cadastrar, salvar nem excluir aulas."].concat(AJUDA_SERVIDOR)
        );
    }

    // le como texto primeiro: assim a resposta estranha pode ser mostrada
    const texto = await resposta.text();

    if (texto.trim() === "") {
        throw new ErroDoServidor(
            "O servidor respondeu vazio (código " + resposta.status + ").",
            [
                "Isso costuma acontecer quando quem está na porta 8000 não é o " +
                "servidor da biblioteca, e sim outro programa.",
                "Feche a janela preta, abra de novo pelo iniciar.bat e recarregue esta página."
            ]
        );
    }

    let corpo;
    try {
        corpo = JSON.parse(texto);
    } catch (erro) {
        throw new ErroDoServidor(
            "O servidor respondeu algo inesperado (código " + resposta.status + ").",
            [
                "Esperava dados da biblioteca e veio outra coisa: " +
                texto.trim().slice(0, 120),
                "Confira se quem está na porta 8000 é mesmo o iniciar.bat."
            ]
        );
    }

    if (!resposta.ok) {
        throw new ErroDoServidor(
            "Não deu para concluir.",
            [corpo.erro || "O servidor recusou o pedido (código " + resposta.status + ")."]
        );
    }

    return corpo;
}

// avisa se o servidor certo nao estiver no ar, antes de voce perder texto
async function servidorNoAr() {
    try {
        const resposta = await fetch("/api/status", { cache: "no-store" });
        if (!resposta.ok) return false;
        const dados = await resposta.json();
        return dados && dados.servidor === "biblioteca";
    } catch (erro) {
        return false;
    }
}

// transforma qualquer erro em algo que a tela sabe mostrar
function explicar(erro) {
    if (erro instanceof ErroDoServidor) {
        return { titulo: erro.titulo, linhas: erro.linhas };
    }
    return { titulo: "Não consegui concluir.", linhas: [String(erro && erro.message || erro)] };
}
