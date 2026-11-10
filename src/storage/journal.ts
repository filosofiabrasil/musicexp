import * as FileSystem from "expo-file-system/legacy";
import { journalFiles } from "./journalFiles";
const path = () => {
  if (!FileSystem.documentDirectory)
    throw new Error("Armazenamento local indisponível.");
  return FileSystem.documentDirectory + "pandeiro-study-journal-v1.json";
};
export async function readJournal() {
  return store().read();
}
export async function writeJournal(raw: string) {
  await store().write(raw);
}
const store = () =>
  journalFiles(
    {
      read: async (uri) =>
        (await FileSystem.getInfoAsync(uri)).exists
          ? FileSystem.readAsStringAsync(uri)
          : null,
      write: (uri, content) => FileSystem.writeAsStringAsync(uri, content),
      move: (from, to) => FileSystem.moveAsync({ from, to }),
      remove: (uri) => FileSystem.deleteAsync(uri, { idempotent: true }),
    },
    path(),
  );
