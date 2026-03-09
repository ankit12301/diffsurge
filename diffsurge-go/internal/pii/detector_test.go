package pii

import (
	"fmt"
	"testing"

	"github.com/diffsurge-org/diffsurge/internal/models"
)

func TestLuhnCheck(t *testing.T) {
	tests := []struct {
		name   string
		number string
		want   bool
	}{
		{"valid visa", "4111111111111111", true},
		{"valid mastercard", "5500000000000004", true},
		{"valid amex", "378282246310005", true},
		{"invalid number", "1234567890123456", false},
		{"too short", "1234", false},
		{"random digits", "9999999999999999", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := luhnCheck(tt.number); got != tt.want {
				t.Errorf("luhnCheck(%q) = %v, want %v", tt.number, got, tt.want)
			}
		})
	}
}

func TestValidateSSN(t *testing.T) {
	tests := []struct {
		name string
		ssn  string
		want bool
	}{
		{"valid", "123-45-6789", true},
		{"area 000", "000-45-6789", false},
		{"area 666", "666-45-6789", false},
		{"area 9xx", "900-45-6789", false},
		{"group 00", "123-00-6789", false},
		{"serial 0000", "123-45-0000", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := validateSSN(tt.ssn); got != tt.want {
				t.Errorf("validateSSN(%q) = %v, want %v", tt.ssn, got, tt.want)
			}
		})
	}
}

func TestDetector_ScanString(t *testing.T) {
	cfg := DefaultConfig()
	cfg.Patterns.IPAddress = true
	d := NewDetector(cfg)

	tests := []struct {
		name     string
		input    string
		wantType PatternType
		wantHit  bool
	}{
		{"email", "contact user@example.com please", PatternEmail, true},
		{"phone US", "call 555-123-4567 now", PatternPhone, true},
		{"phone parens", "call (555) 123-4567 now", PatternPhone, true},
		{"credit card visa", "card 4111111111111111 here", PatternCreditCard, true},
		{"credit card invalid luhn", "card 0000000000000001 here", PatternCreditCard, false},
		{"ssn", "ssn is 123-45-6789", PatternSSN, true},
		{"ssn invalid", "ssn is 000-45-6789", PatternSSN, false},
		{"ipv4", "server at 192.168.1.1 is", PatternIPv4, true},
		{"jwt", "token eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abc123def456ghi789", PatternJWT, true},
		{"aws key", "key AKIAIOSFODNN7EXAMPLE here", PatternAWSKey, true},
		{"no pii", "this is a normal string with no sensitive data", "", false},
		{"dob", "born 1990-01-15 in NYC", PatternDOB, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			detections := d.ScanString(tt.input)
			if tt.wantHit && len(detections) == 0 {
				t.Errorf("expected detection for %q, got none", tt.input)
			}
			if !tt.wantHit && len(detections) > 0 {
				t.Errorf("expected no detection for %q, got %d", tt.input, len(detections))
			}
			if tt.wantHit && len(detections) > 0 {
				found := false
				for _, d := range detections {
					if d.Type == tt.wantType {
						found = true
						break
					}
				}
				if !found {
					types := make([]PatternType, len(detections))
					for i, d := range detections {
						types[i] = d.Type
					}
					t.Errorf("expected type %s in detections, got %v", tt.wantType, types)
				}
			}
		})
	}
}

func TestDetector_RedactString(t *testing.T) {
	d := NewDetector(DefaultConfig())

	tests := []struct {
		name    string
		input   string
		want    string
		changed bool
	}{
		{
			"email",
			"send to user@example.com",
			"send to [EMAIL_REDACTED]",
			true,
		},
		{
			"ssn",
			"ssn: 123-45-6789",
			"ssn: [SSN_REDACTED]",
			true,
		},
		{
			"no pii",
			"hello world",
			"hello world",
			false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, changed := d.RedactString(tt.input)
			if changed != tt.changed {
				t.Errorf("changed = %v, want %v", changed, tt.changed)
			}
			if got != tt.want {
				t.Errorf("got %q, want %q", got, tt.want)
			}
		})
	}
}

func TestDetector_MaskMode(t *testing.T) {
	cfg := DefaultConfig()
	cfg.Mode = ModeMask
	d := NewDetector(cfg)

	got, changed := d.RedactString("email user@example.com here")
	if !changed {
		t.Fatal("expected redaction")
	}
	if got == "email user@example.com here" {
		t.Error("string should have been masked")
	}
	if got == "email [EMAIL_REDACTED] here" {
		t.Error("should use masking, not replacement tokens")
	}
}

func TestDetector_HashMode(t *testing.T) {
	cfg := DefaultConfig()
	cfg.Mode = ModeHash
	d := NewDetector(cfg)

	got, changed := d.RedactString("email user@example.com here")
	if !changed {
		t.Fatal("expected redaction")
	}
	if got == "email user@example.com here" {
		t.Error("string should have been hashed")
	}

	got2, _ := d.RedactString("email user@example.com here")
	if got != got2 {
		t.Error("hash mode should be deterministic")
	}
}

