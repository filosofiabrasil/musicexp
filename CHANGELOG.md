# Alterações

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
