const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'src/data/ritmos.source.js'), 'utf8'), sandbox, { timeout: 1000 });
const data = sandbox.window.PL_DATA;
const padbt = JSON.parse(fs.readFileSync(path.join(root, 'src/data/ritmos-PADBT.json'), 'utf8'));
const basic = new Map(padbt.ritmos.map(r => [r.id, r]));
const rhythms = data.groups.flatMap(group => Object.entries(group.items).map(([id, r]) => {
  if (!/^[PABDTXQMR.]{3,32}$/.test(r.p)) throw new Error('Padrão inválido: ' + id);
  const same = basic.get(id);
  if (same && same.golpes !== r.p) throw new Error('Bases divergentes: ' + id);
  let subdivision = r.sub || same?.sub || 4;
  let subdivisionSource = r.sub ? 'ritmos.js' : same?.sub ? 'ritmos-PADBT.json' : 'padrão de semicolcheias';
  if (!r.sub && !same && /fusas/i.test(r.d)) { subdivision = 8; subdivisionSource = 'descrição: fusas'; }
  if (!r.sub && !same && /3\/4 em colcheias/i.test(r.d)) { subdivision = 2; subdivisionSource = 'descrição: colcheias'; }
  if (!r.sub && !same && /12\/8 em colcheias/i.test(r.d)) { subdivision = 3; subdivisionSource = 'descrição: 12/8'; }
  return { id, name: r.n, sequence: r.p, group: group.name, groupId: group.id, description: r.d,
    subdivision, subdivisionSource, sources: r.src.map(s => data.sources[s]), confidence: r.conf, padbt: !!same };
}));
if (rhythms.length !== 148 || basic.size !== 75) throw new Error('Contagens inesperadas');
fs.writeFileSync(path.join(root, 'src/data/rhythms.json'), JSON.stringify(rhythms, null, 2) + '\n');
console.log(`Importados ${rhythms.length} ritmos; ${basic.size} no filtro PADBT.`);
