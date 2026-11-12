# PANDEIRO.APP — Ler, investigar, comparar

Laboratório de estudo do pandeiro em React Native / Expo SDK 54. A versão **1.3.0** conecta leitura, escuta e prática: formule uma pergunta, prepare uma escrita, execute uma tomada de duração conhecida e compare as condições e os resultados.

A tela inicial abre um estudo original em 4/4. A biblioteca conserva os 148 ritmos e suas referências; o atlas organiza 43 gravações em nove famílias. Os oito estudos técnicos são propostas originais do projeto, sem atribuição a compositores ou métodos externos.

## Abrir o pacote pronto

Instale Node.js LTS, extraia o ZIP e abra um terminal na pasta que contém `package.json`:

```sh
npm run preview
```

Acesse **http://localhost:8080**. A preview incluída funciona sem instalar dependências. Deixe o terminal aberto; Ctrl+C encerra. Para atualizar, encerre o servidor anterior, extraia em outra pasta e recarregue com Ctrl+F5. Confira **v1.3.0** no rodapé.

## Um primeiro estudo

1. Na Prática, leia a alternância P–D–B–D. Ouça posições individuais e confira o significado das letras no atlas.
2. Escreva uma pergunta, por exemplo: “O intervalo entre D e B permanece regular quando o clique some?”.
3. Escolha **Tomada de 4 ciclos**, um andamento confortável e a entrada por pads/teclado ou microfone. Inicie; quatro semínimas de preparação antecedem a execução.
4. Ao terminar, registre o resumo no caderno. Escreva o que percebeu por escuta antes de interpretar apenas os números.
5. Reinicie e repita mantendo os parâmetros. Selecione as duas tomadas no caderno para comparar.
6. Depois experimente **Memória de pulso**: guia no primeiro ciclo e clique nos dois primeiros, quando ligados. Os dois últimos ciclos não recebem novos ataques de referência.

O [guia de estudo](docs/GUIA_DE_ESTUDO.md) desenvolve esse protocolo e os limites de interpretação das medidas.

## Roda e frases — Cadeira vazia e Dominó

Na aba **Roda e frases**, a Cadeira vazia oferece surdo a 84 BPM ou surdo, agogô e reco-reco a 92 BPM. O pandeiro fica desligado por padrão: ocupe esse lugar com seu instrumento e ative o modelo quando quiser comparar. Escolha 4, 8, 16 ou 32 pulsos, ajuste os níveis, a preparação e o clique.

No **Dominó de frases**, adicione levadas, viradas, breques e finais; mova peças, repita ou remova. A montagem aceita até 12 peças e 64 pulsos. Cada peça mostra sua extensão, incluindo finais de seis pulsos. Alterar a base abre uma sequência inicial compatível com o novo andamento. Desligue o modelo para tocar sua própria versão sobre o acompanhamento.

Preparação, acompanhamento, modelo e clique usam um único buffer finito. Pausar conserva a posição; Voltar ao início reinicia. Sair da sala interrompe a reprodução. **Salvar montagem** conserva uma montagem local; **Abrir salva** recupera. Exporte o roteiro JSON para guardar versões e o WAV para ouvir a composição. O WAV contém as referências escolhidas, sem gravação ao vivo do aluno. A sala não atribui pontuação de golpes nem inventa uma partitura para as gravações.

O banco inicial contém 14 trechos alinhados dos anexos, com contagens ACID e origem rastreável em `src/data/ensemble.json`. Reprodução e exportação usam PCM mono de 16 bits a 44,1 kHz; os derivados de origem eram 24 bits. Esta seleção exclui contagens estimadas e a virada ambígua. Os ataques internos e a interpretação continuam sendo os das gravações. Não há alteração livre de BPM nesta sala: as bases disponíveis são 84 e 92.

## Leitura e contagem

