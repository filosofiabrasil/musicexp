# PANDEIRO.APP — três aplicativos de prática

Projeto React Native / Expo SDK 54 com três telas independentes e uma sessão compartilhada:

1. **Roda do tempo:** símbolos por golpe, cursor e pulso sincronizados com a reprodução.
2. **Barras no tempo:** altura por timbre; contorno prata esperado, preenchimento branco tocado dentro da tolerância, laranja no ataque. Um × indica timbre diferente; ponto abaixo marca ataque fora da tolerância.
3. **Precisão:** erro `1000 × (t − nominal)` em ms; pontos sobem e ficam laranja dentro da tolerância, inicialmente ±15 ms.

Não há eventos de aluno simulados. Os golpes vêm dos pads, teclado ou captura de microfone.

## Executar

Use Node.js 20.19+ ou 22 LTS e npm.

```sh
npm install
npm run typecheck
npm test
npm run web
```

O navegador abre em `http://localhost:8081`. Escolha um ritmo, ajuste o BPM e inicie. Os três modos compartilham os golpes e as métricas. Alterar ritmo, BPM, subdivisão ou som reinicia a sessão; pausar e retomar preserva o treino.

No teclado: **A** grave/polegar, **S** dedos, **D** tapa, **F** punho. Golpes adicionais: G abafado, H tapa de polegar, J grave de dedos, K médio, L rulo. Espaço inicia/pausa quando o foco está fora de um controle.

### Android / iPhone

Para visualizar e usar os pads no Expo Go:

```sh
npm start -- --go
```

Para o **microfone com PCM ao vivo**, use um development build com o módulo nativo `@siteed/audio-studio`:

```sh
npm run android:build
# ou, no macOS com Xcode:
npm run ios:build
```

É necessário o ambiente de desenvolvimento Android/iOS correspondente. `eas.json` também prepara perfis development, preview e production; nenhuma compilação remota ou publicação foi feita. A exportação de bundles não é um APK/IPA e não comprova funcionamento em hardware.

## Microfone experimental

Selecione **Microfone**, autorize a captura e use fones. O pandeiro guia e o clique são desligados ao ativá-lo para evitar que o alto-falante seja interpretado como a mão do aluno. O clique pode ser ligado novamente com fones.

O detector usa envelope de 2 ms, limiar adaptativo de energia e janela de timbre de 40 ms. O classificador compara características espectrais com 43 golpes isolados fornecidos no pacote, em nove classes. Ataques ambíguos ou distantes das referências são rejeitados; o contador mostra esses casos.

Para calibrar, clique na letra de um golpe no painel, toque três ataques isolados e clique na letra novamente para concluir. Repita para os golpes usados pelo ritmo. A calibração pausa o treino, guarda até oito exemplos por classe e vale somente nesta sessão. Não há envio de áudio para servidor nem gravação persistente pelo app.

A compensação manual do microfone, de −200 a +200 ms, desconta o atraso fixo configurado. Não há calibração automática de latência nem garantia de precisão de 15 ms no hardware. O timbre de pandeiros, a sala e o microfone afetam o reconhecimento. Rulos, golpes sobrepostos e execuções separadas por menos de 65 ms podem ser agrupados. É um protótipo utilizável para validação, sem taxa de acerto medida com alunos ou celulares físicos.

Na web a captura requer HTTPS ou localhost e AudioWorklet. Android/iOS usam o adaptador nativo; o Expo Go mostra uma explicação e mantém a entrada por toque. A captura para ao voltar para Toque, sair do aplicativo ou desmontar a tela.

## Ritmos e sons

- `src/data/ritmos.source.js`: cópia preservada do `ritmos.js` anexado, com 148 ritmos e suas fontes.
- `src/data/ritmos-PADBT.json`: cópia preservada dos 75 ritmos do segundo anexo; disponível como filtro da biblioteca.
- `src/data/rhythms.json`: catálogo derivado, sem substituir os padrões reais pelos exemplos da demo anterior.
- Ciclos variáveis de 6 a 32 posições, incluindo 7, 9 e 10; `.` é pausa. Os nove símbolos são P, A, D, B, T, X, Q, M e R.
- A subdivisão explícita dos anexos tem prioridade. Fusas e algumas grades de colcheias são obtidas da descrição; os demais casos usam 4 passos por tempo. O painel **Grade e fontes** identifica a origem e permite ajustar 2/3/4/6/8 passos por tempo. Não se deduz a subdivisão apenas pelo comprimento do ciclo.
- `assets/samples/`: 44 arquivos originais; o arquivo longo `a.m4a` não entra no treino. Os outros 43 geram referências de timbre.
- `assets/kit/` e `src/data/kit.json`: nove WAVs e PCM, recortados e normalizados a partir dos sons fornecidos, sem alterar o timbre por variação de BPM.

