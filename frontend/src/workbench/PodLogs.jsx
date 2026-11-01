import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Download,
  Pause,
  Play,
  RefreshCw,
  Search,
  Terminal,
} from "lucide-react";
import { LogBuffer } from "./logBuffer.js";
import { buildLogView } from "./logView.js";
const LOG_CHUNK_STYLE = Object.freeze({display: "block"});
const LogTextChunk = React.memo(function LogTextChunk({ text }) {
  return <span style={LOG_CHUNK_STYLE}>{text}</span>;
});

function PodLogs({
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
    [firstSequence, setFirstSequence] = useState(0),
    [truncated, setTruncated] = useState(false),
    [followingTail, setFollowingTail] = useState(true),
    [error, setError] = useState(""),
    [status, setStatus] = useState(""),
    [refresh, setRefresh] = useState(0);
  const outputRef = useRef(null);
  const followTailRef = useRef(true);
  useEffect(() => {
    setContainer(
      containers.some((c) => c.name === initialContainerName)
        ? initialContainerName
        : containers[0]?.name || "",
    );
    setLines([]);
    setFirstSequence(0);
    setPaused(false);
    followTailRef.current = true;
    setFollowingTail(true);
  }, [resource.metadata?.uid, initialContainerName]);
  useEffect(() => {
    if (paused || !container) return;
    const abort = new AbortController();
    let timer;
    const history = new LogBuffer();
    let flushedRevision = -1;
    setLines([]);
    setFirstSequence(0);
    setTruncated(false);
    setError("");
    setStatus("Bağlanıyor");
    followTailRef.current = true;
    setFollowingTail(true);
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
      timer = undefined;
      if (abort.signal.aborted || flushedRevision === history.revision) return;
      flushedRevision = history.revision;
      const snapshot = history.snapshot();
      setLines(snapshot.lines);
      setFirstSequence(snapshot.firstSequence);
      setTruncated(snapshot.truncated);
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
        while (true) {
          const { done, value } = await reader.read();
          if (abort.signal.aborted) return;
          if (done) break;
          history.append(decoder.decode(value, { stream: true }));
          if (timer === undefined) timer = setTimeout(flush, 180);
        }
        history.append(decoder.decode());
        clearTimeout(timer);
        flush();
        setStatus("Akış tamamlandı");
      } catch (e) {
        if (e.name !== "AbortError") {
          setError(e.message);
          setStatus("Log okunamadı");
        }
      } finally {
        clearTimeout(timer);
      }
    };
    run();
    return () => {
      abort.abort();
      clearTimeout(timer);
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
    if (outputRef.current && !search && followTailRef.current)
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [lines, search]);
  const previousView = useRef();
  const view = useMemo(
    () => buildLogView(lines, firstSequence, search, previousView.current),
    [lines, firstSequence, search],
  );
  useLayoutEffect(() => {
    previousView.current = view;
  }, [view]);
  const { visible, text, chunks } = view;
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
        {!followingTail && (
          <button
            className="button"
            onClick={() => {
              followTailRef.current = true;
              setFollowingTail(true);
              if (outputRef.current)
                outputRef.current.scrollTop = outputRef.current.scrollHeight;
            }}
          >
            En alta dön
          </button>
        )}
      </div>
      {paused && (
        <p className="muted">
          Duraklatma sunucu akışını kapatır. Devam et son seçilen satır sayısını
          yeniden alır; aradaki tüm satırların saklanacağı garanti edilmez.
        </p>
      )}
      {truncated && (
        <p className="muted" role="status">
          Görünüm sınırına ulaşıldı: eski satırlar kaldırıldı veya uzun satırlar
          kısaltıldı. Kubernetes log akışı değişmedi.
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
        onScroll={(event) => {
          const element = event.currentTarget;
          const atBottom =
            element.scrollHeight - element.clientHeight - element.scrollTop <
            24;
          const changed = followTailRef.current !== atBottom;
          followTailRef.current = atBottom;
          if (changed) setFollowingTail(atBottom);
        }}
      >
        {visible.length
          ? chunks.map((chunk) => (
              <LogTextChunk key={chunk.key} text={chunk.text} />
            ))
          : error
            ? "Log içeriği alınamadı."
            : paused
              ? "Akış duraklatıldı."
              : "Henüz log satırı yok."}
      </pre>
      <p className="muted">
        Ham Pod adı: <code>{resource.metadata?.name}</code> · Görünüm en fazla
        5.000 satır ve 1 MiB tutar; tek satır en fazla 16 KiB gösterilir.
      </p>
    </section>
  );
}
export default React.memo(PodLogs);
