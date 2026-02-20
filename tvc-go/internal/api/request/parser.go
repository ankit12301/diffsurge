package request

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
)

const (
	DefaultMaxBodySize = 1 << 20  // 1MB
	SchemaMaxBodySize  = 10 << 20 // 10MB
)

func ParseJSON(r *http.Request, maxSize int64, dst interface{}) error {
	if maxSize == 0 {
		maxSize = DefaultMaxBodySize
	}
	r.Body = http.MaxBytesReader(nil, r.Body, maxSize)

	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()

	if err := dec.Decode(dst); err != nil {
		if err.Error() == "http: request body too large" {
			return fmt.Errorf("request body too large")
		}
		return fmt.Errorf("invalid JSON: %w", err)
	}

	if dec.More() {
		return fmt.Errorf("request body must contain a single JSON object")
	}

	return nil
}

func PathUUID(r *http.Request, name string) (uuid.UUID, error) {
	raw := r.PathValue(name)
	if raw == "" {
		return uuid.Nil, fmt.Errorf("missing path parameter: %s", name)
	}
	id, err := uuid.Parse(raw)
	if err != nil {
		return uuid.Nil, fmt.Errorf("invalid UUID for %s: %s", name, raw)
	}
	return id, nil
}

func QueryString(r *http.Request, key, defaultVal string) string {
	val := r.URL.Query().Get(key)
	if val == "" {
		return defaultVal
	}
	return val
}

func QueryInt(r *http.Request, key string, defaultVal int) int {
	val := r.URL.Query().Get(key)
	if val == "" {
		return defaultVal
	}
	n, err := strconv.Atoi(val)
	if err != nil {
		return defaultVal
	}
	return n
}

func QueryTime(r *http.Request, key string) *time.Time {
	val := r.URL.Query().Get(key)
	if val == "" {
		return nil
	}
	t, err := time.Parse(time.RFC3339, val)
	if err != nil {
		return nil
	}
	return &t
}

func QueryStringSlice(r *http.Request, key string) []string {
	val := r.URL.Query().Get(key)
	if val == "" {
		return nil
	}
	parts := strings.Split(val, ",")
	result := make([]string, 0, len(parts))
	for _, p := range parts {
		trimmed := strings.TrimSpace(p)
		if trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}

func QueryIntSlice(r *http.Request, key string) []int {
	val := r.URL.Query().Get(key)
	if val == "" {
		return nil
	}
	parts := strings.Split(val, ",")
	result := make([]int, 0, len(parts))
	for _, p := range parts {
		n, err := strconv.Atoi(strings.TrimSpace(p))
		if err == nil {
			result = append(result, n)
		}
	}
	return result
}

func DrainBody(r *http.Request) {
	if r.Body != nil {
		io.Copy(io.Discard, r.Body) //nolint:errcheck
		r.Body.Close()              //nolint:errcheck
	}
}
