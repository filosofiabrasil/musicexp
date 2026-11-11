import * as FileSystem from 'expo-file-system/legacy';
import { journalFiles } from './journalFiles';
function store() {
  if (!FileSystem.documentDirectory) throw new Error('Armazenamento indisponível');
  return journalFiles({
    read: async uri => (await FileSystem.getInfoAsync(uri)).exists ? FileSystem.readAsStringAsync(uri) : null,
    write: (uri, content) => FileSystem.writeAsStringAsync(uri, content),
    move: (from, to) => FileSystem.moveAsync({from, to}),
    remove: uri => FileSystem.deleteAsync(uri, {idempotent: true}),
  }, FileSystem.documentDirectory + 'pandeiro-path-progress-v1.json');
}
export async function readPathProgress() { return store().read(); }
export async function writePathProgress(raw: string) { await store().write(raw); }
