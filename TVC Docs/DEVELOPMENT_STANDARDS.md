# TVC Development Standards & Best Practices

**Document Version:** 1.0  
**Last Updated:** February 18, 2026  
**Status:** Living Document

---

## Table of Contents

1. [Philosophy](#philosophy)
2. [Go Backend Standards](#go-backend-standards)
3. [TypeScript/React Frontend Standards](#typescriptreact-frontend-standards)
4. [Database Standards](#database-standards)
5. [API Design Standards](#api-design-standards)
6. [Security Standards](#security-standards)
7. [Performance Standards](#performance-standards)
8. [Documentation Standards](#documentation-standards)
9. [Git Standards](#git-standards)
10. [Review Process](#review-process)

---

## Philosophy

### Core Principles

1. **Clarity over Cleverness:** Code should be obvious and boring, not clever and complex
2. **Tests are Documentation:** Good tests explain how code should be used
3. **Fail Fast, Fail Loud:** Errors should be caught early and reported clearly
4. **Optimize for Readability:** Code is read 10x more than it's written
5. **Progressive Enhancement:** Build solid core, add features incrementally
6. **Zero Trust Input:** Validate everything from external sources
7. **Explicit over Implicit:** Make intentions clear in code

### Code Review Mindset

**When Writing Code:**

- Would a new team member understand this in 6 months?
- Are edge cases handled?
- Is this the simplest solution?
- Are errors actionable?

**When Reviewing Code:**

- Is this approach sound?
- Are there test gaps?
- Could this fail under load?
- Is security considered?

---

## Go Backend Standards

### Project Organization

#### Package Structure Rules

```
✅ DO: Organize by domain/feature
internal/
  ├── diffing/      # All diffing logic
  ├── proxy/        # All proxy logic
  └── replay/       # All replay logic

❌ DON'T: Organize by layer
internal/
  ├── handlers/     # Mixed concerns
  ├── services/     # Mixed concerns
  └── repositories/ # Mixed concerns
```

#### Import Order

```go
import (
    // 1. Standard library
    "context"
    "fmt"
    "net/http"

    // 2. External packages
    "github.com/google/uuid"
    "github.com/gorilla/mux"

    // 3. Internal packages
    "github.com/yourorg/tvc/internal/models"
    "github.com/yourorg/tvc/pkg/logger"
)
```

### Code Style

#### Naming Conventions

```go
// ✅ Good: Clear, descriptive names
func (r *Replayer) ReplayTrafficWithRetry(ctx context.Context, traffic []TrafficLog) error
var maxRetryAttempts = 3
type HTTPClientPool struct { ... }

// ❌ Bad: Abbreviated, unclear names
func (r *Replayer) RepTrfcWthRtry(ctx context.Context, t []TL) error
var mxRtryAtt = 3
type HCPool struct { ... }

// Acronyms: Use consistent casing
type HTTPServer struct { ... }  // ✅ HTTP, not Http
type URLParser struct { ... }   // ✅ URL, not Url
type IDGenerator struct { ... } // ✅ ID, not Id

// Interface naming
type Comparer interface { ... }     // ✅ -er suffix
type DiffEngine interface { ... }   // ✅ If -er doesn't fit
type IComparer interface { ... }    // ❌ No I- prefix

// Boolean names
var isEnabled bool          // ✅ is-, has-, can-
var shouldRetry bool        // ✅
var enabled bool            // ❌ Less clear
```

#### Function Design

```go
// ✅ Good: Single responsibility, clear contract
func (r *Replayer) ReplayRequest(ctx context.Context, log TrafficLog, targetURL string) (*ReplayResult, error) {
    // Single, focused responsibility
    // Clear inputs and outputs
    // Error as return value
}

// ❌ Bad: Multiple responsibilities, unclear contract
func (r *Replayer) DoStuff(stuff interface{}) bool {
    // What does this do?
    // What is "stuff"?
    // What does bool mean?
}

// Function length: Aim for < 50 lines
// If longer, extract helper functions
func (r *Replayer) ProcessTraffic(ctx context.Context, traffic []TrafficLog) error {
    if err := r.validateTraffic(traffic); err != nil {
        return err
    }

    results := r.replayInParallel(ctx, traffic)

    if err := r.storeResults(ctx, results); err != nil {
        return err
    }

    return nil
}
```

#### Error Handling

```go
// ✅ Excellent: Wrap with context, return quickly
func (s *SchemaParser) ParseOpenAPI(filePath string) (*Schema, error) {
    data, err := os.ReadFile(filePath)
    if err != nil {
        return nil, fmt.Errorf("failed to read schema file %q: %w", filePath, err)
    }

    var schema Schema
    if err := yaml.Unmarshal(data, &schema); err != nil {
        return nil, fmt.Errorf("failed to parse YAML in %q: %w", filePath, err)
    }

    if err := s.validateSchema(&schema); err != nil {
        return nil, fmt.Errorf("schema validation failed: %w", err)
    }

    return &schema, nil
}

// ❌ Bad: Silent failures, lost context
func (s *SchemaParser) ParseOpenAPI(filePath string) (*Schema, error) {
    data, err := os.ReadFile(filePath)
    if err != nil {
        return nil, err  // Lost context!
    }

    var schema Schema
    yaml.Unmarshal(data, &schema)  // Ignored error!

    return &schema, nil
}

// Custom error types for domain errors
type ValidationError struct {
    Field   string
    Value   interface{}
    Message string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation failed for field %q (value: %v): %s",
        e.Field, e.Value, e.Message)
}

// Using errors.Is and errors.As
var ErrNotFound = errors.New("resource not found")

func (r *Repository) GetTraffic(id uuid.UUID) (*TrafficLog, error) {
    // ...
    if noRows {
        return nil, fmt.Errorf("traffic log %s: %w", id, ErrNotFound)
    }
    // ...
}

// Caller can check
log, err := repo.GetTraffic(id)
if errors.Is(err, ErrNotFound) {
    // Handle not found specifically
}
```

#### Concurrency Patterns

```go
// Pattern 1: Worker Pool with Error Group
import "golang.org/x/sync/errgroup"

func (r *Replayer) ReplayBatch(ctx context.Context, logs []TrafficLog) error {
    g, ctx := errgroup.WithContext(ctx)

    // Create jobs channel
    jobs := make(chan TrafficLog, len(logs))
    for _, log := range logs {
        jobs <- log
    }
    close(jobs)

    // Start workers
    numWorkers := 10
    for i := 0; i < numWorkers; i++ {
        g.Go(func() error {
            for job := range jobs {
                select {
                case <-ctx.Done():
                    return ctx.Err()
                default:
                    if err := r.replayOne(ctx, job); err != nil {
                        return fmt.Errorf("replay failed: %w", err)
                    }
                }
            }
            return nil
        })
    }

    // Wait for all workers
    if err := g.Wait(); err != nil {
        return fmt.Errorf("batch replay failed: %w", err)
    }

    return nil
}

// Pattern 2: Pipeline with Channels
func (p *ProxyServer) StartCapturePipeline(ctx context.Context) error {
    // Stage 1: Capture -> PII Detection
    captured := make(chan TrafficLog, 100)
    sanitized := make(chan TrafficLog, 100)

    g, ctx := errgroup.WithContext(ctx)

    // PII Detection workers
    g.Go(func() error {
        return p.piiDetectionWorker(ctx, captured, sanitized)
    })

    // Storage workers
    g.Go(func() error {
        return p.storageWorker(ctx, sanitized)
    })

    return g.Wait()
}

// Pattern 3: Rate Limiting
import "golang.org/x/time/rate"

type RateLimitedReplayer struct {
    limiter *rate.Limiter
    client  *http.Client
}

func (r *RateLimitedReplayer) Replay(ctx context.Context, log TrafficLog) error {
    // Wait for rate limiter
    if err := r.limiter.Wait(ctx); err != nil {
        return fmt.Errorf("rate limit wait failed: %w", err)
    }

    // Make request
    return r.makeRequest(ctx, log)
}

// Pattern 4: Timeout with Context
func (r *Replayer) ReplayWithTimeout(log TrafficLog, timeout time.Duration) error {
    ctx, cancel := context.WithTimeout(context.Background(), timeout)
    defer cancel()

    done := make(chan error, 1)
    go func() {
        done <- r.replayOne(ctx, log)
    }()

    select {
    case err := <-done:
        return err
    case <-ctx.Done():
        return fmt.Errorf("replay timeout after %v: %w", timeout, ctx.Err())
    }
}
```

#### Testing Standards

```go
// Table-driven tests
func TestDiffEngine_Compare(t *testing.T) {
    tests := []struct {
        name    string
        input1  map[string]interface{}
        input2  map[string]interface{}
        want    []Diff
        wantErr bool
    }{
        {
            name: "simple field change",
            input1: map[string]interface{}{
                "name": "John",
                "age":  30,
            },
            input2: map[string]interface{}{
                "name": "Jane",
                "age":  30,
            },
            want: []Diff{
                {
                    Path:     "name",
                    Type:     "modified",
                    OldValue: "John",
                    NewValue: "Jane",
                },
            },
            wantErr: false,
        },
        {
            name: "nested object change",
            input1: map[string]interface{}{
                "user": map[string]interface{}{
                    "address": map[string]interface{}{
                        "city": "NYC",
                    },
                },
            },
            input2: map[string]interface{}{
                "user": map[string]interface{}{
                    "address": map[string]interface{}{
                        "city": "LA",
                    },
                },
            },
            want: []Diff{
                {
                    Path:     "user.address.city",
                    Type:     "modified",
                    OldValue: "NYC",
                    NewValue: "LA",
                },
            },
            wantErr: false,
        },
        // More test cases...
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            engine := NewDiffEngine()
            got, err := engine.Compare(tt.input1, tt.input2)

            if (err != nil) != tt.wantErr {
                t.Errorf("Compare() error = %v, wantErr %v", err, tt.wantErr)
                return
            }

            if !reflect.DeepEqual(got, tt.want) {
                t.Errorf("Compare() = %v, want %v", got, tt.want)
            }
        })
    }
}

// Subtests for better organization
func TestProxyServer(t *testing.T) {
    t.Run("forwards requests", func(t *testing.T) {
        // Test implementation
    })

    t.Run("captures traffic", func(t *testing.T) {
        // Test implementation
    })

    t.Run("handles errors", func(t *testing.T) {
        // Test implementation
    })
}

// Mocking with interfaces
type MockRepository struct {
    GetTrafficFunc func(uuid.UUID) (*TrafficLog, error)
}

func (m *MockRepository) GetTraffic(id uuid.UUID) (*TrafficLog, error) {
    if m.GetTrafficFunc != nil {
        return m.GetTrafficFunc(id)
    }
    return nil, errors.New("not implemented")
}

// Using testify
import "github.com/stretchr/testify/assert"

func TestSomething(t *testing.T) {
    result := doSomething()

    assert.NotNil(t, result)
    assert.Equal(t, "expected", result.Value)
    assert.NoError(t, result.Error)
}

// Test helpers
func setupTestDB(t *testing.T) *sql.DB {
    t.Helper()

    db, err := sql.Open("postgres", "postgres://...")
    if err != nil {
        t.Fatalf("failed to open test db: %v", err)
    }

    t.Cleanup(func() {
        db.Close()
    })

    return db
}
```

#### Configuration Management

```go
// Use Viper for config
import "github.com/spf13/viper"

type Config struct {
    Server   ServerConfig   `mapstructure:"server"`
    Database DatabaseConfig `mapstructure:"database"`
    Redis    RedisConfig    `mapstructure:"redis"`
}

type ServerConfig struct {
    Host string `mapstructure:"host"`
    Port int    `mapstructure:"port"`
}

func LoadConfig(path string) (*Config, error) {
    viper.SetConfigFile(path)
    viper.AutomaticEnv()
    viper.SetEnvPrefix("TVC")

    if err := viper.ReadInConfig(); err != nil {
        return nil, fmt.Errorf("failed to read config: %w", err)
    }

    var config Config
    if err := viper.Unmarshal(&config); err != nil {
        return nil, fmt.Errorf("failed to unmarshal config: %w", err)
    }

    if err := validateConfig(&config); err != nil {
        return nil, fmt.Errorf("invalid config: %w", err)
    }

    return &config, nil
}

// Validation
func validateConfig(c *Config) error {
    if c.Server.Port < 1 || c.Server.Port > 65535 {
        return fmt.Errorf("invalid port: %d", c.Server.Port)
    }
    // More validations...
    return nil
}
```

---

## TypeScript/React Frontend Standards

### Project Organization

```
app/
  ├── (auth)/           # Route groups
  ├── (marketing)/
  └── api/

components/
  ├── ui/               # Generic UI components
  ├── dashboard/        # Domain-specific components
  └── shared/           # Shared across domains

lib/
  ├── api/              # API client code
  ├── hooks/            # Custom hooks
  ├── utils/            # Pure utility functions
  └── schemas/          # Zod schemas
```

### Component Design

```typescript
// ✅ Good: Properly typed functional component
interface DiffViewerProps {
  original: Record<string, any>;
  modified: Record<string, any>;
  onSelect?: (path: string) => void;
  className?: string;
}

export function DiffViewer({
  original,
  modified,
  onSelect,
  className
}: DiffViewerProps) {
  // 1. Hooks (at top)
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const { data: diffResult } = useDiff(original, modified);

  // 2. Memoized values
  const sortedDiffs = useMemo(() => {
    return diffResult?.diffs.sort((a, b) =>
      a.severity.localeCompare(b.severity)
    );
  }, [diffResult]);

  // 3. Callbacks
  const handleToggle = useCallback((path: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  // 4. Effects
  useEffect(() => {
    if (diffResult?.hasBreakingChanges) {
      toast.error('Breaking changes detected!');
    }
  }, [diffResult?.hasBreakingChanges]);

  // 5. Early returns
  if (!diffResult) {
    return <LoadingSpinner />;
  }

  if (diffResult.diffs.length === 0) {
    return <EmptyState message="No differences found" />;
  }

  // 6. Render
  return (
    <div className={cn('diff-viewer', className)}>
      {sortedDiffs?.map((diff) => (
        <DiffItem
          key={diff.path}
          diff={diff}
          expanded={expanded.has(diff.path)}
          onToggle={handleToggle}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

// ❌ Bad: Untyped, disorganized component
export function DiffViewer(props: any) {
  const data = useDiff(props.original, props.modified);

  if (!data) return <div>Loading...</div>;

  const [expanded, setExpanded] = useState(new Set());

  // Effects in wrong order
  useEffect(() => {
    // ...
  });

  // Inline handlers
  return (
    <div>
      {data.diffs.map((diff: any) => (
        <div onClick={() => {
          // Complex inline logic
        }}>
          {/* ... */}
        </div>
      ))}
    </div>
  );
}
```

### Custom Hooks

```typescript
// ✅ Good: Reusable, well-typed hook
import { useQuery } from "@tanstack/react-query";
import { trafficApi } from "@/lib/api/traffic";

interface UseTrafficOptions {
  projectId: string;
  filters?: TrafficFilters;
  enabled?: boolean;
}

export function useTraffic({
  projectId,
  filters,
  enabled = true,
}: UseTrafficOptions) {
  return useQuery({
    queryKey: ["traffic", projectId, filters],
    queryFn: () => trafficApi.list(projectId, filters),
    enabled: enabled && !!projectId,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });
}

// Usage
function TrafficPage() {
  const { projectId } = useParams();
  const [filters, setFilters] = useState<TrafficFilters>({});

  const {
    data: traffic,
    isLoading,
    error,
    refetch,
  } = useTraffic({
    projectId,
    filters,
  });

  // ...
}

// Complex hook example
export function useReplaySession(sessionId: string) {
  const queryClient = useQueryClient();

  // Query for session data
  const sessionQuery = useQuery({
    queryKey: ["replay-session", sessionId],
    queryFn: () => replayApi.getSession(sessionId),
  });

  // Mutation to start replay
  const startMutation = useMutation({
    mutationFn: () => replayApi.startSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["replay-session", sessionId],
      });
    },
  });

  // Poll for status updates when running
  useQuery({
    queryKey: ["replay-status", sessionId],
    queryFn: () => replayApi.getStatus(sessionId),
    enabled: sessionQuery.data?.status === "running",
    refetchInterval: 2000, // 2 seconds
  });

  return {
    session: sessionQuery.data,
    isLoading: sessionQuery.isLoading,
    error: sessionQuery.error,
    startReplay: startMutation.mutate,
    isStarting: startMutation.isPending,
  };
}
```

### Type Safety

```typescript
// ✅ Excellent: Strict types, no any
import { z } from 'zod';

// Define schema
export const replayConfigSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  sourceEnvironmentId: z.string().uuid(),
  targetEnvironmentId: z.string().uuid(),
  sampleSize: z.number().int().min(1).max(10000),
  trafficFilter: z.object({
    paths: z.array(z.string()).optional(),
    methods: z.array(z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])).optional(),
    statusCodes: z.array(z.number().int().min(100).max(599)).optional(),
  }).optional(),
});

// Infer TypeScript type
export type ReplayConfig = z.infer<typeof replayConfigSchema>;

// Use in form
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

function ReplayConfigForm() {
  const form = useForm<ReplayConfig>({
    resolver: zodResolver(replayConfigSchema),
    defaultValues: {
      name: '',
      sampleSize: 100,
    },
  });

  const onSubmit = async (data: ReplayConfig) => {
    // data is fully typed!
    await replayApi.create(projectId, data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('name')} />
      {form.formState.errors.name && (
        <p>{form.formState.errors.name.message}</p>
      )}
      {/* ... */}
    </form>
  );
}

// ❌ Bad: Loose types
function ReplayConfigForm() {
  const [config, setConfig] = useState<any>({});

  const onSubmit = (e: any) => {
    e.preventDefault();
    replayApi.create(projectId, config); // No type safety!
  };

  // ...
}
```

### State Management

```typescript
// Use TanStack Query for server state
// Use Context for global UI state

// contexts/sidebar-context.tsx
import { createContext, useContext, useState, ReactNode } from 'react';

interface SidebarContextValue {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
}

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);

  const value: SidebarContextValue = {
    isOpen,
    toggle: () => setIsOpen(prev => !prev),
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  };

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider');
  }
  return context;
}

// Usage
function Layout({ children }: { children: ReactNode }) {
  const { isOpen, toggle } = useSidebar();

  return (
    <div className={cn('layout', isOpen && 'sidebar-open')}>
      <Sidebar isOpen={isOpen} onToggle={toggle} />
      <main>{children}</main>
    </div>
  );
}
```

### Performance Optimization

```typescript
// 1. Memoization
import { memo, useMemo, useCallback } from 'react';

// Memo for expensive components
export const TrafficTable = memo(function TrafficTable({
  data,
  onRowClick,
}: TrafficTableProps) {
  // Component only re-renders if data or onRowClick changes
  return (
    <table>
      {data.map(row => (
        <TrafficRow key={row.id} data={row} onClick={onRowClick} />
      ))}
    </table>
  );
});

// useMemo for expensive computations
function DiffViewer({ diffs }: { diffs: Diff[] }) {
  const groupedDiffs = useMemo(() => {
    return diffs.reduce((acc, diff) => {
      const severity = diff.severity;
      if (!acc[severity]) {
        acc[severity] = [];
      }
      acc[severity].push(diff);
      return acc;
    }, {} as Record<string, Diff[]>);
  }, [diffs]);

  // ...
}

// useCallback for stable function references
function TrafficStream() {
  const [selected, setSelected] = useState<string[]>([]);

  const handleSelect = useCallback((id: string) => {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  }, []);

  return <TrafficTable data={traffic} onSelect={handleSelect} />;
}

// 2. Code splitting
import dynamic from 'next/dynamic';

const DiffViewer = dynamic(() => import('@/components/replay/diff-viewer'), {
  loading: () => <LoadingSpinner />,
  ssr: false, // Client-side only if needed
});

// 3. Virtual scrolling for large lists
import { useVirtualizer } from '@tanstack/react-virtual';

function TrafficList({ items }: { items: TrafficLog[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <TrafficRow data={items[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Database Standards

### Schema Design

```sql
-- ✅ Good practices:

-- 1. Always use UUIDs for primary keys
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- ...
);

-- 2. Use timestamps for audit trail
CREATE TABLE traffic_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- ...
);

-- 3. Add indexes for common queries
CREATE INDEX idx_traffic_logs_project_time
    ON traffic_logs(project_id, timestamp DESC);

CREATE INDEX idx_traffic_logs_path
    ON traffic_logs USING gin(path gin_trgm_ops);  -- For LIKE queries

-- 4. Use JSONB for flexible data
CREATE TABLE traffic_logs (
    -- ...
    request_body JSONB,
    response_body JSONB
);

-- Index JSONB fields if queried
CREATE INDEX idx_traffic_logs_request_body
    ON traffic_logs USING gin(request_body);

-- 5. Use partitioning for large tables
CREATE TABLE traffic_logs (
    id UUID DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    -- ...
    PRIMARY KEY (id, timestamp)
) PARTITION BY RANGE (timestamp);

-- 6. Use constraints for data integrity
ALTER TABLE replay_sessions
    ADD CONSTRAINT replay_sessions_valid_dates
    CHECK (end_time > start_time OR end_time IS NULL);

ALTER TABLE usage_tracking
    ADD CONSTRAINT usage_tracking_non_negative
    CHECK (traffic_requests_count >= 0 AND replay_requests_count >= 0);

-- 7. Use enums for fixed values (via check constraints)
ALTER TABLE replay_sessions
    ADD CONSTRAINT replay_sessions_status_check
    CHECK (status IN ('pending', 'running', 'completed', 'failed'));
```

### Query Optimization

```sql
-- ✅ Use EXPLAIN ANALYZE
EXPLAIN ANALYZE
SELECT * FROM traffic_logs
WHERE project_id = '...'
  AND timestamp >= NOW() - INTERVAL '1 day'
ORDER BY timestamp DESC
LIMIT 100;

-- ❌ Don't SELECT * if you don't need all columns
-- ✅ Select only what you need
SELECT id, method, path, status_code, timestamp
FROM traffic_logs
WHERE ...;

-- ✅ Use CTEs for complex queries
WITH recent_traffic AS (
    SELECT *
    FROM traffic_logs
    WHERE timestamp >= NOW() - INTERVAL '1 hour'
),
error_traffic AS (
    SELECT *
    FROM recent_traffic
    WHERE status_code >= 400
)
SELECT
    path,
    COUNT(*) as error_count,
    AVG(latency_ms) as avg_latency
FROM error_traffic
GROUP BY path
ORDER BY error_count DESC;

-- ✅ Use indexes wisely
-- Bad: Function on indexed column
SELECT * FROM traffic_logs WHERE LOWER(path) = '/api/users';

-- Good: Use functional index
CREATE INDEX idx_traffic_logs_path_lower ON traffic_logs (LOWER(path));

-- Or: Store normalized values
ALTER TABLE traffic_logs ADD COLUMN path_normalized TEXT;
CREATE INDEX idx_traffic_logs_path_normalized ON traffic_logs (path_normalized);
```

### Migrations

```sql
-- migrations/000001_initial_schema.up.sql

-- Always include IF NOT EXISTS for idempotency
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);

-- migrations/000001_initial_schema.down.sql

-- Always provide rollback
DROP TABLE IF EXISTS organizations CASCADE;
```

---

## API Design Standards

### RESTful Conventions

```
✅ Good API design:

GET    /api/v1/projects              # List resources
POST   /api/v1/projects              # Create resource
GET    /api/v1/projects/:id          # Get single resource
PUT    /api/v1/projects/:id          # Full update
PATCH  /api/v1/projects/:id          # Partial update
DELETE /api/v1/projects/:id          # Delete resource

GET    /api/v1/projects/:id/traffic  # Nested resource

POST   /api/v1/projects/:id/replays/:replayId/start  # Action on resource
```

### Request/Response Format

```json
// Request: POST /api/v1/projects
{
  "name": "My API",
  "description": "Production API"
}

// Success Response: 201 Created
{
  "id": "uuid",
  "name": "My API",
  "description": "Production API",
  "createdAt": "2026-02-18T10:00:00Z",
  "updatedAt": "2026-02-18T10:00:00Z"
}

// Error Response: 400 Bad Request
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "name",
        "message": "Name is required"
      }
    ]
  }
}

// Error Response: 500 Internal Server Error
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred",
    "requestId": "req_123abc"  // For support/debugging
  }
}
```

### Pagination

```
GET /api/v1/traffic?page=2&limit=50&sort=-timestamp

Response:
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 50,
    "total": 1000,
    "totalPages": 20
  }
}
```

### Versioning

```
# URL versioning (preferred for simplicity)
/api/v1/projects
/api/v2/projects

