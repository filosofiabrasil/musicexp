# 1.3.0

- Cadeira vazia com bases reais de 84 e 92 BPM, modelo de pandeiro opcional e níveis por instrumento.
- Dominó de frases com ordem e repetições editáveis, preparação, clique e reprodução numa linha de tempo compartilhada.
- Salvamento local de montagem e exportação de roteiro JSON e áudio WAV.
- Banco de 14 trechos com origem rastreável e testes de duração, composição e retomada.

# 1.2.2

- Percurso guiado com 11 etapas, acesso à prática e progresso local reversível.

# Alterações

## 1.2.1 — Continuidade de escrita e áudio

- A pauta passou a usar cinco linhas e posições fixas para cada uma das nove articulações, com legenda explícita. As posições classificam golpes e não indicam alturas afinadas.
- Ao adicionar ou retirar uma unidade pelo editor, o último grupo válido é ajustado junto com a escrita, evitando que a ferramenta de pausa deixe o exercício inválido.
- Os pads nativos preferem vozes livres e ampliam o pool até oito reproduções simultâneas por amostra antes de reutilizar uma voz ativa, reduzindo cortes nas caudas de ataques rápidos.
- Revisão adicional da suíte web, da lógica de áudio, da persistência e do typecheck.

## 1.2.0 — Ler, investigar, comparar

- Substituída a escrita categórica em três linhas por leitura rítmica em linha única e mapa de articulações separado. Figuras, pausas, bandeirolas e clave usam contornos Bravura/SMuFL com licença incluída.
- Corrigida a apresentação da contagem: tempos reiniciam por compasso, 6/8 conta dois pulsos compostos, subdivisões são numeradas dentro do pulso/grupo e índices de edição permanecem separados. O exemplo de oito semicolcheias pode ser estudado explicitamente em 2/4.
- Escolha de métrica limitada aos compassos completos representáveis na grade. Travessas separam pausas, compassos e fronteiras de quiálteras; trechos incompletos são identificados.
- Percurso de prática com intenção escrita, exploração livre, tomada de quatro ciclos e memória de pulso. Programas finitos têm quatro semínimas de preparação, referência programada e término agendado no próprio áudio; a preparação não pontua.
- Editor com acentos, rotação, reaproveitamento da escrita da prática e biblioteca pessoal persistente de até 30 escritas. Salvar novamente a mesma definição não duplica; variações distintas são preservadas. Incluídos exportação, desfazer e recuperação de dados ilegíveis.
- Laboratório de escuta com quatro pares de articulações, referências identificadas, exemplo oculto sorteado entre gravações reais e uma resposta por pergunta. A pré-escuta interrompe a anterior para evitar sobreposição.
- Comparação de duas tomadas no caderno, explicitando diferenças de protocolo antes de interpretar números. Objetivo, métrica, programa, ciclo e posição original entram nos dados exportados.
- A tela inicial abre um estudo original em 4/4; os 148 ritmos e as 43 gravações permanecem disponíveis.

## 1.1.0 — Laboratório de estudos

- Interface reorganizada em Prática, Estudos e escrita, Articulações e sons e Caderno, com tipografia de leitura, navegação por teclado e layout a partir de 320 px.
- Escrita didática em três linhas, posições explícitas, inspeção e pré-escuta de cada unidade, recortes de repetição e redução por articulação. A notação é própria e não representa alturas afinadas.
- Oito estudos originais com pausas, acentos, tercinas, sextinas, 6/8 e 7/8; editor de 1 a 32 unidades com validação de letras, subdivisão e grupos aditivos.
- Separados ciclo, fórmula de compasso, agrupamento e unidade do BPM: a referência numérica é sempre a semínima. Preservados os 148 ritmos e suas referências, com novos filtros e consulta de fontes.
- Corrigida a continuidade da semínima em ciclos fracionários. O buffer pode conter vários ciclos para fechar simultaneamente a escrita e o pulso; clique por subdivisão e por grupos também disponível.
- Banco de reprodução reorganizado: 43 gravações em nove famílias, WAVs mono de 44,1 kHz, caudas completas, pré-escuta e escolha de variantes. Referências de análise em 16 kHz permanecem separadas. O clipe longo não identificado foi retirado da distribuição do app.
- Níveis relativos p/mp/mf/f, acentos de referência e volume de saída que preserva a tomada. Esses ajustes não são medições acústicas calibradas.
- Caderno local com observações, 50 resumos, identificadores estáveis, atualização sem duplicação, remoção com desfazer e recuperação de conteúdo ilegível. Exportação JSON/CSV da tomada atual e compartilhamento de arquivos no celular.
- Escrita nativa do caderno usa arquivo temporário, cópia anterior e recuperação em falhas. Erros de armazenamento não criam resumos fictícios.
- Reaplicar um estudo com as mesmas notas cria uma tomada independente; alterar a compensação de captura também reinicia a tomada para não misturar referências temporais.
- Exportações explicitam unidades, configuração final, taxas de referência/captura e limites dos escores. Incluído protocolo de estudo e comparação de tomadas.

## 1.0.2

- Corrigidos início duplicado de áudio e reprodução tardia após mudar o BPM ou reiniciar durante a inicialização.
- O atalho Espaço respeita os bloqueios de calibração, captura e controles focados.
- Tentativas de microfone são serializadas; permissões e callbacks de tentativas canceladas não alteram a sessão atual.
- Ataques recebidos após pausa, reinício ou troca de calibração são descartados quando pertencem ao estado anterior.
- Corrigida a comparação inclusiva de ±15 ms e a seleção do golpe nas barras quando há mais de um ataque no mesmo passo.
- Normalizada a medida de cruzamentos de zero para comparar captura em 44,1/48 kHz com os samples de 16 kHz.
- Carregamentos cancelados liberam listeners e timeouts; os pads tratam erros e não disparam sons após serem descartados.
- Reduzido o processamento de históricos longos na atualização das métricas e barras.
- Versão visível no rodapé para conferir qual pacote está aberto.

## 1.0.1

- Corrigido o intervalo de silêncio que o player HTML acrescentava entre voltas no navegador.
- Reprodução web e pads usam Web Audio; o cursor acompanha o relógio do mesmo contexto de áudio.
- Mantidos os padrões, pausas escritas nos ritmos e subdivisões da biblioteca.
- Incluídos testes para a duração dos 148 ritmos e continuidade de três ciclos no renderizador de áudio.
- A versão web pronta e o ZIP de download foram atualizados.

Para atualizar, encerre o servidor anterior com Ctrl+C, extraia o novo ZIP em outra pasta e execute npm run preview nessa nova pasta. Recarregue o navegador com Ctrl+F5.
