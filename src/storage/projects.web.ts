const key = "pandeiro.study.projects.v1";
export async function readProjects() {
  return localStorage.getItem(key);
}
export async function writeProjects(raw: string) {
  localStorage.setItem(key, raw);
}
