const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('C:/Users/ednei/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root = path.resolve(__dirname,'../../assets/imagens/questoes/3-ano/desafio-12/missao-1/ilustracoes-geradas');
(async () => {
  let originalBytes = 0,webBytes = 0;
  for (const file of (await fs.readdir(root)).filter(file => file.endsWith('.png'))) {
    const input = path.join(root,file),output = path.join(root,file.replace(/\.png$/,'.webp'));
    const metadata = await sharp(input).metadata(),statistics = await sharp(input).stats();
    if (!metadata.hasAlpha || statistics.isOpaque) throw new Error(`${file}: transparência ausente`);
    // Encode for the website without changing composition, size or generated alpha.
    await sharp(input).webp({quality:94,alphaQuality:100,effort:6}).toFile(output);
    const packaged = await sharp(output).metadata();
    if (!packaged.hasAlpha || metadata.width !== packaged.width || metadata.height !== packaged.height) throw new Error(`${file}: dimensão ou transparência alterada`);
    originalBytes += (await fs.stat(input)).size; webBytes += (await fs.stat(output)).size;
    console.log(`${file}: ${metadata.width} × ${metadata.height}, transparência preservada`);
  }
  console.log(`Originais: ${originalBytes} bytes; versões para o jogo: ${webBytes} bytes (${Math.round((1 - webBytes / originalBytes) * 100)}% menores).`);
})().catch(error => { console.error(error); process.exitCode = 1; });
