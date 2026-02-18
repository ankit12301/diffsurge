# TVC Quick Reference Guide

**Version:** 1.0  
**For:** Active Development Reference

---

## 🚀 Quick Start Commands

### Development

```bash
# Start everything
make dev

# Backend only
cd tvc-go && go run cmd/cli/main.go

# Frontend only
cd tvc-frontend && npm run dev

# Database
docker-compose up postgres redis -d

# Run migrations
make migrate-up

# Reset database
make migrate-reset
```

### Testing

```bash
# Backend tests
make test
make test-coverage
make test-integration

# Frontend tests
npm test
npm run test:watch
npm run test:coverage

# Linting
make lint
npm run lint
```

### Building

```bash
# Build CLI
make build-cli

# Build all services
make build-all

# Build for release (all platforms)
make release
```

---

## 📁 Project Structure Quick Map

```
tvc-go/
├── cmd/
│   ├── cli/         → CLI entrypoint
│   ├── proxy/       → Proxy server entrypoint
│   └── api/         → Web API entrypoint
├── internal/
│   ├── diffing/     → Diff engine logic
│   ├── proxy/       → Proxy implementation
│   ├── replayer/    → Replay engine
│   ├── pii/         → PII detection
│   └── storage/     → Database layer
└── pkg/             → Public libraries

tvc-frontend/
├── app/
│   ├── (auth)/      → Protected routes
│   └── (marketing)/ → Public pages
├── components/
│   ├── ui/          → Design system
│   └── dashboard/   → Business logic
└── lib/
    ├── api/         → API client
    └── hooks/       → Custom hooks
```

---

## 🎨 Code Templates

### Go: New Command (CLI)

```go
// cmd/cli/diff.go
package main

import (
    "github.com/spf13/cobra"
)

var diffCmd = &cobra.Command{
    Use:   "diff",
    Short: "Compare two JSON files",
    RunE:  runDiff,
}

func init() {
    diffCmd.Flags().StringP("file-old", "o", "", "Old file path")
    diffCmd.Flags().StringP("file-new", "n", "", "New file path")
    rootCmd.AddCommand(diffCmd)
}

func runDiff(cmd *cobra.Command, args []string) error {
    oldFile, _ := cmd.Flags().GetString("file-old")
    newFile, _ := cmd.Flags().GetString("file-new")

    // Implementation
    return nil
}
```

### Go: HTTP Handler

```go
// internal/api/handlers/traffic.go
package handlers

import (
    "encoding/json"
    "net/http"
)

type TrafficHandler struct {
    repo storage.Repository
}

func (h *TrafficHandler) ListTraffic(w http.ResponseWriter, r *http.Request) {
    // Get user from context
    userID := r.Context().Value("user_id").(string)

    // Parse query params
    projectID := r.URL.Query().Get("project_id")

    // Fetch data
    traffic, err := h.repo.GetTraffic(r.Context(), projectID)
    if err != nil {
        respondError(w, http.StatusInternalServerError, err)
        return
    }

    // Respond
    respondJSON(w, http.StatusOK, traffic)
}

func respondJSON(w http.ResponseWriter, status int, data interface{}) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, status int, err error) {
    respondJSON(w, status, map[string]string{"error": err.Error()})
}
```

### TypeScript: New Component

```typescript
// components/dashboard/stats-card.tsx
'use client';

import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  className?: string;
}

export function StatsCard({
  title,
  value,
  change,
  icon,
  className
}: StatsCardProps) {
  return (
    <div className={cn(
      'rounded-lg border bg-card p-6 shadow-sm',
      className
    )}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">
          {title}
        </p>
        {icon}
      </div>
      <div className="mt-2">
        <p className="text-2xl font-bold">{value}</p>
        {change !== undefined && (
          <p className={cn(
            'text-sm',
            change >= 0 ? 'text-green-600' : 'text-red-600'
          )}>
            {change >= 0 ? '+' : ''}{change}%
          </p>
        )}
      </div>
    </div>
  );
}
```