Regerar o catálogo: `npm run import:rhythms`. Regerar kit e referências: `npm run build:kit` (exige FFmpeg no PATH). Os dados derivados já estão no projeto; FFmpeg não é necessário para executar o app.

## Código e integração

```text
App.tsx                        telas, biblioteca e controles
src/pandeiro-ui-base/           HitBars, TimingScatter, RhythmRing, tipos e useClock
src/audio/AudioEngine.ts        reprodução nativa com expo-audio
src/audio/AudioEngine.web.ts    reprodução contínua na web com Web Audio
src/audio/mixCycle.ts           mixagem de um ciclo em PCM
src/audio/timing.ts             grade, posição no ciclo e métricas
src/audio/dsp.ts                ataques, características e classificação
src/audio/microphone.web.ts     captura via AudioWorklet
src/audio/microphone.ts         captura PCM no development build
src/hooks/usePractice.ts        sessão, entrada dos golpes e calibração
tests/                         testes de áudio, tempo, biblioteca e interações
docs/VALIDACAO.md               verificações realizadas e limites
```

As posições dos samples são agendadas nos próprios frames. Na web, o motor usa `AudioBufferSourceNode` com repetição contínua e relógio `AudioContext.currentTime`, evitando a pausa que o player HTML introduzia entre voltas. No Android/iOS, o motor gera um WAV por ciclo e usa `expo-audio` com `AudioPlayer.currentTime`. O RAF apenas atualiza a tela. Os pads são pré-carregados e registram o primeiro contato; o navegador usa atraso de press-in igual a zero.

Um reconhecedor externo pode alimentar o mesmo contrato:

```ts
type DetectedHit = {
  t: number;        // segundos no relógio da reprodução, com compensação aplicada
  nominal: number;  // posição correspondente na grade desse mesmo relógio
  kind: Kind;      // grave | dedos | tapa | punho, ou uma das cinco extensões
  source?: 'touch' | 'mic';
  confidence?: number;
};
```

Os acertos exigem a combinação de posição, timbre e tolerância. Cada posição pontua uma vez; pausas, repetições e timbres diferentes não aumentam o resultado. O erro médio, o desvio e a tendência usam todos os golpes registrados. O denominador considera posições já transcorridas.

### Testes de navegador

```sh
npx playwright install chromium
npm run test:browser
```

O teste abre o servidor automaticamente quando necessário. Para incluir o teste com áudio no microfone virtual do Chromium, em Linux/macOS:

```sh
python tools/mic-fixture.py
PANDEIRO_MIC_WAV="$PWD/.test-fixtures/microphone-fixture.wav" npm run test:browser
```

No PowerShell, defina `$env:PANDEIRO_MIC_WAV` com o caminho absoluto antes de executar o teste. O WAV alimenta o dispositivo de captura virtual; os eventos de golpe são produzidos pelo detector real do app. É um teste de integração, sem equivalência a uma avaliação acústica em um celular.

Exportar as três plataformas: `npx expo export --platform all`. Para testar a versão já exportada sem instalar dependências, execute `npm run preview` e abra `http://localhost:8080`.

A pasta `preview-web/` contém uma exportação web estática: sirva por HTTP, por exemplo com `python -m http.server 8080 --directory preview-web`, e acesse localhost. Abrir o HTML diretamente por `file://` não carrega o app.

Paleta e fontes seguem os arquivos fornecidos: preto, marfim, laranja `#F36915`, prata; verde e amarelo apenas na notação da roda. Os samples e ritmos são os materiais fornecidos pelo usuário. Fontes e bibliotecas mantêm as licenças dos respectivos pacotes.
