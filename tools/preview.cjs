// Servidor local, sem dependências, para a exportação web incluída na entrega.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../preview-web');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.wav': 'audio/wav', '.ttf': 'font/ttf', '.png': 'image/png' };
if (!fs.existsSync(path.join(root, 'index.html'))) {
  console.error('A exportação web não está presente. Execute npm run web para abrir o projeto Expo.');
  process.exit(1);
}
http.createServer((request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (pathname === '/favicon.ico') { response.writeHead(204); response.end(); return; }
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      response.writeHead(404); response.end('Arquivo não encontrado.'); return;
    }
    response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Content-Length': fs.statSync(file).size });
    if (request.method === 'HEAD') response.end();
    else fs.createReadStream(file).pipe(response);
  } catch {
    response.writeHead(400); response.end('Requisição inválida.');
  }
}).listen(8080, '127.0.0.1', () => console.log('PANDEIRO.APP: http://localhost:8080 — Ctrl+C para encerrar.'));
