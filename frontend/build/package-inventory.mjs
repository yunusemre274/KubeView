// Build-time evidence only. This plugin does not transform any runtime code.
import { createHash } from 'node:crypto';
import { readFileSync, lstatSync, readdirSync, openSync, fstatSync, readSync, closeSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
export const INVENTORY_FILE = 'package-inventory.json';
const LIMIT = 4 << 20;
export const BUILD_INPUTS = ['package.json', 'package-lock.json', 'index.html', 'vite.config.js', 'build/package-inventory.mjs'];
const digest = value => createHash('sha256').update(value).digest('hex');
const inside = (root, file) => { const rel = path.relative(root, file); return rel !== '..' && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel); };
const validText = value => typeof value === 'string' && value.length > 0 && value.length <= 512 && !/[\x00-\x20\\:]/.test(value);
const readJSON = file => {
  const stat = lstatSync(file);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > LIMIT) throw Error('Package inventory input must be a bounded regular file');
  return JSON.parse(readFileSync(file, 'utf8'));
};

export function hashInventoryFile(file) {
  const expected = lstatSync(file);
  if (!expected.isFile() || expected.isSymbolicLink()) throw Error('Inventory input must be a real regular file');
  const fd = openSync(file, 'r'), hash = createHash('sha256'), buffer = Buffer.alloc(64 << 10);
  try {
    const actual = fstatSync(fd);
    if (!actual.isFile() || actual.dev !== expected.dev || actual.ino !== expected.ino) throw Error('Inventory input changed while opening');
    let n;
    while ((n = readSync(fd, buffer, 0, buffer.length, null)) > 0) hash.update(buffer.subarray(0, n));
    return hash.digest('hex');
  } finally { closeSync(fd); }
}
export function inventoryPublicInputs(root) {
  const result = Object.create(null), base = path.join(root, 'public');
  let info;
  try { info = lstatSync(base); } catch (error) { if (error.code === 'ENOENT') return result; throw error; }
  if (!info.isDirectory() || info.isSymbolicLink()) throw Error('Public input directory must be a real directory');
  const walk = (directory, relative = '') => {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const name = path.posix.join(relative, entry.name), file = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) throw Error('Public inventory symlink rejected');
      if (entry.isDirectory()) walk(file, name);
      else if (entry.isFile()) result[name] = hashInventoryFile(file);
      else throw Error('Public inventory special file rejected');
    }
  };
  walk(base); return result;
}
export function collectPackageInventory(root, bundle, build = { mode: 'production', reactProfile: false }) {
  root = path.resolve(root);
  const manifest = readJSON(path.join(root, 'package.json'));
  const lock = readJSON(path.join(root, 'package-lock.json'));
  if (lock.lockfileVersion !== 3 || !lock.packages || !manifest.name) throw Error('Expected npm v3 lock and named frontend package');
  const packages = new Map(), cache = new Map(), unresolved = [], firstParty = Object.create(null);
  const totals = { renderedModules: 0, localModules: 0, virtualModules: 0, unresolvedModules: 0 };
  const unknown = (id, chunk, reason) => {
    totals.unresolvedModules++;
    if (unresolved.length < 256) unresolved.push({ idHash: digest(id), chunk, reason });
  };
  const owner = id => {
    const filename = id.split('?')[0];
    if (!path.isAbsolute(filename)) return { category: 'virtual' };
    if (!filename.split(path.sep).includes('node_modules')) return inside(root, filename) ? { category: 'local' } : { category: 'unknown', reason: 'outside-frontend-root' };
    if (!inside(root, filename)) return { category: 'unknown', reason: 'outside-frontend-root' };
    let directory = path.dirname(filename);
    for (let depth = 0; depth < 64 && inside(root, directory); depth++, directory = path.dirname(directory)) {
      if (cache.has(directory)) return cache.get(directory);
      const file = path.join(directory, 'package.json');
      let data;
      try { data = readJSON(file); }
      catch (error) { if (error.code === 'ENOENT' || error.code === 'ENOTDIR') continue; return { category: 'unknown', reason: 'invalid-package-owner' }; }
      // Nested package.json files can declare only module type; keep walking
      // to the actual package owner rather than inventing an identity.
      if (!data.name || !data.version) continue;
      const relative = path.relative(root, directory).split(path.sep).join('/');
      const entry = lock.packages[relative];
      if (!relative.startsWith('node_modules/') || !entry || !validText(data.name) || !validText(data.version) || data.version !== entry.version) return { category: 'unknown', reason: 'package-lock-owner-mismatch' };
      const expected = entry.name || relative.slice(relative.lastIndexOf('node_modules/') + 'node_modules/'.length);
      if (data.name !== expected) return { category: 'unknown', reason: 'package-lock-name-mismatch' };
      const result = { category: 'package', name: data.name, version: data.version, lockPath: relative, id: `${data.name}@${data.version}` };
      cache.set(directory, result);
      return result;
    }
    return { category: 'unknown', reason: 'package-owner-not-found' };
  };
  const chunks = Object.create(null), outputs = Object.create(null);
  for (const [filename, chunk] of Object.entries(bundle).sort(([a], [b]) => a.localeCompare(b))) {
    if (path.posix.isAbsolute(filename) || filename.split('/').includes('..') || filename.includes('\\')) throw Error('Unsafe output chunk name');
    if (filename === INVENTORY_FILE) throw Error('Reserved inventory output name');
    if (chunk.type !== 'chunk' && chunk.type !== 'asset') throw Error('Unknown output type');
    outputs[filename] = digest(chunk.type === 'chunk' ? chunk.code : chunk.source);
    if (chunk.type !== 'chunk') continue;
    const ids = new Set();
    let count = 0;
    for (const [id, data] of Object.entries(chunk.modules || {})) {
      // Consumed first-party source is bound even if tree-shaken to zero code.
      // Unimported tests/docs never enter Rollup's consumed module list.
      const sourceFile = id.split('?')[0];
      if (!id.startsWith('\0') && path.isAbsolute(sourceFile) && inside(root, sourceFile) && !sourceFile.split(path.sep).includes('node_modules')) {
        firstParty[path.relative(root, sourceFile).split(path.sep).join('/')] = hashInventoryFile(sourceFile);
      }
      if (!(Number(data.renderedLength) > 0)) continue;
      totals.renderedModules++; count++;
      if (id.startsWith('\0') || id.startsWith('virtual:')) { totals.virtualModules++; continue; }
      const item = owner(id);
      if (item.category === 'virtual') totals.virtualModules++;
      else if (item.category === 'local') totals.localModules++;
      else if (item.category === 'unknown') unknown(id, filename, item.reason);
      else {
        if (!packages.has(item.id)) packages.set(item.id, { id: item.id, name: item.name, version: item.version, lockPaths: new Set() });
        packages.get(item.id).lockPaths.add(item.lockPath); ids.add(item.id);
      }
    }
    chunks[filename] = { sha256: digest(chunk.code), bytes: Buffer.byteLength(chunk.code), renderedModules: count, packages: [...ids].sort() };
  }
  if (!Object.keys(chunks).length || packages.size > 5000) throw Error('Missing or excessive emitted frontend package inventory');
  const publicInputs = inventoryPublicInputs(root);
  for (const [name, hash] of Object.entries(publicInputs)) {
    if (name === INVENTORY_FILE || outputs[name] && outputs[name] !== hash) throw Error('Conflicting public/output inventory path');
    outputs[name] = hash;
  }
  const value = { schemaVersion: 1, producer: 'kubeview-vite-package-inventory-v1',
    packageJSONSHA256: digest(readFileSync(path.join(root, 'package.json'))),
    lockSHA256: digest(readFileSync(path.join(root, 'package-lock.json'))),
    coverage: 'positive-rendered-JavaScript-module-package-ownership; consumed first-party/build/public inputs bound separately; not function reachability',
    build: { mode: String(build.mode), reactProfile: Boolean(build.reactProfile) },
    buildInputs: Object.fromEntries(BUILD_INPUTS.map(file => [file, hashInventoryFile(path.join(root, file))])),
    firstParty: Object.fromEntries(Object.entries(firstParty).sort(([a], [b]) => a.localeCompare(b))), publicInputs,
    outputs: Object.fromEntries(Object.entries(outputs).sort(([a], [b]) => a.localeCompare(b))),
    chunks, packages: [...packages.values()].map(item => ({ ...item, lockPaths: [...item.lockPaths].sort() })).sort((a, b) => a.id.localeCompare(b.id)),
    totals, unresolved, unresolvedListTruncated: totals.unresolvedModules > unresolved.length };
  if (Buffer.byteLength(JSON.stringify(value)) > LIMIT) throw Error('Frontend package inventory exceeds4MiB');
  return value;
}

export function packageInventory({ root = fileURLToPath(new URL('../', import.meta.url)) } = {}) {
  let build = { mode: 'production', reactProfile: process.env.VITE_REACT_PROFILE === '1' };
  return { name: 'kubeview-package-inventory', apply: 'build', enforce: 'post',
    configResolved(config) { build = { mode: config.mode, reactProfile: config.env?.VITE_REACT_PROFILE === '1' || process.env.VITE_REACT_PROFILE === '1' }; },
    // Vite's normal generateBundle hooks still rewrite preload URLs after
    // user plugins. Hook order (separate from Vite enforce) binds final bytes.
    generateBundle: { order: 'post', handler(_options, bundle) {
      this.emitFile({ type: 'asset', fileName: INVENTORY_FILE, source: JSON.stringify(collectPackageInventory(root, bundle, build), null, 2) + '\n' });
    } } };
}
