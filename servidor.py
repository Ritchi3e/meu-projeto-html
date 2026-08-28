# -*- coding: utf-8 -*-
"""
Servidor local da biblioteca de estudos.

Serve as paginas do projeto e recebe o que o editor manda salvar,
gravando os arquivos direto na pasta. E o que permite escrever a aula
e clicar em salvar sem escolher pasta nenhuma.

Roda so na sua maquina (127.0.0.1) e usa apenas a biblioteca padrao do
Python - nao precisa instalar nada.

Para iniciar: clique duas vezes em iniciar.bat, ou rode
    python servidor.py
"""

import json
import re
import traceback
import unicodedata
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

RAIZ = Path(__file__).parent.resolve()
PORTA = 8000

# so estes lugares podem ser gravados
CATALOGO = RAIZ / "dados" / "aulas.js"
PASTA_MATERIAS = RAIZ / "materias"

# aula excluida vai para ca em vez de sumir de vez
LIXEIRA = RAIZ / "lixeira"


# ---------------------------------------------------------------
# AJUDANTES
# ---------------------------------------------------------------

def slug(texto):
    """'Endereçamento IPv6!' -> 'enderecamento-ipv6'"""
    texto = unicodedata.normalize("NFD", str(texto))
    texto = "".join(c for c in texto if unicodedata.category(c) != "Mn")
    texto = texto.lower()
    texto = re.sub(r"[^a-z0-9]+", "-", texto)
    return texto.strip("-")


def caminho_seguro(relativo):
    """
    Resolve um caminho recebido do navegador e recusa qualquer coisa que
    aponte para fora da pasta do projeto. Sem isso, um caminho como
    '../../Windows/System32/x' seria gravado onde nao devia.
    """
    alvo = (RAIZ / relativo).resolve()
    if alvo != RAIZ and RAIZ not in alvo.parents:
        raise ValueError("Caminho fora da pasta do projeto: %s" % relativo)
    if alvo.suffix != ".html":
        raise ValueError("So e permitido gravar arquivos .html")
    if PASTA_MATERIAS not in alvo.parents:
        raise ValueError("So e permitido gravar dentro de materias/")
    return alvo


def escapar_atributo(texto):
    return str(texto).replace("&", "&amp;").replace('"', "&quot;").replace("<", "&lt;")


def escapar_texto(texto):
    return str(texto).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


# tags que ganham linha propria no arquivo salvo. th e td ficam de fora
# de proposito, para a linha da tabela caber em uma linha so.
BLOCOS = "h2|h3|h4|h5|h6|p|ul|ol|li|pre|blockquote|table|thead|tbody|tr|div|hr"


def formatar_corpo(corpo):
    """
    O editor devolve tudo numa linha so. Aqui cada bloco ganha a sua
    linha, para o arquivo continuar legivel quando voce abrir no VS Code.

    O conteudo dentro de <pre> nao e tocado: la a quebra de linha aparece
    na tela e mexer nisso estragaria o codigo escrito na aula.
    """
    texto = re.sub(r"(<(?:%s)\b[^>]*>)" % BLOCOS, r"\n\1", corpo)
    texto = re.sub(r"(</(?:%s)>)" % BLOCOS, r"\1\n", texto)

    saida = []
    for linha in texto.split("\n"):
        linha = linha.rstrip()
        if not linha.strip():
            continue
        # linha em branco antes de cada titulo, para o arquivo respirar
        if linha.lstrip().startswith(("<h2", "<h3", "<h4")) and saida:
            saida.append("")
        saida.append(linha)
    return "\n".join(saida)


def pagina_da_aula(titulo_completo, resumo, corpo, relativo):
    """Monta o arquivo .html inteiro a partir do miolo escrito no editor."""
    nav = (
        '<nav><a href="../../index.html">&larr; Voltar para o início</a>'
        ' <a href="../../editor.html?arquivo=%s">Editar</a></nav>'
        % escapar_atributo(relativo)
    )
    return "\n".join([
        "<!DOCTYPE html>",
        '<html lang="pt-BR">',
        "<head>",
        '<meta charset="UTF-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
        "<title>%s</title>" % escapar_texto(titulo_completo),
        '<meta name="description" content="%s">' % escapar_atributo(resumo),
        '<link rel="stylesheet" href="../../assets/css/style.css">',
        "</head>",
        "<body>",
        nav,
        "<main>",
        "",
        "<h1>%s</h1>" % escapar_texto(titulo_completo),
        "",
        formatar_corpo(corpo.strip()),
        "",
        "</main>",
        "</body>",
        "</html>",
        "",
    ])


