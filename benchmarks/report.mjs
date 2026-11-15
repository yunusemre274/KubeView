// Data tables only; interpretation and limitations live in PERFORMANCE_REPORT.md.
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { distribution, processMetrics } from "./metrics.mjs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const prefix = process.argv[2] || "v3";
const out = path.join(root, "benchmarks/results", `${prefix}-export`);
const accepted = JSON.parse(
  await readFile(path.join(out, "accepted-runs.json"), "utf8"),
);
const unavailable = await readFile(
  path.join(out, "unavailable-runs.json"),
  "utf8",
)
  .then(JSON.parse)
  .catch((error) => {
    if (error.code === "ENOENT") return {};
    throw error;
  });
const read = async (profile, scenario, phase) => {
  const key = `${profile}/${scenario}/${phase}`;
  const id =
    accepted[key]?.id ||
    unavailable[key]?.id ||
    `${prefix}-${profile}-${scenario}-${phase}`;
  const report = JSON.parse(
    await readFile(
      path.join(root, `benchmarks/results/${id}/summary.json`),
      "utf8",
    ),
  );
  if (unavailable[key]) {
    if (
      profile !== "M" ||
      scenario !== "log-stress" ||
      phase !== "baseline" ||
      report.runs.length ||
      !report.errors.some((error) =>
        error.includes("one owned process exceeds 6 GiB RSS"),
      )
    )
      throw new Error(`Unverified unavailable set: ${id}`);
    return null;
  }
  if (
    !report.manifest.finishedAt ||
    report.errors.length ||
    report.runs.length !== 3
  )
    throw new Error(`Incomplete set: ${id}`);
  return report;
};
const fmt = (n, digits = 2) => (Number.isFinite(n) ? n.toFixed(digits) : "N/A");
const range = (values, digits = 2) => {
  const d = distribution(values);
  return d.n
    ? `${fmt(d.p50, digits)} (${fmt(d.min, digits)}–${fmt(d.max, digits)}; n=${d.n})`
    : "N/A";
};
const value = (report, metric) =>
  report.runs.map((run) =>
    metric.split(".").reduce((object, key) => object?.[key], run),
  );
const mib = (bytes) => (Number.isFinite(bytes) ? bytes / 1024 / 1024 : null);
const rssMiB = (kib) => (Number.isFinite(kib) ? kib / 1024 : null);
const tables = [
  "# Ölçüm tabloları",
  "",
  "Değerler tekrar medyanı (min–max; tekrar sayısı). JS çizim/sn fiziksel GPU sunum FPS'i değildir. CPU çekirdek eşdeğeri; RSS tek süreç, toplanmış fiziksel RAM değildir.",
  "",
  "| Profil / güç | Görünür Node / Pod | Çizim/sn önce → sonra | p95 ms önce → sonra | p99 ms önce → sonra |",
  "|---|---:|---|---|---|",
];
const budgets = [];
for (const profile of ["S", "M", "L"]) {
  const before = await read(profile, "living", "baseline"),
    after = await read(profile, "living", "optimized");
  const visible = after.runs[0].before.stats.lifecycle;
  tables.push(
    `| ${profile} / ${after.manifest.powerSource} | ${visible.visibleNodes} / ${visible.visiblePods} | ${range(value(before, "summary.renderedFPS"))} → ${range(value(after, "summary.renderedFPS"))} | ${range(value(before, "summary.renderIntervalMs.p95"))} → ${range(value(after, "summary.renderIntervalMs.p95"))} | ${range(value(before, "summary.renderIntervalMs.p99"))} → ${range(value(after, "summary.renderIntervalMs.p99"))} |`,
  );
  for (const [phase, report] of [
    ["baseline", before],
    ["optimized", after],
  ])
    for (const run of report.runs) {
      const target =
        profile === "L"
          ? { fps: 30, p95: 40, p99: 50, gapsOver100: 0 }
          : { fps: 55, p95: 20, p99: 33.3, gapsOver100: 0 };
      budgets.push({
        profile,
        scenario: "living",
        phase,
        repeat: run.repeat,
        target,
        actual: {
          fps: run.summary.renderedFPS,
          p95: run.summary.renderIntervalMs.p95,
          p99: run.summary.renderIntervalMs.p99,
          gapsOver100: run.summary.gapsOver100Ms,
        },
        meetsTiming:
          run.summary.renderedFPS >= target.fps &&
          run.summary.renderIntervalMs.p95 <= target.p95 &&
          run.summary.renderIntervalMs.p99 <= target.p99 &&
          run.summary.gapsOver100Ms <= target.gapsOver100,
      });
    }
}
tables.push(
  "",
  "| Profil / faz | Browser CPU çekirdek | Go CPU çekirdek | En büyük browser süreci RSS MiB | Go RSS MiB | JS heap son MiB | Tam frame draw-call / üçgen medyanı |",
  "|---|---|---|---|---|---|---|",
);
for (const profile of ["S", "M", "L"])
  for (const phase of ["baseline", "optimized"]) {
    const report = await read(profile, "living", phase);
    const process = report.runs.map((run) =>
      processMetrics(run.osBefore, run.osAfter),
    );
    tables.push(
      `| ${profile} / ${phase} | ${range(
        process.map((p) => p.browserCores),
        3,
      )} | ${range(
        process.map((p) => p.backendCores),
        4,
      )} | ${range(
        process.map((p) => rssMiB(p.maxBrowserProcessRSSKiB)),
        1,
      )} | ${range(
        process.map((p) => rssMiB(p.backendRSSKiB)),
        1,
      )} | ${range(
        report.runs.map((r) => mib(r.after.heap?.used)),
        1,
      )} | ${range(value(report, "summary.calls.p50"), 0)} / ${range(value(report, "summary.triangles.p50"), 0)} |`,
    );
  }
