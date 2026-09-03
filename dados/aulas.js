/* =========================================================
   CATÁLOGO DA BIBLIOTECA
   Este é o único arquivo que você precisa editar para
   cadastrar uma aula nova. O índice se monta sozinho a
   partir daqui.

   Para gerar um bloco novo já no formato certo, abra a
   página novo.html, preencha o formulário e cole o
   resultado no final desta lista.

   Campos:
     id      - identificador único, em kebab-case
     titulo  - aparece no cartão do índice
     materia - agrupa as aulas; matéria nova aparece sozinha
     aula    - número da aula dentro da matéria
     data    - quando a anotação foi escrita (AAAA-MM-DD)
     tags    - palavras-chave, usadas pela busca
     resumo  - uma linha sobre o conteúdo
     arquivo - caminho do arquivo a partir da raiz do projeto
     status  - "pronto" ou "rascunho"
   ========================================================= */

const AULAS = [
  {
    id: "html-01-introducao",
    titulo: "Introdução ao HTML",
    materia: "HTML na prática",
    aula: 1,
    data: "2026-08-19",
    tags: ["html", "tags", "estrutura", "doctype", "atributos"],
    resumo: "O que é HTML, a estrutura básica de um documento, as principais tags e como funcionam os atributos.",
    arquivo: "materias/html-na-pratica/aula-01-introducao-ao-html.html",
    status: "pronto"
  },
  {
    id: "html-02-css",
    titulo: "Introdução ao CSS",
    materia: "HTML na prática",
    aula: 2,
    data: "2026-08-19",
    tags: ["css", "seletores", "estilo", "sintaxe"],
    resumo: "O que é CSS, como conectar ao HTML, a sintaxe de uma regra e os principais seletores.",
    arquivo: "materias/html-na-pratica/aula-02-introducao-ao-css.html",
    status: "pronto"
  },
  {
    id: "redes-01-modelo-osi",
    titulo: "Modelo de Referência OSI",
    materia: "Redes de Computadores",
    aula: 1,
    data: "2026-08-26",
    tags: ["osi", "camadas", "protocolos", "encapsulamento", "iso"],
    resumo: "Por que o modelo OSI surgiu, as 7 camadas, seus protocolos e o encapsulamento de dados.",
    arquivo: "materias/redes-de-computadores/aula-01-modelo-osi.html",
    status: "pronto"
  },
  {
    id: "redes-02-encapsulamento",
    titulo: "Encapsulamento de Dados",
    materia: "Redes de Computadores",
    aula: 2,
    data: "2026-08-26",
    tags: ["encapsulamento", "frames", "fcs", "cabecalho", "trailer", "cmd"],
    resumo: "Continuação do encapsulamento: cabeçalhos, trailers, FCS e prática com comandos de rede no CMD.",
    arquivo: "materias/redes-de-computadores/aula-02-encapsulamento.html",
    status: "pronto"
  },
  {
    id: "redes-03-tcp-ip",
    titulo: "Modelo TCP/IP e Endereçamento",
    materia: "Redes de Computadores",
    aula: 3,
    data: "2026-08-26",
    tags: ["tcp", "udp", "ip", "ipv4", "ipv6", "nat", "sub-redes", "cidr", "portas"],
    resumo: "As camadas do modelo TCP/IP, portas dos principais protocolos, endereçamento IPv4 e IPv6, classes, NAT, máscaras e sub-redes.",
    arquivo: "materias/redes-de-computadores/aula-03-tcp-ip-enderecamento.html",
    status: "pronto"
  },
  {
    id: "portu-01-teste",
    titulo: "teste",
    materia: "portu",
    aula: 1,
    data: "2026-08-31",
    tags: ["adsd"],
    resumo: "asda",
    arquivo: "materias/portu/aula-01-teste.html",
    status: "rascunho"
  }
];
