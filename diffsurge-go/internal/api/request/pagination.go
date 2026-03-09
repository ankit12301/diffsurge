package request

import (
	"encoding/base64"
	"encoding/json"
	"net/http"
	"time"
)

const (
	DefaultPageSize = 50
	MaxPageSize     = 200
)

type Cursor struct {
	Timestamp time.Time `json:"ts,omitempty"`
	ID        string    `json:"id,omitempty"`
}

type PaginationParams struct {
	Limit  int
	Cursor *Cursor
}

func ParsePagination(r *http.Request) PaginationParams {
	limit := QueryInt(r, "limit", DefaultPageSize)
	if limit < 1 {
		limit = 1
	}
	if limit > MaxPageSize {
		limit = MaxPageSize
	}

	params := PaginationParams{Limit: limit}

	cursorStr := r.URL.Query().Get("cursor")
	if cursorStr != "" {
		data, err := base64.URLEncoding.DecodeString(cursorStr)
		if err == nil {
			var c Cursor
			if json.Unmarshal(data, &c) == nil {
				params.Cursor = &c
			}
		}
	}

	return params
}

func EncodeCursor(c Cursor) string {
	data, err := json.Marshal(c)
	if err != nil {
		return ""
	}
	return base64.URLEncoding.EncodeToString(data)
}
