import React, { useEffect, useRef, useState } from "react";
import { Play, Square, Terminal } from "lucide-react";

function cleanOutput(value) {
  return value
    .replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, "")
    .replace(/\x1b\][^\x07]*(?:\x07|\x1b\\)/g, "")
    .replace(/\r\n/g, "\n");
}
export default function PodTerminal({
  resource,
  cluster,
  api,
  disabled,
  reason,
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
    [shell, setShell] = useState("/bin/sh"),
    [connected, setConnected] = useState(false),
    [output, setOutput] = useState(""),
    [input, setInput] = useState(""),
    [error, setError] = useState(""),
    [session, setSession] = useState(0),
    [started, setStarted] = useState(false);
  const socketRef = useRef(null),
    outputRef = useRef(null);
  useEffect(() => {
    setStarted(false);
    setContainer(
      containers.some((c) => c.name === initialContainerName)
        ? initialContainerName
        : containers[0]?.name || "",
    );
  }, [resource.metadata.uid, initialContainerName]);
  useEffect(() => {
    if (!started || disabled) return;
    let live = true;
    const params = new URLSearchParams({
      context: cluster || "",
      namespace: resource.metadata.namespace,
      pod: resource.metadata.name,
      uid: resource.metadata.uid,
      container,
      command: shell,
    });
    const url = new URL(
      api?.url ? api.url(`/api/exec?${params}`) : `/api/exec?${params}`,
      window.location.href,
    );
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(url);
    socket.binaryType = "arraybuffer";
    socketRef.current = socket;
    setOutput("");
    setError("");
    socket.onopen = () => {
      if (live) setConnected(true);
    };
    socket.onmessage = (event) => {
      if (!live) return;
      const text =
        typeof event.data === "string"
          ? event.data
          : new TextDecoder().decode(event.data);
      setOutput((previous) => (previous + cleanOutput(text)).slice(-250000));
    };
    socket.onerror = () => {
      if (live)
        setError(
          "Exec oturumu açılamadı. pods/exec yetkisini, container durumunu ve /bin/sh varlığını kontrol edin.",
        );
    };
    socket.onclose = (event) => {
      if (live) {
        setConnected(false);
        if (event.code !== 1000 && event.code !== 1005)
          setError(event.reason || `Oturum kapandı (${event.code}).`);
      }
    };
    return () => {
      live = false;
      socket.close(1000, "UI session ended");
      socketRef.current = null;
      setConnected(false);
    };
  }, [
    started,
    session,
    disabled,
    resource.metadata.uid,
    cluster,
    api,
    container,
    shell,
  ]);
  useEffect(() => {
    if (outputRef.current)
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [output]);
  const send = () => {
    if (!connected || socketRef.current?.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(`${input}\n`);
    setInput("");
  };
  return (
    <section className="pod-terminal">
      <div className="inline-alert alert-warning">
        Bu terminal seçili Pod container’ında gerçek bir shell oturumu açar.
        Girdi doğrudan Kubernetes pods/exec alt kaynağına gönderilir.
      </div>
      {disabled && (
        <div className="inline-alert">
          {reason || "Exec bu bağlantıda kullanılamıyor."}
        </div>
      )}
      <div className="logs-toolbar">
        <label>
          Container
          <select
            disabled={started}
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
          Shell
          <select
            disabled={started}
            value={shell}
            onChange={(e) => setShell(e.target.value)}
          >
            <option>/bin/sh</option>
            <option>/bin/bash</option>
          </select>
        </label>
        <button
          className="button"
          disabled={disabled}
          onClick={() => {
            if (started) {
              socketRef.current?.close(1000, "User ended session");
              setStarted(false);
            } else {
              setSession((n) => n + 1);
              setStarted(true);
            }
          }}
        >
          {started ? <Square size={14} /> : <Play size={14} />}
          {started ? "Oturumu kapat" : "Oturum aç"}
        </button>
      </div>
      <div className="logs-status">
        <Terminal size={14} />
        {connected
          ? "Exec bağlı · gerçek container"
          : started
            ? "Oturum bağlantısı bekleniyor / kapalı"
            : "Oturum kapalı"}
      </div>
      {error && (
        <div role="alert" className="inline-alert alert-danger">
          {error}
        </div>
      )}
      <pre
        ref={outputRef}
        tabIndex={0}
        className="log-output"
        aria-label="Gerçek exec çıktısı"
      >
        {output || "Çıktı henüz yok."}
      </pre>
      <label className="form-field">
        <span>Terminal girdisi</span>
        <textarea
          rows={2}
          value={input}
          disabled={!connected}
          spellCheck={false}
          placeholder="Komutu yazın ve Enter ile gönderin"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
      </label>
      <div className="terminal-actions">
        <button className="button" disabled={!connected} onClick={send}>
          Gönder
        </button>
        <button
          className="button"
          disabled={!connected}
          onClick={() => {
            socketRef.current?.close(1000, "User ended session");
            setStarted(false);
          }}
        >
          Oturumu sonlandır
        </button>
      </div>
      <p className="muted">
        TTY kapalı, satır tabanlı oturum · Enter gönderir, Shift+Enter yeni
        satır ekler. ANSI kontrol kodları sadeleştirilir; tam ekran terminal
        uygulamaları ve pencere boyutlandırma desteklenmez. Panelden ayrılınca
        oturum kapanır.
      </p>
    </section>
  );
}
