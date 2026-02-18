# TVC Sprint Execution Roadmap

**Document Version:** 1.0  
**Date:** February 18, 2026  
**Status:** Awaiting Approval

---

## Executive Summary

This document outlines the detailed sprint-by-sprint execution plan for building TVC (Traffic Version Control). The plan follows a **divide-and-conquer** approach, building incrementally with clear milestones and testing at each step.

**Total Duration:** 8 weeks (4 phases)  
**Sprints:** 13 sprints across 4 phases  
**Approach:** Backend-first with parallel frontend development

---

## Sprint Calendar

```
Week 1-2: Phase 1 - Foundation
├── Sprint 1.1: Project Setup (3 days)
├── Sprint 1.2: JSON Diff Engine (3 days)
├── Sprint 1.3: OpenAPI Parser (3 days)
└── Sprint 1.4: CLI Interface (3 days)

Week 3-4: Phase 2 - Traffic Proxy
├── Sprint 2.1: Reverse Proxy Skeleton (4 days)
├── Sprint 2.2: Traffic Capture (5 days)
└── Sprint 2.3: Configuration & Routing (3 days)

Week 5-6: Phase 3 - Replay Engine
├── Sprint 3.1: Traffic Selection (3 days)
├── Sprint 3.2: Replayer Client (5 days)
└── Sprint 3.3: Comparison Logic (4 days)

Week 7-8: Phase 4 - Dashboard & Security
├── Sprint 4.1: PII Detection (3 days)
├── Sprint 4.2: Traffic Dashboard (4 days)
├── Sprint 4.3: Replay Interface (4 days)
└── Sprint 4.4: Auth & Billing (3 days)
```

---

## Phase 1: Foundation (Weeks 1-2)

**Goal:** Build the core CLI tool and establish development infrastructure

### Sprint 1.1: Project Setup & Infrastructure

**Duration:** 3 days  
**Priority:** Critical  
**Dependencies:** None

#### Backend Tasks

**Day 1: Go Project Initialization**

```bash
# Tasks:
1. Initialize Go module
   - cd tvc-go
   - go mod init github.com/yourorg/tvc
   - Directory structure creation

2. Set up development tools
   - golangci-lint configuration
   - Makefile with common commands
   - Pre-commit hooks (optional but recommended)

3. Create base packages
   - internal/config
   - internal/models
   - pkg/logger
   - cmd/cli, cmd/proxy, cmd/api
```

**Implementation:**

```go
// go.mod
module github.com/yourorg/tvc

go 1.22

require (
    github.com/spf13/cobra v1.8.0
    github.com/spf13/viper v1.18.2
    github.com/rs/zerolog v1.32.0
    // ... more dependencies as needed
)
```

```makefile
# Makefile
.PHONY: build test lint clean

build:
	go build -o bin/tvc ./cmd/cli
	go build -o bin/tvc-proxy ./cmd/proxy

test:
	go test -v -race -coverprofile=coverage.out ./...

lint:
	golangci-lint run

clean:
	rm -rf bin/
```

**Day 2: Docker & Database Setup**

```yaml
# docker-compose.yml
version: "3.8"

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: tvc_dev
      POSTGRES_USER: tvc
      POSTGRES_PASSWORD: tvc_dev_pass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

**Tasks:**

1. Create docker-compose.yml
2. Set up database migrations (golang-migrate)
3. Create initial schema (organizations, projects, environments)
4. Test local development setup

**Day 3: CI Pipeline**

```yaml
# .github/workflows/go.yml
name: Go CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: "1.22"

      - name: Install dependencies
        run: go mod download

      - name: Run linter
        run: |
          go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
          golangci-lint run

      - name: Run tests
        run: go test -v -race -coverprofile=coverage.out ./...

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

#### Frontend Tasks

**Day 1: TailwindCSS Configuration**

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          // ... full palette
          900: "#0c4a6e",
        },
        // Semantic colors
        danger: "#ef4444",
        warning: "#f59e0b",
        success: "#10b981",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
