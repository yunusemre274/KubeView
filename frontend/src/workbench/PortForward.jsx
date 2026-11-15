import React, { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Network, Square } from "lucide-react";

export default function PortForward({
  resource,
  cluster,
  api,
  disabled,
  reason,
}) {
  const declaredPorts = (resource.spec?.containers || [])
    .flatMap((c) => c.ports || [])
    .filter((p) => p.protocol !== "UDP");
  const [port, setPort] = useState(declaredPorts[0]?.containerPort || 80),
    [session, setSession] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const sessionRef = useRef(null),
    mounted = useRef(true);
  const closeSession = async () => {
    const current = sessionRef.current;
    sessionRef.current = null;
    if (!current) return;
    try {
      await api.request(
        `/api/portforwards?id=${encodeURIComponent(current.id)}`,
        { method: "DELETE" },
      );
      if (mounted.current) setSession(null);
    } catch (e) {
      if (mounted.current) setError(e.message);
    }
  };
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      const current = sessionRef.current;
      sessionRef.current = null;
      if (current)
        api
          .request(`/api/portforwards?id=${encodeURIComponent(current.id)}`, {
            method: "DELETE",
          })
          .catch(() => {});
    };
  }, [resource.metadata.uid, api]);
  const openSession = async () => {
    const value = Number(port);
    if (!Number.isInteger(value) || value < 1 || value > 65535) {
      setError("Port 1–65535 arasında bir tam sayı olmalı.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await api.request("/api/portforwards", {
        method: "POST",
        body: {
          context: cluster,
          namespace: resource.metadata.namespace,
          pod: resource.metadata.name,
          uid: resource.metadata.uid,
          port: value,
        },
      });
      if (!mounted.current) {
        await api.request(
          `/api/portforwards?id=${encodeURIComponent(result.id)}`,
          { method: "DELETE" },
        );
        return;
      }
      sessionRef.current = result;
      setSession(result);
    } catch (e) {
      if (mounted.current) setError(e.message);
    } finally {
      if (mounted.current) setBusy(false);
    }
  };
  return (
    <section className="port-forward">
      <div className="inline-alert alert-info">
        <Network size={17} />
        <span>
          Gerçek Kubernetes pods/portforward bağlantısı. Seçili Pod’un TCP
          portundaki HTTP uygulamasını aynı origin altında önizleyin.
        </span>
      </div>
      {disabled && (
        <div className="inline-alert">
          {reason || "pods/portforward create yetkisi gerekli."}
        </div>
      )}
      <label className="form-field">
        <span>Pod TCP portu</span>
        <input
          type="number"
          min={1}
          max={65535}
          disabled={!!session || busy}
          value={port}
          onChange={(e) => setPort(e.target.value)}
        />
        {declaredPorts.length > 0 && (
          <small>
            Bildirilen portlar:{" "}
            {declaredPorts.map((p) => p.containerPort).join(", ")}
          </small>
        )}
      </label>
      {error && (
        <div className="inline-alert alert-danger" role="alert">
          {error}
        </div>
      )}
      {session ? (
        <>
          <div className="inline-alert alert-success">
            Oturum oluşturuldu. Gerçek SPDY bağlantısı uygulama isteğiyle
            açılır; uygulamanın yanıtı ayrı doğrulanır.
          </div>
          <dl>
            <div className="detail-row">
              <dt>Pod</dt>
              <dd>
                {resource.metadata.namespace}/{resource.metadata.name}:
                {session.port}
              </dd>
            </div>
            <div className="detail-row">
              <dt>Oturum süresi</dt>
              <dd>
                {new Date(session.expiresAt).toLocaleTimeString("tr-TR")}{" "}
                tarihine kadar
              </dd>
            </div>
            <div className="detail-row">
              <dt>Taşıma</dt>
              <dd>{session.transport}</dd>
            </div>
          </dl>
          <div className="terminal-actions">
            <a
              className="button button-primary"
              href={api?.url ? api.url(session.url) : session.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Uygulamayı aç
              <ArrowUpRight size={15} />
            </a>
            <button className="button" onClick={closeSession}>
              <Square size={14} />
              Oturumu kapat
            </button>
          </div>
        </>
      ) : (
        <button
          className="button button-primary"
          disabled={disabled || busy}
          onClick={openSession}
        >
          {busy ? "Oturum oluşturuluyor…" : "Port-forward oturumu aç"}
        </button>
      )}
      <p className="muted">
        HTTP önizlemesi sandbox ve cookie temizliği uygular. Kök dizinden
        başlayan asset yolları bu önizlemede çalışmayabilir. Ham TCP erişimi
        ayrı WebSocket taşımasındadır; bu panel yerel işletim sistemi portu
        açmaz. Panelden ayrılınca oturum kapanır, sunucuda en geç 15 dakika
        sonra sona erer.
      </p>
    </section>
  );
}
