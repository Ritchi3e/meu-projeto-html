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

Ler a biblioteca funciona sempre assim. A página de **cadastro**, porém, depende de
recursos que alguns navegadores só liberam em contexto seguro (`https` ou
`localhost`) — o botão Copiar e, principalmente, a escolha da pasta do projeto. Se o
cadastro reclamar ao abrir por duplo clique, rode com servidor: use a extensão
**Live Server** do VS Code, ou:

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
3. Clique em **Salvar aula**.

Pronto: a página grava os dois arquivos sozinha — acrescenta o cadastro em
`dados/aulas.js` e cria a página da aula em `materias/<materia>/`. Depois é só abrir
o arquivo criado e escrever o conteúdo.

Uma matéria nova não exige nenhuma configuração: basta digitar o nome dela no
formulário que a pasta é criada e o filtro correspondente aparece no índice.

### O que esperar na primeira vez

O navegador abre uma janela para você escolher a pasta do projeto (a pasta
`meu-projeto-html`, aquela que tem o `index.html` dentro) e pede permissão para
editá-la. A escolha fica lembrada, então nas vezes seguintes basta reconfirmar a
permissão em um clique.

A página recusa a pasta errada: se não encontrar `dados/aulas.js` dentro dela, avisa
em vez de gravar em lugar nenhum.

### Proteções

- **Nunca sobrescreve** um arquivo de aula existente. Se o caminho já estiver
  ocupado, ela avisa e não grava nada — nem a página, nem o catálogo.
- Recusa cadastro duplicado (mesmo identificador ou mesmo arquivo).
- Recusa campos obrigatórios vazios.
- Grava a página da aula **antes** do catálogo. Se algo falhar no meio, sobra um
  arquivo órfão inofensivo, em vez de um cadastro apontando para um arquivo que não
  existe — que é justamente o link quebrado que queremos evitar.

### Requisitos e modo manual

A gravação automática usa a **File System Access API**, que hoje existe no Chrome e
no Edge, mas não no Firefox nem no Safari. Nesses navegadores a página esconde o
botão e abre o **modo manual** (copiar e colar os dois blocos), que funciona em
qualquer lugar.

Alguns navegadores também bloqueiam a escolha de pasta quando a página é aberta com
duplo clique (endereço `file://`). Se isso acontecer, a página explica e sugere abrir
o projeto por um servidor local — ou usar o modo manual.

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
