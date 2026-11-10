# Guia de estudo: leitura, escuta e comparação

Esta proposta organiza observação musical e registro de dados. Não é um currículo certificado, uma transcrição de repertório de concerto ou substituição de acompanhamento docente.

## 1. Definir uma pergunta

Escolha uma variável por tomada. Exemplos: o intervalo D–B se mantém regular? O grave abafado tem decaimento diferente do grave solto? O acento deslocado altera involuntariamente os ataques vizinhos? As pausas são lidas sem perder a referência da semínima?

Anote a pergunta no Caderno. Escolha uma gravação de referência no Atlas e mantenha-a durante a comparação.

## 2. Tornar a escrita explícita

O BPM usa a semínima. A grade define 2, 3, 4, 6 ou 8 unidades por semínima. O agrupamento organiza essas unidades; não determina sozinho uma fórmula de compasso.

No estudo 6/8, seis colcheias formam dois grupos de três. A 100 BPM de semínima, cada colcheia dura 0,3 s; cada grupo dura 0,9 s, equivalente a uma semínima pontuada a aproximadamente 66,67 pulsos por minuto. O ciclo inteiro dura 1,8 s.

No estudo 7/8 em 2+2+3, o mesmo andamento produz grupos de 0,6 s, 0,6 s e 0,9 s. Alterne Pulso e Grupos para ouvir a diferença, registrando tomadas separadas.

Para um ciclo de sete semicolcheias, a duração é 1,75 semínimas; o app não o declara automaticamente como um compasso específico. Com Pulso selecionado, a semínima atravessa as voltas do ciclo sem reiniciar.

## 3. Relacionar articulação e som

Use o Atlas para comparar P/A, D/Q e T/X. Observe ataque, ressonância e presença de platinelas. As letras representam articulações do catálogo; a posição vertical é categórica, sem altura afinada.

B significa base da mão, não o pulso anatômico. M preserva um rótulo de gravação sem identificação técnica definitiva. R é uma textura: ouvir um sample de rulo não equivale a avaliar a regularidade de um rulo executado.

As pausas da grade indicam ausência de novo ataque, não abafamento automático da pele. Para estudar interrupção da ressonância, defina essa intenção nas observações e avalie-a por escuta; a referência digital não executa uma técnica de abafamento adicional entre notas.

## 4. Construir tomadas comparáveis

1. Escolha um estudo, andamento confortável, amostra, recorte e referência de clique.
2. Ouça sem tocar. Identifique os grupos e as posições selecionadas na escrita.
3. Execute uma tomada e pause. Anote dificuldades percebidas antes de olhar apenas os números.
4. Registre o resumo. Exporte JSON/CSV se quiser guardar os eventos individuais.
5. Repita mantendo os parâmetros. Depois altere uma única variável e registre outra tomada.

Não interprete uma janela de 15 ms como padrão universal de qualidade artística. Ela é um critério operacional ajustável. Regularidade temporal, intenção de acento, controle de ressonância e adequação de timbre são dimensões distintas.

## 5. Interpretar as medidas

- Erro com sinal: positivo é atraso; negativo é adiantamento em relação à unidade atribuída.
- MAE: média dos valores absolutos dos erros.
- Viés: média com sinal; pode indicar tendência local de antecipação ou atraso.
- σ: dispersão populacional dos erros em torno da média.
- Acertos: posições já concluídas com pelo menos um golpe da articulação esperada e dentro da janela. Repetições não multiplicam pontos.

A associação à unidade mais próxima pode transformar um golpe muito deslocado em um evento de outra unidade. Não é um alinhador de frases. No microfone, as classificações também são hipóteses: rejeição ou timbre divergente pode ser falha da captura/classificador. Use observação externa antes de atribuir o desacordo ao estudante.

Os contadores de ausência, articulação divergente, erro temporal, golpe em pausa e repetição podem se sobrepor. Não some essas categorias para obter um total de erros.

## 6. Preservar os dados

O caderno guarda resumos, configuração e observações. Os eventos individuais só ficam na tomada atual e na exportação feita pelo estudante. Antes de mudar a escrita, recorte, amostra ou referência, exporte os dados que pretende analisar.

JSON e CSV compartilham o identificador da tomada. A configuração exportada representa o estado final; o volume de saída pode variar durante a execução. O CSV explicita semínimas/minuto, unidades por semínima, intervalos em segundos e erros em milissegundos. O índice de semelhança do microfone não é uma probabilidade calibrada.

Compare tomadas de mesma origem de entrada: teclado/pads e microfone possuem cadeias de latência diferentes. A captura no celular ainda exige calibração e validação físicas.

## Referência de notação

GIANESELLA, Eduardo F. _O Uso Idiomático dos Instrumentos de Percussão Brasileiros: principais sistemas notacionais para o pandeiro brasileiro_. Música Hodie, v. 12, 2012. https://revistas.ufg.br/musica/article/view/23359

A referência é apresentada para estudo dos sistemas notacionais. A grafia em três linhas e letras deste aplicativo é uma convenção própria, não uma edição ou reprodução das figuras do artigo.