# Header versioning (alternative)
Accept: application/vnd.tvc.v1+json
```

---

## Security Standards

### Authentication

```go
// JWT validation middleware
func AuthMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        authHeader := r.Header.Get("Authorization")
        if authHeader == "" {
            http.Error(w, "Missing authorization header", http.StatusUnauthorized)
            return
        }

        token := strings.TrimPrefix(authHeader, "Bearer ")
        claims, err := validateJWT(token)
        if err != nil {
            http.Error(w, "Invalid token", http.StatusUnauthorized)
            return
        }

        // Add user info to context
        ctx := context.WithValue(r.Context(), "user_id", claims.UserID)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}
```

### Input Validation

```go
// ✅ Always validate input
func (h *Handler) CreateProject(w http.ResponseWriter, r *http.Request) {
    var input CreateProjectInput
    if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
        respondError(w, http.StatusBadRequest, "Invalid JSON")
        return
    }

    if err := validator.Validate(input); err != nil {
        respondValidationError(w, err)
        return
    }

    // Process validated input...
}

// ❌ Never trust input directly
func (h *Handler) CreateProject(w http.ResponseWriter, r *http.Request) {
    var input map[string]interface{}
    json.NewDecoder(r.Body).Decode(&input)

    // Dangerous: no validation!
    h.service.Create(input["name"].(string))
}
```

### SQL Injection Prevention

```go
// ✅ Always use parameterized queries
func (r *Repository) GetTraffic(projectID uuid.UUID, path string) ([]TrafficLog, error) {
    query := `
        SELECT * FROM traffic_logs
        WHERE project_id = $1 AND path = $2
    `

    var logs []TrafficLog
    err := r.db.Select(&logs, query, projectID, path)
    return logs, err
}

