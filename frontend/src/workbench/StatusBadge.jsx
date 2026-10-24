import React from "react";
import { CheckCircle2, AlertCircle, Circle, Clock3 } from "lucide-react";
import { resourceStatus } from "./resourceUtils";
export default function StatusBadge({ resource, status }) {
  const value = status || resourceStatus(resource);
  const Icon =
    value.tone === "success"
      ? CheckCircle2
      : value.tone === "danger"
        ? AlertCircle
        : value.tone === "warning"
          ? Clock3
          : Circle;
  return (
    <span className={`status-badge status-${value.tone}`}>
      <Icon size={13} aria-hidden="true" />
      {value.label}
    </span>
  );
}
