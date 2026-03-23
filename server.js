import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const PORT = process.env.PORT || 3000;
const ROOT = process.cwd();

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
};

const server = createServer(async (req, res) => {
  try {
    const reqPath = req.url === '/' ? '/index.html' : req.url;
    const safePath = normalize(reqPath).replace(/^\/+/, '');
    const fullPath = join(ROOT, safePath);
    const data = await readFile(fullPath);
    const type = MIME_TYPES[extname(fullPath)] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Snake server running at http://localhost:${PORT}`);
});