def acrescentar_no_catalogo(bloco):
    """Insere o bloco novo antes do '];' que fecha a lista AULAS."""
    texto = CATALOGO.read_text(encoding="utf-8")
    fim = texto.rfind("];")
    if fim == -1:
        raise ValueError("Nao encontrei o '];' que fecha a lista AULAS em dados/aulas.js")
    antes = texto[:fim].rstrip()
    depois = texto[fim:]
    virgula = "," if antes.endswith("}") else ""
    CATALOGO.write_text(antes + virgula + "\n" + bloco + "\n" + depois, encoding="utf-8")


def remover_do_catalogo(relativo):
    """Tira do catalogo o bloco cujo campo arquivo aponta para este caminho."""
    texto = CATALOGO.read_text(encoding="utf-8")
    marca = 'arquivo: "%s"' % relativo
    posicao = texto.find(marca)
    if posicao == -1:
        return False

    inicio = texto.rfind("\n  {", 0, posicao)
    fim = texto.find("\n  }", posicao)
    if inicio == -1 or fim == -1:
        raise ValueError("Nao consegui localizar o bloco inteiro em dados/aulas.js")
    fim += len("\n  }")

    antes = texto[:inicio]
    depois = texto[fim:]

    if depois.lstrip().startswith(","):
        # tinha bloco depois: a virgula que os separava sai junto
        depois = depois.lstrip()[1:]
    else:
        # era o ultimo bloco: a virgula sobrando fica no bloco anterior
        antes = antes.rstrip().rstrip(",")

    CATALOGO.write_text(antes + depois, encoding="utf-8")
    return True


def bloco_do_catalogo(aula):
    def aspas(v):
        return '"%s"' % str(v).replace("\\", "\\\\").replace('"', '\\"')

    tags = ", ".join(aspas(t) for t in aula["tags"])
    return "\n".join([
        "  {",
        "    id: %s," % aspas(aula["id"]),
        "    titulo: %s," % aspas(aula["titulo"]),
        "    materia: %s," % aspas(aula["materia"]),
        "    aula: %d," % aula["aula"],
        "    data: %s," % aspas(aula["data"]),
        "    tags: [%s]," % tags,
        "    resumo: %s," % aspas(aula["resumo"]),
        "    arquivo: %s," % aspas(aula["arquivo"]),
        "    status: %s" % aspas(aula["status"]),
        "  }",
    ])


# ---------------------------------------------------------------
# AS DUAS OPERACOES
# ---------------------------------------------------------------

def criar_aula(dados):
    titulo = str(dados.get("titulo", "")).strip()
    materia = str(dados.get("materia", "")).strip()
    resumo = str(dados.get("resumo", "")).strip()
    data = str(dados.get("data", "")).strip()
    status = dados.get("status") or "rascunho"
    numero = int(dados.get("aula") or 1)
    tags = [slug(t) for t in dados.get("tags", []) if slug(t)]

    faltando = [nome for nome, valor in
                [("título", titulo), ("matéria", materia), ("resumo", resumo), ("data", data)]
                if not valor]
    if faltando:
        raise ValueError("Faltou preencher: " + ", ".join(faltando))

    pasta_materia = slug(materia) or "materia"
    apelido = slug(titulo) or "sem-titulo"
    nome_arquivo = "aula-%02d-%s.html" % (numero, apelido)
    relativo = "materias/%s/%s" % (pasta_materia, nome_arquivo)

    destino = caminho_seguro(relativo)
    if destino.exists():
        raise ValueError(
            "Já existe o arquivo %s. Para não apagar uma anotação sua, nada foi gravado. "
            "Mude o número ou o título da aula." % relativo
        )

    catalogo = CATALOGO.read_text(encoding="utf-8")
    identificador = "%s-%02d-%s" % (pasta_materia, numero, apelido)
    if ('"%s"' % relativo) in catalogo or ('"%s"' % identificador) in catalogo:
        raise ValueError("Essa aula já está cadastrada em dados/aulas.js.")

    titulo_completo = "Aula %02d - %s" % (numero, titulo)
    corpo = "<h2>Nesta aula</h2>\n<p>Comece a escrever aqui.</p>"

    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(
        pagina_da_aula(titulo_completo, resumo, corpo, relativo),
        encoding="utf-8",
    )

    acrescentar_no_catalogo(bloco_do_catalogo({
        "id": identificador, "titulo": titulo, "materia": materia, "aula": numero,
        "data": data, "tags": tags, "resumo": resumo, "arquivo": relativo,
        "status": status,
    }))

    return {"arquivo": relativo, "titulo": titulo_completo}


def salvar_aula(dados):
    relativo = str(dados.get("arquivo", ""))
    corpo = str(dados.get("corpo", ""))
    titulo_completo = str(dados.get("titulo", "")).strip()
    resumo = str(dados.get("resumo", "")).strip()

    destino = caminho_seguro(relativo)
    if not destino.exists():
        raise ValueError("O arquivo %s não existe. Cadastre a aula antes." % relativo)

    destino.write_text(
        pagina_da_aula(titulo_completo, resumo, corpo, relativo),
        encoding="utf-8",
    )
    return {"arquivo": relativo}


