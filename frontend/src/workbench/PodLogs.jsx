import React, { useEffect, useRef, useState } from "react";
import {
  Download,
  Pause,
  Play,
  RefreshCw,
  Search,
  Terminal,
} from "lucide-react";

export default function PodLogs({
  resource,
  cluster,
  api,
  initialContainerName,
  onContainerChange,
}) {
  const containers = [
    ...(resource.spec?.containers || []),
    ...(resource.spec?.initContainers || []),
    ...(resource.spec?.ephemeralContainers || []),
  ];
  const [container, setContainer] = useState(
      initialContainerName || containers[0]?.name || "",
    ),
    [tailLines, setTailLines] = useState(150),
    [follow, setFollow] = useState(true),
    [previous, setPrevious] = useState(false),
    [timestamps, setTimestamps] = useState(true),
    [paused, setPaused] = useState(false),
    [wrap, setWrap] = useState(true),
    [search, setSearch] = useState(""),
    [lines, setLines] = useState([]),
    [error, setError] = useState(""),
    [status, setStatus] = useState(""),
    [refresh, setRefresh] = useState(0);
  const outputRef = useRef(null);
  useEffect(() => {
    setContainer(
      containers.some((c) => c.name === initialContainerName)
        ? initialContainerName
        : containers[0]?.name || "",
    );
    setLines([]);
    setPaused(false);
  }, [resource.metadata?.uid, initialContainerName]);
  useEffect(() => {
    if (paused || !container) return;
    const abort = new AbortController();
    let timer;
    let buffer = "",
      pending = "";
    setLines([]);
    setError("");
    setStatus("Bağlanıyor");
    const query = new URLSearchParams({
      namespace: resource.metadata?.namespace || "default",
      pod: resource.metadata?.name || "",
      container,
      tailLines: String(tailLines),
      follow: String(follow),
      previous: String(previous),
      timestamps: String(timestamps),
      context: cluster || "",
    });
    const url = api?.url ? api.url(`/api/logs?${query}`) : `/api/logs?${query}`;
    const flush = () => {
      if (!pending) return;
      const batch = pending;
      pending = "";
      setLines((current) => [...current, ...batch.split("\n")].slice(-5000));
    };
    const run = async () => {
      try {
        const response = await fetch(url, {
          signal: abort.signal,
          credentials: "same-origin",
        });
        if (!response.ok) {
          const text = await response.text();
          try {
            throw new Error(
              JSON.parse(text).error || JSON.parse(text).message || text,
            );
          } catch (e) {
            throw new Error(
              e instanceof SyntaxError
                ? text || `HTTP ${response.status}`
                : e.message,
            );
          }
        }
        setStatus(follow ? "Canlı akış" : "Log alınıyor");
        const reader = response.body?.getReader();
        if (!reader) throw new Error("Tarayıcı yanıt akışını desteklemiyor.");
        const decoder = new TextDecoder();
        timer = setInterval(flush, 180);
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const index = buffer.lastIndexOf("\n");
          if (index >= 0) {
            pending += buffer.slice(0, index + 1);
            buffer = buffer.slice(index + 1);
          }
        }
        if (buffer) pending += buffer;
        flush();
        setStatus("Akış tamamlandı");
      } catch (e) {
        if (e.name !== "AbortError") {
          setError(e.message);
          setStatus("Log okunamadı");
        }
      } finally {
        clearInterval(timer);
      }
    };
    run();
    return () => {
      abort.abort();
      clearInterval(timer);
    };
  }, [
    resource.metadata?.uid,
    resource.metadata?.name,
    resource.metadata?.namespace,
    container,
    tailLines,
    follow,
    previous,
    timestamps,
    paused,
    refresh,
    cluster,
    api,
  ]);
  useEffect(() => {
    if (outputRef.current && !search)
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [lines, search]);
  const visible = search
    ? lines.filter((line) =>
        line
          .toLocaleLowerCase("tr-TR")
          .includes(search.toLocaleLowerCase("tr-TR")),
      )
    : lines;
  return (
    <section className="pod-logs">
      <div className="logs-toolbar">
        <label>
          Container
          <select
            value={container}
            onChange={(e) => {
              setContainer(e.target.value);
              onContainerChange?.(e.target.value);
            }}
          >
            {containers.map((c) => (
              <option key={c.name}>{c.name}</option>
            ))}
          </select>
        </label>
        <label>
          Son satır
          <select
            value={tailLines}
            onChange={(e) => setTailLines(Number(e.target.value))}
          >
            {[50, 150, 500, 1000].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <button
          className="icon-button"
          aria-label={paused ? "Logları yeniden bağla" : "Log akışını duraklat"}
          onClick={() => setPaused(!paused)}
        >
          {paused ? <Play size={16} /> : <Pause size={16} />}
        </button>
        <button
          className="icon-button"
          aria-label="Logları yeniden yükle"
          onClick={() => setRefresh((n) => n + 1)}
        >
          <RefreshCw size={16} />
        </button>
        <button
          className="icon-button"
          aria-label="Logları indir"
          disabled={!lines.length}
          onClick={() => {
            const url = URL.createObjectURL(
              new Blob([lines.join("\n")], {
                type: "text/plain;charset=utf-8",
              }),
            );
            const a = document.createElement("a");
            a.href = url;
            a.download = `${resource.metadata?.name}-${container}.log`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          }}
        >
          <Download size={16} />
        </button>
      </div>
      <div className="logs-options">
        <label>
          <input
            type="checkbox"
            checked={follow}
            onChange={(e) => setFollow(e.target.checked)}
          />
          Follow
        </label>
        <label>
          <input
            type="checkbox"
            checked={timestamps}
            onChange={(e) => setTimestamps(e.target.checked)}
          />
          Zaman damgası
        </label>
        <label>
          <input
            type="checkbox"
            checked={wrap}
            onChange={(e) => setWrap(e.target.checked)}
          />
          Satırları sar
        </label>
        <label>
          <input
            type="checkbox"
            checked={previous}
            onChange={(e) => setPrevious(e.target.checked)}
          />
          Önceki container
        </label>
      </div>
      <label className="table-search">
        <Search size={14} />
        <input
          aria-label="Loglarda ara ve filtrele"
          placeholder="Loglarda ara ve filtrele…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>
      <div className="logs-status">
        <Terminal size={14} />
        <span>
          {paused ? "Duraklatıldı" : status} · {visible.length} satır
        </span>
      </div>
      {paused && (
        <p className="muted">
          Duraklatma sunucu akışını kapatır. Devam et son seçilen satır sayısını
          yeniden alır; aradaki tüm satırların saklanacağı garanti edilmez.
        </p>
      )}
      {error && (
        <div className="inline-alert alert-danger" role="alert">
          {error}
        </div>
      )}
      <pre
        className="log-output"
        style={{
          whiteSpace: wrap ? "pre-wrap" : "pre",
          overflowWrap: wrap ? "anywhere" : "normal",
        }}
        ref={outputRef}
        tabIndex={0}
        aria-label="Container log çıktısı"
      >
        {visible.length
          ? visible.join("\n")
          : error
            ? "Log içeriği alınamadı."
            : paused
              ? "Akış duraklatıldı."
              : "Henüz log satırı yok."}
      </pre>
      <p className="muted">
        Ham Pod adı: <code>{resource.metadata?.name}</code> · Görünüm en fazla
        5.000 satır tutar.
      </p>
    </section>
  );
}
