import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { ETUDES } from '../music/etudes';
import { Rhythm, THEME as T } from '../pandeiro-ui-base/types';
import { readPathProgress, writePathProgress } from '../storage/pathProgress';
import { Button, Label, fonts } from './ui';

const levels = [
  { name: '01 · Fundamentos', lessons: [
    { id: 'pulse', title: 'Pulso e ressonância', study: 0, task: 'Toque o grave em cada pulso e escute o som entre os ataques.', done: 'Complete três ciclos mantendo o pulso e perceba a ressonância.' },
    { id: 'alternation', title: 'Alternância de articulações', study: 1, task: 'Alterne polegar, dedos e base da mão lentamente.', done: 'Complete três ciclos e escute a diferença entre os golpes.' },
    { id: 'rests', title: 'Pausas', study: 7, task: 'Conte as unidades silenciosas sem interromper a pulsação.', done: 'Complete três ciclos lembrando que pausa não corta o som anterior.' },
  ]},
  { name: '02 · Coordenação', lessons: [
    { id: 'subdivision', title: 'Subdivisão em três', study: 3, task: 'Divida cada pulso em três partes iguais; comece devagar.', done: 'Complete três ciclos mantendo as três partes regulares.' },
    { id: 'accent', title: 'Acentos deslocados', study: 2, task: 'Destaque a quarta subdivisão de cada tempo sem acelerar.', done: 'Complete três ciclos e ouça a posição dos acentos.' },
    { id: 'compound', title: 'Métrica composta', study: 6, task: 'Conte dois grupos de três colcheias no 6/8.', done: 'Conte os dois grupos e toque três ciclos.' },
    { id: 'additive', title: 'Agrupamento 2+2+3', study: 5, task: 'Conte os grupos antes de tocar o padrão.', done: 'Toque três ciclos sem perder o início de cada grupo.' },
  ]},
  { name: '03 · Controle', lessons: [
    { id: 'dynamics', title: 'Contraste de dinâmica', study: 1, task: 'Toque um ciclo suave e outro forte, conservando o andamento.', done: 'Repita a alternância e ouça uma diferença clara de intensidade.' },
    { id: 'muted', title: 'Aberto e abafado', study: 0, task: 'Alterne o grave aberto com o abafado no mesmo pulso; escute a duração de cada som.', done: 'Execute três ciclos alternando os dois sons e perceba o contraste.' },
  ]},
  { name: '04 · Criação', lessons: [
    { id: 'variation', title: 'Variação controlada', study: 1, task: 'Depois de aprender o padrão, altere uma unidade no editor e compare as duas versões.', done: 'Toque a versão original e sua variação, mantendo o ciclo.' },
    { id: 'improv', title: 'Pergunta e resposta', study: 0, task: 'Ouça um ciclo de graves e responda com uma frase usando dois golpes.', done: 'Crie e repita sua resposta; observe como ela termina no ciclo.' },
  ]},
];
const ids = new Set(levels.flatMap(l => l.lessons.map(x => x.id)));
export function LearningPath({onChoose}: {onChoose: (rhythm: Rhythm) => void}) {
  const [completed, setCompleted] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const current = useRef<string[]>([]);
  const queue = useRef(Promise.resolve());
  useEffect(() => { let active = true; readPathProgress().then(raw => {
    const value: unknown = raw === null ? [] : JSON.parse(raw);
    if (!Array.isArray(value) || value.some(x => typeof x !== 'string')) throw new Error('Dados inválidos');
    if (active) { current.current = value; setCompleted(value); setLoaded(true); }
  }).catch(() => { if (active) setError('Não foi possível abrir o progresso. Os dados existentes foram preservados.'); }); return () => { active = false; }; }, []);
  function toggle(id: string) {
    const job = queue.current.then(async () => {
      const next = current.current.includes(id) ? current.current.filter(x => x !== id) : [...current.current, id];
      await writePathProgress(JSON.stringify(next)); current.current = next; setCompleted(next); setError('');
    });
    queue.current = job.catch(() => { setError('Não foi possível salvar o progresso. Tente novamente.'); });
  }
  return <View style={{gap: 18}}>
    <Label orange>PERCURSO GUIADO · {completed.filter(id => ids.has(id)).length}/{ids.size} ETAPAS</Label>
    <Text style={{color:T.ivory, fontFamily:fonts.serif, fontSize:30}}>Da pulsação à criação.</Text>
    <Text style={{color:T.muted, fontFamily:fonts.text, fontSize:14, lineHeight:22}}>Escolha uma etapa, abra o estudo e pratique no seu andamento. Depois, marque sua conclusão pela escuta e observação. Você pode voltar ou desmarcar a qualquer momento.</Text>
    {!!error && <Text accessibilityRole="alert" style={{color:T.orange}}>{error}</Text>}
    {levels.map(level => <View key={level.name} style={{gap:12}}><Label orange>{level.name}</Label>
      {level.lessons.map(lesson => <View key={lesson.id} style={{padding:18, gap:9, borderWidth:1, borderColor:T.line, backgroundColor:T.panel, borderRadius:5}}>
        <Text style={{color:T.ivory, fontFamily:fonts.serif, fontSize:23}}>{lesson.title}</Text>
        <Text style={{color:T.muted, fontFamily:fonts.text, lineHeight:22}}>{lesson.task}</Text>
        <Text style={{color:T.silver, fontFamily:fonts.text, lineHeight:22}}>Para concluir: {lesson.done}</Text>
        <View style={{flexDirection:'row', flexWrap:'wrap', gap:8}}>
          <Button label={`Praticar etapa ${lesson.title}`} onPress={() => onChoose(lesson.id === 'muted' ? {...ETUDES[0], id: 'path-muted', name: 'Aberto e abafado', sequence: 'P...A...P...A...'} : ETUDES[lesson.study])}>Abrir na prática →</Button>
          <Button disabled={!loaded} active={completed.includes(lesson.id)} label={`${completed.includes(lesson.id) ? 'Desmarcar' : 'Concluir'} etapa ${lesson.title}`} onPress={() => toggle(lesson.id)}>{completed.includes(lesson.id) ? '✓ Concluída · desfazer' : 'Marcar como concluída'}</Button>
        </View>
      </View>)}
    </View>)}
  </View>;
}
