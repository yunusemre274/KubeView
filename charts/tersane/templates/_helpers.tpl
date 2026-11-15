{{- define "tersane.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- define "tersane.fullname" -}}
{{- if .Values.fullnameOverride -}}{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}{{- else -}}{{- printf "%s-%s" .Release.Name (include "tersane.name" .) | trunc 63 | trimSuffix "-" -}}{{- end -}}
{{- end -}}
{{- define "tersane.selectorLabels" -}}
app.kubernetes.io/name: {{ include "tersane.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}
{{- define "tersane.labels" -}}
{{ include "tersane.selectorLabels" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | quote }}
{{- end -}}
{{- define "tersane.serviceAccountName" -}}
{{- if .Values.serviceAccount.create -}}{{- default (include "tersane.fullname" .) .Values.serviceAccount.name -}}{{- else -}}{{- default "default" .Values.serviceAccount.name -}}{{- end -}}
{{- end -}}
{{- define "tersane.authSecret" -}}
{{- default (printf "%s-auth" (include "tersane.fullname" .)) .Values.auth.existingSecret -}}
{{- end -}}