def excluir_aula(dados):
    """
    Tira a aula do catalogo e move o arquivo para a pasta lixeira/.

    De proposito nao apaga de vez: se voce excluir sem querer, o arquivo
    continua la para ser arrastado de volta.
    """
    relativo = str(dados.get("arquivo", ""))
    destino = caminho_seguro(relativo)

    if not destino.exists():
        # o arquivo ja sumiu, mas o cadastro pode ter sobrado
        if remover_do_catalogo(relativo):
            return {"arquivo": relativo, "lixeira": None,
                    "aviso": "O arquivo ja nao existia; removi so o cadastro."}
        raise ValueError("Nao encontrei nem o arquivo nem o cadastro de %s." % relativo)

    alvo = LIXEIRA / Path(relativo)
    alvo.parent.mkdir(parents=True, exist_ok=True)

    # nao sobrescreve algo que ja foi excluido antes com o mesmo nome
    contador = 2
    while alvo.exists():
        alvo = alvo.with_name("%s-%d%s" % (alvo.stem, contador, alvo.suffix))
        contador += 1

    destino.replace(alvo)
    remover_do_catalogo(relativo)

    # se a pasta da materia ficou vazia, ela vai junto
    try:
        if not any(destino.parent.iterdir()):
            destino.parent.rmdir()
    except OSError:
        pass

    return {"arquivo": relativo, "lixeira": str(alvo.relative_to(RAIZ)).replace("\\", "/")}


# ---------------------------------------------------------------
# SERVIDOR
# ---------------------------------------------------------------

class Manipulador(SimpleHTTPRequestHandler):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(RAIZ), **kwargs)

    def log_message(self, formato, *args):
        """
        So mostra as chamadas de api, para o terminal nao virar poluicao.

        O try existe por um motivo serio: send_response() chama este metodo
        DEPOIS de escrever a linha de status. Se escrever no terminal falhar
        aqui (console fechado, problema de acentuacao no Windows), a resposta
        morre no meio e o navegador recebe um corpo vazio - que aparece como
        "Unexpected end of JSON input". Falhar ao imprimir um log nunca pode
        derrubar a resposta.
        """
        try:
            if "api" in str(args):
                super().log_message(formato, *args)
        except Exception:
            pass

    def _responder(self, codigo, dados):
        corpo = json.dumps(dados, ensure_ascii=False).encode("utf-8")
        self.send_response(codigo)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(corpo)))
        self.end_headers()
        self.wfile.write(corpo)

    def end_headers(self):
        # o navegador nao pode guardar cache das paginas, senao voce
        # salva a aula e continua vendo a versao antiga
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        # ping usado pelas paginas para saber se o servidor certo esta no ar
        if self.path == "/api/status":
            self._responder(200, {"ok": True, "servidor": "biblioteca", "raiz": str(RAIZ)})
            return
        super().do_GET()

    def do_POST(self):
        acoes = {
            "/api/criar": criar_aula,
            "/api/salvar": salvar_aula,
            "/api/excluir": excluir_aula,
        }
        if self.path not in acoes:
            self._responder(404, {"erro": "Endereço desconhecido: %s" % self.path})
            return

        try:
            tamanho = int(self.headers.get("Content-Length") or 0)
            dados = json.loads(self.rfile.read(tamanho).decode("utf-8"))
        except Exception as erro:
            self._responder(400, {"erro": "Não entendi os dados enviados: %s" % erro})
            return

        try:
            resultado = acoes[self.path](dados)
            self._responder(200, {"ok": True, **resultado})
        except ValueError as erro:
            self._responder(400, {"erro": str(erro)})
        except Exception as erro:
            # qualquer falha inesperada vira uma resposta JSON de erro, com o
            # detalhe no terminal - nunca uma resposta vazia
            traceback.print_exc()
            self._responder(500, {"erro": "Erro inesperado no servidor: %s: %s"
                                          % (type(erro).__name__, erro)})


def main():
    if not CATALOGO.exists():
        print("ERRO: nao achei dados/aulas.js.")
        print("Rode este arquivo de dentro da pasta do projeto.")
        input("\nAperte Enter para fechar.")
        return

    endereco = "http://localhost:%d/" % PORTA
    servidor = ThreadingHTTPServer(("127.0.0.1", PORTA), Manipulador)

    print("=" * 58)
    print("  Biblioteca de Estudos rodando")
    print("=" * 58)
    print("  Abra no navegador:  %s" % endereco)
    print("  Pasta do projeto:   %s" % RAIZ)
    print()
    print("  Deixe esta janela aberta enquanto estiver estudando.")
    print("  Para parar: feche a janela ou aperte Ctrl+C.")
    print("=" * 58)
    print()

    webbrowser.open(endereco)
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor encerrado.")


if __name__ == "__main__":
    main()
