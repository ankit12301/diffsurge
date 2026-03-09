package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/testutil"
	"github.com/stretchr/testify/assert"
)

func TestPrometheusMiddleware(t *testing.T) {
	// Reset metrics before test
	httpRequestsTotal.Reset()
	httpRequestDuration.Reset()

	handler := PrometheusMiddleware()(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("test response"))
	}))

	req := httptest.NewRequest("GET", "/test", nil)
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)

	// Check if metrics were recorded
	count := testutil.CollectAndCount(httpRequestsTotal)
	assert.Greater(t, count, 0, "httpRequestsTotal should have recorded metrics")

	count = testutil.CollectAndCount(httpRequestDuration)
	assert.Greater(t, count, 0, "httpRequestDuration should have recorded metrics")
}

func TestPrometheusMiddleware_CapturesStatusCode(t *testing.T) {
	httpRequestsTotal.Reset()

	tests := []struct {
		name       string
		statusCode int
	}{
		{"200 OK", http.StatusOK},
		{"201 Created", http.StatusCreated},
		{"400 Bad Request", http.StatusBadRequest},
		{"404 Not Found", http.StatusNotFound},
		{"500 Internal Server Error", http.StatusInternalServerError},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			handler := PrometheusMiddleware()(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(tt.statusCode)
			}))

			req := httptest.NewRequest("GET", "/test", nil)
			rec := httptest.NewRecorder()

			handler.ServeHTTP(rec, req)

			assert.Equal(t, tt.statusCode, rec.Code)
		})
	}
}

func TestPrometheusMiddleware_RecordsRequestSize(t *testing.T) {
	httpRequestSize.Reset()

	body := []byte("request body content")
	handler := PrometheusMiddleware()(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest("POST", "/test", nil)
	req.ContentLength = int64(len(body))
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	count := testutil.CollectAndCount(httpRequestSize)
	assert.Greater(t, count, 0, "httpRequestSize should have recorded metrics")
}

func TestMetricsHelpers(t *testing.T) {
	t.Run("RecordTrafficCaptured", func(t *testing.T) {
		trafficCapturedTotal.Reset()
		RecordTrafficCaptured("project-123", "GET")
		count := testutil.CollectAndCount(trafficCapturedTotal)
		assert.Greater(t, count, 0)
	})

	t.Run("RecordReplaySession", func(t *testing.T) {
		replaySessionsTotal.Reset()
		RecordReplaySession("project-123", "completed")
		count := testutil.CollectAndCount(replaySessionsTotal)
		assert.Greater(t, count, 0)
	})

	t.Run("RecordReplayDuration", func(t *testing.T) {
		replayDuration.Reset()
		RecordReplayDuration("project-123", 5*time.Second)
		count := testutil.CollectAndCount(replayDuration)
		assert.Greater(t, count, 0)
	})

	t.Run("RecordDBQuery", func(t *testing.T) {
		dbQueriesTotal.Reset()
		dbQueryDuration.Reset()
		RecordDBQuery("SELECT", "traffic_logs", 50*time.Millisecond)
		assert.Greater(t, testutil.CollectAndCount(dbQueriesTotal), 0)
		assert.Greater(t, testutil.CollectAndCount(dbQueryDuration), 0)
	})

	t.Run("RecordRedisOperation", func(t *testing.T) {
		redisOperationsTotal.Reset()
		redisOperationDuration.Reset()
		RecordRedisOperation("GET", "success", 2*time.Millisecond)
		assert.Greater(t, testutil.CollectAndCount(redisOperationsTotal), 0)
		assert.Greater(t, testutil.CollectAndCount(redisOperationDuration), 0)
	})

	t.Run("SetDBConnectionsActive", func(t *testing.T) {
		SetDBConnectionsActive(10)
		value := testutil.ToFloat64(dbConnectionsActive)
		assert.Equal(t, float64(10), value)
	})

	t.Run("RecordRateLimitHit", func(t *testing.T) {
		rateLimitHitsTotal.Reset()
		RecordRateLimitHit("free", "/api/v1/traffic")
		count := testutil.CollectAndCount(rateLimitHitsTotal)
		assert.Greater(t, count, 0)
	})

	t.Run("RecordPIIDetection", func(t *testing.T) {
		piiDetectionsTotal.Reset()
		RecordPIIDetection("email")
		count := testutil.CollectAndCount(piiDetectionsTotal)
		assert.Greater(t, count, 0)
	})

	t.Run("RecordPIIScanDuration", func(t *testing.T) {
		piiScanDuration = prometheus.NewHistogram(
			prometheus.HistogramOpts{
				Name:    "diffsurge_pii_scan_duration_seconds_test",
				Help:    "PII scanning duration in seconds",
				Buckets: []float64{.0001, .0005, .001, .005, .01, .05, .1},
			},
		)
		RecordPIIScanDuration(500 * time.Microsecond)
		count := testutil.CollectAndCount(piiScanDuration)
		assert.Greater(t, count, 0)
	})
}

func BenchmarkPrometheusMiddleware(b *testing.B) {
	handler := PrometheusMiddleware()(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("benchmark"))
	}))

	req := httptest.NewRequest("GET", "/benchmark", nil)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)
	}
}
