// The Kubernetes /log URL is name-addressed. Gateway guards are deliberately
// explicit; an unverified response must not be shown as this Pod UID's output.
export const LOG_PROTOCOL = "guarded-text-v1";
export const MAX_LOG_GUARD_CHARS = 8192;
let sequence = 0;

export function logSessionID() {
  return (
    globalThis.crypto?.randomUUID?.() ||
    `log-${Date.now().toString(36)}-${++sequence}`
  );
}

export function verifyLogOpening(headers, uid, session) {
  if (!uid || headers.get("X-KubeView-Pod-UID") !== uid)
    throw new Error(
      "Log yanıtının Pod UID’si doğrulanamadı; farklı kaynak çıktısı gösterilmedi.",
    );
  if (
    headers.get("X-KubeView-Log-Session") !== session ||
    headers.get("X-KubeView-Log-Protocol") !== LOG_PROTOCOL
  )
    throw new Error("Log oturumu doğrulanamadı; kaynağı yeniden açın.");
}

/** Normal bytes pass through; only a bounded current-session guard tail waits. */
export class LogStreamDecoder {
  constructor(session) {
    this.prefix = `\n\x1eKUBEVIEW_LOG_ERROR:${session}:`;
    this.pending = "";
    this.ended = false;
  }
  push(chunk, final = false) {
    if (this.ended) return { text: "", error: null };
    this.pending += chunk;
    const at = this.pending.indexOf(this.prefix);
    if (at < 0) {
      let held = final
        ? 0
        : Math.min(this.pending.length, this.prefix.length - 1);
      while (held && !this.prefix.startsWith(this.pending.slice(-held))) --held;
      const text = this.pending.slice(0, this.pending.length - held);
      this.pending = held ? this.pending.slice(-held) : "";
      return { text, error: null };
    }
    const text = this.pending.slice(0, at);
    const detail = this.pending.slice(at + this.prefix.length);
    const end = detail.indexOf("\n");
    if (end < 0 && !final && detail.length <= MAX_LOG_GUARD_CHARS) {
      this.pending = this.prefix + detail;
      return { text, error: null };
    }
    this.ended = true;
    this.pending = "";
    if (end < 0 || end > MAX_LOG_GUARD_CHARS)
      return {
        text,
        error: "Log kimlik denetimi kesildi; akış güvenli biçimde kapatıldı.",
      };
    try {
      const result = JSON.parse(detail.slice(0, end));
      return {
        text,
        error: String(
          result.error || "Log kimliği veya watch doğrulaması kaybedildi.",
        ).slice(0, 4096),
      };
    } catch {
      return {
        text,
        error: "Log oturumu hata kaydı okunamadı; akış kapatıldı.",
      };
    }
  }
}
