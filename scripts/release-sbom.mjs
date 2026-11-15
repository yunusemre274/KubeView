// Public release inventory; Node/Go/npm are existing build prerequisites.
// These semantic checks do not replace full official CycloneDX schema QA.
import { createHash, randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync, lstatSync, mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { BUILD_INPUTS, hashInventoryFile, inventoryPublicInputs } from '../frontend/build/package-inventory.mjs';
export const MAX_JSON_BYTES = 2 << 20;
const MAX_COMPONENTS = 5000, SHA = /^[a-f0-9]{64}$/;
export const sha256 = value => createHash('sha256').update(value).digest('hex');
const fail = message => { throw Error(`Release SBOM: ${message}`); };
const text = (value, label, max = 512) => {
  if (typeof value !== 'string' || !value || value.length > max || /[\x00-\x1f\x7f\\]/.test(value)) fail(`invalid ${label}`);
  return value;
};
const publicAtom = (value, label) => {
  text(value, label);
  if (/\s|:\/\/|^file:|^\/|^[A-Za-z]:/.test(value)) fail(`non-public ${label}`);
  return value;
};
const property = (name, value) => ({ name: `kubeview:${name}`, value: String(value) });
const purl = (ecosystem, name, version) => `pkg:${ecosystem}/${name.split('/').map(encodeURIComponent).join('/')}@${encodeURIComponent(version)}`;
const boundedJSON = (data, label, limit = MAX_JSON_BYTES) => {
  const raw = Buffer.isBuffer(data) ? data.toString('utf8') : typeof data === 'string' ? data : JSON.stringify(data);
  if (Buffer.byteLength(raw) > limit) fail(`${label} exceeds JSON limit`);
  try { return JSON.parse(raw); } catch { fail(`invalid ${label} JSON`); }
};
const regularJSON = (file, limit = MAX_JSON_BYTES) => {
  const info = lstatSync(file);
  if (!info.isFile() || info.isSymbolicLink() || info.size > limit) fail('metadata must be a bounded regular file');
  return boundedJSON(readFileSync(file), 'metadata', limit);
};
function baseBom(component, lifecycle, now = new Date().toISOString()) {
  return { $schema: 'http://cyclonedx.org/schema/bom-1.5.schema.json', bomFormat: 'CycloneDX', specVersion: '1.5',
    serialNumber: `urn:uuid:${randomUUID()}`, version: 1,
    metadata: { timestamp: now, lifecycles: [{ phase: lifecycle }], tools: [{ vendor: 'KubeView', name: 'release-sbom', version: '1' }], component }, components: [], dependencies: [] };
}
export function validateBom(value) {
  const bom = boundedJSON(value, 'BOM');
  if (bom.bomFormat !== 'CycloneDX' || bom.specVersion !== '1.5' || !Array.isArray(bom.components) || bom.components.length > MAX_COMPONENTS || !Array.isArray(bom.dependencies)) fail('unsupported or excessive BOM');
  publicAtom(bom.metadata?.component?.name, 'root name'); publicAtom(bom.metadata?.component?.version, 'root version');
  const refs = new Set([publicAtom(bom.metadata?.component?.['bom-ref'], 'root reference')]);
  for (const component of bom.components) {
    const ref = publicAtom(component['bom-ref'], 'component reference');
    if (refs.has(ref)) fail('duplicate component reference');
    refs.add(ref); publicAtom(component.name, 'component name'); publicAtom(component.version, 'component version');
    if (component.purl && (!component.purl.startsWith('pkg:') || /[?#\s\\]/.test(component.purl))) fail('invalid public component PURL');
  }
  const seen = new Set();
  for (const edge of bom.dependencies) {
    if (!refs.has(edge.ref) || seen.has(edge.ref) || !Array.isArray(edge.dependsOn) || edge.dependsOn.some(ref => !refs.has(ref))) fail('invalid or dangling dependency reference');
    seen.add(edge.ref);
  }
  if (!seen.has(bom.metadata.component['bom-ref'])) fail('missing root dependency graph');
  return bom;
}

export function validateFrontendInventory({ root, frontendAssets }) {
  const file = path.join(root, 'frontend/dist/package-inventory.json');
  const inventory = regularJSON(file, 4 << 20);
  if (!inventory.outputs || typeof inventory.outputs !== 'object' || Array.isArray(inventory.outputs)) fail('missing frontend output binding');
  const emitted = Object.keys(frontendAssets).filter(name => name !== 'package-inventory.json').sort();
  if (JSON.stringify(Object.keys(inventory.outputs).sort()) !== JSON.stringify(emitted)) fail('frontend output set changed');
  if (emitted.some(name => !SHA.test(inventory.outputs[name]) || inventory.outputs[name] !== frontendAssets[name])) fail('frontend output digest changed');
  const lock = regularJSON(path.join(root, 'frontend/package-lock.json'));
  const packageJSONSHA256 = sha256(readFileSync(path.join(root, 'frontend/package.json')));
  const lockSHA256 = sha256(readFileSync(path.join(root, 'frontend/package-lock.json')));
  if (!Number.isInteger(inventory.totals?.renderedModules) || inventory.totals.renderedModules < 1
    || !Number.isInteger(inventory.totals?.localModules) || inventory.totals.localModules < 0
    || !Number.isInteger(inventory.totals?.virtualModules) || inventory.totals.virtualModules < 0
    || inventory.schemaVersion !== 1 || inventory.producer !== 'kubeview-vite-package-inventory-v1'
    || inventory.packageJSONSHA256 !== packageJSONSHA256 || inventory.lockSHA256 !== lockSHA256
    || inventory.totals?.unresolvedModules !== 0 || !Array.isArray(inventory.unresolved) || inventory.unresolved.length
    || !Array.isArray(inventory.packages) || !inventory.packages.length || inventory.packages.length > MAX_COMPONENTS) fail('missing, stale or unresolved frontend inventory');
  if (inventory.build?.mode !== 'production' || inventory.build?.reactProfile !== false) fail('prepared frontend is not a normal production build');
  const frontend = path.join(root, 'frontend');
  const compareFiles = (files, label) => {
    if (!files || typeof files !== 'object' || Array.isArray(files)) fail(`missing ${label} binding`);
    for (const [name, hash] of Object.entries(files)) {
      if (!name || path.posix.isAbsolute(name) || /^[A-Za-z]:|:\/\//.test(name) || name.includes('\\') || name.split('/').includes('..') || !SHA.test(hash)) fail(`unsafe ${label} binding`);
      if (hashInventoryFile(path.join(frontend, name)) !== hash) fail(`stale ${label} input`);
    }
  };
  if (JSON.stringify(Object.keys(inventory.buildInputs || {}).sort()) !== JSON.stringify([...BUILD_INPUTS].sort())) fail('build input set changed');
  compareFiles(inventory.buildInputs, 'build'); compareFiles(inventory.firstParty, 'consumed source');
  const publicNow = inventoryPublicInputs(frontend);
  if (JSON.stringify(publicNow) !== JSON.stringify(inventory.publicInputs)) fail('public input set/content changed');
  for (const [name, hash] of Object.entries(publicNow)) if (frontendAssets[name] !== hash) fail('copied public output differs from source');
  const expectedChunks = Object.keys(frontendAssets).filter(name => /\.(?:m?js)$/.test(name)).sort();
  if (JSON.stringify(Object.keys(inventory.chunks || {}).sort()) !== JSON.stringify(expectedChunks)) fail('frontend emitted chunk set changed');
  const ids = new Set();
  for (const item of inventory.packages) {
    publicAtom(item.name, 'bundled npm name'); publicAtom(item.version, 'bundled npm version');
    if (item.id !== `${item.name}@${item.version}` || ids.has(item.id) || !Array.isArray(item.lockPaths) || !item.lockPaths.length) fail('invalid bundled package identity');
    ids.add(item.id);
    for (const lockPath of item.lockPaths) {
      if (!/^node_modules\//.test(lockPath) || lockPath.split('/').includes('..') || lockPath.includes('\\') || lock.packages?.[lockPath]?.version !== item.version) fail('bundled package disagrees with lock');
      const entry = lock.packages[lockPath];
      const expected = entry.name || lockPath.slice(lockPath.lastIndexOf('node_modules/') + 13);
      if (item.name !== expected) fail('bundled package name disagrees with lock');
    }
  }
  const referenced = new Set(); let rendered = 0;
  for (const filename of expectedChunks) {
    const item = inventory.chunks[filename];
    if (!SHA.test(item.sha256) || item.sha256 !== frontendAssets[filename] || !Number.isInteger(item.renderedModules) || item.renderedModules < 0
      || !Array.isArray(item.packages) || item.packages.some(id => !ids.has(id))) fail('frontend emitted chunk digest/ownership changed');
    item.packages.forEach(id => referenced.add(id)); rendered += item.renderedModules;
  }
  if (rendered !== inventory.totals.renderedModules || referenced.size !== ids.size) fail('frontend module/package totals disagree');
  return { ...inventory, manifestSHA256: sha256(readFileSync(file)), packageJSONSHA256, lockSHA256 };
}

function safeLicenses(licenses) {
  if (!Array.isArray(licenses)) return undefined;
  const result = [];
  for (const item of licenses.slice(0, 16)) {
    if (typeof item.expression === 'string' && item.expression.length <= 256 && !/[\x00-\x1f]|:\/\//.test(item.expression)) result.push({ expression: item.expression });
    else if (typeof (item.license?.id || item.license?.name) === 'string') {
      const label = item.license.id || item.license.name;
      if (label.length <= 256 && !/[\x00-\x1f\\]|:\/\/|^\/|^[A-Za-z]:|^~\//.test(label)) result.push({ license: { name: label } });
    }
  }
  return result.length ? result : undefined;
}
export function frontendSourceBom(raw, binding) {
  const source = boundedJSON(raw, 'npm SBOM');
  if (source.bomFormat !== 'CycloneDX' || source.specVersion !== '1.5' || !Array.isArray(source.components) || !source.components.length || source.components.length > MAX_COMPONENTS || !Array.isArray(source.dependencies)) fail('missing or unsupported npm source BOM');
  const rootRef = 'kubeview:frontend-source', originalRoot = publicAtom(source.metadata?.component?.['bom-ref'], 'npm root reference');
  const bom = baseBom({ type: 'application', name: 'KubeView-frontend-source-inputs', version: binding.version, 'bom-ref': rootRef,
    properties: [property('sourceCommit', binding.commit), property('coverage', 'resolved npm lock inputs including dev/build; not all shipped JavaScript'),
      property('packageJSONSHA256', binding.packageJSONSHA256), property('lockSHA256', binding.lockSHA256), property('frontendAssetsSHA256', sha256(JSON.stringify(binding.frontendAssets)))] }, 'pre-build');
  const sourceTools = Array.isArray(source.metadata?.tools) ? source.metadata.tools : source.metadata?.tools?.components || [];
  const npmTool = sourceTools.find(tool => tool.vendor === 'npm' && tool.name === 'cli' || tool.name === 'npm');
  if (!npmTool?.version) fail('npm producer version missing');
  bom.metadata.tools.push({ vendor: 'npm', name: 'cli', version: publicAtom(npmTool.version, 'npm producer version') });
  const mapping = new Map([[originalRoot, rootRef]]);
  bom.components = source.components.map(component => {
    const original = publicAtom(component['bom-ref'], 'npm component reference');
    if (mapping.has(original)) fail('duplicate npm source reference');
    const name = component.group && !component.name.startsWith('@') ? `${component.group}/${component.name}` : component.name;
    publicAtom(name, 'npm source name'); publicAtom(component.version, 'npm source version');
    const ref = `npm-source:${original}`; mapping.set(original, ref);
    const development = (component.properties || []).some(p => p.name === 'cdx:npm:package:development' && p.value === 'true');
    const value = { type: 'library', name, version: component.version, 'bom-ref': ref, purl: purl('npm', name, component.version),
      scope: development ? 'optional' : 'required', properties: [property('coverage', 'resolved frontend source input'), property('development', development)] };
    const licenses = safeLicenses(component.licenses); if (licenses) value.licenses = licenses;
    return value;
  });
  bom.dependencies = source.dependencies.map(edge => {
    if (!mapping.has(edge.ref) || !Array.isArray(edge.dependsOn) || edge.dependsOn.some(id => !mapping.has(id))) fail('dangling npm source graph');
    return { ref: mapping.get(edge.ref), dependsOn: [...new Set(edge.dependsOn.map(id => mapping.get(id)))] };
  });
  return validateBom(bom);
}

export function binaryBom(raw, binding) {
  const info = boundedJSON(raw, 'Go BuildInfo');
  if (!/^go\d+\.\d+(?:\.\d+)?$/.test(info.GoVersion || '') || !info.Main?.Path || !Array.isArray(info.Deps) || !info.Deps.length) fail('missing linked Go metadata');
  const settings = new Map((info.Settings || []).map(item => [item.Key, item.Value]));
  const [GOOS, GOARCH] = binding.target.split('-');
  if (settings.get('GOOS') !== GOOS || settings.get('GOARCH') !== GOARCH || settings.get('CGO_ENABLED') !== '0') fail('binary target/CGO mismatch');
  if (settings.has('vcs.revision') && settings.get('vcs.revision') !== binding.commit) fail('binary source revision mismatch');
  if (!SHA.test(binding.binarySHA256)) fail('invalid binary hash');
  const rootRef = `kubeview:binary:${binding.target}`;
  const bom = baseBom({ type: 'application', name: 'KubeView', version: binding.version, 'bom-ref': rootRef,
    hashes: [{ alg: 'SHA-256', content: binding.binarySHA256 }], properties: [property('sourceCommit', binding.commit), property('target', binding.target),
      property('compiler', info.GoVersion), property('goVcsModified', settings.get('vcs.modified') ?? 'unknown'), property('runtimeInputsDirty', Boolean(binding.dirty)), property('coverage', 'linked Go modules and positive-rendered JavaScript package ownership; no function reachability or host OS inventory'),
      property('goBuildInfoSHA256', sha256(typeof raw === 'string' || Buffer.isBuffer(raw) ? raw : JSON.stringify(raw))),
      property('frontendInventorySHA256', binding.inventory.manifestSHA256), property('frontendLockSHA256', binding.inventory.lockSHA256),
      property('frontendPackageJSONSHA256', binding.inventory.packageJSONSHA256), property('frontendAssetsSHA256', sha256(JSON.stringify(binding.frontendAssets))),
      property('dependencyEdges', 'root assembly membership; Go import edges unavailable')] }, 'post-build');
  for (const dependency of info.Deps) {
    const actual = dependency.Replace || dependency;
    const name = publicAtom(actual.Path, 'Go module path'), version = publicAtom(actual.Version, 'Go module version');
    if (!/^v\d/.test(version) || /^(?:\.|\/)/.test(name)) fail('unversioned/local Go replacement requires explicit source inventory');
    const ref = purl('golang', name, version);
    const properties = [property('coverage', 'embedded Go BuildInfo module')];
    if (actual.Sum) { if (!/^h1:[A-Za-z0-9+/=]+$/.test(actual.Sum)) fail('invalid Go module checksum'); properties.push(property('goModuleH1', actual.Sum)); }
    if (dependency.Replace) properties.push(property('replacedFrom', `${publicAtom(dependency.Path, 'original module path')}@${publicAtom(dependency.Version, 'original module version')}`));
    bom.components.push({ type: 'library', name, version, 'bom-ref': ref, purl: ref, properties });
  }
  const stdlib = purl('golang', 'stdlib', info.GoVersion.slice(2));
  bom.components.push({ type: 'library', name: 'stdlib', version: info.GoVersion.slice(2), 'bom-ref': stdlib, purl: stdlib,
    properties: [property('coverage', 'actual compiler standard library version; not symbol reachability')] });
  for (const item of binding.inventory.packages) {
    const ref = purl('npm', item.name, item.version);
    bom.components.push({ type: 'library', name: item.name, version: item.version, 'bom-ref': ref, purl: ref,
      properties: [property('coverage', 'positive-rendered JavaScript module package'), property('lockPaths', JSON.stringify(item.lockPaths))] });
  }
  bom.dependencies = [{ ref: rootRef, dependsOn: bom.components.map(item => item['bom-ref']) }];
  return validateBom(bom);
}

export function collectFrontendSource({ root, execute, binding }) {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'kubeview-sbom-'));
  try {
    const user = path.join(directory, 'user.npmrc'), global = path.join(directory, 'global.npmrc');
    writeFileSync(user, '', { mode: 0o600, flag: 'wx' }); writeFileSync(global, '', { mode: 0o600, flag: 'wx' });
    const env = { NODE_ENV: 'development', NPM_CONFIG_OFFLINE: 'true', NPM_CONFIG_IGNORE_SCRIPTS: 'true', NPM_CONFIG_LOGLEVEL: 'error', NPM_CONFIG_CACHE: path.join(directory, 'cache') };
    for (const key of ['PATH', 'HOME', 'SYSTEMROOT', 'TMPDIR', 'LANG', 'LC_ALL']) if (process.env[key]) env[key] = process.env[key];
    const raw = execute('npm', ['sbom', '--package-lock-only', '--sbom-format', 'cyclonedx', '--sbom-type', 'application', '--include=dev', '--include=optional', '--include=peer', '--ignore-scripts', '--offline', '--userconfig', user, '--globalconfig', global],
      { cwd: path.join(root, 'frontend'), env, encoding: 'utf8', timeout: 15000, maxBuffer: MAX_JSON_BYTES });
    return frontendSourceBom(raw, binding);
  } catch (error) { fail(error.message.startsWith('Release SBOM:') ? error.message.slice(14) : 'npm source inventory failed; no archive published'); }
  finally { rmSync(directory, { recursive: true, force: true }); }
}