```

**Day 2: Component Library Setup**

```bash
# Install dependencies
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu \
  @radix-ui/react-tabs @radix-ui/react-toast \
  @tanstack/react-query lucide-react date-fns \
  react-hook-form @hookform/resolvers zod
```

Create base UI components:

- Button, Card, Input, Badge
- Dialog (Modal), Dropdown, Tabs
- Table, Loading Spinner, Empty State

**Day 3: Layout & Routing**

```typescript
// app/(auth)/layout.tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

#### Success Criteria

- [x] `make dev` starts entire stack (Go + Next.js + Postgres + Redis)
- [x] CI pipeline passes on sample PR
- [x] Database migrations run successfully
- [x] Frontend renders with basic layout
- [x] Can create a simple API endpoint and call from frontend

---

### Sprint 1.2: JSON Diff Engine

**Duration:** 3 days  
**Priority:** Critical  
**Dependencies:** Sprint 1.1

#### Implementation Plan

**Day 1: Core Diff Algorithm**

Create the core diffing engine:

```go
// internal/diffing/engine.go
package diffing

type DiffType string

const (
    DiffTypeAdded        DiffType = "added"
    DiffTypeRemoved      DiffType = "removed"
    DiffTypeModified     DiffType = "modified"
    DiffTypeTypeChanged  DiffType = "type_changed"
)

type Severity string

const (
    SeverityInfo     Severity = "info"
    SeverityWarning  Severity = "warning"
    SeverityError    Severity = "error"
    SeverityBreaking Severity = "breaking"
)

type Diff struct {
    Path     string      `json:"path"`
    Type     DiffType    `json:"type"`
    OldValue interface{} `json:"oldValue,omitempty"`
    NewValue interface{} `json:"newValue,omitempty"`
    Severity Severity    `json:"severity"`
}

type Engine struct {
    config Config
}

type Config struct {
    IgnorePaths    []string
    TreatArraysAsSet bool // Compare arrays as sets (ignore order)
}

func NewEngine(config Config) *Engine {
    return &Engine{config: config}
}

func (e *Engine) Compare(a, b interface{}) ([]Diff, error) {
    diffs := []Diff{}
    e.compareRecursive("", a, b, &diffs)
    return diffs, nil
}

func (e *Engine) compareRecursive(path string, a, b interface{}, diffs *[]Diff) {
    // Handle nil cases
    if a == nil && b == nil {
        return
    }
    if a == nil && b != nil {
        *diffs = append(*diffs, Diff{
            Path:     path,
            Type:     DiffTypeAdded,
            NewValue: b,
            Severity: SeverityInfo,
        })
        return
    }
    if a != nil && b == nil {
        *diffs = append(*diffs, Diff{
            Path:     path,
            Type:     DiffTypeRemoved,
            OldValue: a,
            Severity: SeverityWarning,
        })
        return
    }

    // Type comparison
    aType := reflect.TypeOf(a)
    bType := reflect.TypeOf(b)

    if aType != bType {
        *diffs = append(*diffs, Diff{
            Path:     path,
            Type:     DiffTypeTypeChanged,
            OldValue: a,
            NewValue: b,
            Severity: SeverityBreaking,
        })
        return
    }

    // Handle different types
    switch aVal := a.(type) {
    case map[string]interface{}:
        e.compareObjects(path, aVal, b.(map[string]interface{}), diffs)
    case []interface{}:
        e.compareArrays(path, aVal, b.([]interface{}), diffs)
    default:
        // Primitive comparison
        if !reflect.DeepEqual(a, b) {
            *diffs = append(*diffs, Diff{
                Path:     path,
                Type:     DiffTypeModified,
                OldValue: a,
                NewValue: b,
                Severity: SeverityInfo,
            })
        }
    }
}
```

**Day 2: Object & Array Comparison**

Implement specialized comparison logic:

