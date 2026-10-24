import React, { useEffect, useRef } from "react";
import { X, ArrowLeft } from "lucide-react";
export function isolateWorld(event) {
  event.stopPropagation();
}
export default function Window({
  title,
  subtitle,
  icon: Icon,
  children,
  onClose,
  onBack,
  className = "",
  modal = false,
  footer,
}) {
  const ref = useRef(null),
    closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement;
    const frame = requestAnimationFrame(() => {
      const target =
        ref.current?.querySelector("[data-autofocus]") ||
        ref.current?.querySelector("input,button,select");
      target?.focus();
    });
    const key = (e) => {
      if (
        e.key === "Escape" &&
        !document.querySelector(".resource-form-dialog")
      ) {
        e.stopPropagation();
        e.preventDefault();
        closeRef.current?.();
      }
      if (e.key === "Tab" && modal) {
        const nodes = [
          ...ref.current.querySelectorAll(
            'button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex="0"]',
          ),
        ].filter((n) => n.offsetParent !== null);
        if (e.shiftKey && document.activeElement === nodes[0]) {
          e.preventDefault();
          nodes.at(-1)?.focus();
        } else if (!e.shiftKey && document.activeElement === nodes.at(-1)) {
          e.preventDefault();
          nodes[0]?.focus();
        }
      }
    };
    ref.current?.addEventListener("keydown", key);
    return () => {
      cancelAnimationFrame(frame);
      ref.current?.removeEventListener("keydown", key);
      if (previous?.isConnected) previous.focus();
      else document.getElementById("world-find")?.focus();
    };
  }, [modal]);
  const content = (
    <section
      ref={ref}
      className={`world-window ${className}`}
      role="dialog"
      aria-modal={modal || undefined}
      aria-label={title}
      onPointerDown={isolateWorld}
      onPointerMove={isolateWorld}
      onPointerUp={isolateWorld}
      onClick={isolateWorld}
      onDoubleClick={isolateWorld}
      onWheel={isolateWorld}
      onTouchStart={isolateWorld}
    >
      <header className="window-header">
        <div className="window-heading">
          {onBack && (
            <button className="icon-button" aria-label="Geri" onClick={onBack}>
              <ArrowLeft />
            </button>
          )}
          {Icon && (
            <span className="window-icon">
              <Icon size={20} />
            </span>
          )}
          <div>
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
        </div>
        <button
          className="icon-button"
          aria-label="Pencereyi kapat"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </header>
      <div className="window-content">{children}</div>
      {footer && <footer className="window-footer">{footer}</footer>}
    </section>
  );
  return modal ? (
    <div
      className="world-modal-layer"
      onPointerDown={isolateWorld}
      onWheel={isolateWorld}
    >
      {content}
    </div>
  ) : (
    content
  );
}
