import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLockIdentity } from './build-lock.mjs';
import { fixedConditionReasons } from './repair-report.mjs';
const source = version => ({ name:'app', version, lockfileVersion:3, packages:{
  '':{name:'app',version,dependencies:{react:'^18.3.1'}},
  'node_modules/react':{version:'18.3.1',integrity:'sha512-real',resolved:'https://registry.example/react.tgz'},
} });
test('root release metadata differs honestly while dependency comparison stays strict', () => {
  const a=buildLockIdentity(JSON.stringify(source('0.4.0'))), b=buildLockIdentity(JSON.stringify(source('1.1.0')));
  assert.notEqual(a.lockSHA256,b.lockSHA256);
  assert.equal(a.dependencyGraphSHA256,b.dependencyGraphSHA256);
  assert.deepEqual(fixedConditionReasons([{manifest:a},{manifest:b}]),[]);
  for(const field of ['version','integrity','resolved']) {
    const changed=source('1.1.0'); changed.packages['node_modules/react'][field]='changed';
    const c=buildLockIdentity(JSON.stringify(changed));
    assert.notEqual(a.dependencyGraphSHA256,c.dependencyGraphSHA256);
    assert.equal(fixedConditionReasons([{manifest:a},{manifest:c}]).length,1);
  }
  assert.equal(fixedConditionReasons([{manifest:{lockSHA256:'old'}},{manifest:{lockSHA256:'changed'}}]).length,1);
});
