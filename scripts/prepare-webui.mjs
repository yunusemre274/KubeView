import { cp, mkdir, readdir, rm, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const source = fileURLToPath(new URL('../frontend/dist/', import.meta.url));
const target = fileURLToPath(new URL('../backend/internal/webui/dist/', import.meta.url));
await access(`${source}/index.html`);
await mkdir(target, { recursive: true });
for (const name of await readdir(target)) {
  if (name !== 'README.txt') await rm(`${target}/${name}`, { recursive: true, force: true });
}
await cp(source, target, { recursive: true });
console.log('Production frontend prepared for Go embed.');