A leitura usa **uma pauta de percussão com três linhas**, figuras de duração, pausas, clave, compassos e quiálteras. Graves e abafados ficam embaixo, punho no centro e dedos e tapas acima. As letras distinguem as articulações que compartilham a mesma linha. Uma legenda explicita esse mapa. Essas posições identificam golpes; não representam alturas afinadas. O **Mapa de articulações** continua disponível como grade separada.

O exemplo `ADBDPDBD`, com quatro unidades por semínima, contém **oito semicolcheias = duas semínimas**. Ao escolher 2/4, a tela mostra um compasso com dois tempos; cada tempo conta suas quatro subdivisões:

```text
Compasso 1    tempo 1             tempo 2
Subdivisão    1  2  3  4          1  2  3  4
Articulação   A  D  B  D          P  D  B  D
Índice        01 02 03 04         05 06 07 08
```

Os índices 01… servem à edição e aos recortes. Eles não são tempos. A coordenada de inspeção informa semínima e subdivisão explicitamente, sem a antiga abreviação `1+1/4`.

Em 2/4, 3/4 e 4/4, os tempos reiniciam em cada compasso. Em 6/8, 9/8 e 12/8, a contagem destaca pulsos de semínima pontuada. Em 7/8, os grupos são identificados, inclusive a escolha 2+2+3. Sem fórmula declarada, aparecem semínimas consecutivas do ciclo. A fórmula de estudo é uma escolha explícita, com opções limitadas às extensões e grupos representáveis na grade; o app não deduz a métrica só pelo nome do ritmo.

As travessas quebram em pausas, compassos e fronteiras de quiálteras. Quiálteras incompletas são identificadas. A escrita representa os eventos da grade: cada letra inicia um ataque e cada ponto representa ausência de um novo ataque. As pausas desenhadas não executam abafamento nem cortam a ressonância do áudio. O modelo não edita livremente durações sustentadas, ligaduras, polifonia ou repertório MusicXML.

A pauta apresenta três linhas para as articulações e usa X para os tapas. Ciclos longos são divididos em sistemas de até 16 unidades para manter a leitura e a contagem legíveis.

## Andamento e referências

O campo BPM refere-se sempre à **semínima**:

| Unidades por semínima | Valor da unidade            |
| --------------------- | --------------------------- |
| 2                     | Colcheia                    |
| 3                     | Colcheia em tercina 3:2     |
| 4                     | Semicolcheia                |
| 6                     | Semicolcheia em sextina 6:4 |
| 8                     | Fusa                        |

`duração da unidade = 60 / BPM / subdivisão`.

Em 6/8, seis colcheias somam três semínimas, organizadas em dois pulsos compostos. A 100 BPM de semínima, o pulso de semínima pontuada ocorre a aproximadamente 66,7 por minuto; a interface mostra essa conversão.

O clique pode marcar semínimas, cada unidade da grade ou os grupos escolhidos. Em ciclos fracionários, a semínima continua através das voltas. Na exploração livre, o buffer fecha simultaneamente o ciclo e a fase do clique quando necessário; não usa reinício de mídia HTML a cada volta.

| Programa           | Preparação     | Corpo da tomada                                                                                  |
| ------------------ | -------------- | ------------------------------------------------------------------------------------------------ |
| Exploração livre   | Sem preparação | Repetição contínua                                                                               |
| Tomada de 4 ciclos | 4 semínimas    | 4 ciclos, referências conforme os controles                                                      |
| Memória de pulso   | 4 semínimas    | Guia ligado no ciclo 1; clique ligado nos ciclos 1–2; ciclos 3–4 sem novos ataques de referência |

A preparação não registra golpes. Os programas finitos encerram no próprio buffer de áudio. A frase escrita no objetivo e o programa usado acompanham o registro. No microfone, o guia é desligado e o clique é ativado; use fones para reduzir vazamento. Caudas de samples podem continuar ressoando após o último ataque de referência. Nos dois últimos ciclos de Memória, o cursor, os contadores e os resultados parciais ficam ocultos, mantendo o registro dos golpes para o final.

## Escrever e conservar variações