tables.push(
  "",
  "RSS ölçüm sonu OS örneğidir, tepe/tekil toplam bellek değildir. JS heap doğal GC noktasında ölçüldü. Draw-call ve üçgen sayıları shadow pass dahil tam JS render çağrısını kapsar.",
  "",
  "| Soğuk açılış profil / faz | Canvas + canonical hazır ms | İlk raycast-görünür Node ms | Açılış sayısı |",
  "|---|---|---|---:|",
);
for (const profile of ["S", "M", "L"])
  for (const phase of ["baseline", "optimized"]) {
    const report = await read(profile, "living", phase);
    const starts = report.manifest.coldStarts || [];
    tables.push(
      `| ${profile} / ${phase} | ${range(
        starts.map((r) => r.canonicalAndCanvasReadyMs),
        0,
      )} | ${range(
        starts.map((r) => r.firstReadyMs),
        0,
      )} | ${starts.length} |`,
    );
  }
tables.push(
  "",
  "Soğuk açılış ayrı, yeni browser context ile ölçülür; OS/GPU cache temizlenmez. Her yaşayan liman setinde bir açılış vardır: tek açılıştan güvenilir hızlanma yüzdesi çıkarılmaz. Üç ısınmış tekrar bu sütunun örnek sayısı değildir.",
);
tables.push(
  "",
  "| M senaryo | Güç | Çizim/sn sonra | p95 ms sonra | Tüm browser süreçleri CPU önce → sonra | En büyük browser süreci RSS MiB önce → sonra |",
  "|---|---|---|---|---|---|",
);
for (const scenario of [
  "living",
  "events",
  "water-off",
  "ships-off",
  "idle",
  "panel",
  "interaction",
  "log-stress",
]) {
  const before = await read("M", scenario, "baseline"),
    after = await read("M", scenario, "optimized");
  const processes = (report) =>
    report
      ? report.runs.map((run) => processMetrics(run.osBefore, run.osAfter))
      : [];
  const b = processes(before),
    a = processes(after);
  tables.push(
    `| ${scenario} | ${after.manifest.powerSource} | ${range(value(after, "summary.renderedFPS"))} | ${range(value(after, "summary.renderIntervalMs.p95"))} | ${range(
      b.map((p) => p.browserCores),
      3,
    )} → ${range(
      a.map((p) => p.browserCores),
      3,
    )} | ${range(
      b.map((p) => rssMiB(p.maxBrowserProcessRSSKiB)),
      1,
    )} → ${range(
      a.map((p) => rssMiB(p.maxBrowserProcessRSSKiB)),
      1,
    )} |`,
  );
}
tables.push(
  "",
  ...Object.entries(unavailable).map(
    ([key, row]) =>
      `Ölçülemeyen ${key}: ${row.reason} Kaynak: ${row.id}; renderer RSS ${fmt(row.rendererRSSKiB / 1024, 1)} MiB. Bu başarısız başlangıç koşusu kabul edilen üçlü veya hızlanma yüzdesi değildir.`,
  ),
  "",
  "Idle aralıkları beklenen demand boşluklarıdır; 60 FPS jank bütçesine uygulanmaz. M/L'de mevcut sekiz gemilik bölgeleme ve Node sayısı>12 için statik ayrıntı LOD'u korunur.",
  "",
  "| Olay / faz | Store p95 ms | Görünüm proxy p95 ms | Alınan olay / çizim proxy örneği |",
  "|---|---|---|---|",
);
for (const phase of ["baseline", "optimized"]) {
  const report = await read("M", "events", phase);
  for (const band of ["normal", "burst"]) {
    const rows = report.runs.map((run) => run.loadBands[band]);
    tables.push(
      `| ${band} / ${phase} | ${range(rows.map((r) => r.callbackToStoreMs.p95))} | ${range(rows.map((r) => r.drawProxyMs.p95))} | ${rows.map((r) => `${r.received}/${r.drawProxyMs.n}`).join(", ")} |`,
    );
    for (let i = 0; i < rows.length; i++)
      budgets.push({
        profile: "M",
        scenario: "events",
        phase,
        repeat: i,
        band,
        actual: rows[i],
        meetsTiming:
          rows[i].callbackToStoreMs.p95 <= (band === "burst" ? 250 : 100) &&
          rows[i].drawProxyMs.n > 0 &&
          rows[i].drawProxyMs.p95 <= (band === "burst" ? 500 : 250),
      });
  }
}
tables.push(
  "",
  "Görünüm ölçümü doğru UID/RV için commit + sonraki çizim proxy'sidir; görünmeyen bölgelerde örnek yoktur. Callback öncesi ana thread/ağ/Kubernetes gecikmesi dahil değildir.",
  "",
  "| Etkileşim fazı | DOM p95 ms | Sonraki rAF proxy p95 ms | Örnek sayıları |",
  "|---|---|---|---|",
);
for (const phase of ["baseline", "optimized"]) {
  const r = await read("M", "interaction", phase);
  tables.push(
    `| ${phase} | ${range(value(r, "summary.panelDomProxyMs.p95"))} | ${range(value(r, "summary.panelRafProxyMs.p95"))} | ${value(r, "summary.panelDomProxyMs.n").join(", ")} |`,
  );
  for (const run of r.runs)
    budgets.push({
      profile: "M",
      scenario: "interaction",
      phase,
      repeat: run.repeat,
      actual: {
        dom: run.summary.panelDomProxyMs,
        raf: run.summary.panelRafProxyMs,
      },
      meetsTiming:
        run.summary.panelDomProxyMs.n > 0 &&
        run.summary.panelDomProxyMs.p95 <= 200 &&
        run.summary.panelRafProxyMs.p95 <= 100,
    });
}
tables.push(
  "",
  "Özel DOM/rAF ölçümleri INP değildir; temel başlık/veri geri bildirimi proxy'sidir. Hata veya başarısız bütçe burada saklanır; otomatik olarak uygulama kabulü sayılmaz.",
);
await writeFile(path.join(out, "TABLES.md"), tables.join("\n") + "\n");
await writeFile(
  path.join(out, "budgets.json"),
  JSON.stringify(
    {
      generated: new Date().toISOString(),
      budgets,
      failures: budgets.filter((row) => !row.meetsTiming),
      unavailable,
      note: "Measured timing targets only; full correctness, browser, memory, metadata and visual review remain separate gates.",
    },
    null,
    2,
  ),
);
console.log({
  out,
  checks: budgets.length,
  failures: budgets.filter((row) => !row.meetsTiming).length,
  unavailableCases: Object.keys(unavailable).length,
});
