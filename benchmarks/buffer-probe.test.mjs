import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { installBufferProbe } from './buffer-probe.mjs';
test('opt-in buffer counters preserve API returns, receivers and errors without counting warmup', () => {
  const scope = vm.createContext({});
  vm.runInContext(`class WebGL2RenderingContext {
    createBuffer(){if(!(this instanceof WebGL2RenderingContext))throw Error('receiver');return {buffer:true};}
    bufferData(){throw Error('invalid request');}
    deleteBuffer(){}
  };globalThis.WebGL2RenderingContext=WebGL2RenderingContext;
  (${installBufferProbe.toString()})();
  globalThis.gl=new WebGL2RenderingContext(); gl.createBuffer();
  __KUBEVIEW_BUFFER_PROBE__.start();globalThis.result=gl.createBuffer();gl.deleteBuffer(result);`, scope);
  assert.equal(scope.result.buffer, true);
  assert.throws(() => vm.runInContext('gl.bufferData()', scope), /invalid request/);
  const first = vm.runInContext('__KUBEVIEW_BUFFER_PROBE__.stop()', scope);
  assert.equal(first.calls.createBuffer, 1);
  assert.equal(first.calls.deleteBuffer, 1);
  assert.equal(first.calls.bufferData, 0);
  vm.runInContext(`gl.createBuffer();(${installBufferProbe.toString()})();__KUBEVIEW_BUFFER_PROBE__.start();gl.createBuffer();`, scope);
  assert.equal(vm.runInContext('__KUBEVIEW_BUFFER_PROBE__.stop().calls.createBuffer', scope), 1);
});