### TypeScript: Custom Hook

```typescript
// lib/hooks/use-traffic.ts
import { useQuery } from "@tanstack/react-query";
import { trafficApi } from "@/lib/api/traffic";

export function useTraffic(projectId: string) {
  return useQuery({
    queryKey: ["traffic", projectId],
    queryFn: () => trafficApi.list(projectId),
    enabled: !!projectId,
    refetchInterval: 30000, // 30s
  });
}
```

---

## 🧪 Testing Patterns

### Go: Table-Driven Test

```go
func TestDiffEngine_Compare(t *testing.T) {
    tests := []struct {
        name    string
        a       interface{}
        b       interface{}
        want    []Diff
        wantErr bool
    }{
        {
            name: "simple change",
            a:    map[string]interface{}{"x": 1},
            b:    map[string]interface{}{"x": 2},
            want: []Diff{{Path: "x", Type: "modified"}},
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            engine := NewEngine()
            got, err := engine.Compare(tt.a, tt.b)

            if tt.wantErr {
                assert.Error(t, err)
                return
            }

            assert.NoError(t, err)
            assert.Equal(t, tt.want, got)
        })
    }
}
```

### TypeScript: Component Test

```typescript
import { render, screen } from '@testing-library/react';
import { StatsCard } from './stats-card';

describe('StatsCard', () => {
  it('renders title and value', () => {
    render(<StatsCard title="Total Requests" value="1,234" />);

    expect(screen.getByText('Total Requests')).toBeInTheDocument();
    expect(screen.getByText('1,234')).toBeInTheDocument();
  });

  it('shows positive change in green', () => {
    render(<StatsCard title="Test" value="100" change={15} />);

    const changeEl = screen.getByText('+15%');
    expect(changeEl).toHaveClass('text-green-600');
  });
});
```

---

## 🗄️ Database Quick Reference

### Common Queries

```sql
-- Get recent traffic
SELECT * FROM traffic_logs
WHERE project_id = $1
  AND timestamp >= NOW() - INTERVAL '1 hour'
ORDER BY timestamp DESC
LIMIT 100;

-- Traffic by status code
SELECT
  status_code,
  COUNT(*) as count,
  AVG(latency_ms) as avg_latency
FROM traffic_logs
WHERE project_id = $1
  AND timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY status_code
ORDER BY count DESC;

-- Active replay sessions
SELECT * FROM replay_sessions
WHERE status IN ('pending', 'running')
ORDER BY created_at DESC;

-- Replay results with diffs
SELECT
  rr.*,
  tl.path,
  tl.method
FROM replay_results rr
JOIN traffic_logs tl ON rr.original_traffic_log_id = tl.id
WHERE rr.replay_session_id = $1
  AND rr.body_match = false
ORDER BY rr.severity DESC;
```

### Migrations

```bash
# Create new migration
migrate create -ext sql -dir internal/storage/migrations -seq migration_name

# Run migrations
make migrate-up

# Rollback last migration
make migrate-down

# Go to specific version
migrate -path internal/storage/migrations -database $DATABASE_URL goto 5

# Force version (if broken)
migrate -path internal/storage/migrations -database $DATABASE_URL force 5
```

---

## 🔧 Common Patterns

### Error Handling (Go)

```go
// ✅ Good
if err != nil {
    return fmt.Errorf("failed to parse schema: %w", err)
}

// ❌ Bad
if err != nil {
    return err  // Lost context
}
```

### Context Usage (Go)

```go
// Pass context to all I/O operations
func (r *Repository) GetTraffic(ctx context.Context, id string) (*Traffic, error) {
    // Use ctx for cancellation
    return r.db.QueryContext(ctx, "SELECT ...")
}

// Check for cancellation in loops
for _, item := range items {
    select {
    case <-ctx.Done():
        return ctx.Err()
    default:
        // Process item
    }
}
```

### Type Safety (TypeScript)

