const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const root = __dirname;
const host = '0.0.0.0';
const port = Number(process.env.ORBITA_PORT || 8080);

const contentTypes = {
  '.html':'text/html; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.js':'text/javascript; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.png':'image/png',
  '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg',
  '.gif':'image/gif',
  '.svg':'image/svg+xml',
  '.webp':'image/webp',
  '.ico':'image/x-icon',
  '.mp3':'audio/mpeg',
  '.wav':'audio/wav',
  '.ogg':'audio/ogg',
  '.mp4':'video/mp4',
  '.webm':'video/webm'
};

function sendText(response,status,message) {
  response.writeHead(status,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'});
  response.end(message);
}

function resolveRequestPath(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl,'http://localhost').pathname);
  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/,'');
  const filePath = path.resolve(root,relativePath);
  const rootPrefix = `${path.resolve(root)}${path.sep}`;
  return filePath === path.resolve(root) || filePath.startsWith(rootPrefix) ? filePath : null;
}

function streamFile(request,response,filePath,stats) {
  const extension = path.extname(filePath).toLowerCase();
  const contentType = contentTypes[extension] || 'application/octet-stream';
  const range = request.headers.range;
  const headers = {
    'Content-Type':contentType,
    'Accept-Ranges':'bytes',
    'Cache-Control':extension === '.html' || extension === '.css' || extension === '.js'
      ? 'no-store'
      : 'public, max-age=3600'
  };

  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match) return sendText(response,416,'Intervalo inválido.');
    const start = match[1] ? Number(match[1]) : 0;
    const end = match[2] ? Math.min(Number(match[2]),stats.size - 1) : stats.size - 1;
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || start > end || start >= stats.size) {
      response.writeHead(416,{'Content-Range':`bytes */${stats.size}`});
      return response.end();
    }
    headers['Content-Range'] = `bytes ${start}-${end}/${stats.size}`;
    headers['Content-Length'] = end - start + 1;
    response.writeHead(206,headers);
    if (request.method === 'HEAD') return response.end();
    return fs.createReadStream(filePath,{start,end}).pipe(response);
  }

  headers['Content-Length'] = stats.size;
  response.writeHead(200,headers);
  if (request.method === 'HEAD') return response.end();
  fs.createReadStream(filePath).pipe(response);
}

const server = http.createServer((request,response) => {
  if (!['GET','HEAD'].includes(request.method)) return sendText(response,405,'Método não permitido.');
  let filePath;
  try {
    filePath = resolveRequestPath(request.url);
  } catch (_) {
    return sendText(response,400,'Endereço inválido.');
  }
  if (!filePath) return sendText(response,403,'Acesso negado.');

  fs.stat(filePath,(error,stats) => {
    if (error || !stats.isFile()) return sendText(response,404,'Arquivo não encontrado.');
    streamFile(request,response,filePath,stats);
  });
});

server.on('error',error => {
  if (error.code === 'EADDRINUSE') {
    console.error(`A porta ${port} já está sendo usada. Feche o outro servidor e tente novamente.`);
  } else {
    console.error('Não foi possível iniciar o servidor:',error.message);
  }
  process.exitCode = 1;
});

server.listen(port,host,() => {
  const addresses = [];
  for (const interfaces of Object.values(os.networkInterfaces())) {
    for (const address of interfaces || []) {
      if (address.family === 'IPv4' && !address.internal && !address.address.startsWith('169.254.')) {
        addresses.push(`http://${address.address}:${port}`);
      }
    }
  }
  console.log('');
  console.log('ÓRBITA disponível para acesso:');
  console.log(`No computador: http://localhost:${port}`);
  [...new Set(addresses)].forEach(address => console.log(`No celular:    ${address}`));
  console.log('');
  console.log('Mantenha esta janela aberta. Pressione Ctrl+C para encerrar.');
});

