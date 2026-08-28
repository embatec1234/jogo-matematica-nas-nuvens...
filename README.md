# ☁️ Matemática nas Nuvens

Jogo educativo de matemática para crianças de 6 a 10 anos.

## Estrutura de arquivos

```
matematica-nas-nuvens/
├── index.html      → estrutura HTML da página
├── css/
│   └── style.css   → toda a estilização visual (cores, fontes, layout responsivo)
└── js/
    └── script.js   → toda a lógica do jogo (telas, questões, pontuação, salvamento, sons)
```

## Como jogar

Basta abrir o arquivo `index.html` em qualquer navegador moderno (Chrome, Edge, Firefox, Safari).
Não é necessário instalar nada nem rodar servidor.

## Observação sobre salvamento

O jogo foi originalmente construído para rodar dentro do ambiente de artefatos do Claude.ai,
que fornece a API `window.storage` (salvamento automático em nuvem, sem precisar de backend).

Se você abrir este `index.html` diretamente fora do Claude.ai, o navegador não terá o objeto
`window.storage` disponível, então o salvamento automático não vai funcionar (o jogo ainda
funciona normalmente, mas não guardará o progresso entre sessões).

Para usar em um site próprio, hospedagem, ou app, troque as funções `loadSave()` e `persist()`
no `js/script.js` por uma implementação equivalente usando `localStorage`, um banco de dados,
ou uma API própria — a lógica do jogo (telas, questões, vidas, pontuação) não precisa mudar.

## Conteúdo por fase

- **Fase 1 — Fundamentos:** números, contagem, soma e subtração simples
- **Fase 2 — Operações:** soma, subtração, multiplicação e divisão
- **Fase 3 — Desafios:** operações combinadas, sequências, comparações, probleminhas
- **Fase 4 — Desafio Final:** mistura de tudo, com mais dificuldade
- **Desafio Bônus:** liberado após concluir a Fase 4, mistura tudo

## Dificuldades

Fácil, Médio e Difícil — alteram os intervalos numéricos e a complexidade das questões.
