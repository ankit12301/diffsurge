package response

import (
	"net/http"
)

type ErrorCode string

const (
	CodeValidation      ErrorCode = "VALIDATION_ERROR"
	CodeNotFound        ErrorCode = "NOT_FOUND"
	CodeUnauthorized    ErrorCode = "UNAUTHORIZED"
	CodeForbidden       ErrorCode = "FORBIDDEN"
	CodeConflict        ErrorCode = "CONFLICT"
	CodeRateLimited     ErrorCode = "RATE_LIMITED"
	CodeInternal        ErrorCode = "INTERNAL_ERROR"
	CodeServiceUnavail  ErrorCode = "SERVICE_UNAVAILABLE"
	CodePayloadTooLarge ErrorCode = "PAYLOAD_TOO_LARGE"
)

type FieldError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

type errorBody struct {
	Code      ErrorCode    `json:"code"`
	Message   string       `json:"message"`
	RequestID string       `json:"request_id,omitempty"`
	Details   []FieldError `json:"details,omitempty"`
}

type errorResponse struct {
	Error errorBody `json:"error"`
}

func writeError(w http.ResponseWriter, status int, code ErrorCode, message string, details []FieldError) {
	requestID := w.Header().Get("X-Request-ID")
	JSON(w, status, errorResponse{
		Error: errorBody{
			Code:      code,
			Message:   message,
			RequestID: requestID,
			Details:   details,
		},
	})
}

func ValidationError(w http.ResponseWriter, details []FieldError) {
	writeError(w, http.StatusBadRequest, CodeValidation, "Validation failed", details)
}

func BadRequest(w http.ResponseWriter, message string) {
	writeError(w, http.StatusBadRequest, CodeValidation, message, nil)
}

func NotFound(w http.ResponseWriter, resource string) {
	writeError(w, http.StatusNotFound, CodeNotFound, resource+" not found", nil)
}

func Unauthorized(w http.ResponseWriter, message string) {
	if message == "" {
		message = "Authentication required"
	}
	writeError(w, http.StatusUnauthorized, CodeUnauthorized, message, nil)
}

func Forbidden(w http.ResponseWriter, message string) {
	if message == "" {
		message = "Insufficient permissions"
	}
	writeError(w, http.StatusForbidden, CodeForbidden, message, nil)
}

func Conflict(w http.ResponseWriter, message string) {
	writeError(w, http.StatusConflict, CodeConflict, message, nil)
}

func RateLimited(w http.ResponseWriter) {
	writeError(w, http.StatusTooManyRequests, CodeRateLimited, "Rate limit exceeded", nil)
}

func InternalError(w http.ResponseWriter) {
	writeError(w, http.StatusInternalServerError, CodeInternal, "An unexpected error occurred", nil)
}

func PayloadTooLarge(w http.ResponseWriter, maxSize string) {
	writeError(w, http.StatusRequestEntityTooLarge, CodePayloadTooLarge, "Request body exceeds maximum size of "+maxSize, nil)
}
