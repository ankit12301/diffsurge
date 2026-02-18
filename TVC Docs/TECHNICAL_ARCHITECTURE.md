# TVC - Technical Architecture & Implementation Plan

**Document Version:** 1.0  
**Date:** February 18, 2026  
**Status:** Awaiting Review

---

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Technology Stack & Justification](#technology-stack--justification)
3. [Project Structure](#project-structure)
4. [Data Models & Database Schema](#data-models--database-schema)
5. [API Contracts](#api-contracts)
6. [Code Quality Standards](#code-quality-standards)
7. [Sprint Implementation Plan](#sprint-implementation-plan)
8. [Testing Strategy](#testing-strategy)
9. [Development Workflow](#development-workflow)
10. [Risk Assessment & Mitigation](#risk-assessment--mitigation)

---

## System Architecture Overview

### High-Level Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                           │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐        │
│  │   Web UI     │   │  CLI Tool    │   │  CI/CD Plugin│        │
│  │  (Next.js)   │   │  (Cobra)     │   │              │        │
│  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘        │
└─────────┼──────────────────┼──────────────────┼────────────────┘
          │                  │                  │
          └──────────────────┴──────────────────┘
                             │
                    ┌────────▼────────┐
                    │   API Gateway   │
                    │  (Go - Port 80) │
                    └────────┬────────┘
                             │
          ┏━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━┓
          ┃                                   ┃
    ┌─────▼──────┐                    ┌───────▼────────┐
    │  CLI APIs  │                    │  Proxy Service │
    │  (Diffing, │                    │  (Traffic      │
    │   Schema   │                    │   Capture &    │
    │   Compare) │                    │   Forward)     │
    └─────┬──────┘                    └────────┬───────┘
          │                                    │
          │                           ┌────────▼────────┐
          │                           │  Redis Queue    │
          │                           │  (Buffer)       │
          │                           └────────┬────────┘
          │                                    │
          │                           ┌────────▼────────┐
          │                           │  Worker Pool    │
          │                           │  (Goroutines)   │
          │                           └────────┬────────┘
          │                                    │
          └────────────────┬───────────────────┘
                           │
                  ┌────────▼────────┐
                  │   PostgreSQL    │
                  │   (Supabase)    │
                  │                 │
                  │  - Traffic Logs │
                  │  - Diff Reports │
                  │  - Users/Auth   │
                  │  - Subscriptions│
                  └─────────────────┘
```

### Component Responsibilities

#### 1. CLI Tool (`tvc-cli`)

- **Purpose:** Local development tool for schema diffing
- **Responsibilities:**
  - Parse OpenAPI/Swagger/GraphQL schemas
  - Perform deep JSON comparisons
  - Detect breaking changes
  - Generate human-readable diff reports
  - CI/CD integration (exit codes, JSON output)
- **Distribution:** Single Go binary (cross-platform)

#### 2. Traffic Proxy Service

- **Purpose:** Capture production traffic non-invasively
- **Responsibilities:**
  - Reverse proxy incoming requests
  - Smart sampling (configurable rate)
  - PII detection & redaction
  - Async buffering to Redis
  - Performance monitoring (latency tracking)
- **Performance Target:** < 5ms added latency

#### 3. Replay Engine

- **Purpose:** Validate new deployments against real traffic
- **Responsibilities:**
  - Fetch filtered traffic from DB
  - Concurrent request replay (configurable workers)
  - Semantic response comparison
  - Drift detection & scoring
  - Report generation
- **Performance Target:** 1000+ RPS replay capability

#### 4. Web Dashboard

- **Purpose:** User interface for monitoring & governance
- **Responsibilities:**
  - Real-time traffic visualization
  - Replay configuration & execution
  - Diff report browsing
  - User authentication & billing
  - Audit log export (PDF/CSV)

---

## Technology Stack & Justification

### Backend (Go)

**Core Services:**

- **Language:** Go 1.22+
- **HTTP Framework:** Standard `net/http` + `gorilla/mux` (routing)
- **CLI Framework:** `spf13/cobra` + `spf13/viper` (config)
- **Schema Parsing:** `getkin/kin-openapi` (OpenAPI), `vektah/gqlparser` (GraphQL)

**Why Go?**

- Excellent concurrency primitives (goroutines, channels)
- Single binary deployment (no runtime dependencies)
- Superior performance for proxy workloads
- Strong stdlib for HTTP handling
- Easy cross-compilation

**Libraries:**
| Library | Purpose | Version |
|---------|---------|---------|
| `spf13/cobra` | CLI framework | v1.8+ |
| `spf13/viper` | Configuration management | v1.18+ |
| `getkin/kin-openapi` | OpenAPI parser | v0.123+ |
| `go-redis/redis` | Redis client | v9.5+ |
| `lib/pq` | PostgreSQL driver | v1.10+ |
| `golang.org/x/sync/errgroup` | Worker pool management | Latest |
| `r3labs/diff` | JSON diffing utility | v3.0+ |
| `dgrijalva/jwt-go` | JWT authentication | v3.2+ (or golang-jwt/jwt v5+) |

### Frontend (Next.js)

**Stack:**

- **Framework:** Next.js 15+ (App Router)
- **Language:** TypeScript 5.4+
- **Styling:** TailwindCSS 4+
- **State Management:** React Context + TanStack Query (for server state)
- **UI Components:** Radix UI (unstyled primitives) + custom components
- **Charts:** Recharts or Chart.js
- **Authentication:** Clerk or Supabase Auth

**Why This Stack?**

- Next.js App Router: Server-first architecture, optimal performance
- TypeScript: Type safety, better DX, fewer runtime errors
- TailwindCSS 4: Utility-first, fast iteration, consistent design
- Radix UI: Accessible, unstyled primitives (no bloat)
- TanStack Query: Best-in-class server state management

**Libraries:**
| Library | Purpose | Version |
|---------|---------|---------|
| `@tanstack/react-query` | Server state management | v5+ |
| `@radix-ui/react-*` | Accessible UI primitives | Latest |
| `recharts` | Data visualization | v2.12+ |
| `date-fns` | Date manipulation | v3+ |
| `zod` | Schema validation | v3.22+ |
| `react-hook-form` | Form management | v7.51+ |
| `lucide-react` | Icon system | Latest |

### Database (PostgreSQL via Supabase)

**Schema Strategy:**

- Normalized design for MVP
- Partitioning strategy for traffic logs (monthly partitions)
- JSONB columns for flexible payload storage
- Proper indexing strategy (B-tree, GIN for JSONB)
- Migration tool: `golang-migrate/migrate`

**Future:** Migrate high-volume traffic logs to ClickHouse when > 100M rows

### Infrastructure

**Development:**

- Docker Compose for local development
- Make/Taskfile for common commands
- Air for Go hot-reload
- Next.js dev server with Turbopack

**Production (Future):**

- Docker containers
- Kubernetes/AWS ECS for orchestration
- Redis for queue + caching
- Supabase for managed PostgreSQL
- CloudFront/Vercel for frontend CDN

---

## Project Structure

### Backend Structure (`tvc-go/`)

```
tvc-go/
├── cmd/
│   ├── cli/                    # CLI application entrypoint
│   │   └── main.go
│   ├── proxy/                  # Proxy server entrypoint
│   │   └── main.go
│   ├── replayer/               # Replay engine entrypoint
│   │   └── main.go
│   └── api/                    # Web API server entrypoint
│       └── main.go
├── internal/                   # Private application code
│   ├── cli/
│   │   ├── diff.go             # Diff command implementation
│   │   ├── schema.go           # Schema parsing logic
│   │   └── output.go           # Output formatting
│   ├── proxy/
│   │   ├── handler.go          # HTTP handler
│   │   ├── middleware.go       # Middleware chain
│   │   ├── capture.go          # Request/response capture
│   │   ├── sampler.go          # Traffic sampling strategy
│   │   └── router.go           # Dynamic routing logic
│   ├── replayer/
│   │   ├── client.go           # HTTP client pool
│   │   ├── worker.go           # Worker pool implementation
│   │   ├── comparer.go         # Response comparison logic
│   │   └── reporter.go         # Report generation
│   ├── diffing/
│   │   ├── engine.go           # Core diff algorithm
│   │   ├── json.go             # JSON-specific diffing
│   │   ├── schema.go           # Schema diffing
│   │   └── breaking.go         # Breaking change detection rules
│   ├── pii/
│   │   ├── detector.go         # PII detection patterns
│   │   ├── redactor.go         # Redaction logic
│   │   └── patterns.go         # Regex patterns
│   ├── storage/
│   │   ├── postgres.go         # PostgreSQL client
│   │   ├── redis.go            # Redis client
│   │   ├── repository.go       # Data access layer
│   │   └── migrations/         # SQL migrations
│   ├── api/
│   │   ├── handlers/           # HTTP handlers
│   │   ├── middleware/         # API middleware
│   │   └── routes.go           # Route definitions
│   ├── models/                 # Domain models
│   │   ├── traffic.go
│   │   ├── diff.go
│   │   └── user.go
│   └── config/
│       ├── config.go           # Configuration struct
│       └── loader.go           # Config loading logic
├── pkg/                        # Public libraries (reusable)
│   ├── logger/                 # Structured logging
│   ├── validator/              # Common validation
│   └── errors/                 # Error handling utilities
├── test/
│   ├── integration/            # Integration tests
│   ├── fixtures/               # Test data
│   └── mocks/                  # Mock implementations
├── scripts/
│   ├── build.sh                # Build script
│   └── docker-build.sh         # Docker build script
├── deployments/
│   ├── docker/
│   │   ├── Dockerfile.cli
│   │   ├── Dockerfile.proxy
│   │   └── Dockerfile.api
│   └── docker-compose.yml      # Local development setup
├── configs/
│   ├── proxy.example.yaml      # Example proxy config
│   └── replayer.example.yaml   # Example replayer config
├── go.mod
├── go.sum
├── Makefile                    # Common commands
└── README.md
```

### Frontend Structure (`tvc-frontend/`)

```
tvc-frontend/
├── app/
│   ├── (auth)/                 # Auth-protected routes
│   │   ├── dashboard/
│   │   │   ├── page.tsx        # Dashboard home
│   │   │   └── layout.tsx
│   │   ├── traffic/
│   │   │   ├── page.tsx        # Traffic stream view
│   │   │   └── [id]/
│   │   │       └── page.tsx    # Individual request detail
│   │   ├── replay/
│   │   │   ├── page.tsx        # Replay configuration
│   │   │   ├── new/
│   │   │   │   └── page.tsx    # Create new replay
│   │   │   └── [id]/
│   │   │       ├── page.tsx    # Replay results
│   │   │       └── report/
│   │   │           └── page.tsx # Detailed report
│   │   ├── audit/
│   │   │   └── page.tsx        # Audit logs
│   │   └── settings/
│   │       ├── page.tsx        # User settings
│   │       └── billing/
│   │           └── page.tsx    # Billing management
│   ├── (marketing)/            # Public marketing pages
│   │   ├── page.tsx            # Landing page
│   │   ├── pricing/
│   │   │   └── page.tsx
│   │   └── docs/
│   │       └── page.tsx
│   ├── api/                    # API routes (if needed)
│   │   └── webhooks/
│   │       └── stripe/
│   │           └── route.ts
│   ├── layout.tsx              # Root layout
│   ├── globals.css             # Global styles
│   └── providers.tsx           # App providers
├── components/
│   ├── ui/                     # Design system components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown.tsx
│   │   ├── input.tsx
│   │   ├── table.tsx
│   │   ├── badge.tsx
│   │   ├── tabs.tsx
│   │   └── ...
│   ├── dashboard/              # Dashboard-specific components
│   │   ├── traffic-stream.tsx
│   │   ├── stats-card.tsx
│   │   └── recent-activity.tsx
│   ├── traffic/
│   │   ├── request-viewer.tsx  # JSON request viewer
│   │   ├── response-viewer.tsx
│   │   └── http-details.tsx    # Headers, status, etc.
│   ├── replay/
│   │   ├── replay-config-form.tsx
│   │   ├── diff-viewer.tsx     # Side-by-side diff display
│   │   ├── replay-progress.tsx
│   │   └── results-table.tsx
│   ├── layout/
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   └── footer.tsx
│   └── shared/
│       ├── loading-spinner.tsx
│       ├── error-boundary.tsx
│       └── empty-state.tsx
├── lib/
│   ├── api/                    # API client
│   │   ├── client.ts           # Axios/fetch wrapper
│   │   ├── traffic.ts          # Traffic API calls
│   │   ├── replay.ts           # Replay API calls
│   │   └── auth.ts             # Auth API calls
│   ├── hooks/                  # Custom React hooks
│   │   ├── use-traffic.ts
│   │   ├── use-replay.ts
│   │   └── use-auth.ts
│   ├── utils/
│   │   ├── format.ts           # Formatting utilities
│   │   ├── date.ts             # Date helpers
│   │   └── validation.ts       # Validation helpers
│   ├── schemas/                # Zod schemas
│   │   ├── replay.ts
│   │   └── settings.ts
│   └── constants.ts            # App constants
├── types/
│   ├── traffic.ts              # Traffic-related types
│   ├── replay.ts               # Replay-related types
│   └── api.ts                  # API response types
├── styles/
│   └── themes/                 # Theme configurations
├── public/
│   ├── images/
│   └── icons/
├── .env.local.example
├── .env.production.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## Data Models & Database Schema

### Database Schema (PostgreSQL)

```sql
-- Users Table (managed by Supabase Auth)
-- We'll use Supabase's built-in auth.users table

-- Organizations Table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Organization Mapping
CREATE TABLE user_organizations (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member', -- owner, admin, member
    PRIMARY KEY (user_id, organization_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects (API services being monitored)
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    config JSONB DEFAULT '{}', -- proxy config, sampling rate, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (organization_id, slug)
);

CREATE INDEX idx_projects_org ON projects(organization_id);

-- Environments (production, staging, development)
CREATE TABLE environments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- production, staging, development
    base_url VARCHAR(500) NOT NULL,
    is_source BOOLEAN DEFAULT false, -- is this the traffic source?
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (project_id, name)
);

CREATE INDEX idx_environments_project ON environments(project_id);

-- Traffic Logs (partitioned by month)
-- This will be partitioned for scalability
CREATE TABLE traffic_logs (
    id UUID DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    environment_id UUID NOT NULL REFERENCES environments(id) ON DELETE CASCADE,

    -- Request Data
    method VARCHAR(10) NOT NULL,
    path TEXT NOT NULL,
    query_params JSONB,
    request_headers JSONB,
    request_body JSONB,

    -- Response Data
    status_code INTEGER NOT NULL,
    response_headers JSONB,
    response_body JSONB,

    -- Metadata
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    latency_ms INTEGER,
    ip_address INET,
    user_agent TEXT,

    -- PII Redaction Flag
    pii_redacted BOOLEAN DEFAULT false,

    PRIMARY KEY (id, timestamp)
) PARTITION BY RANGE (timestamp);

-- Create monthly partitions (example for 2026)
CREATE TABLE traffic_logs_2026_02 PARTITION OF traffic_logs
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

CREATE TABLE traffic_logs_2026_03 PARTITION OF traffic_logs
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

-- Indexes for traffic logs
CREATE INDEX idx_traffic_logs_project ON traffic_logs(project_id, timestamp DESC);
CREATE INDEX idx_traffic_logs_path ON traffic_logs(project_id, path, timestamp DESC);
CREATE INDEX idx_traffic_logs_status ON traffic_logs(project_id, status_code, timestamp DESC);

-- Replay Sessions
CREATE TABLE replay_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    source_environment_id UUID NOT NULL REFERENCES environments(id),
    target_environment_id UUID NOT NULL REFERENCES environments(id),

    -- Replay Configuration
    name VARCHAR(255),
    description TEXT,
    traffic_filter JSONB, -- filters for which traffic to replay
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    sample_size INTEGER, -- number of requests to replay

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, running, completed, failed

    -- Results Summary
    total_requests INTEGER DEFAULT 0,
    successful_requests INTEGER DEFAULT 0,
    failed_requests INTEGER DEFAULT 0,
    mismatched_responses INTEGER DEFAULT 0,

    -- Timestamps
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_replay_sessions_project ON replay_sessions(project_id, created_at DESC);
CREATE INDEX idx_replay_sessions_status ON replay_sessions(status);

-- Replay Results (individual request comparisons)
CREATE TABLE replay_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    replay_session_id UUID NOT NULL REFERENCES replay_sessions(id) ON DELETE CASCADE,
    original_traffic_log_id UUID NOT NULL, -- reference to traffic_logs

    -- Target Response Data
    target_status_code INTEGER,
    target_response_body JSONB,
    target_latency_ms INTEGER,

    -- Comparison Results
    status_match BOOLEAN,
    body_match BOOLEAN,
    diff_report JSONB, -- detailed diff
    severity VARCHAR(50), -- info, warning, error, breaking

    -- Error Info
    error_message TEXT,

    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_replay_results_session ON replay_results(replay_session_id);
CREATE INDEX idx_replay_results_severity ON replay_results(replay_session_id, severity);

-- Schema Versions (for CLI diff tracking)
CREATE TABLE schema_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    version VARCHAR(100) NOT NULL,
    schema_type VARCHAR(50) NOT NULL, -- openapi, graphql, grpc
    schema_content JSONB NOT NULL,
    git_commit VARCHAR(100),
    git_branch VARCHAR(100),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (project_id, version)
);

CREATE INDEX idx_schema_versions_project ON schema_versions(project_id, created_at DESC);

-- Schema Diffs
CREATE TABLE schema_diffs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    from_version_id UUID REFERENCES schema_versions(id),
    to_version_id UUID REFERENCES schema_versions(id),

    -- Diff Results
    diff_report JSONB NOT NULL,
    has_breaking_changes BOOLEAN DEFAULT false,
    breaking_changes JSONB,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_schema_diffs_project ON schema_diffs(project_id, created_at DESC);

-- Subscriptions (for billing)
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Subscription Details
    tier VARCHAR(50) NOT NULL DEFAULT 'free', -- free, pro, enterprise
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, cancelled, expired

    -- Stripe Integration
    stripe_customer_id VARCHAR(100),
    stripe_subscription_id VARCHAR(100),

    -- Limits
    monthly_traffic_limit INTEGER,
    monthly_replay_limit INTEGER,

    -- Timestamps
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_org ON subscriptions(organization_id);

-- Usage Tracking (for billing)
CREATE TABLE usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Usage Metrics
    traffic_requests_count INTEGER DEFAULT 0,
    replay_requests_count INTEGER DEFAULT 0,

    -- Period
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (organization_id, period_start)
);

CREATE INDEX idx_usage_tracking_org_period ON usage_tracking(organization_id, period_start DESC);
```

### Go Domain Models

```go
// internal/models/traffic.go
package models

import (
    "time"
    "github.com/google/uuid"
)

type TrafficLog struct {
    ID               uuid.UUID              `json:"id" db:"id"`
    ProjectID        uuid.UUID              `json:"project_id" db:"project_id"`
    EnvironmentID    uuid.UUID              `json:"environment_id" db:"environment_id"`
    Method           string                 `json:"method" db:"method"`
    Path             string                 `json:"path" db:"path"`
    QueryParams      map[string]interface{} `json:"query_params,omitempty" db:"query_params"`
    RequestHeaders   map[string]interface{} `json:"request_headers,omitempty" db:"request_headers"`
    RequestBody      map[string]interface{} `json:"request_body,omitempty" db:"request_body"`
    StatusCode       int                    `json:"status_code" db:"status_code"`
    ResponseHeaders  map[string]interface{} `json:"response_headers,omitempty" db:"response_headers"`
    ResponseBody     map[string]interface{} `json:"response_body,omitempty" db:"response_body"`
    Timestamp        time.Time              `json:"timestamp" db:"timestamp"`
    LatencyMs        int                    `json:"latency_ms" db:"latency_ms"`
    IPAddress        string                 `json:"ip_address,omitempty" db:"ip_address"`
    UserAgent        string                 `json:"user_agent,omitempty" db:"user_agent"`
    PIIRedacted      bool                   `json:"pii_redacted" db:"pii_redacted"`
}

type ReplaySession struct {
    ID                    uuid.UUID              `json:"id" db:"id"`
    ProjectID             uuid.UUID              `json:"project_id" db:"project_id"`
    SourceEnvironmentID   uuid.UUID              `json:"source_environment_id" db:"source_environment_id"`
    TargetEnvironmentID   uuid.UUID              `json:"target_environment_id" db:"target_environment_id"`
    Name                  string                 `json:"name" db:"name"`
    Description           *string                `json:"description,omitempty" db:"description"`
    TrafficFilter         map[string]interface{} `json:"traffic_filter,omitempty" db:"traffic_filter"`
    StartTime             *time.Time             `json:"start_time,omitempty" db:"start_time"`
    EndTime               *time.Time             `json:"end_time,omitempty" db:"end_time"`
    SampleSize            int                    `json:"sample_size" db:"sample_size"`
    Status                string                 `json:"status" db:"status"`
    TotalRequests         int                    `json:"total_requests" db:"total_requests"`
    SuccessfulRequests    int                    `json:"successful_requests" db:"successful_requests"`
    FailedRequests        int                    `json:"failed_requests" db:"failed_requests"`
    MismatchedResponses   int                    `json:"mismatched_responses" db:"mismatched_responses"`
    CreatedBy             uuid.UUID              `json:"created_by" db:"created_by"`
    CreatedAt             time.Time              `json:"created_at" db:"created_at"`
    StartedAt             *time.Time             `json:"started_at,omitempty" db:"started_at"`
    CompletedAt           *time.Time             `json:"completed_at,omitempty" db:"completed_at"`
}

// ... other models
```

### TypeScript Types

```typescript
// types/traffic.ts
export interface TrafficLog {
  id: string;
  projectId: string;
  environmentId: string;
  method: string;
  path: string;
  queryParams?: Record<string, any>;
  requestHeaders?: Record<string, any>;
  requestBody?: Record<string, any>;
  statusCode: number;
  responseHeaders?: Record<string, any>;
  responseBody?: Record<string, any>;
  timestamp: string;
  latencyMs: number;
  ipAddress?: string;
  userAgent?: string;
  piiRedacted: boolean;
}

export interface ReplaySession {
  id: string;
  projectId: string;
  sourceEnvironmentId: string;
  targetEnvironmentId: string;
  name: string;
  description?: string;
  trafficFilter?: Record<string, any>;
  startTime?: string;
  endTime?: string;
  sampleSize: number;
  status: "pending" | "running" | "completed" | "failed";
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  mismatchedResponses: number;
  createdBy: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

// ... other types
```

---

## API Contracts

### RESTful API Endpoints

#### Authentication

```
POST   /api/v1/auth/login          # Login user
POST   /api/v1/auth/logout         # Logout user
POST   /api/v1/auth/refresh        # Refresh token
GET    /api/v1/auth/me             # Get current user
```

#### Projects

```
GET    /api/v1/projects            # List projects
POST   /api/v1/projects            # Create project
GET    /api/v1/projects/:id        # Get project
PUT    /api/v1/projects/:id        # Update project
DELETE /api/v1/projects/:id        # Delete project
```

#### Traffic

```
GET    /api/v1/projects/:id/traffic                 # List traffic logs
GET    /api/v1/projects/:id/traffic/:logId          # Get traffic log
GET    /api/v1/projects/:id/traffic/stats           # Get traffic stats
DELETE /api/v1/projects/:id/traffic                 # Bulk delete (with filters)
```

#### Replay

```
GET    /api/v1/projects/:id/replays                 # List replay sessions
POST   /api/v1/projects/:id/replays                 # Create replay session
GET    /api/v1/projects/:id/replays/:replayId       # Get replay session
DELETE /api/v1/projects/:id/replays/:replayId       # Delete replay session
POST   /api/v1/projects/:id/replays/:replayId/start # Start replay
POST   /api/v1/projects/:id/replays/:replayId/stop  # Stop replay
GET    /api/v1/projects/:id/replays/:replayId/results # Get replay results
GET    /api/v1/projects/:id/replays/:replayId/export  # Export report (PDF)
```

#### Schema Management

```
GET    /api/v1/projects/:id/schemas                 # List schema versions
POST   /api/v1/projects/:id/schemas                 # Upload schema
GET    /api/v1/projects/:id/schemas/:versionId      # Get schema
POST   /api/v1/projects/:id/schemas/diff            # Compare two schemas
```

### Request/Response Examples

#### Create Replay Session

```json
// POST /api/v1/projects/:id/replays
// Request
{
  "name": "Pre-production validation",
  "description": "Testing new discount calculation logic",
  "sourceEnvironmentId": "prod-env-uuid",
  "targetEnvironmentId": "staging-env-uuid",
  "trafficFilter": {
    "paths": ["/api/v1/cart/*"],
    "methods": ["POST", "PUT"],
    "statusCodes": [200, 201]
  },
  "startTime": "2026-02-17T00:00:00Z",
  "endTime": "2026-02-17T23:59:59Z",
  "sampleSize": 1000
}

// Response 201
{
  "id": "replay-uuid",
  "projectId": "project-uuid",
  "status": "pending",
  "createdAt": "2026-02-18T10:00:00Z",
  // ... other fields
}
```

---

## Code Quality Standards

### Go Standards

#### Code Style

- Follow official [Effective Go](https://go.dev/doc/effective_go) guidelines
- Use `gofmt` for formatting (enforced in CI)
- Use `golangci-lint` with strict configuration
- Maximum function length: 50 lines (excluding tests)
- Maximum file length: 500 lines

#### Naming Conventions

- Packages: lowercase, single word (e.g., `diffing`, `storage`)
- Interfaces: -er suffix (e.g., `Comparer`, `Storer`)
- Constructors: `New*` (e.g., `NewEngine()`)
- Private members: lowercase start (e.g., `privateFunc()`)
- Public members: uppercase start (e.g., `PublicFunc()`)

#### Error Handling

```go
// Always wrap errors with context
if err != nil {
    return fmt.Errorf("failed to parse schema: %w", err)
}

// Use custom error types for domain errors
type ValidationError struct {
    Field   string
    Message string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation error on field %s: %s", e.Field, e.Message)
}
```

#### Testing

- Table-driven tests for unit tests
- Minimum 80% code coverage
- Use testify/assert for assertions
- Mock external dependencies (interfaces)
- Subtests for better organization

```go
func TestDiffEngine_Compare(t *testing.T) {
    tests := []struct {
        name     string
        input1   interface{}
        input2   interface{}
        expected []Diff
    }{
        {
            name:   "simple field change",
            input1: map[string]interface{}{"name": "old"},
            input2: map[string]interface{}{"name": "new"},
            expected: []Diff{
                {Path: "name", Type: "modified", Old: "old", New: "new"},
            },
        },
        // ... more test cases
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            engine := NewDiffEngine()
            result := engine.Compare(tt.input1, tt.input2)
            assert.Equal(t, tt.expected, result)
        })
    }
}
```

#### Concurrency Patterns

- Use `sync.WaitGroup` for goroutine coordination
- Use `context.Context` for cancellation
- Use buffered channels for work queues
- Always defer channel close in producer

```go
// Worker pool pattern
func (r *Replayer) processTraffic(ctx context.Context, traffic []TrafficLog) error {
    workers := 10
    jobs := make(chan TrafficLog, len(traffic))
    results := make(chan Result, len(traffic))

    // Start workers
    var wg sync.WaitGroup
    for i := 0; i < workers; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for job := range jobs {
                select {
                case <-ctx.Done():
                    return
                case results <- r.replayRequest(ctx, job):
                }
            }
        }()
    }

    // Send jobs
    for _, log := range traffic {
        jobs <- log
    }
    close(jobs)

    // Wait for completion
    go func() {
        wg.Wait()
        close(results)
    }()

    // Collect results
    for result := range results {
        // Process result
    }

    return nil
}
```

### TypeScript/React Standards

#### Code Style

- Use ESLint + Prettier with recommended configs
- Prefer functional components with hooks
- Maximum component size: 200 lines
- Extract complex logic into custom hooks

#### Component Structure

```typescript
// components/replay/diff-viewer.tsx
'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface DiffViewerProps {
  original: any;
  modified: any;
  className?: string;
}

export function DiffViewer({ original, modified, className }: DiffViewerProps) {
  // Hooks first
  const [expanded, setExpanded] = useState(false);

  // Effects
  useEffect(() => {
    // ...
  }, [original, modified]);

  // Event handlers
  const handleExpand = () => setExpanded(!expanded);

  // Render helpers
  const renderDiff = () => {
    // ...
  };

  // Main render
  return (
    <div className={cn('diff-viewer', className)}>
      {/* ... */}
    </div>
  );
}
```

#### State Management

- Use TanStack Query for server state
- Use Context for global UI state (theme, sidebar, etc.)
- Use local state for component-specific state
- Avoid prop drilling (max 2 levels)

#### Type Safety

- No `any` types (use `unknown` if necessary)
- Use Zod for runtime validation
- Generate types from API responses

```typescript
// lib/schemas/replay.ts
import { z } from "zod";

export const replaySessionSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  sourceEnvironmentId: z.string().uuid(),
  targetEnvironmentId: z.string().uuid(),
  sampleSize: z.number().int().min(1).max(10000),
  // ...
});

export type ReplaySessionInput = z.infer<typeof replaySessionSchema>;
```

#### Testing

- Use React Testing Library
- Test user behavior, not implementation
- Minimum 70% coverage for components

---

## Sprint Implementation Plan

### Phase 1: Foundation (Weeks 1-2)

#### Sprint 1.1: Project Setup & Infrastructure

**Goal:** Set up development environment and tooling

**Backend Tasks:**

1. Initialize Go modules and project structure
2. Set up Docker Compose for local development (Postgres + Redis)
3. Configure Makefile with common commands (`make build`, `make test`, `make lint`)
4. Set up migration tool and create initial schema
5. Configure logging framework (structured JSON logs)
6. Set up GitHub Actions CI pipeline (lint, test, build)

**Frontend Tasks:**

1. Configure TailwindCSS with custom theme
2. Set up component library structure (Radix UI integration)
3. Create base layout components (Header, Sidebar, Footer)
4. Configure TanStack Query with default settings
5. Set up Clerk/Supabase Auth integration
6. Create routing structure with protected routes

**Deliverables:**

- ✅ `make dev` starts entire stack locally
- ✅ CI pipeline runs tests and builds
- ✅ Frontend renders with auth flow
- ✅ Database migrations run successfully

**Testing Checklist:**

- [ ] Can start local dev environment with single command
- [ ] CI pipeline passes on main branch
- [ ] Frontend routes properly with auth

---

#### Sprint 1.2: CLI - JSON Diff Engine (Feature 1.1)

**Goal:** Core diffing algorithm for JSON comparison

**Tasks:**

1. Create `internal/diffing` package structure
2. Implement deep JSON comparison algorithm
   - Handle nested objects
   - Handle arrays (ordered vs unordered comparison)
   - Type change detection
3. Implement diff output formatters
   - Human-readable text format
   - JSON format (for CI/CD)
   - Colored terminal output
4. Add comprehensive unit tests (edge cases: null, empty, large objects)

**Technical Details:**

```go
type Diff struct {
    Path      string      // JSON path (e.g., "user.address.street")
    Type      string      // added, removed, modified, type_changed
    OldValue  interface{} // nil if added
    NewValue  interface{} // nil if removed
    Severity  string      // info, warning, breaking
}

type DiffEngine struct {
    config DiffConfig
}

func (e *DiffEngine) Compare(a, b interface{}) ([]Diff, error)
```

**Performance Target:**

- Diff 1MB JSON in < 100ms
- Diff 10MB JSON in < 1s

**Testing Checklist:**

- [ ] Detects simple field changes
- [ ] Detects nested changes
- [ ] Handles array modifications
- [ ] Detects type changes (string → number)
- [ ] Handles null/undefined correctly
- [ ] Performance targets met

---

#### Sprint 1.3: CLI - OpenAPI Parser (Feature 1.2)

**Goal:** Parse and compare OpenAPI specifications

**Tasks:**

1. Integrate `getkin/kin-openapi` library
2. Create schema parser for OpenAPI 3.0/3.1
3. Implement breaking change detection rules:
   - Required field added/removed
   - Response schema changes
   - Endpoint URL changes
   - Method changes
   - Parameter changes (required → optional is safe, opposite is breaking)
4. Generate detailed change report

**Breaking Change Rules:**

```go
type BreakingChangeRule interface {
    Check(oldSpec, newSpec *openapi3.T) []BreakingChange
}

// Rules:
// 1. Removing required field is breaking
// 2. Changing field type is breaking
// 3. Removing endpoint is breaking
// 4. Changing response structure is breaking
// 5. Adding required parameter is breaking
```

**Testing Checklist:**

- [ ] Parses valid OpenAPI 3.0 specs
- [ ] Detects all breaking change types
- [ ] Does not flag non-breaking changes
- [ ] Generates actionable report

---

#### Sprint 1.4: CLI Interface (Feature 1.3)

**Goal:** User-friendly CLI tool

**Tasks:**

1. Set up Cobra CLI framework
2. Implement `tvc diff` command
   - `--file-old` and `--file-new` flags
   - `--format` flag (text|json|yaml)
   - `--output` flag (file path)
3. Implement `tvc schema diff` command
   - OpenAPI-specific diffing
   - `--breaking-only` flag
   - `--fail-on-breaking` flag (for CI)
4. Add version command and help docs
5. Cross-compile for macOS, Linux, Windows

**CLI Design:**

```bash
# Basic JSON diff
tvc diff --file-old old.json --file-new new.json

# Schema diff with CI integration
tvc schema diff \
  --file-old swagger-v1.yaml \
  --file-new swagger-v2.yaml \
  --breaking-only \
  --format json \
  --fail-on-breaking

# Exit codes:
# 0 - No changes
# 1 - Changes detected (breaking if --fail-on-breaking)
# 2 - Error
```

**Testing Checklist:**

- [ ] Binary runs on macOS/Linux/Windows
- [ ] All commands work with proper flags
- [ ] Exit codes are correct
- [ ] Help documentation is clear
- [ ] Error messages are user-friendly

---

### Phase 2: Traffic Proxy (Weeks 3-4)

#### Sprint 2.1: Reverse Proxy Skeleton (Feature 2.1)

**Goal:** Basic HTTP proxy that forwards traffic

**Tasks:**

1. Create `cmd/proxy/main.go` entrypoint
2. Implement basic HTTP server (port 8080)
3. Set up `httputil.ReverseProxy` with configurable target
4. Implement middleware chain:
   - Request logging
   - Request ID generation
   - CORS handling
   - Error recovery
5. Add graceful shutdown

**Architecture:**

```go
type ProxyServer struct {
    config     *config.ProxyConfig
    logger     *logger.Logger
    middleware []Middleware
}

type Middleware func(http.Handler) http.Handler

func (s *ProxyServer) ServeHTTP(w http.ResponseWriter, r *http.Request)
```

**Testing Checklist:**

- [ ] Forwards GET/POST/PUT/DELETE requests
- [ ] Preserves headers correctly
- [ ] Handles request bodies (streaming)
- [ ] Returns correct response to client
- [ ] < 5ms added latency

---

#### Sprint 2.2: Request/Response Capture (Feature 2.2)

**Goal:** Capture and store traffic asynchronously

**Tasks:**

1. Define traffic log schema (Go struct + DB table)
2. Implement middleware to capture request/response
   - Use `httputil.DumpRequest` carefully (avoid memory issues)
   - Capture response with custom ResponseWriter
3. Implement async buffering with channels
4. Create worker pool to consume from channel and write to DB
5. Add Redis queue as secondary buffer (if DB is slow)
6. Implement sampling strategy (configurable % of traffic)

**Performance Design:**

```go
type TrafficCapture struct {
    buffer     chan TrafficLog
    workers    int
    repository storage.Repository
    sampler    *Sampler
}

// Sampling strategies
type Sampler interface {
    ShouldSample(r *http.Request) bool
}

// Options: percentage, rate-limited, path-based, etc.
```

**Testing Checklist:**

- [ ] Captures 100 RPS without blocking
- [ ] All captured data matches original request/response
- [ ] Worker pool processes queue efficiently
- [ ] Sampling works correctly
- [ ] No memory leaks under load

---

#### Sprint 2.3: Configuration & Routing (Feature 2.3)

**Goal:** Dynamic routing with YAML config

**Tasks:**

1. Define YAML configuration schema
2. Implement config loader with hot-reload support
3. Implement dynamic routing (path-based forwarding)
4. Add health check endpoint (`/health`)
5. Add metrics endpoint (`/metrics`) - Prometheus format

**Config Example:**

```yaml
proxy:
  listen_addr: ":8080"
  sampling_rate: 0.1 # 10% of traffic

  routes:
    - path_prefix: "/api/v1/users"
      target: "http://users-service:8000"
      pii_detection: true

    - path_prefix: "/api/v1/orders"
      target: "http://orders-service:8001"
      sampling_rate: 1.0 # Override: capture 100%

  storage:
    postgres_url: "postgres://..."
    redis_url: "redis://..."

  buffer:
    queue_size: 10000
    workers: 20
```

**Testing Checklist:**

- [ ] Routes requests to correct backend
- [ ] Hot-reload works without downtime
- [ ] Health check is functional
- [ ] Metrics are accurate

---

### Phase 3: Replay Engine (Weeks 5-6)

#### Sprint 3.1: Traffic Selection & Filtering (Feature 3.1)

**Goal:** Query and filter captured traffic

**Tasks:**

1. Create repository methods for traffic queries
   - Time range filter
   - Path filter
   - Method filter
   - Status code filter
   - Limit & pagination
2. Implement PII-safe token replacement
3. Add SQL query optimization (explain analyze)

**API Example:**

```go
type TrafficFilter struct {
    ProjectID     uuid.UUID
    EnvironmentID uuid.UUID
    StartTime     time.Time
    EndTime       time.Time
    Paths         []string
    Methods       []string
    StatusCodes   []int
    Limit         int
}

func (r *Repository) FetchTraffic(ctx context.Context, filter TrafficFilter) ([]TrafficLog, error)
```

**Testing Checklist:**

- [ ] Filters work correctly
- [ ] Pagination is efficient
- [ ] Queries are optimized (< 100ms for 1M rows)
- [ ] No sensitive data leaks

---

#### Sprint 3.2: Replayer Client (Feature 3.2)

**Goal:** High-concurrency HTTP client

**Tasks:**

1. Create HTTP client pool (connection reuse)
2. Implement worker pool for concurrent replay
3. Add rate limiting (protect target server)
4. Implement retry logic with exponential backoff
5. Add timeout handling

**Design:**

```go
type Replayer struct {
    httpClient *http.Client
    workers    int
    rateLimit  int  // requests per second
}

func (r *Replayer) ReplayTraffic(ctx context.Context, traffic []TrafficLog, targetURL string) ([]ReplayResult, error)
```

**Performance Target:**

- 1000 RPS replay capability
- Graceful handling of target errors

**Testing Checklist:**

- [ ] Replays traffic accurately
- [ ] Rate limiting works
- [ ] Handles target server errors
- [ ] No connection leaks
- [ ] Achieves 1000 RPS target

---

#### Sprint 3.3: Comparison Logic (Feature 3.3)

**Goal:** Compare production vs staging responses

**Tasks:**

1. Integrate diff engine from Sprint 1.2
2. Implement semantic comparison (ignore whitespace, field order)
3. Add severity scoring:
   - Info: cosmetic differences (whitespace)
   - Warning: non-breaking changes (new optional field)
   - Error: data mismatches
   - Breaking: missing required fields, type changes
4. Store diff results in DB
5. Generate summary report

**Comparison Strategy:**

```go
type Comparer struct {
    diffEngine *diffing.DiffEngine
}

func (c *Comparer) Compare(original, replayed TrafficLog) ComparisonResult

type ComparisonResult struct {
    StatusMatch bool
    BodyMatch   bool
    Diffs       []Diff
    Severity    Severity
}
```

**Testing Checklist:**

- [ ] Detects response differences
- [ ] Severity scoring is accurate
- [ ] Ignores benign differences
- [ ] Intentional API break is caught

---

### Phase 4: Dashboard & PII (Weeks 7-8)

#### Sprint 4.1: PII Auto-Detection (Feature 4.1)

**Goal:** Automatically redact sensitive data

**Tasks:**

1. Implement regex patterns for common PII:
   - Email addresses
   - Phone numbers (US, international)
   - Credit card numbers
   - SSN
   - IP addresses (optional)
2. Implement redaction logic (replace with `***`)
3. Add PII detection to proxy capture pipeline
4. Make patterns configurable (YAML)
5. Add unit tests with real-world examples

**Patterns:**

```go
var PIIPatterns = map[string]*regexp.Regexp{
    "email":       regexp.MustCompile(`[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}`),
    "phone_us":    regexp.MustCompile(`\b\d{3}[-.]?\d{3}[-.]?\d{4}\b`),
    "credit_card": regexp.MustCompile(`\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b`),
    // ...
}
```

**Testing Checklist:**

- [ ] Detects all common PII types
- [ ] Does not over-redact (false positives)
- [ ] Performance: < 10ms for 1KB payload
- [ ] DB only contains redacted data

---

#### Sprint 4.2: Dashboard - Traffic View (Feature 4.2)

**Goal:** Real-time traffic monitoring UI

**Tasks:**

1. Create dashboard layout with navigation
2. Implement traffic stream page:
   - Real-time updates (polling or WebSocket)
   - Filterable table (path, method, status)
   - Pagination
3. Implement traffic detail page:
   - Request viewer (formatted JSON)
   - Response viewer (formatted JSON)
   - Headers & metadata display
4. Add stats cards (total requests, avg latency, error rate)
5. Implement search functionality

**Components:**

```typescript
// app/(auth)/dashboard/page.tsx
- StatsGrid: Overview metrics
- TrafficChart: Time-series visualization
- RecentActivity: Latest traffic logs

// app/(auth)/traffic/page.tsx
- TrafficTable: Paginated table with filters
- FilterBar: Search and filter controls

// app/(auth)/traffic/[id]/page.tsx
- RequestViewer: JSON viewer with syntax highlighting
- ResponseViewer: Side-by-side comparison
- MetadataPanel: Headers, latency, timestamp
```

**Testing Checklist:**

- [ ] Traffic updates in real-time
- [ ] Filters work correctly
- [ ] Detail page shows all data
- [ ] Performance: < 2s initial load

---

#### Sprint 4.3: Dashboard - Replay Interface (Feature 4.2 cont.)

**Goal:** Configure and run replay sessions

**Tasks:**

1. Create replay configuration form
   - Environment selection (source/target)
   - Traffic filters (time range, paths)
   - Sample size configuration
2. Implement replay execution UI:
   - Start/stop controls
   - Real-time progress bar
   - Live results stream
3. Create replay results page:
   - Summary statistics
   - Diff viewer (side-by-side)
   - Filter by severity
   - Export report (PDF)
4. Add replay history page

**Components:**

```typescript
// app/(auth)/replay/new/page.tsx
- ReplayConfigForm: Multi-step form

// app/(auth)/replay/[id]/page.tsx
- ReplayProgress: Real-time status
- ResultsSummary: Stats cards
- ResultsTable: Individual request results

// app/(auth)/replay/[id]/report/page.tsx
- DetailedDiffViewer: Side-by-side JSON diff
- SeverityBadge: Color-coded severity
- ExportButton: PDF generation
```

**Testing Checklist:**

- [ ] Form validation works
- [ ] Replay starts successfully
- [ ] Progress updates in real-time
- [ ] Results display correctly
- [ ] PDF export works

---

#### Sprint 4.4: Authentication & Billing (Feature 4.3)

**Goal:** User auth and subscription management

**Tasks:**

1. Integrate Clerk/Supabase Auth:
   - Login/signup flow
   - Protected routes middleware
   - Session management
2. Create organization/project structure:
   - User can belong to multiple orgs
   - Project creation/management
3. Integrate Stripe:
   - Checkout flow
   - Webhook handlers (subscription created/cancelled)
   - Usage tracking
4. Implement subscription checks:
   - Free tier: CLI only
   - Pro tier: Traffic capture + replay (limits)
   - Enterprise tier: Unlimited
5. Create settings/billing page

**Subscription Tiers:**

```typescript
const PLANS = {
  free: {
    name: "Free",
    price: 0,
    features: ["CLI tool", "Schema diffing", "Community support"],
    limits: { traffic: 0, replays: 0 },
  },
  pro: {
    name: "Pro",
    price: 99, // per month
    features: [
      "Everything in Free",
      "100K traffic logs/mo",
      "50 replays/mo",
      "Email support",
    ],
    limits: { traffic: 100000, replays: 50 },
  },
  enterprise: {
    name: "Enterprise",
    price: 499,
    features: [
      "Everything in Pro",
      "Unlimited traffic",
      "Unlimited replays",
      "Priority support",
    ],
    limits: { traffic: -1, replays: -1 }, // unlimited
  },
};
```

**Testing Checklist:**

- [ ] Login/signup flow works
- [ ] Protected routes enforce auth
- [ ] Stripe checkout completes
- [ ] Webhooks are processed
- [ ] Feature access respects subscription tier

---

## Testing Strategy

### Unit Tests

- **Coverage Target:** 80% for backend, 70% for frontend
- **Tools:** Go testing package, testify assertions, React Testing Library
- **Run Frequency:** On every commit (pre-commit hook + CI)

### Integration Tests

- **Scope:** API endpoints, database operations, proxy behavior
- **Tools:** Docker Compose for test dependencies, Postman/Newman for API tests
- **Run Frequency:** On PR creation, before merge

### End-to-End Tests

- **Scope:** Critical user flows (auth, replay creation, report generation)
- **Tools:** Playwright or Cypress
- **Run Frequency:** Nightly builds, before production deploy

### Performance Tests

- **Scope:** Proxy latency, replay throughput, database query performance
- **Tools:** `hey` or `wrk` for HTTP load testing, `pgbench` for DB
- **Benchmarks:**
  - Proxy: < 5ms added latency at 1000 RPS
  - Replay: 1000 RPS throughput
  - Database queries: < 100ms for p95

### Load Tests

- **Scope:** System behavior under high load
- **Tools:** k6 or Gatling
- **Scenarios:**
  - 10,000 RPS for 5 minutes
  - 100 concurrent replay sessions
- **Run Frequency:** Before major releases

---

## Development Workflow

### Git Workflow

- **Main Branch:** `main` (production-ready)
- **Development Branch:** `develop` (integration branch)
- **Feature Branches:** `feature/sprint-X-Y-description`
- **Hotfix Branches:** `hotfix/description`

### Branch Protection

- Require PR reviews (minimum 1 approval)
- Enforce CI checks (lint, test, build)
- No direct commits to `main`

### Commit Convention

Follow Conventional Commits:

```
feat(proxy): add PII redaction middleware
fix(cli): handle empty JSON files
docs(readme): update installation instructions
test(replayer): add concurrency tests
refactor(diffing): improve performance
```

### Code Review Checklist

- [ ] Code follows style guide
- [ ] Tests are included and pass
- [ ] No console.log or TODO comments
- [ ] Error handling is comprehensive
- [ ] Performance considerations addressed
- [ ] Documentation updated (if needed)

### CI/CD Pipeline

**On PR:**

1. Lint (golangci-lint, ESLint)
2. Unit tests
3. Integration tests
4. Build check

**On Merge to `develop`:**

1. All above checks
2. Deploy to staging environment
3. Run E2E tests
4. Notify team

**On Merge to `main`:**

1. All above checks
2. Create release tag
3. Build production binaries
4. Deploy to production
5. Notify stakeholders

---

## Risk Assessment & Mitigation

### Technical Risks

#### Risk 1: Proxy Performance Bottleneck

**Impact:** High  
**Probability:** Medium  
**Mitigation:**

- Implement efficient async buffering
- Use connection pooling
- Add caching layer (Redis)
- Load test early and often
- Have fallback mode (sampling 1% instead of 10%)

#### Risk 2: Database Growth (Traffic Logs)

**Impact:** High  
**Probability:** High  
**Mitigation:**

- Implement table partitioning from day 1
- Add automatic data retention policy (90 days default)
- Plan migration path to ClickHouse
- Implement data archival to S3

#### Risk 3: PII Leakage

**Impact:** Critical  
**Probability:** Low  
**Mitigation:**

- Comprehensive PII pattern testing
- Regular security audits
- Allow custom PII patterns per project
- Encrypt data at rest
- Audit logging for data access

#### Risk 4: Replay Overwhelming Target Server

**Impact:** Medium  
**Probability:** Medium  
**Mitigation:**

- Implement rate limiting
- Add circuit breaker pattern
- Default to conservative replay rates
- Provide clear warnings in UI
- Add "dry run" mode

### Product Risks

#### Risk 1: Poor CLI Developer Experience

**Impact:** High  
**Probability:** Low  
**Mitigation:**

- Invest in clear error messages
- Comprehensive documentation
- Video tutorials
- Early beta testing with real developers

#### Risk 2: Complex Setup/Integration

**Impact:** High  
**Probability:** Medium  
**Mitigation:**

- Provide Docker Compose setup
- One-line install script
- Clear step-by-step guides
- Offer managed service option

#### Risk 3: Insufficient Free Tier Value

**Impact:** High  
**Probability:** Medium  
**Mitigation:**

- Ensure CLI is genuinely useful standalone
- Create compelling upgrade path
- Transparent pricing
- Free tier extended trial for traffic features

---

## Success Metrics

### Development Metrics

- **Sprint Velocity:** Complete planned features per sprint
- **Code Quality:** Maintain 80%+ test coverage
- **CI/CD:** < 10 min pipeline duration
- **Bug Rate:** < 5 bugs per sprint

### Product Metrics (Post-Launch)

- **Adoption:** 1000 CLI downloads in first month
- **Activation:** 100 sign-ups for paid tier in first quarter
- **Engagement:** 50% of users run replay at least weekly
- **Performance:** 99.9% uptime for proxy service

---

## Next Steps

1. **Review This Document:** Please review and provide feedback
2. **Align on Priorities:** Confirm sprint order and timeline
3. **Resource Allocation:** Confirm development capacity
4. **Kick-off Sprint 1.1:** Set up development environment

---

## Questions for Review

1. **Tech Stack:** Any concerns about Go + Next.js + PostgreSQL?
2. **Scope:** Should we adjust the sprint breakdown?
3. **Timeline:** Is 8 weeks realistic for Phase 1-4?
4. **Priorities:** Any features to prioritize or defer?
5. **Infrastructure:** Preference for Supabase vs self-hosted Postgres?
6. **Auth:** Preference for Clerk vs Supabase Auth?

---

**Document Status:** ✅ Ready for Review  
**Next Action:** Awaiting stakeholder approval to begin Sprint 1.1
