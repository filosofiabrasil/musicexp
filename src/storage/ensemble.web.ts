const key = "pandeiro.ensemble.v1";
export async function readEnsemble() {
  return localStorage.getItem(key);
}
export async function writeEnsemble(raw: string) {
  localStorage.setItem(key, raw);
}
