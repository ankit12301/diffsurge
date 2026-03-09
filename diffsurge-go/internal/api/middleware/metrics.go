package middleware

import (
	"net/http"
	"strconv"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

// Prometheus metrics collectors
var (
	// HTTP request metrics
	httpRequestsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "diffsurge_http_requests_total",
			Help: "Total number of HTTP requests processed",
		},
		[]string{"method", "path", "status"},
	)

	httpRequestDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "diffsurge_http_request_duration_seconds",
			Help:    "HTTP request latency in seconds",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"method", "path"},
	)

	httpRequestSize = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "diffsurge_http_request_size_bytes",
			Help:    "HTTP request size in bytes",
			Buckets: prometheus.ExponentialBuckets(100, 10, 8), // 100B to ~100MB
		},
		[]string{"method", "path"},
	)

	httpResponseSize = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "diffsurge_http_response_size_bytes",
			Help:    "HTTP response size in bytes",
			Buckets: prometheus.ExponentialBuckets(100, 10, 8),
		},
		[]string{"method", "path"},
	)

	// Traffic capture metrics
	trafficCapturedTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "diffsurge_traffic_captured_total",
			Help: "Total number of traffic logs captured",
		},
		[]string{"project_id", "method"},
	)

	trafficCaptureErrors = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "diffsurge_traffic_capture_errors_total",
			Help: "Total number of traffic capture errors",
		},
		[]string{"project_id", "error_type"},
	)

	// Replay metrics
	replaySessionsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "diffsurge_replay_sessions_total",
			Help: "Total number of replay sessions",
		},
		[]string{"project_id", "status"},
	)

	replayRequestsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "diffsurge_replay_requests_total",
			Help: "Total number of replay requests executed",
		},
		[]string{"project_id", "status"},
	)

	replayDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "diffsurge_replay_duration_seconds",
			Help:    "Replay session duration in seconds",
			Buckets: prometheus.ExponentialBuckets(1, 2, 10), // 1s to ~17m
		},
		[]string{"project_id"},
	)

	replayDiffsDetected = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "diffsurge_replay_diffs_detected_total",
			Help: "Total number of diffs detected during replay",
		},
		[]string{"project_id", "severity"},
	)

	// Database metrics
	dbQueriesTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "diffsurge_db_queries_total",
			Help: "Total number of database queries",
		},
		[]string{"operation", "table"},
	)

	dbQueryDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "diffsurge_db_query_duration_seconds",
			Help:    "Database query duration in seconds",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"operation", "table"},
	)

	dbConnectionsActive = promauto.NewGauge(
		prometheus.GaugeOpts{
			Name: "diffsurge_db_connections_active",
			Help: "Number of active database connections",
		},
	)

	// Redis metrics
	redisOperationsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "diffsurge_redis_operations_total",
			Help: "Total number of Redis operations",
		},
		[]string{"operation", "status"},
	)

	redisOperationDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "diffsurge_redis_operation_duration_seconds",
			Help:    "Redis operation duration in seconds",
			Buckets: []float64{.001, .005, .01, .025, .05, .1, .25, .5, 1},
		},
		[]string{"operation"},
	)

	// Rate limiting metrics
	rateLimitHitsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "diffsurge_rate_limit_hits_total",
			Help: "Total number of rate limit hits (blocked requests)",
		},
		[]string{"tier", "endpoint"},
	)

	// PII detection metrics
	piiDetectionsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "diffsurge_pii_detections_total",
			Help: "Total number of PII patterns detected",
		},
		[]string{"pattern_type"},
	)

	piiScanDuration = promauto.NewHistogram(
		prometheus.HistogramOpts{
			Name:    "diffsurge_pii_scan_duration_seconds",
			Help:    "PII scanning duration in seconds",
			Buckets: []float64{.0001, .0005, .001, .005, .01, .05, .1},
		},
	)
)

// PrometheusMiddleware records HTTP metrics for all requests
func PrometheusMiddleware() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()

			// Record request size
			if r.ContentLength > 0 {
				httpRequestSize.WithLabelValues(
					r.Method,
					r.URL.Path,
				).Observe(float64(r.ContentLength))
			}

			// Wrap response writer to capture status and size
			rw := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}

			// Process request
			next.ServeHTTP(rw, r)

			// Record metrics after request completes
			duration := time.Since(start).Seconds()
			status := strconv.Itoa(rw.statusCode)

			httpRequestsTotal.WithLabelValues(
				r.Method,
				r.URL.Path,
				status,
			).Inc()

			httpRequestDuration.WithLabelValues(
				r.Method,
				r.URL.Path,
			).Observe(duration)

			httpResponseSize.WithLabelValues(
				r.Method,
				r.URL.Path,
			).Observe(float64(rw.size))
		})
	}
}

// responseWriter wraps http.ResponseWriter to capture status code and size
type responseWriter struct {
	http.ResponseWriter
	statusCode int
	size       int
}

func (rw *responseWriter) WriteHeader(statusCode int) {
	rw.statusCode = statusCode
	rw.ResponseWriter.WriteHeader(statusCode)
}

func (rw *responseWriter) Write(b []byte) (int, error) {
	n, err := rw.ResponseWriter.Write(b)
	rw.size += n
	return n, err
}

// MetricsHelpers provides convenience functions for recording metrics

// RecordTrafficCaptured increments the traffic captured counter
func RecordTrafficCaptured(projectID, method string) {
	trafficCapturedTotal.WithLabelValues(projectID, method).Inc()
}

// RecordTrafficCaptureError increments the traffic capture error counter
func RecordTrafficCaptureError(projectID, errorType string) {
	trafficCaptureErrors.WithLabelValues(projectID, errorType).Inc()
}

// RecordReplaySession increments the replay session counter
func RecordReplaySession(projectID, status string) {
	replaySessionsTotal.WithLabelValues(projectID, status).Inc()
}

// RecordReplayRequest increments the replay request counter
func RecordReplayRequest(projectID, status string) {
	replayRequestsTotal.WithLabelValues(projectID, status).Inc()
}

// RecordReplayDuration records the duration of a replay session
func RecordReplayDuration(projectID string, duration time.Duration) {
	replayDuration.WithLabelValues(projectID).Observe(duration.Seconds())
}

// RecordReplayDiff increments the diff detection counter
func RecordReplayDiff(projectID, severity string) {
	replayDiffsDetected.WithLabelValues(projectID, severity).Inc()
}

// RecordDBQuery records database query metrics
func RecordDBQuery(operation, table string, duration time.Duration) {
	dbQueriesTotal.WithLabelValues(operation, table).Inc()
	dbQueryDuration.WithLabelValues(operation, table).Observe(duration.Seconds())
}

// SetDBConnectionsActive sets the active database connections gauge
func SetDBConnectionsActive(count int) {
	dbConnectionsActive.Set(float64(count))
}

// RecordRedisOperation records Redis operation metrics
func RecordRedisOperation(operation, status string, duration time.Duration) {
	redisOperationsTotal.WithLabelValues(operation, status).Inc()
	redisOperationDuration.WithLabelValues(operation).Observe(duration.Seconds())
}

// RecordRateLimitHit increments the rate limit hit counter
func RecordRateLimitHit(tier, endpoint string) {
	rateLimitHitsTotal.WithLabelValues(tier, endpoint).Inc()
}

// RecordPIIDetection increments the PII detection counter
func RecordPIIDetection(patternType string) {
	piiDetectionsTotal.WithLabelValues(patternType).Inc()
}

// RecordPIIScanDuration records PII scanning duration
func RecordPIIScanDuration(duration time.Duration) {
	piiScanDuration.Observe(duration.Seconds())
}