// ❌ Never concatenate SQL
func (r *Repository) GetTraffic(projectID, path string) ([]TrafficLog, error) {
    query := fmt.Sprintf(`
        SELECT * FROM traffic_logs
        WHERE project_id = '%s' AND path = '%s'
    `, projectID, path)  // SQL injection risk!

    // ...
}
```

### Secrets Management

```bash
# ✅ Use environment variables
export DATABASE_URL="postgres://..."
export JWT_SECRET="..."

# ❌ Never commit secrets
# Bad: config.yaml
database_url: "postgres://user:password@localhost/db"
jwt_secret: "my-secret-key"
```

```go
// ✅ Load from env
import "os"

func LoadConfig() *Config {
    return &Config{
        DatabaseURL: os.Getenv("DATABASE_URL"),
        JWTSecret:   os.Getenv("JWT_SECRET"),
    }
}
```

---

## Performance Standards

### Benchmarking

```go
// Write benchmarks for critical paths
func BenchmarkDiffEngine_Compare(b *testing.B) {
    engine := NewDiffEngine()
    obj1 := generateLargeObject()
    obj2 := generateLargeObject()

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        engine.Compare(obj1, obj2)
    }
}

// Run benchmarks
// go test -bench=. -benchmem
```

### Performance Targets

```
Proxy:
- p50 latency: < 3ms
- p95 latency: < 10ms
- p99 latency: < 50ms
- Throughput: 1000 RPS per instance

