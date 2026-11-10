const KEY = "pandeiro.study.journal.v1";
export async function readJournal() {
  return localStorage.getItem(KEY);
}
export async function writeJournal(raw: string) {
  localStorage.setItem(KEY, raw);
}