func TestDetector_ScanAndRedact_DeepNested(t *testing.T) {
	d := NewDetector(DefaultConfig())

	data := map[string]interface{}{
		"user": map[string]interface{}{
			"profile": map[string]interface{}{
				"email": "secret@example.com",
				"tags":  []interface{}{"normal", "ssn: 123-45-6789"},
			},
		},
		"safe": "no pii here",
	}

	result := d.ScanAndRedact(data)
	if !result.Found {
		t.Fatal("expected PII to be found")
	}

	email := data["user"].(map[string]interface{})["profile"].(map[string]interface{})["email"].(string)
	if email != "[EMAIL_REDACTED]" {
		t.Errorf("email not redacted: %s", email)
	}

	tags := data["user"].(map[string]interface{})["profile"].(map[string]interface{})["tags"].([]interface{})
	if tags[0] != "normal" {
		t.Error("safe string was modified")
	}
	if tags[1] == "ssn: 123-45-6789" {
		t.Error("SSN in array not redacted")
	}

	if data["safe"] != "no pii here" {
		t.Error("safe field was modified")
	}
}

func TestRedactor_RedactTrafficLog(t *testing.T) {
	cfg := DefaultConfig()
	r := NewRedactor(cfg)

	log := &models.TrafficLog{
		Path: "/users/test",
		RequestBody: map[string]interface{}{
			"email": "user@example.com",
			"name":  "John",
		},
		ResponseBody: map[string]interface{}{
			"token": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abc123def456ghi789",
		},
		RequestHeaders: map[string]interface{}{
			"Content-Type": "application/json",
		},
		QueryParams: map[string]interface{}{
			"search": "nothing sensitive",
		},
	}

	result := r.RedactTrafficLog(log)
	if !result.Found {
		t.Fatal("expected PII to be found")
	}
	if !log.PIIRedacted {
		t.Error("PIIRedacted should be true")
	}
	if log.RequestBody["email"] == "user@example.com" {
		t.Error("email in request body not redacted")
	}
	if log.RequestBody["name"] != "John" {
		t.Error("non-PII field was modified")
	}
}

func TestRedactor_Disabled(t *testing.T) {
	cfg := DefaultConfig()
	cfg.Enabled = false
	r := NewRedactor(cfg)

	log := &models.TrafficLog{
		RequestBody: map[string]interface{}{
			"email": "user@example.com",
		},
	}

	result := r.RedactTrafficLog(log)
	if result.Found {
		t.Error("disabled redactor should not find PII")
	}
	if log.RequestBody["email"] != "user@example.com" {
		t.Error("disabled redactor should not modify data")
	}
}

func TestDetector_CustomPatterns(t *testing.T) {
	cfg := DefaultConfig()
	cfg.CustomPatterns = []CustomPattern{
		{
			Name:        "internal_id",
			Regex:       `CUST-[A-Z0-9]{10}`,
			Replacement: "[INTERNAL_ID_REDACTED]",
		},
	}
	d := NewDetector(cfg)

	got, changed := d.RedactString("customer CUST-ABCDEF1234 found")
	if !changed {
		t.Fatal("expected custom pattern match")
	}
	if got != "customer [INTERNAL_ID_REDACTED] found" {
		t.Errorf("got %q", got)
	}
}

func BenchmarkDetector_ScanString_1KB(b *testing.B) {
	d := NewDetector(DefaultConfig())
	payload := generatePayload(1024)

	b.ResetTimer()
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		d.ScanString(payload)
	}
}

func BenchmarkDetector_ScanAndRedact_10KB(b *testing.B) {
	d := NewDetector(DefaultConfig())
	data := generateNestedData(100)

	b.ResetTimer()
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		dataCopy := copyMap(data)
		d.ScanAndRedact(dataCopy)
	}
}

func generatePayload(size int) string {
	base := "user email is test@example.com and phone is 555-123-4567 data "
	result := ""
	for len(result) < size {
		result += base
	}
	return result[:size]
}

func generateNestedData(fields int) map[string]interface{} {
	data := make(map[string]interface{})
	for i := 0; i < fields; i++ {
		if i%5 == 0 {
			data[fmt.Sprintf("email_%d", i)] = "user@example.com"
		} else if i%7 == 0 {
			data[fmt.Sprintf("nested_%d", i)] = map[string]interface{}{
				"ssn":  "123-45-6789",
				"safe": "normal value",
			}
		} else {
			data[fmt.Sprintf("field_%d", i)] = "normal safe value"
		}
	}
	return data
}

func copyMap(m map[string]interface{}) map[string]interface{} {
	cp := make(map[string]interface{}, len(m))
	for k, v := range m {
		if nested, ok := v.(map[string]interface{}); ok {
			cp[k] = copyMap(nested)
		} else {
			cp[k] = v
		}
	}
	return cp
}