Database Queries:
- Simple selects: < 10ms
- Complex queries: < 100ms
- Paginated lists: < 50ms

Frontend:
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Lighthouse score: > 90
```

---

## Documentation Standards

### Code Comments

```go
// ✅ Good: Explain WHY, not WHAT
// CompareSchemas detects breaking changes between two API schemas.
// It uses a rule-based engine to classify changes by severity.
// See docs/breaking-changes.md for the full ruleset.
func CompareSchemas(old, new *Schema) (*ComparisonReport, error) {
    // We normalize paths first because OpenAPI allows
    // equivalent paths in different formats (e.g., /users vs /users/)
    oldPaths := normalizePaths(old.Paths)
    newPaths := normalizePaths(new.Paths)

    // ...
}

// ❌ Bad: Obvious comments
// Get user by ID
func GetUser(id string) (*User, error) {
    // Call database
    user, err := db.Get(id)
    if err != nil {
        // Return error
        return nil, err
    }
    // Return user
    return user, nil
}

// ✅ Document exported functions
// ParseOpenAPISpec parses an OpenAPI 3.0 or 3.1 specification file.
// It supports both YAML and JSON formats.
//
// Parameters:
//   - filePath: Path to the spec file
//
// Returns:
//   - *Schema: Parsed schema object
//   - error: Parse error, if any
func ParseOpenAPISpec(filePath string) (*Schema, error) {
    // ...
}
```

### README Files

````markdown
# Component Name

## Purpose

Brief description of what this component does.

## Usage

```go
engine := NewDiffEngine()
result, err := engine.Compare(obj1, obj2)
```
````

## Architecture

Explain key design decisions.

## Testing

How to run tests for this component.

```

