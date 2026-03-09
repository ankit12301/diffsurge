package pii

import "github.com/diffsurge-org/diffsurge/internal/models"

type Redactor struct {
	detector *Detector
	config   Config
}

func NewRedactor(cfg Config) *Redactor {
	return &Redactor{
		detector: NewDetector(cfg),
		config:   cfg,
	}
}

// RedactTrafficLog applies PII detection and redaction to all scannable
// fields of a TrafficLog. Returns the aggregate scan result and sets
// PIIRedacted on the log if any PII was found.
func (r *Redactor) RedactTrafficLog(log *models.TrafficLog) ScanResult {
	if !r.config.Enabled {
		return ScanResult{}
	}

	aggregate := ScanResult{}

	if r.config.ScanRequestBody && log.RequestBody != nil {
		res := r.detector.ScanAndRedact(log.RequestBody)
		mergeResult(&aggregate, &res)
	}

	if r.config.ScanResponseBody && log.ResponseBody != nil {
		res := r.detector.ScanAndRedact(log.ResponseBody)
		mergeResult(&aggregate, &res)
	}

	if r.config.ScanHeaders && log.RequestHeaders != nil {
		res := r.detector.ScanAndRedact(log.RequestHeaders)
		mergeResult(&aggregate, &res)
	}

	if r.config.ScanHeaders && log.ResponseHeaders != nil {
		res := r.detector.ScanAndRedact(log.ResponseHeaders)
		mergeResult(&aggregate, &res)
	}

	if r.config.ScanQueryParams && log.QueryParams != nil {
		res := r.detector.ScanAndRedact(log.QueryParams)
		mergeResult(&aggregate, &res)
	}

	if r.config.ScanURLPath {
		redactedPath, wasRedacted := r.detector.RedactString(log.Path)
		if wasRedacted {
			aggregate.Found = true
			aggregate.Detections = append(aggregate.Detections, Detection{
				Type:     "url_path",
				Path:     log.Path,
				Redacted: true,
			})
			log.Path = redactedPath
		}
	}

	if aggregate.Found {
		log.PIIRedacted = true
	}

	return aggregate
}

func mergeResult(dst, src *ScanResult) {
	if src.Found {
		dst.Found = true
	}
	dst.Detections = append(dst.Detections, src.Detections...)
}
