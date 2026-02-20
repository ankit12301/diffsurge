package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/tvc-org/tvc/internal/api/response"
	"github.com/tvc-org/tvc/internal/config"
	"github.com/tvc-org/tvc/internal/storage"
)

type HealthHandler struct {
	store     storage.Repository
	startedAt time.Time
}

func NewHealthHandler(store storage.Repository) *HealthHandler {
	return &HealthHandler{
		store:     store,
		startedAt: time.Now(),
	}
}

func (h *HealthHandler) Health(w http.ResponseWriter, r *http.Request) {
	response.JSON(w, http.StatusOK, map[string]interface{}{
		"status":         "healthy",
		"version":        config.Version,
		"uptime_seconds": int(time.Since(h.startedAt).Seconds()),
	})
}

func (h *HealthHandler) Ready(w http.ResponseWriter, r *http.Request) {
	checks := make(map[string]interface{})

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	dbStart := time.Now()
	dbErr := h.store.Ping(ctx)
	dbLatency := time.Since(dbStart)

	if dbErr != nil {
		checks["database"] = map[string]interface{}{
			"status": "down",
			"error":  dbErr.Error(),
		}
	} else {
		checks["database"] = map[string]interface{}{
			"status":     "up",
			"latency_ms": dbLatency.Milliseconds(),
		}
	}

	overallStatus := "ready"
	statusCode := http.StatusOK
	if dbErr != nil {
		overallStatus = "not_ready"
		statusCode = http.StatusServiceUnavailable
	}

	response.JSON(w, statusCode, map[string]interface{}{
		"status":         overallStatus,
		"checks":         checks,
		"version":        config.Version,
		"uptime_seconds": int(time.Since(h.startedAt).Seconds()),
	})
}
