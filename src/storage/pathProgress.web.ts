const key = 'pandeiro.path.progress.v1';
export async function readPathProgress() { return localStorage.getItem(key); }
export async function writePathProgress(raw: string) { localStorage.setItem(key, raw); }