```go
func (e *Engine) compareObjects(path string, a, b map[string]interface{}, diffs *[]Diff) {
    // Find removed and modified keys
    for key, aVal := range a {
        currentPath := e.buildPath(path, key)

        if e.shouldIgnore(currentPath) {
            continue
        }

        bVal, exists := b[key]
        if !exists {
            *diffs = append(*diffs, Diff{
                Path:     currentPath,
                Type:     DiffTypeRemoved,
                OldValue: aVal,
                Severity: SeverityWarning,
            })
            continue
        }

        e.compareRecursive(currentPath, aVal, bVal, diffs)
    }

    // Find added keys
    for key, bVal := range b {
        currentPath := e.buildPath(path, key)

        if e.shouldIgnore(currentPath) {
            continue
        }

        if _, exists := a[key]; !exists {
            *diffs = append(*diffs, Diff{
                Path:     currentPath,
                Type:     DiffTypeAdded,
                NewValue: bVal,
                Severity: SeverityInfo,
            })
        }
    }
}

func (e *Engine) compareArrays(path string, a, b []interface{}, diffs *[]Diff) {
    if e.config.TreatArraysAsSet {
        e.compareArraysAsSet(path, a, b, diffs)
        return
    }

    // Ordered comparison
    maxLen := len(a)
    if len(b) > maxLen {
        maxLen = len(b)
    }

    for i := 0; i < maxLen; i++ {
        currentPath := fmt.Sprintf("%s[%d]", path, i)

        if i >= len(a) {
            *diffs = append(*diffs, Diff{
                Path:     currentPath,
                Type:     DiffTypeAdded,
                NewValue: b[i],
                Severity: SeverityInfo,
            })
            continue
        }

        if i >= len(b) {
            *diffs = append(*diffs, Diff{
                Path:     currentPath,
                Type:     DiffTypeRemoved,
                OldValue: a[i],
                Severity: SeverityWarning,
            })
            continue
        }

        e.compareRecursive(currentPath, a[i], b[i], diffs)
    }
}
```

**Day 3: Output Formatters & Testing**

Create formatters and comprehensive tests:

```go
// internal/diffing/formatter.go
package diffing

type Formatter interface {
    Format(diffs []Diff) (string, error)
}

type TextFormatter struct {
    colors bool
}

func (f *TextFormatter) Format(diffs []Diff) (string, error) {
    var buf bytes.Buffer

    buf.WriteString(fmt.Sprintf("Found %d differences:\n\n", len(diffs)))

    for _, diff := range diffs {
        symbol := f.getSymbol(diff.Type)
        color := f.getColor(diff.Severity)

        if f.colors {
            buf.WriteString(color)
        }

        buf.WriteString(fmt.Sprintf("%s %s (%s)\n", symbol, diff.Path, diff.Type))

        if diff.OldValue != nil {
            buf.WriteString(fmt.Sprintf("  - Old: %v\n", diff.OldValue))
        }
        if diff.NewValue != nil {
            buf.WriteString(fmt.Sprintf("  + New: %v\n", diff.NewValue))
        }

        if f.colors {
            buf.WriteString("\033[0m")
        }

        buf.WriteString("\n")
    }

    return buf.String(), nil
}

// JSONFormatter for CI/CD
type JSONFormatter struct{}

func (f *JSONFormatter) Format(diffs []Diff) (string, error) {
    data, err := json.MarshalIndent(diffs, "", "  ")
    if err != nil {
        return "", err
    }
    return string(data), nil
}
```

**Testing:**