Em **Estudos e escrita**, use um dos oito estudos, traga a escrita atual ou escreva de 1 a 32 unidades. É possível pintar articulações/pausas, alternar acentos com a ferramenta `>`, girar o ciclo uma unidade, escolher subdivisão, grupos e compasso.

**Aplicar** envia a escrita para a prática. **Salvar escrita** conserva uma definição na biblioteca pessoal, com até 30 entradas. Salvar novamente uma definição idêntica não duplica; acentos, métrica ou nomes diferentes formam outras versões. Os rascunhos ainda não salvos permanecem apenas durante a sessão aberta. Ao editar o texto da sequência, os acentos são limpos para evitar posições órfãs.

A biblioteca pessoal permite reabrir, praticar, remover/desfazer e exportar JSON. Usa armazenamento local; não há sincronização em nuvem ou importador nesta versão. Falhas de leitura bloqueiam a sobrescrita e permitem exportar o conteúdo preservado. Falhas de espaço conservam o editor e os registros existentes.

## Atlas e escuta

| Código    | Articulação do catálogo                                                |
| --------- | ---------------------------------------------------------------------- |
| P / A / Q | Grave solto de polegar / grave abafado / grave de dedos                |
| D / B     | Pontas dos dedos / base da mão, chamada punho no app                   |
| T / X     | Tapa de mão / tapa de polegar                                          |
| M         | Médio, rótulo dos arquivos MEDIO; identificação técnica a confirmar    |
| R         | Rulo gravado; textura, sem avaliação de regularidade do rulo executado |

Os 43 M4A originais isolados permanecem em `assets/samples/`. O clipe longo não identificado `a.m4a` foi retirado da distribuição; permanece no anexo original do usuário. As variantes de reprodução são mono em 44,1 kHz, com silêncio inicial recortado, pico de referência 0,8 e fade final de 12 ms. As caudas não são limitadas a 500 ms. Metadados estão em `src/data/sound-catalog.json`.

Os níveis p/mp/mf/f e os acentos alteram ganhos relativos do guia; não são camadas acústicas gravadas nem medidas em dB SPL. O volume de saída pode mudar sem zerar a tomada; a configuração exportada registra seu estado final.

O **Laboratório de escuta** oferece quatro pares: P/A, D/B, T/X e D/Q. Primeiro ouça referências identificadas; depois reconheça um arquivo oculto sorteado entre gravações do par. É necessário ouvir antes de responder e cada pergunta pontua uma vez. A revelação permite conferir o arquivo. Esse resultado mede identificação de referências, sem avaliar a execução física do instrumento. Os resultados da rodada não são persistidos.

## Caderno e dados

O caderno guarda até 50 **resumos**, condições de estudo e observações. Os eventos individuais de tomadas antigas não são armazenados: exporte a tomada atual antes de mudar sua configuração.

- JSON: escrita original, recorte, objetivo, programa, métrica, configuração final, fontes, resumo e golpes.
- CSV: um golpe por linha, com t/nominal em segundos, erro em ms, código esperado/tocado, origem, índice heurístico, taxas, ciclo e índice da unidade original. UTF-8 e vírgula, com aspas conforme RFC 4180; no Excel, importe escolhendo UTF-8 e separador vírgula.
- CSV, JSON e resumo usam o mesmo identificador. Salvar novamente atualiza a mesma tomada.
- A comparação de duas tomadas mostra erro médio absoluto, dispersão, viés, posições corretas e quantidade de golpes. Diferenças de escrita, andamento, entrada, ganho ou referências são explicitadas; números de protocolos diferentes não isolam uma mudança de desempenho.
- Remoções podem ser desfeitas. Arquivos nativos usam gravação temporária e cópia anterior; conteúdo ilegível é preservado para recuperação. Exportações nativas compartilham arquivos de cache via expo-sharing.

A associação temporal usa a unidade mais próxima. Acertos exigem articulação e tempo dentro da janela, uma vez por posição concluída. MAE, média com sinal e desvio-padrão populacional incluem todos os golpes registrados. Diagnósticos podem se sobrepor. As medidas descrevem ajuste local à grade; não reconhecem um deslocamento inteiro de frase ou avaliam interpretação artística.

