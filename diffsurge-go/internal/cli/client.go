package cli

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// APIClient is an HTTP client that attaches the API key to every request.
type APIClient struct {
	baseURL    string
	apiKey     string
	httpClient *http.Client
}

// NewAPIClient creates a new API client with the given base URL and API key.
func NewAPIClient(baseURL, apiKey string) *APIClient {
	return &APIClient{
		baseURL: baseURL,
		apiKey:  apiKey,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// Get performs an authenticated GET request.
func (c *APIClient) Get(path string) (*http.Response, error) {
	return c.Do("GET", path, nil)
}

// Post performs an authenticated POST request.
func (c *APIClient) Post(path string, body io.Reader) (*http.Response, error) {
	return c.Do("POST", path, body)
}

// Do performs an authenticated HTTP request.
func (c *APIClient) Do(method, path string, body io.Reader) (*http.Response, error) {
	url := c.baseURL + path

	req, err := http.NewRequest(method, url, body)
	if err != nil {
		return nil, fmt.Errorf("creating request: %w", err)
	}

	req.Header.Set("X-API-Key", c.apiKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "diffsurge-cli")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}

	if resp.StatusCode >= 400 {
		defer resp.Body.Close()
		return nil, parseAPIError(resp)
	}

	return resp, nil
}

// APIError represents an error response from the backend.
type APIError struct {
	StatusCode int
	Message    string
}

func (e *APIError) Error() string {
	switch e.StatusCode {
	case 401:
		return "Authentication failed — check your API key (SURGE_API_KEY)"
	case 403:
		return "Permission denied — your API key may not have access to this resource"
	case 404:
		return fmt.Sprintf("Not found: %s", e.Message)
	default:
		return fmt.Sprintf("API error (%d): %s", e.StatusCode, e.Message)
	}
}

func parseAPIError(resp *http.Response) error {
	body, _ := io.ReadAll(resp.Body)

	apiErr := &APIError{StatusCode: resp.StatusCode}

	var errResp struct {
		Error   string `json:"error"`
		Message string `json:"message"`
	}
	if json.Unmarshal(body, &errResp) == nil {
		if errResp.Error != "" {
			apiErr.Message = errResp.Error
		} else {
			apiErr.Message = errResp.Message
		}
	}

	if apiErr.Message == "" {
		apiErr.Message = string(body)
	}

	return apiErr
}
