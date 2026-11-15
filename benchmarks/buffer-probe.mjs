// Opt-in diagnostic counters; never part of primary production CPU comparisons.
// Counts API calls, not GPU duration, allocated VRAM or retained native memory.
export function installBufferProbe() {
  if (globalThis.__KUBEVIEW_BUFFER_PROBE__) return;
  const names = ['createBuffer', 'deleteBuffer', 'bufferData', 'bufferSubData', 'createVertexArray', 'deleteVertexArray', 'vertexAttribPointer'];
  let active = false, counts = {};
  const reset = () => { counts = Object.fromEntries(names.map(name => [name, 0])); };
  reset();
  for (const type of ['WebGLRenderingContext', 'WebGL2RenderingContext']) {
    const prototype = globalThis[type]?.prototype;
    if (!prototype) continue;
    for (const name of names) {
      const descriptor = Object.getOwnPropertyDescriptor(prototype, name);
      if (typeof descriptor?.value !== 'function') continue;
      const original = descriptor.value;
      Object.defineProperty(prototype, name, { ...descriptor, value: function (...args) {
        const result = Reflect.apply(original, this, args);
        if (active) counts[name]++;
        return result;
      } });
    }
  }
  globalThis.__KUBEVIEW_BUFFER_PROBE__ = {
    start() { reset(); active = true; },
    stop() { active = false; return { calls: { ...counts }, scope: 'Page WebGL API calls returning without a JS exception; GL error state is not queried. No VRAM, GPU-time or physical-memory inference.' }; },
  };
}
