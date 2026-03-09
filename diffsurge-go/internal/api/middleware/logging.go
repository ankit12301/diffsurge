package middleware

import (
	"net/http"
	"time"

	"github.com/diffsurge-org/diffsurge/pkg/logger"
)

type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (r *statusRecorder) WriteHeader(code int) {
	r.status = code
	r.ResponseWriter.WriteHeader(code)
}

func Logging(log *logger.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			rec := &statusRecorder{ResponseWriter: w, status: http.StatusOK}

			next.ServeHTTP(rec, r)

			duration := time.Since(start)
			log.Info().
				Str("method", r.Method).
				Str("path", r.URL.Path).
				Int("status", rec.status).
				Dur("duration", duration).
				Str("request_id", GetRequestID(r.Context())).
				Str("remote_addr", r.RemoteAddr).
				Msg("request completed")
		})
	}
}
