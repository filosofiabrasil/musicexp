# Validação 1.1.0 — 10 de novembro de 2026

## Executado neste ambiente

- `npm install`: concluído; `package-lock.json` incluído. Os módulos Expo Asset, Constants e Core foram fixados nas versões do SDK 54 para evitar resolução automática de peers de outro SDK.
- `npm run typecheck`: aprovado, TypeScript estrito.
- `npm test`: 33 testes aprovados. Cobrem catálogos, os oito estudos originais, escrita válida/inválida, recortes, métrica, continuidade do pulso, os 43 WAVs de reprodução, classificação, diagnóstico, exportação CSV e cinco cenários de persistência com falha de disco simulada.
- Chromium/Playwright: 26 testes aprovados. Incluem os 12 testes anteriores e verificações de pulso em ciclo fracionário, 6/8, editor, reaplicação de escrita, recortes, isolamento, volume, variantes, compensação de captura, exportações, recuperação/limite de armazenamento, fontes, teclado e layout de 320 px.
- O teste de captura injeta um WAV dos samples no **dispositivo virtual de áudio do Chromium**. O AudioWorklet, o detector e o classificador do app processam o sinal. Não há injeção de eventos de golpe.
- Inspeção visual das três visualizações e das quatro áreas, em desktop e celular. As telas ficam contidas no viewport; a escrita extensa tem rolagem interna. Capturas da versão estão em `docs/images/`.
- Versão web de produção testada com reprodução, teclado, pausa, troca de visualização, estudos, variante sonora, caderno e download JSON. Confirmados versão 1.1.0, quatro golpes exportados e nenhum erro de console, JavaScript ou carregamento de recursos nesse percurso.
- O ZIP foi extraído em outra pasta, sem `node_modules`. `npm run preview` iniciou com os módulos internos do Node, e o mesmo percurso de navegador passou nessa cópia. CRC, quantidade de samples e inclusão das fontes da preview foram conferidos no arquivo.
- `npx expo install --check`: versões compatíveis com o SDK.
- `npx expo config --type prebuild --json`: plugins de configuração avaliados.
- `npx expo export --platform all`: bundles web, Android e iOS gerados.

## Limites da validação

- Não foi compilado ou instalado um APK/IPA; não há Android SDK ou Xcode neste ambiente. A exportação de JavaScript/Hermes não compila o código Kotlin/Swift do módulo de microfone.
- O adaptador de captura nativa está implementado e configurado para development build, mas a compatibilidade em execução do módulo `@siteed/audio-studio` com cada dispositivo ainda precisa ser validada no hardware.
- Não foi medida a latência ponta a ponta nem uma taxa de reconhecimento de alunos. O ensaio com um WAV conhecido verifica a integração; ele não mede generalização para outro pandeiro, sala, microfone ou técnica.
- As métricas de ms refletem os timestamps e a compensação disponíveis. A tolerância de 15 ms é configurável, sem promessa de resolução física de 15 ms.
- A janela de classificação adiciona 40 ms; a entrega do buffer nativo pode adicionar mais atraso. O intervalo mínimo entre ataques é 65 ms. Rulos e sobreposição exigem validação adicional.
- Os oito estudos são propostas originais do projeto, sem validação pedagógica externa. A escrita própria não foi certificada como sistema notacional para repertório erudito. Não há importador MusicXML, edição de alturas afinadas ou avaliação automática de interpretação/dinâmica.
- As falhas de disco nativas foram exercitadas com um adaptador de arquivos em memória. A exportação Android/iOS verifica tipos e integração do bundle; os mecanismos reais de armazenamento e compartilhamento ainda requerem ensaio em dispositivo.

## Conteúdo da entrega

O ZIP contém o projeto completo, fontes de dados preservadas, sons originais/derivados, testes, lockfile e uma versão web exportada para conferência local. Não inclui `node_modules`, caches, gravações de sessão, vídeos antigos, projetos Remotion ou builds assinados.

## Revisão musical e funcional 1.1.0

O teste do ciclo de sete semicolcheias captura o `AudioBuffer` usado pelo app, mede seus ataques de clique e confirma intervalos de 0,6 s a 100 BPM, inclusive na virada de um buffer de 4,2 s. A interface continua mostrando os ciclos escritos de 1,05 s. A propriedade de fechamento entre pulso e ciclo foi conferida para todas as extensões de 1 a 32 unidades e as cinco subdivisões disponíveis.

Os 43 WAVs foram inspecionados em teste quanto a cabeçalho, taxa de 44.100 Hz, duração em frames, valores finitos e pico de referência. A seleção de variantes, os acentos e o ganho foram comparados no PCM resultante. O banco de análise em 16 kHz permanece independente.

Os testes de caderno verificam persistência após recarga, atualização do mesmo identificador, remoção/desfazer, JSON/CSV coerentes, conteúdo ilegível preservado, erro de quota sem registro fictício e recuperação de uma gravação de arquivo interrompida. Reaplicar a mesma escrita e alterar a compensação de captura iniciam uma tomada independente.

Os metadados da referência de Gianesella foram conferidos na página editorial da Música Hodie. Os demais vínculos bibliográficos dos ritmos são dados de origem preservados; não representam conferência integral das obras citadas. As posições em três linhas são categorias de articulação, sem equivalência a frequência ou altura afinada.

## Correção 1.0.1: intervalo entre voltas na web

Foi reproduzido um ciclo nominal de 2,4 segundos com intervalos medidos de 2,5094, 2,5163 e 2,5332 segundos entre voltas usando o player HTML. Os samples do kit iniciam o ataque a cerca de 1 ms; não havia uma batida vazia adicionada ao padrão.

A reprodução web passou a usar um AudioBufferSourceNode em loop com o relógio do AudioContext. O teste de regressão renderiza três voltas do buffer efetivamente usado pelo app em OfflineAudioContext e compara todos os frames com a repetição exata do ciclo. Outro teste verifica a duração em frames de todos os 148 ritmos.

Essa correção é específica do motor web; a reprodução nativa ainda exige validação em aparelho.

## Revisão 1.0.2

Antes das correções foram reproduzidas falhas em quatro testes de navegador: duas fontes simultâneas ao iniciar, áudio iniciando depois de alterar o BPM, erro tardio de permissão cancelada e atalho de início durante calibração. Um teste de lógica reproduziu a rejeição incorreta de golpes em exatamente ±15 ms.

A suíte passou após as correções, com testes adicionais para serialização dos pedidos de microfone, foco do teclado, seleção de golpes nas barras, normalização entre taxas de captura e cancelamento de listeners/timeouts. O ensaio de captura continua usando o microfone virtual do Chromium; ele não mede taxa de acerto de reconhecimento acústico em hardware.

O ajuste do ciclo de vida nativo foi verificado por tipos, testes da espera de carregamento e exportação Android/iOS. Não foi feito teste em celular físico nem compilação de APK/IPA nesta revisão.
