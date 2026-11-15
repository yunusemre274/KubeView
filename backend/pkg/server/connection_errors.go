package server

import (
	"context"
	"crypto/x509"
	"errors"
	"net"
	"net/http"
	"strings"

	apierrors "k8s.io/apimachinery/pkg/api/errors"
)

// Upstream errors can contain exec plugin stderr, kubeconfig paths, URLs with
// credentials, or rejected Secret values. Return a useful classification rather
// than passing that untrusted text to a browser or diagnostic export.
type connectionError struct {
	Error     string `json:"error"`
	Code      int    `json:"code"`
	Category  string `json:"category"`
	Retryable bool   `json:"retryable"`
}

func publicError(err error) connectionError {
	v := connectionError{Error: "Kubernetes isteği tamamlanamadı", Code: 503, Category: "upstream", Retryable: true}
	if err == nil {
		return v
	}
	var apiStatus apierrors.APIStatus
	if errors.As(err, &apiStatus) {
		status := apiStatus.Status()
		lower := strings.ToLower(err.Error())
		if status.Code >= 400 && status.Code <= 599 {
			v.Code = int(status.Code)
		}
		switch v.Code {
		case 401:
			v.Category, v.Error, v.Retryable = "authentication", "Kubernetes kimliği doğrulanamadı; erişim bilgilerinizi yenileyin", false
		case 403:
			v.Category, v.Error, v.Retryable = "forbidden", "Kubernetes yetkisi bu kaynak veya işlem için yeterli değil", false
		case 404:
			v.Category, v.Error, v.Retryable = "not_found", "Kaynak veya Kubernetes API bulunamadı", false
		case 409:
			v.Category, v.Error, v.Retryable = "conflict", "Kaynak UID veya resourceVersion değişti; yeniden yükleyip inceleyin", false
		case 400, 422:
			v.Category, v.Error, v.Retryable = "validation", "Kubernetes isteği doğrulamayı geçemedi; kaynak alanlarını ve kapsamı kontrol edin", false
		case 429:
			v.Category, v.Error = "rate_limited", "Kubernetes istek sınırına ulaşıldı; tekrar deneyin"
		case 408, 504:
			v.Category, v.Error = "timeout", "Kubernetes isteği zaman aşımına uğradı; sonucu yeniden okuyun"
		}
		switch {
		case strings.Contains(lower, "sunucu salt okunur"):
			v.Category, v.Error, v.Retryable = "read_only", "Sunucu salt okunur modda (READ_ONLY=true)", false
		case strings.Contains(lower, "kubeview yönetim"):
			v.Category, v.Error, v.Retryable = "management_disabled", "Bu bağlantı ve kapsam için yönetim modunu açıkça etkinleştirin", false
		case strings.Contains(lower, "kubeview bağlantı oturumu"):
			v.Category, v.Error, v.Retryable = "connection_changed", "Bağlantı oturumu değişti; kaynağı yeniden seçin", false
		case strings.Contains(lower, "exceeded quota"):
			v.Category, v.Error, v.Retryable = "quota", "Kubernetes kaynak kotası aşıldı; namespace kotasını ve istek miktarını kontrol edin", false
		case strings.Contains(lower, "disruption budget") || strings.Contains(lower, "poddisruptionbudget"):
			v.Category, v.Error, v.Retryable = "disruption_budget", "PodDisruptionBudget kesintiye izin vermiyor (disruption budget)", false
		case strings.Contains(lower, "admission webhook") || strings.Contains(lower, "admission policy"):
			v.Category, v.Error, v.Retryable = "admission", "Kubernetes admission ilkesi isteği reddetti; namespace ve workload ilkelerini kontrol edin", false
		}
		return v
	}
	var unknownAuthority x509.UnknownAuthorityError
	var hostname x509.HostnameError
	var invalid x509.CertificateInvalidError
	var dns *net.DNSError
	var netErr net.Error
	lower := strings.ToLower(err.Error())
	switch {
	case errors.Is(err, context.DeadlineExceeded) || errors.As(err, &netErr) && netErr.Timeout():
		v.Category, v.Error = "timeout", "Kubernetes bağlantısı zaman aşımına uğradı; ağ/VPN erişimini kontrol edin"
	case errors.As(err, &unknownAuthority) || errors.As(err, &hostname) || errors.As(err, &invalid) || strings.Contains(lower, "tls:") || strings.Contains(lower, "x509:"):
		v.Category, v.Error, v.Retryable = "tls", "Kubernetes TLS sertifikası doğrulanamadı; güvenilir CA ve sertifika süresini kontrol edin", false
	case strings.Contains(lower, "exec:") || strings.Contains(lower, "executable") || strings.Contains(lower, "exec plugin") || strings.Contains(lower, "getting credentials"):
		v.Category, v.Error, v.Retryable = "auth_plugin", "Kubeconfig kimlik eklentisi çalıştırılamadı; güvenilir auth eklentisinin kurulumunu ve oturumunu kontrol edin", false
	case errors.As(err, &dns):
		v.Category, v.Error = "dns", "Kubernetes API sunucu adı çözümlenemedi; DNS/VPN erişimini kontrol edin"
	case strings.Contains(lower, "configuration") || strings.Contains(lower, "context") || strings.Contains(lower, "kubeconfig") || strings.Contains(lower, "yapılandır"):
		v.Category, v.Error, v.Retryable = "configuration", "Kubeconfig veya seçili context geçersiz; yalnız güvenilir yerel yapılandırmayı kontrol edin", false
	case strings.Contains(lower, "connection refused") || strings.Contains(lower, "no route to host") || errors.As(err, &netErr):
		v.Category, v.Error = "network", "Kubernetes API sunucusuna erişilemiyor; adres, port ve VPN erişimini kontrol edin"
	}
	return v
}

func failure(w http.ResponseWriter, err error) {
	v := publicError(err)
	jsonResponse(w, v.Code, v)
}

func safeError(err error) string { return publicError(err).Error }
