# Biblioteca de Aulas e Conteúdos Avulsos

Meu caderno de estudos da faculdade, escrito em HTML e CSS puros. Cada matéria é um
capítulo e cada aula é uma página, com anotações e exemplos práticos.

O objetivo é ser uma biblioteca online de estudos onde eu consiga cadastrar novos
conteúdos com facilidade.

## Como rodar localmente

Não precisa de instalação nem de servidor: basta abrir o `index.html` no navegador.

Se você usa o VS Code, a extensão **Live Server** é mais confortável (recarrega a
página sozinha a cada alteração) — e vai ser necessária mais pra frente, quando o
índice passar a ser carregado de um arquivo JSON.

## Estrutura do projeto

```
meu-projeto-html/
├── index.html                 # índice: lista todas as matérias e aulas
├── assets/
│   └── css/
│       └── style.css          # estilo compartilhado por todas as páginas
└── materias/
    ├── html-na-pratica/
    │   ├── aula-01-introducao-ao-html.html
    │   └── aula-02-introducao-ao-css.html
    └── redes-de-computadores/
        ├── aula-01-modelo-osi.html
        ├── aula-02-encapsulamento.html
        └── aula-03-tcp-ip-enderecamento.html
```

## Como adicionar uma aula nova

1. Crie o arquivo em `materias/<materia>/aula-NN-assunto-curto.html`.
   Se a matéria ainda não existir, crie a pasta dela.
2. Copie o cabeçalho de uma aula existente e ajuste `<title>`, `<meta name="description">` e `<h1>`.
3. Adicione o link correspondente no `index.html`.

### Regra de nomes (importante)

Arquivos e pastas usam **kebab-case, sem acentos, sem espaços e sem maiúsculas**:

- ✅ `aula-03-tcp-ip-enderecamento.html`
- ❌ `Aula 03 - Endereçamento .html`

O site é publicado no GitHub Pages, que roda em Linux — lá `Aula.html` e `aula.html`
são arquivos diferentes, e acentos e espaços viram códigos como `%C3%A7` na URL.
Seguir a regra evita links que funcionam no Windows e quebram no ar.

## Convenções das páginas

- `<h1>` — título da aula, igual ao `<title>` e ao texto do link no índice.
- `<h2>` — seções da aula.
- `<h3>` / `<h4>` — subdivisões.
- `<pre><code>` — blocos de código e comandos, com indentação de 4 espaços.
- `<code>` — termos técnicos e comandos no meio do texto.
- Links externos levam `target="_blank" rel="noopener noreferrer"`.
- Tabelas ficam dentro de `<div class="tabela-rolavel">` para rolarem no celular.

## Temas

As cores ficam todas em variáveis CSS no bloco `:root` do `style.css`. Para mudar o
tema do site inteiro, basta trocar os valores desse bloco.

## Próximos passos

- [ ] Índice gerado a partir de um `dados/aulas.json`, com busca e filtro por matéria
- [ ] Página de cadastro que monta o JSON de uma aula nova
- [ ] Modo escuro com `prefers-color-scheme`
- [ ] Publicar no GitHub Pages