```go
// internal/diffing/engine_test.go
func TestEngine_Compare(t *testing.T) {
    tests := []struct {
        name    string
        a       interface{}
        b       interface{}
        want    []Diff
    }{
        {
            name: "simple field change",
            a: map[string]interface{}{
                "name": "John",
                "age":  30,
            },
            b: map[string]interface{}{
                "name": "Jane",
                "age":  30,
            },
            want: []Diff{
                {
                    Path:     "name",
                    Type:     DiffTypeModified,
                    OldValue: "John",
                    NewValue: "Jane",
                    Severity: SeverityInfo,
                },
            },
        },
        // ... 20+ test cases covering:
        // - Nested objects
        // - Arrays (ordered and unordered)
        // - Type changes
        // - Null values
        // - Large objects (performance test)
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            engine := NewEngine(Config{})
            got, err := engine.Compare(tt.a, tt.b)
            assert.NoError(t, err)
            assert.Equal(t, tt.want, got)
        })
    }
}

// Benchmark test
func BenchmarkEngine_Compare(b *testing.B) {
    engine := NewEngine(Config{})
    obj1 := generateLargeTestObject(1000) // 1000 fields
    obj2 := generateLargeTestObject(1000)

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        engine.Compare(obj1, obj2)
    }
}
```

#### Success Criteria

- [x] Can diff simple JSON objects
- [x] Handles nested objects correctly
- [x] Supports array comparison (ordered and unordered)
- [x] Detects type changes
- [x] Handles null/undefined values
- [x] Performance: 1MB JSON in < 100ms
- [x] Test coverage > 80%

---

### Sprint 1.3: OpenAPI Parser

**Duration:** 3 days  
**Priority:** Critical  
**Dependencies:** Sprint 1.2

**Tasks:** See Technical Architecture Doc for full details

**Key Deliverables:**

- OpenAPI 3.0/3.1 parser
- Breaking change detection rules
- Schema comparison logic
- Integration tests with real OpenAPI specs

#### Success Criteria

- [x] Parses valid OpenAPI 3.x specs
- [x] Detects all defined breaking changes
- [x] No false positives on safe changes
- [x] Detailed, actionable reports
- [x] Test coverage > 80%

---

### Sprint 1.4: CLI Interface

**Duration:** 3 days  
**Priority:** Critical  
**Dependencies:** Sprint 1.2, 1.3

**Tasks:** Build user-facing CLI with Cobra

**Key Commands:**

```bash
tvc diff --file-old old.json --file-new new.json
tvc schema diff --file-old v1.yaml --file-new v2.yaml --breaking-only
tvc version
tvc help
```

**Cross-compilation:**

```bash
# Build for all platforms
make build-all

# Output:
# bin/tvc-darwin-amd64
# bin/tvc-darwin-arm64
# bin/tvc-linux-amd64
# bin/tvc-linux-arm64
# bin/tvc-windows-amd64.exe
```

#### Success Criteria

- [x] Binary runs on macOS/Linux/Windows
- [x] All commands functional
- [x] Exit codes correct (0=no change, 1=change, 2=error)
- [x] Help docs clear
- [x] Error messages user-friendly
- [x] Can integrate into GitHub Actions

---

## Phase 2: Traffic Proxy (Weeks 3-4)

**Goal:** Build traffic capture infrastructure

### Sprint 2.1: Reverse Proxy Skeleton

**Duration:** 4 days

**Key Implementation:**

```go
// cmd/proxy/main.go
func main() {
    config := loadConfig()

    server := proxy.NewServer(config)

    // Graceful shutdown
    ctx, cancel := context.WithCancel(context.Background())
    defer cancel()

    go func() {
        sigCh := make(chan os.Signal, 1)
        signal.Notify(sigCh, os.Interrupt, syscall.SIGTERM)
        <-sigCh

        log.Info().Msg("Shutting down gracefully...")
        cancel()
    }()

    if err := server.Start(ctx); err != nil {
        log.Fatal().Err(err).Msg("Server failed")
    }
}

// internal/proxy/server.go
type Server struct {
    config     *config.ProxyConfig
    httpServer *http.Server
    logger     *logger.Logger
}

func (s *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    // Middleware chain
    handler := s.buildHandler()
    handler.ServeHTTP(w, r)
}

func (s *Server) buildHandler() http.Handler {
    // Build middleware chain
    handler := s.proxyHandler()
    handler = s.loggingMiddleware(handler)
    handler = s.requestIDMiddleware(handler)
    handler = s.recoveryMiddleware(handler)

    return handler
}
```

