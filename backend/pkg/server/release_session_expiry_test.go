package server

import (
	"context"
	"net/http/httptest"
	"testing"
	"time"
)

func TestReleaseNewOperatorContextUsesCookieAbsoluteExpiry(t *testing.T) {
	s := New()
	defer s.Close()
	_, session := s.operator(httptest.NewRequest("GET", "http://localhost/api/connection", nil), httptest.NewRecorder())
	deadline, ok := session.ctx.Deadline()
	if !ok || !deadline.Equal(session.expires) {
		t.Fatal("operator context lifetime differs from the cookie/session lifetime")
	}
	prior := session.ctx
	resetOperator(session)
	if prior.Err() != context.Canceled {
		t.Fatal("reset did not cancel the previous scope")
	}
	deadline, ok = session.ctx.Deadline()
	if !ok || !deadline.Equal(session.expires) {
		t.Fatal("scope reset extended the original session lifetime")
	}
}

// Resetting a scope/grant must not extend the original eight-hour lifetime or
// leave a stream waiting for the next HTTP request to discover expiry.
func TestReleaseOperatorResetCancelsAtAbsoluteExpiryWithoutAnotherRequest(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	session := &operatorSession{ctx: ctx, cancel: cancel, expires: time.Now().Add(25 * time.Millisecond)}
	defer func() { session.cancel() }()
	resetOperator(session)
	select {
	case <-session.ctx.Done():
		if time.Now().Before(session.expires) {
			t.Fatal("session canceled before its absolute expiry")
		}
	case <-time.After(250 * time.Millisecond):
		t.Fatal("expired operator context stayed live without another HTTP request")
	}
}