---

## Git Standards

### Commit Messages

```

✅ Good commit messages:

feat(proxy): add PII redaction middleware

Implements automatic detection and redaction of PII in request/response
bodies before storage. Supports emails, phone numbers, and credit cards.

Closes #123

---

fix(cli): handle empty OpenAPI specs gracefully

Previously would panic on empty spec files. Now returns a clear error
message.

---

refactor(diffing): extract comparison rules into separate package

No functional changes. Improves testability and maintainability.

---

test(replayer): add load tests for 10k concurrent requests

---

docs(readme): update installation instructions for macOS

```

```

❌ Bad commit messages:

fixed bug
updated code
WIP
asdfasdf

```

### Branch Names

```

✅ Good branch names:

feature/sprint-1-2-json-diff
feature/pii-redaction
fix/cli-empty-file-panic
refactor/extract-comparison-rules
docs/update-readme

❌ Bad branch names:

fix
update
john-dev
feature

```

---

## Review Process

### Code Review Checklist

**Functionality:**
- [ ] Code works as intended
- [ ] Edge cases are handled
- [ ] Errors are handled gracefully
- [ ] No hardcoded values (use config)

**Code Quality:**
- [ ] Follows style guide
- [ ] No code duplication
- [ ] Functions are focused and small
- [ ] Variable names are descriptive
- [ ] Comments explain WHY, not WHAT

**Testing:**
- [ ] Unit tests are included
- [ ] Tests cover edge cases
- [ ] Integration tests if needed
- [ ] All tests pass

**Security:**
- [ ] Input is validated
- [ ] No SQL injection risks
- [ ] No hardcoded secrets
- [ ] Authentication/authorization is correct

**Performance:**
- [ ] No obvious performance issues
- [ ] Queries are optimized
- [ ] No N+1 query problems
- [ ] Resource leaks prevented

**Documentation:**
- [ ] Public APIs are documented
- [ ] README updated if needed
- [ ] Breaking changes noted

### Review Response Time

- **Initial review:** Within 24 hours
- **Follow-up reviews:** Within 8 hours
- **Urgent fixes:** Within 2 hours

### Approval Process

- Minimum 1 approval required
- Author cannot approve their own PR
- Address all comments before merge
- Squash merge to keep history clean

---

## Continuous Improvement

This document is living and should be updated as we learn and grow. If you find a better pattern or practice, propose an update via PR.

**Last Updated:** February 18, 2026
**Next Review:** March 18, 2026
```
