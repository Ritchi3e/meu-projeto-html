# Biblioteca de Aulas e Conteúdos Avulsos

Meu caderno de estudos da faculdade. Cada matéria é um capítulo e cada aula é uma
página, com anotações e exemplos práticos.

O índice tem busca e filtro por matéria, e as aulas são escritas em um editor com
barra de ferramentas, parecido com o Word — o que você escreve já aparece do jeito
que vai ficar na página. Ao salvar, o arquivo é gravado direto no projeto.

## Como usar

**Clique duas vezes em `iniciar.bat`.** Uma janela preta abre e o navegador vai
sozinho para a biblioteca.

Deixe a janela preta aberta enquanto estiver estudando — é ela que grava os
arquivos. Para parar, feche a janela.

Se preferir o terminal:

```bash
python servidor.py
```

### Escrever uma aula nova

1. No rodapé do índice, clique em **+ Cadastrar nova aula**
2. Preencha título, matéria, número, resumo e tags
3. Clique em **Criar e escrever**

O editor abre em seguida. Escreva, formate com a barra de ferramentas e clique em
**Salvar** (ou <kbd>Ctrl</kbd>+<kbd>S</kbd>). Ele também salva sozinho a cada 30
segundos e avisa se você tentar fechar com alterações pendentes.

Uma matéria nova não exige configuração nenhuma: digite o nome e a pasta é criada.

### Editar uma aula que já existe

Cada cartão do índice tem os botões **Editar** e **Excluir** no canto direito. Dentro
da própria aula também existe um link **Editar** no topo.

### Excluir uma aula

Clique em **Excluir** no cartão e confirme. A aula sai do índice, mas **o arquivo não
é apagado**: ele vai para a pasta `lixeira/`, mantendo o caminho original. Se você se
arrepender, arraste de volta para `materias/` e cadastre a aula de novo.

A pasta `lixeira/` fica fora do Git (está no `.gitignore`), então ela é só uma rede de
segurança local.

### A barra de ferramentas

| Botão | O que faz |
|---|---|
| ↶ ↷ | Desfazer e refazer |
| Formato | Texto normal, título de seção, subtítulo, bloco de código, citação |
| Fonte | Padrão, serifada ou monoespaçada, aplicada ao parágrafo |
| **N** *I* <u>S</u> | Negrito, itálico, sublinhado |
| ✎ | Destaca o trecho selecionado |
| `</>` | Marca como código no meio do texto |
| • — / 1. — | Lista com marcadores e lista numerada |
| 🔗 | Vira link (externo já sai com a proteção `rel="noopener"`) |
| ▦ | Insere uma tabela |
| ✕ | Limpa a formatação |

Texto colado de outro site entra **sem formatação**, de propósito: assim a aula não
herda o estilo da página de origem.

## Estrutura do projeto

```
meu-projeto-html/
├── iniciar.bat                # duplo clique para começar
├── servidor.py                # servidor local que grava os arquivos
├── index.html                 # índice: busca, filtros e cartões
├── novo.html                  # cadastro de aula nova
├── editor.html                # editor com barra de ferramentas
├── dados/
│   └── aulas.js               # catálogo, atualizado pelo servidor
├── assets/
│   ├── css/style.css          # estilo de todas as páginas
│   └── js/
│       ├── app.js             # monta o índice, busca e filtros
│       ├── novo.js            # envia o cadastro ao servidor
│       └── editor.js          # o editor
└── materias/
    ├── html-na-pratica/
    └── redes-de-computadores/
```

## Sobre o servidor

É um arquivo só, feito com a biblioteca padrão do Python — **não precisa instalar
nada**. Ele roda apenas na sua máquina (`127.0.0.1`), não fica exposto na internet, e
só aceita gravar arquivos `.html` dentro de `materias/`, além do `dados/aulas.js`.
Qualquer caminho que aponte para fora da pasta do projeto é recusado.

Ele existe só para **escrever**. Ler a biblioteca funciona sem servidor nenhum: dá
para abrir o `index.html` direto, e o site funciona igual publicado no GitHub Pages —
só o cadastro e o editor é que precisam dele.

### Proteções

- Nunca sobrescreve um arquivo de aula existente. Se o caminho já estiver ocupado,
  avisa e não grava nada.
- Recusa cadastro duplicado e campos obrigatórios vazios.
- Cria o arquivo da aula **antes** de mexer no catálogo, para nunca sobrar um
  cadastro apontando para um arquivo que não existe.
- Ao salvar, o HTML é reindentado para o arquivo continuar legível no VS Code.

## Regra de nomes

Arquivos e pastas usam **kebab-case, sem acentos, sem espaços e sem maiúsculas**. O
servidor já faz isso sozinho ao criar as aulas — `Endereçamento IPv6` vira
`aula-04-enderecamento-ipv6.html`.

Isso importa porque o GitHub Pages roda em Linux, onde `Aula.html` e `aula.html` são
arquivos diferentes, e acentos viram códigos como `%C3%A7` na URL.

## Busca

Ignora acentos e maiúsculas: procurar por `enderecamento` encontra "Endereçamento".
Cada palavra digitada precisa aparecer no título, resumo, matéria ou tags — então
`ipv6 nat` só traz aulas que tenham as duas. <kbd>Esc</kbd> limpa o campo.

## Temas

As cores ficam todas em variáveis CSS no bloco `:root` do `style.css`. Para mudar o
tema do site inteiro, basta trocar os valores desse bloco.

## Se der problema

**"O servidor da biblioteca não está no ar"** — o `iniciar.bat` não está rodando, ou a
janela preta foi fechada. Abra de novo e recarregue a página.

**"O servidor respondeu vazio"** ou **"respondeu algo inesperado"** — tem outro
programa ocupando a porta 8000, e é ele que está respondendo no lugar da biblioteca.
Feche a janela preta, confira quem está na porta e abra de novo:

```bash
netstat -ano | findstr :8000
```

Se aparecer alguma linha em `LISTENING` mesmo com a janela preta fechada, é um
processo antigo travado. Anote o número no fim da linha e encerre com
`taskkill /F /PID <numero>`.

**A página abre mas nada salva** — confira o endereço. Precisa ser
`http://localhost:8000/`, e não um caminho começando com `file:///`. Abrindo o arquivo
com duplo clique, a leitura funciona mas o cadastro e o editor não têm como gravar.

## Próximos passos

- [ ] Modo escuro com `prefers-color-scheme`
- [ ] Publicar no GitHub Pages
- [ ] Poder renomear o título de uma aula já criada
- [ ] Inserir imagens no editor