#### Success Criteria

- [x] Forwards all HTTP methods
- [x] Preserves headers
- [x] Handles streaming responses
- [x] < 5ms added latency
- [x] Graceful shutdown

---

### Sprint 2.2: Request/Response Capture

**Duration:** 5 days

**Architecture:**

```
Request → Proxy → [Capture] → Channel → Worker Pool → Database
                    ↓
                 Response
```

**Key Components:**

1. Capture middleware
2. Async channel buffer
3. Worker pool
4. Database repository
5. Sampling strategy

#### Success Criteria

- [x] Captures 100+ RPS without blocking
- [x] All data captured correctly
- [x] No memory leaks under load
- [x] Sampling works
- [x] Redis queue integration

---

### Sprint 2.3: Configuration & Routing

**Duration:** 3 days

**Features:**

- YAML configuration
- Dynamic routing (path-based)
- Hot-reload support
- Health checks
- Metrics endpoint

#### Success Criteria

- [x] Routes to correct backends
- [x] Hot-reload works
- [x] Health check functional
- [x] Metrics accurate

---

## Phase 3: Replay Engine (Weeks 5-6)

**Goal:** Build traffic replay and comparison system

### Sprint 3.1-3.3: Replay Implementation

See Technical Architecture Doc for full implementation details.

**Key Deliverables:**

- Traffic filtering and selection
- High-concurrency replayer
- Response comparison engine
- Diff reporting

---

## Phase 4: Dashboard & Security (Weeks 7-8)

**Goal:** Production-ready application

### Sprint 4.1-4.4: Dashboard & Auth

**Key Features:**

- PII detection
- Traffic visualization
- Replay interface
- User authentication
- Subscription management

---

## Risk Mitigation Plan

### High-Risk Areas

1. **Proxy Performance**
   - **Mitigation:** Load test early (Sprint 2.2)
   - **Fallback:** Reduce sampling rate

2. **Database Scaling**
   - **Mitigation:** Partitioning from day 1
   - **Fallback:** Reduce retention period

3. **Complex Frontend State**
   - **Mitigation:** Use TanStack Query
   - **Fallback:** Simplify UI if needed

---

## Definition of Done

A sprint is "done" when:

1. **Code Quality**
   - [x] All tests pass (unit + integration)
   - [x] Code coverage > target (80% backend, 70% frontend)
   - [x] No linting errors
   - [x] Code reviewed and approved

2. **Functionality**
   - [x] Feature works as specified
   - [x] Edge cases handled
   - [x] Error cases handled
   - [x] Manual testing completed

3. **Documentation**
   - [x] Code comments for complex logic
   - [x] README updated (if needed)
   - [x] API docs updated (if needed)

4. **Deployment**
   - [x] CI pipeline passes
   - [x] Can deploy to local environment
   - [x] Migrations run successfully

---

## Next Steps

**Before Development:**

1. Review and approve this roadmap
2. Set up development environment (Sprint 1.1)
3. Create GitHub repository
4. Set up project management tool (Linear, Jira, or GitHub Projects)
5. Schedule daily standups (optional but recommended)

**Sprint Kickoff Process:**

1. Review sprint goals and tasks
2. Identify any blockers or dependencies
3. Confirm understanding of acceptance criteria
4. Begin development

**Sprint Review Process:**

1. Demo completed features
2. Review against Definition of Done
3. Document any technical debt
4. Plan next sprint

---

## Questions for Stakeholder

1. **Timeline:** Is 8 weeks acceptable, or do we need to prioritize specific features?
2. **MVP Scope:** Should we reduce scope for faster initial release?
3. **Resource Availability:** Will you be available for quick feedback during development?
4. **Technology Preferences:** Any strong preferences for specific tools (Supabase vs custom, Clerk vs Supabase Auth)?
5. **Testing Requirements:** Do you want to be involved in manual testing during sprints?

---

**Document Status:** ✅ Ready for Review  
**Awaiting:** Stakeholder approval to proceed with Sprint 1.1
