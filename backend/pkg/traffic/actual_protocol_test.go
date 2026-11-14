package traffic

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// Replays actual privacy-whitelisted Hubble1.20.2 JSONPB captured in the owned
// repair lab, not hand-authored provider data. The live capture itself is in
// artifacts/pre-v11-repair/repair-20261101T130559Z/hubble-protocol-actual-*.json.
// Unit replay proves classification stability; it is not a new live E2E run.
func TestActualMaskedProviderProtocolClassification(t *testing.T) {
	for _, tc := range []struct{ file, protocol, transport string }{
		{"hubble-1.20.2-l4-old-mask.json", "TCP", "TCP"},
		{"hubble-1.20.2-l4-safe-mask.json", "TCP", "TCP"},
		{"hubble-1.20.2-l4-safe-mask-empty-oneof.json", "TCP", "TCP"},
		{"hubble-1.20.2-http-response-safe-mask.json", "HTTP", "TCP"},
		{"hubble-1.20.2-dns-response-safe-mask.json", "DNS", "UDP"},
	} {
		t.Run(tc.file, func(t *testing.T) {
			raw, err := os.ReadFile(filepath.Join("testdata", tc.file))
			if err != nil {
				t.Fatal(err)
			}
			if strings.Contains(string(raw), `"url"`) || strings.Contains(string(raw), `"headers"`) || strings.Contains(string(raw), `"query"`) {
				t.Fatal("actual fixture includes disallowed application content")
			}
			row, _, err := decodeObservation(raw)
			if err != nil || row == nil || row.protocol != tc.protocol || row.transport != tc.transport {
				t.Fatalf("actual provider classification: got=%+v err=%v want=%s/%s", row, err, tc.protocol, tc.transport)
			}
			if tc.protocol == "TCP" && (row.httpCode != nil || row.httpProtocol != nil || row.dnsRcode != nil || row.latencyMS != nil) {
				t.Fatal("materialized/stale L7 fields escaped genuine L3/L4 observation")
			}
			if tc.protocol == "HTTP" && (row.httpCode == nil || *row.httpCode != 200 || row.httpProtocol == nil || row.latencyMS == nil) {
				t.Fatal("actual measured HTTP response metadata lost")
			}
		})
	}
}

func TestUnknownOrAmbiguousL7NeverInventsApplicationProtocol(t *testing.T) {
	for _, line := range []string{
		`{"flow":{"time":"2026-11-01T00:00:00Z","Type":"L3_L4","l4":{"TCP":{"destination_port":80}},"l7":{"type":"RESPONSE","http":{"code":200,"protocol":"HTTP/1.1"}}}}`,
		`{"flow":{"time":"2026-11-01T00:00:00Z","Type":"L7","l4":{"TCP":{"destination_port":80}},"l7":{"http":{}}}}`,
		`{"flow":{"time":"2026-11-01T00:00:00Z","Type":"L7","l4":{"TCP":{"destination_port":80}},"l7":{"type":"UNKNOWN_L7_TYPE","http":{"code":200}}}}`,
		`{"flow":{"time":"2026-11-01T00:00:00Z","Type":"L7","l4":{"TCP":{"destination_port":80}},"l7":{"type":"REQUEST","http":{},"dns":{}}}}`,
	} {
		row, _, err := decodeObservation([]byte(line))
		if err != nil || row.protocol != "TCP" || row.httpCode != nil || row.dnsRcode != nil || row.latencyMS != nil {
			t.Fatalf("ambiguous/unsupported observation inferred HTTP/DNS: %+v %v", row, err)
		}
	}
}