## Microfone

O detector/classificador é experimental: envelope de 2 ms, janela de timbre de 40 ms, intervalo mínimo entre ataques de 65 ms e referências espectrais em 16 kHz. A taxa efetiva da captura aparece no painel e na exportação; o índice de semelhança é heurístico, sem interpretação de probabilidade calibrada.

Na web, use HTTPS ou localhost com AudioWorklet. No celular, a captura requer development build. Para calibrar: selecione Microfone, abra **Grade, fontes e calibração**, escolha a letra, toque três ataques isolados e selecione a mesma letra novamente. Até oito exemplos por classe ficam na sessão. Use fones; a pré-escuta fica desativada durante a captura.

A compensação manual desconta um atraso fixo e inicia outra tomada ao mudar. Não foram medidas latência ponta a ponta ou taxa de reconhecimento em alunos; rulos, ataques sobrepostos e diferenças de instrumento/sala exigem ensaio físico. A tolerância configurada não certifica resolução física de ±15 ms. Confira os [testes e limites](docs/VALIDACAO.md).

## Desenvolvimento

Node.js 20.19+ ou 22 LTS:

```sh
npm install
npm run typecheck
npm test
npm run web
```

Expo web: http://localhost:8081. Para pads no Expo Go: `npm start -- --go`. Microfone nativo: `npm run android:build`, ou `npm run ios:build` no macOS com Xcode. Exportar bundles não compila APK/IPA.

```sh
npx playwright install chromium
npm run test:browser
python tools/mic-fixture.py
PANDEIRO_MIC_WAV="$PWD/.test-fixtures/microphone-fixture.wav" npm run test:browser
```

No PowerShell, defina `$env:PANDEIRO_MIC_WAV` com o caminho absoluto. O WAV alimenta o dispositivo de captura virtual do Chromium; o detector real produz os eventos.

Regerar catálogos: `npm run import:rhythms`. Regerar análise e reprodução: `npm run build:sounds` (FFmpeg). Regerar os contornos: `python tools/build-glyphs.py` (fontTools). Os derivados já vêm no projeto; essas ferramentas não são necessárias para usar a preview. Exportar plataformas: `npx expo export --platform all`.

## Fontes e licenças

Catálogos originais: `src/data/ritmos.source.js` e `src/data/ritmos-PADBT.json`, preservados dos anexos. Referência sobre notação: GIANESELLA, Eduardo F. _O Uso Idiomático dos Instrumentos de Percussão Brasileiros: principais sistemas notacionais para o pandeiro brasileiro_. Música Hodie, v. 12, n. 2 (2012), p. 188–200, publicado em 2013. [Página editorial](https://revistas.ufg.br/musica/article/view/23359) e [artigo](https://revistas.ufg.br/musica/article/download/23359/13753/0). O artigo discute sistemas de Anunciação e Stasi e exemplifica o samba como oito semicolcheias em 2/4. A pauta de três linhas deste app usa posições próprias para as articulações; não reproduz aqueles sistemas ou partituras.

Os contornos Bravura e as fontes de interface têm licenças em `licenses/`; veja [materiais e dependências](THIRD_PARTY_NOTICES.md). As referências bibliográficas dos ritmos foram preservadas, sem conferência integral de cada obra citada. Não são distribuídos PDFs de métodos ou partituras protegidas.

Capturas: [prática](docs/images/pratica.png), [estudos](docs/images/estudos.png), [escuta](docs/images/escuta.png), [caderno](docs/images/caderno.png), [comparação](docs/images/comparacao.png) e [celular](docs/images/celular.png).

### Percurso guiado

Em **Estudos e escrita**, escolha uma das 11 etapas, abra o estudo na prática e marque sua conclusão. O progresso é salvo neste dispositivo e pode ser desmarcado. As etapas de dinâmica, abafamento e criação usam escuta e autoavaliação.
