// Separate diagnostic only. The primary FPS/CPU comparison does not install it.
export function installGPUProbe() {
  const probe = globalThis.__KUBEVIEW_BENCHMARK__;
  const attach = probe.renderer.bind(probe),
    stop = probe.stop.bind(probe);
  probe.gpu = [];
  probe.gpuDisjoint = 0;
  probe.stop = () => ({
    ...stop(),
    gpu: probe.gpu,
    gpuDisjoint: probe.gpuDisjoint,
  });
  probe.renderer = (renderer) => {
    const cleanup = attach(renderer),
      original = renderer.render;
    const gl = renderer.getContext(),
      ext = gl.getExtension("EXT_disjoint_timer_query_webgl2");
    let query = null,
      start;
    renderer.render = function (scene, camera) {
      if (!ext || !probe.active) return original.call(this, scene, camera);
      if (query && gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE)) {
        if (!gl.getParameter(ext.GPU_DISJOINT_EXT))
          probe.gpu.push({
            start,
            ms: gl.getQueryParameter(query, gl.QUERY_RESULT) / 1e6,
          });
        else probe.gpuDisjoint++;
        gl.deleteQuery(query);
        query = null;
      }
      const measuring = !query;
      if (measuring) {
        query = gl.createQuery();
        start = performance.now();
        gl.beginQuery(ext.TIME_ELAPSED_EXT, query);
      }
      const result = original.call(this, scene, camera);
      if (measuring) gl.endQuery(ext.TIME_ELAPSED_EXT);
      return result;
    };
    return () => {
      if (query) gl.deleteQuery(query);
      renderer.render = original;
      cleanup();
    };
  };
}
