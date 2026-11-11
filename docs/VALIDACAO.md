# Validação 1.2.0 — 10 de novembro de 2026

## Verificações

- `npm install` e `npm run typecheck`: concluídos; TypeScript estrito e lockfile incluído.
- `npm test`: **43 testes aprovados**. Incluem os catálogos, os 43 WAVs, o modelo temporal, classificação, persistência e os novos casos de notação, métricas de compasso, programas, biblioteca pessoal, comparação e seleção das perguntas de escuta.
- Playwright/Chromium: **35 testes aprovados**, incluindo captura por dispositivo virtual. Os casos acrescentados exercitam o exemplo da imagem (oito semicolcheias em 2/4), contagem composta de 6/8, preparação sem pontuação, término finito, silêncio do exercício de memória, salvamento/recarga/desfazer de escritas, corrupção/quota, identificação auditiva e comparação de protocolos.
- Após ocultar o apoio visual no exercício de memória, os testes afetados foram executados novamente: preparação, ausência de cursor no silêncio e retorno dos resultados ao terminar. Os ensaios usam andamentos mais lentos para observar os estados sem depender de janelas de 250 ms.
- O teste de captura injeta WAV no dispositivo virtual do Chromium. AudioWorklet, detector e classificador produzem os eventos a partir do PCM, sem injeção de golpes fictícios.
- O teste da tomada finita compara quantidade de frames, duração de preparação/corpo e término do buffer. O teste de memória verifica ausência de amostras diferentes de zero no trecho final e ausência do cursor naquele trecho.
- `npx expo install --check`: dependências compatíveis com SDK 54.
- Bundles de produção web, Android e iOS exportados. A exportação JavaScript/Hermes não compila o código Kotlin/Swift.

## Evidência musical

O exemplo ADBDPDBD é tratado como oito semicolcheias a quatro unidades por semínima, somando duas semínimas. Em 2/4, o teste confere dois tempos e as subdivisões 1–4 em cada um. A contagem reinicia por compasso em ciclos de mais de uma barra. Em 6/8 com colcheias, o teste confere dois pulsos de três unidades; em 7/8, confere grupos aditivos.

As durações, clave, bandeirolas e pausas são contornos Bravura/SMuFL. A representação em linha única foi separada da grade de articulações. O modelo ainda é uma grade de ataques: pontos não comandam abafamento e não há edição livre de durações sustentadas, ligaduras ou polifonia. Fórmulas com fronteiras que não cabem na grade ficam desabilitadas, sem afirmar que essas combinações sejam impossíveis na teoria musical.

Foi consultado o artigo de Gianesella na Música Hodie, inclusive o exemplo textual de oito semicolcheias de samba em 2/4. O app não implementa ou certifica os sistemas de Anunciação/Stasi. As fontes dos 148 ritmos são dados preservados dos anexos, sem revisão integral das obras citadas.

## Limites físicos e pedagógicos

- Não foram compilados ou instalados APK/IPA; o ambiente não tem Android SDK ou Xcode. Os mecanismos nativos de captura, arquivos e compartilhamento requerem ensaio em dispositivo.
- Os cenários de falha de disco foram testados com adaptador em memória. Os testes de quota/corrupção web exercitam o armazenamento do navegador.
- O microfone não tem taxa de reconhecimento medida em alunos, instrumentos ou salas diferentes. O índice de semelhança é heurístico e não probabilístico. A janela de timbre adiciona 40 ms; o intervalo mínimo entre ataques é 65 ms. Rulos e sobreposição não têm avaliação validada.
- Não foi medida a latência ponta a ponta ou certificada precisão física de ±15 ms. A atribuição à unidade mais próxima não alinha frases inteiras.
- A comparação de duas tomadas é descritiva e verifica configurações registradas; o ganho final pode não representar todo o percurso e ajustes de calibração pessoal podem ter mudado. Ela não prova evolução, equivalência acústica ou significância estatística.
- A identificação auditiva mede respostas sobre arquivos do banco e não técnica de execução. Os oito estudos e o percurso proposto não receberam validação pedagógica externa.

## Distribuição

O percurso de produção foi executado no bundle web exportado: versão 1.2.0, salvamento de escrita após recarga, programa de memória, tomada concluída com 4 s de execução, dois golpes exportados em JSON, comparação de dois registros e identificação auditiva 1/1. Não foram observados erros de JavaScript, console ou carregamento de recursos nesse percurso. As capturas da produção estão em `docs/images/`. O mesmo percurso passou no ZIP extraído em outra pasta, sem `node_modules`, usando somente `npm run preview`. CRC, versões, quantidade de samples e inclusão das fontes foram conferidos no arquivo.

O ZIP inclui código, dados de origem, sons originais/derivados, símbolos/licenças, testes, lockfile e preview web. Não inclui dependências instaladas, caches, dados pessoais de sessão, projetos antigos de vídeo ou builds assinados. As imagens do caderno e as tomadas feitas para testar o pacote são exemplos de interface, sem avaliação de estudante.

## Histórico relevante

Na versão 1.0.1, um ciclo nominal de 2,4 s foi medido em 2,5094–2,5332 s no player HTML. A troca por AudioBufferSourceNode removeu o intervalo entre voltas na web. O teste continua renderizando três voltas do buffer real em OfflineAudioContext e comparando a repetição dos frames.

A versão 1.0.2 corrigiu início concorrente, reprodução tardia após mudança de configuração, permissões canceladas, foco de teclado, limite de ±15 ms e callbacks de captura obsoletos. A versão 1.1.0 separou reprodução em 44,1 kHz de análise em 16 kHz e manteve o clique de semínima regular em ciclos fracionários. Esses testes permanecem na suíte 1.2.0.