```typescript
// ✅ Use Zod for validation
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1),
  age: z.number().int().positive(),
});

type User = z.infer<typeof schema>;

const user = schema.parse(data); // Throws if invalid

// ❌ Don't use any
const data: any = await fetch(...);
```

---

## 🐛 Debugging Tips

### Go

```bash
# Print with stack trace
log.Printf("Error: %+v", err)

# Debug with delve
dlv debug ./cmd/cli -- diff --file-old a.json --file-new b.json

# Profile CPU
go test -cpuprofile=cpu.prof -bench=.
go tool pprof cpu.prof

# Profile memory
go test -memprofile=mem.prof -bench=.
go tool pprof mem.prof

# Race detection
go test -race ./...
```

### TypeScript / Next.js

```typescript
// Debug console
console.log("Data:", data);
console.table(users); // For arrays
console.trace(); // Show call stack

// React DevTools
// Install: https://react.dev/learn/react-developer-tools

// Next.js debug mode
// package.json: "dev": "next dev --turbo"
```

---

## 🔒 Security Checklist

### Before Committing

- [ ] No hardcoded secrets (use env vars)
- [ ] No console.log with sensitive data
- [ ] Input validation on all endpoints
- [ ] SQL queries parameterized
- [ ] Auth middleware on protected routes
- [ ] CORS configured correctly

### Before Deploying

- [ ] Environment variables set
- [ ] Database migrations run
- [ ] SSL/TLS enabled
- [ ] Rate limiting configured
- [ ] Logging excludes PII
- [ ] Error messages don't leak info

---

## 📊 Performance Targets

```
Proxy:
- Latency (p50): < 3ms
- Latency (p95): < 10ms
- Latency (p99): < 50ms
- Throughput: 1000 RPS

Database:
- Simple SELECT: < 10ms
- Complex queries: < 100ms
- Pagination: < 50ms

Frontend:
- FCP: < 1.5s
- TTI: < 3s
- Lighthouse: > 90
```

---

## 🎯 Common Issues & Solutions

### Issue: Go test timeout

```bash
# Solution: Increase timeout
go test -timeout 30s ./...
```

### Issue: Database connection refused

```bash
# Solution: Check Docker
docker-compose ps
docker-compose up postgres -d
```

### Issue: Frontend build error

```bash
# Solution: Clear cache
rm -rf .next
rm -rf node_modules
npm install
npm run dev
```

### Issue: Migration conflict

```bash
# Solution: Reset local DB
make migrate-reset
make migrate-up
```

### Issue: CORS error in browser

```go
// Solution: Add CORS middleware
func corsMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Access-Control-Allow-Origin", "*")
        w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE")
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

        if r.Method == "OPTIONS" {
            w.WriteHeader(http.StatusOK)
            return
        }

        next.ServeHTTP(w, r)
    })
}
```

---

## 📚 Quick Links

### Documentation

- [Go Docs](https://go.dev/doc/)
- [Next.js Docs](https://nextjs.org/docs)
- [TailwindCSS](https://tailwindcss.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

### Tools

- [GitHub Copilot](https://github.com/features/copilot)
- [Postman](https://www.postman.com/)
- [TablePlus](https://tableplus.com/)
- [React DevTools](https://react.dev/learn/react-developer-tools)

### Our Docs

- [Architecture](./TECHNICAL_ARCHITECTURE.md)
- [Standards](./DEVELOPMENT_STANDARDS.md)
- [Roadmap](./SPRINT_ROADMAP.md)
- [Review Package](./PRE_DEVELOPMENT_REVIEW.md)

---

## 🆘 Getting Help

### Before Asking

1. Check this quick reference
2. Search in project docs
3. Check error message carefully
4. Try Google/Stack Overflow

### When Asking

1. Share error message (full)
2. Share relevant code snippet
3. Explain what you tried
4. Include environment details

---

**Keep this file handy during development!** 🚀

**Last Updated:** February 18, 2026
