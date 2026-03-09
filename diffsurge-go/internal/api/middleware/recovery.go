package middleware

import (
	"net/http"
	"runtime/debug"

	"github.com/diffsurge-org/diffsurge/internal/api/response"
	"github.com/diffsurge-org/diffsurge/pkg/logger"
)

func Recovery(log *logger.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func() {
				if err := recover(); err != nil {
					log.Error().
						Interface("panic", err).
						Str("stack", string(debug.Stack())).
						Str("method", r.Method).
						Str("path", r.URL.Path).
						Str("request_id", GetRequestID(r.Context())).
						Msg("panic recovered")

					response.InternalError(w)
				}
			}()
			next.ServeHTTP(w, r)
		})
	}
}
