package middleware

import (
	"net/http"
	"strings"
)

type CORSConfig struct {
	AllowedOrigins   []string
	AllowedMethods   []string
	AllowedHeaders   []string
	AllowCredentials bool
	MaxAge           int
}

func DefaultCORSConfig() CORSConfig {
	return CORSConfig{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Authorization", "Content-Type", "X-Request-ID"},
		AllowCredentials: true,
		MaxAge:           86400,
	}
}

func CORS(cfg CORSConfig) func(http.Handler) http.Handler {
	methods := strings.Join(cfg.AllowedMethods, ", ")
	headers := strings.Join(cfg.AllowedHeaders, ", ")

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")
			if origin == "" {
				next.ServeHTTP(w, r)
				return
			}

			allowed := false
			for _, o := range cfg.AllowedOrigins {
				if o == "*" || o == origin {
					allowed = true
					break
				}
			}

			if !allowed {
				next.ServeHTTP(w, r)
				return
			}

			if cfg.AllowedOrigins[0] == "*" && !cfg.AllowCredentials {
				w.Header().Set("Access-Control-Allow-Origin", "*")
			} else {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Vary", "Origin")
			}

			w.Header().Set("Access-Control-Allow-Methods", methods)
			w.Header().Set("Access-Control-Allow-Headers", headers)

			if cfg.AllowCredentials {
				w.Header().Set("Access-Control-Allow-Credentials", "true")
			}

			if r.Method == http.MethodOptions {
				w.Header().Set("Access-Control-Max-Age", "86400")
				w.WriteHeader(http.StatusNoContent)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
