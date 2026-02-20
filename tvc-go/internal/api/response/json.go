package response

import (
	"encoding/json"
	"net/http"
)

type PaginationMeta struct {
	NextCursor    string `json:"next_cursor,omitempty"`
	HasMore       bool   `json:"has_more"`
	TotalEstimate int64  `json:"total_estimate,omitempty"`
}

type paginatedResponse struct {
	Data       interface{}    `json:"data"`
	Pagination PaginationMeta `json:"pagination"`
}

func JSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if data != nil {
		json.NewEncoder(w).Encode(data) //nolint:errcheck
	}
}

func Created(w http.ResponseWriter, data interface{}) {
	JSON(w, http.StatusCreated, data)
}

func NoContent(w http.ResponseWriter) {
	w.WriteHeader(http.StatusNoContent)
}

func Paginated(w http.ResponseWriter, data interface{}, pagination PaginationMeta) {
	JSON(w, http.StatusOK, paginatedResponse{
		Data:       data,
		Pagination: pagination,
	})
}
