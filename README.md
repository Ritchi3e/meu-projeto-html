# Biblioteca de Aulas e Conteúdos Avulsos

Meu caderno de estudos da faculdade, escrito em HTML, CSS e JavaScript puros — sem
framework e sem build. Cada matéria é um capítulo e cada aula é uma página, com
anotações e exemplos práticos.

O índice se monta sozinho a partir de um catálogo, tem busca e filtro por matéria, e
existe um formulário que gera o cadastro de uma aula nova.

## Como rodar localmente

Basta abrir o `index.html` no navegador — não precisa de servidor. O catálogo é
carregado por `<script src>`, e não por `fetch`, justamente para que o site continue
funcionando ao abrir o arquivo direto (`file://`).

A única coisa que não funciona em `file://` é o botão **Copiar** da página de
cadastro, porque a API de área de transferência exige contexto seguro. Nesse caso a
página seleciona o texto sozinha e mostra "Selecionado - Ctrl+C".

Se quiser rodar com servidor (recomendado, e obrigatório se um dia migrar para
`fetch` + JSON), use a extensão **Live Server** do VS Code, ou:

```bash
python -m http.server 8000
```

## Estrutura do projeto

```
meu-projeto-html/
├── index.html                 # índice: busca, filtros e cartões
├── novo.html                  # formulário que gera o cadastro de uma aula
├── dados/
│   └── aulas.js               # O CATÁLOGO — o único arquivo a editar
├── assets/
│   ├── css/
│   │   └── style.css          # estilo compartilhado por todas as páginas
│   └── js/
│       ├── app.js             # monta o índice, busca e filtros
│       └── novo.js            # gera o cadastro na página novo.html
└── materias/
    ├── html-na-pratica/
    │   ├── aula-01-introducao-ao-html.html
    │   └── aula-02-introducao-ao-css.html
    └── redes-de-computadores/
        ├── aula-01-modelo-osi.html
        ├── aula-02-encapsulamento.html
        └── aula-03-tcp-ip-enderecamento.html
```

## Como cadastrar uma aula nova

1. Abra o `novo.html` (ou clique em **+ Cadastrar nova aula** no rodapé do índice).
2. Preencha os campos. A página sugere o próximo número da aula quando a matéria já
   existe, e monta o caminho do arquivo sozinha.
3. Copie o **bloco 1** e cole no final da lista em `dados/aulas.js`, antes do `];`.
   Não esqueça da vírgula depois do bloco anterior.
4. Copie o **bloco 2**, crie o arquivo no caminho indicado e cole o conteúdo lá.
5. Escreva a aula e confira no índice.

Uma matéria nova não exige nenhuma configuração: basta digitar o nome dela no
formulário que o filtro correspondente aparece sozinho no índice.

### Campos do catálogo

| Campo | Para que serve |
|---|---|
| `id` | Identificador único, em kebab-case |
| `titulo` | Aparece no cartão do índice |
| `materia` | Agrupa as aulas e gera o filtro |
| `aula` | Número da aula dentro da matéria |
| `data` | Quando a anotação foi escrita (AAAA-MM-DD) |
| `tags` | Palavras-chave, usadas pela busca |
| `resumo` | Uma linha sobre o conteúdo |
| `arquivo` | Caminho a partir da raiz do projeto |
| `status` | `pronto` ou `rascunho` (rascunho ganha etiqueta no cartão) |

### Regra de nomes (importante)

Arquivos e pastas usam **kebab-case, sem acentos, sem espaços e sem maiúsculas**:

- ✅ `aula-03-tcp-ip-enderecamento.html`
- ❌ `Aula 03 - Endereçamento .html`

O site é publicado no GitHub Pages, que roda em Linux — lá `Aula.html` e `aula.html`
são arquivos diferentes, e acentos e espaços viram códigos como `%C3%A7` na URL.
Seguir a regra evita links que funcionam no Windows e quebram no ar.

## Busca

A busca ignora acentos e maiúsculas: procurar por `enderecamento` encontra
"Endereçamento". Cada palavra digitada precisa aparecer em algum lugar do título,
resumo, matéria ou tags — então `ipv6 nat` só traz aulas que tenham as duas.

<kbd>Esc</kbd> limpa o campo.

## Convenções das páginas

- `<h1>` — título da aula, igual ao `<title>` e ao `titulo` no catálogo.
- `<h2>` — seções da aula.
- `<h3>` / `<h4>` — subdivisões.
- `<pre><code>` — blocos de código e comandos, com indentação de 4 espaços.
- `<code>` — termos técnicos e comandos no meio do texto.
- Todo o conteúdo fica dentro de `<main>`.
- Links externos levam `target="_blank" rel="noopener noreferrer"`.
- Tabelas ficam dentro de `<div class="tabela-rolavel">` para rolarem no celular.

## Temas

As cores ficam todas em variáveis CSS no bloco `:root` do `style.css`. Para mudar o
tema do site inteiro, basta trocar os valores desse bloco.

## Próximos passos

- [ ] Modo escuro com `prefers-color-scheme`
- [ ] Publicar no GitHub Pages
- [ ] Ordenar por data além de por número da aula
- [ ] Página por matéria, para linkar direto um capítulo
