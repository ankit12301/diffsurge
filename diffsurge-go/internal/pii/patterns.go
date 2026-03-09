package pii

import "regexp"

type PatternType string

const (
	PatternEmail      PatternType = "email"
	PatternPhone      PatternType = "phone"
	PatternCreditCard PatternType = "credit_card"
	PatternSSN        PatternType = "ssn"
	PatternIPv4       PatternType = "ipv4"
	PatternIPv6       PatternType = "ipv6"
	PatternJWT        PatternType = "jwt"
	PatternAPIKey     PatternType = "api_key"
	PatternAWSKey     PatternType = "aws_key"
	PatternDOB        PatternType = "dob"
)

type Pattern struct {
	Type        PatternType
	Regex       *regexp.Regexp
	Replacement string
	Mask        func(string) string
	Validate    func(string) bool
}

var defaultPatterns = []Pattern{
	{
		Type:        PatternEmail,
		Regex:       regexp.MustCompile(`[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}`),
		Replacement: "[EMAIL_REDACTED]",
		Mask:        maskEmail,
	},
	{
		Type:        PatternPhone,
		Regex:       regexp.MustCompile(`(?:\+?1[-.\s]?)?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}`),
		Replacement: "[PHONE_REDACTED]",
		Mask:        maskGeneric,
	},
	{
		Type:        PatternCreditCard,
		Regex:       regexp.MustCompile(`\b(?:\d[-\s]*?){13,19}\b`),
		Replacement: "[CC_REDACTED]",
		Mask:        maskCreditCard,
		Validate:    luhnCheck,
	},
	{
		Type:        PatternSSN,
		Regex:       regexp.MustCompile(`\b\d{3}-\d{2}-\d{4}\b`),
		Replacement: "[SSN_REDACTED]",
		Mask:        maskSSN,
		Validate:    validateSSN,
	},
	{
		Type:        PatternIPv4,
		Regex:       regexp.MustCompile(`\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b`),
		Replacement: "[IP_REDACTED]",
		Mask:        maskGeneric,
	},
	{
		Type:        PatternIPv6,
		Regex:       regexp.MustCompile(`(?i)\b(?:[0-9a-f]{1,4}:){7}[0-9a-f]{1,4}\b|(?i)\b(?:[0-9a-f]{1,4}:){1,7}:|(?i)\b::(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4}\b`),
		Replacement: "[IP_REDACTED]",
		Mask:        maskGeneric,
	},
	{
		Type:        PatternJWT,
		Regex:       regexp.MustCompile(`eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}`),
		Replacement: "[JWT_REDACTED]",
		Mask:        maskGeneric,
	},
	{
		Type:        PatternAPIKey,
		Regex:       regexp.MustCompile(`(?i)(?:sk_live_|sk_test_|pk_live_|pk_test_|Bearer\s+)[A-Za-z0-9_\-]{20,}`),
		Replacement: "[API_KEY_REDACTED]",
		Mask:        maskGeneric,
	},
	{
		Type:        PatternAWSKey,
		Regex:       regexp.MustCompile(`(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}`),
		Replacement: "[AWS_KEY_REDACTED]",
		Mask:        maskGeneric,
	},
	{
		Type:        PatternDOB,
		Regex:       regexp.MustCompile(`\b(?:19|20)\d{2}[-/](?:0[1-9]|1[0-2])[-/](?:0[1-9]|[12]\d|3[01])\b`),
		Replacement: "[DOB_REDACTED]",
		Mask:        maskGeneric,
	},
}

func luhnCheck(number string) bool {
	var digits []int
	for _, ch := range number {
		if ch >= '0' && ch <= '9' {
			digits = append(digits, int(ch-'0'))
		}
	}
	if len(digits) < 13 || len(digits) > 19 {
		return false
	}

	sum := 0
	odd := len(digits) % 2
	for i, d := range digits {
		if i%2 == odd {
			d *= 2
			if d > 9 {
				d -= 9
			}
		}
		sum += d
	}
	return sum%10 == 0
}

func validateSSN(s string) bool {
	var digits []byte
	for _, ch := range s {
		if ch >= '0' && ch <= '9' {
			digits = append(digits, byte(ch))
		}
	}
	if len(digits) != 9 {
		return false
	}
	area := string(digits[:3])
	if area == "000" || area == "666" || digits[0] == '9' {
		return false
	}
	group := string(digits[3:5])
	if group == "00" {
		return false
	}
	serial := string(digits[5:])
	return serial != "0000"
}

func maskEmail(s string) string {
	at := -1
	for i, ch := range s {
		if ch == '@' {
			at = i
			break
		}
	}
	if at <= 0 {
		return "[EMAIL_REDACTED]"
	}
	masked := make([]byte, len(s))
	masked[0] = s[0]
	for i := 1; i < at; i++ {
		masked[i] = '*'
	}
	copy(masked[at:], s[at:])
	return string(masked)
}

func maskCreditCard(s string) string {
	var digits []int
	var positions []int
	for i, ch := range s {
		if ch >= '0' && ch <= '9' {
			digits = append(digits, int(ch-'0'))
			positions = append(positions, i)
		}
	}
	if len(digits) < 4 {
		return "[CC_REDACTED]"
	}
	result := []byte(s)
	for i := 0; i < len(positions)-4; i++ {
		result[positions[i]] = '*'
	}
	return string(result)
}

func maskSSN(s string) string {
	if len(s) >= 7 {
		return "***-**-" + s[len(s)-4:]
	}
	return "[SSN_REDACTED]"
}

func maskGeneric(s string) string {
	if len(s) <= 4 {
		return "****"
	}
	masked := make([]byte, len(s))
	for i := range masked {
		masked[i] = '*'
	}
	copy(masked[len(masked)-4:], s[len(s)-4:])
	return string(masked)
}
