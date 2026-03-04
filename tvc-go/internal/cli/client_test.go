package cli

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestAPIClient_AddsAuthHeader(t *testing.T) {
	var receivedKey string
	var receivedUA string

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		receivedKey = r.Header.Get("X-API-Key")
		receivedUA = r.Header.Get("User-Agent")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	}))
	defer server.Close()

	client := NewAPIClient(server.URL, "tvc_live_testabc123")

	resp, err := client.Get("/api/v1/health")
	require.NoError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, "tvc_live_testabc123", receivedKey)
	assert.Equal(t, "diffsurge-cli", receivedUA)
	assert.Equal(t, http.StatusOK, resp.StatusCode)
}

func TestAPIClient_PostSendsBody(t *testing.T) {
	var receivedBody string

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)
		receivedBody = string(body)
		assert.Equal(t, "POST", r.Method)
		assert.Equal(t, "application/json", r.Header.Get("Content-Type"))
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	}))
	defer server.Close()

	client := NewAPIClient(server.URL, "tvc_live_testkey")

	resp, err := client.Post("/api/v1/test", strings.NewReader(`{"hello":"world"}`))
	require.NoError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, `{"hello":"world"}`, receivedBody)
}

func TestAPIClient_Handles401(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
		_, _ = w.Write([]byte(`{"error":"Invalid or expired token"}`))
	}))
	defer server.Close()

	client := NewAPIClient(server.URL, "tvc_live_badkey")

	_, err := client.Get("/api/v1/health")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "Authentication failed")
}

func TestAPIClient_Handles403(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusForbidden)
		_, _ = w.Write([]byte(`{"error":"Insufficient permissions"}`))
	}))
	defer server.Close()

	client := NewAPIClient(server.URL, "tvc_live_limited")

	_, err := client.Get("/api/v1/projects")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "Permission denied")
}

func TestAPIClient_Handles500(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
		_, _ = w.Write([]byte(`{"error":"Internal error"}`))
	}))
	defer server.Close()

	client := NewAPIClient(server.URL, "tvc_live_testkey")

	_, err := client.Get("/api/v1/health")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "API error (500)")
}

func TestAPIClient_Handles404(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNotFound)
		_, _ = w.Write([]byte(`{"error":"Project not found"}`))
	}))
	defer server.Close()

	client := NewAPIClient(server.URL, "tvc_live_testkey")

	_, err := client.Get("/api/v1/projects/nonexistent")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "Not found")
}
