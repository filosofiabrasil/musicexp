# Validação — 10 de novembro de 2026

## Executado neste ambiente

- `npm install`: concluído; `package-lock.json` incluído. Os módulos Expo Asset, Constants e Core foram fixados nas versões do SDK 54 para evitar resolução automática de peers de outro SDK.
- `npm run typecheck`: aprovado, TypeScript estrito.
- `npm test`: 10 testes aprovados. Cobrem os dois catálogos, subdivisões, ciclos irregulares, precisão na virada, pontuação sem duplicação, métricas, formato PCM/WAV, ataque atravessando buffers, silêncio, classificação dos nove samples do player e rejeição de empates.
- Chromium/Playwright: 5 testes aprovados. Reprodução por mais de um ciclo, pausa/retomada, teclado, pads, manutenção dos golpes entre as três telas, filtro PADBT, ciclos de 7/24/32 passos, alteração de BPM, largura de 390 px, permissão negada e captura de microfone.
- O teste de captura injeta um WAV dos samples no **dispositivo virtual de áudio do Chromium**. O AudioWorklet, o detector e o classificador do app processam o sinal. Não há injeção de eventos de golpe.
- Inspeção visual das três telas e do layout de celular; sem rolagem horizontal. Capturas finais sem erros de console ou JavaScript.
- `npx expo install --check`: versões compatíveis com o SDK.
- `npx expo config --type prebuild --json`: plugins de configuração avaliados.
- `npx expo export --platform all`: bundles web, Android e iOS gerados.

## Limites da validação

- Não foi compilado ou instalado um APK/IPA; não há Android SDK ou Xcode neste ambiente. A exportação de JavaScript/Hermes não compila o código Kotlin/Swift do módulo de microfone.
- O adaptador de captura nativa está implementado e configurado para development build, mas a compatibilidade em execução do módulo `@siteed/audio-studio` com cada dispositivo ainda precisa ser validada no hardware.
- Não foi medida a latência ponta a ponta nem uma taxa de reconhecimento de alunos. O ensaio com um WAV conhecido verifica a integração; ele não mede generalização para outro pandeiro, sala, microfone ou técnica.
- As métricas de ms refletem os timestamps e a compensação disponíveis. A tolerância de 15 ms é configurável, sem promessa de resolução física de 15 ms.
- A janela de classificação adiciona 40 ms; a entrega do buffer nativo pode adicionar mais atraso. O intervalo mínimo entre ataques é 65 ms. Rulos e sobreposição exigem validação adicional.
- Camadas progressivas e desafios de escada sugeridos nos documentos do pacote não fazem parte desta implementação das três visualizações.

## Conteúdo da entrega

O ZIP contém o projeto completo, fontes de dados preservadas, sons originais/derivados, testes, lockfile e uma versão web exportada para conferência local. Não inclui `node_modules`, caches, gravações de sessão, vídeos antigos, projetos Remotion ou builds assinados.
