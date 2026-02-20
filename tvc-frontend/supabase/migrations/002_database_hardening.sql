-- ============================================================================
-- TVC — Database Hardening & Performance Optimization
-- Migration 002
-- ============================================================================

-- ── Enable required extensions ──────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pg_trgm;     -- For fast LIKE/ILIKE searches
CREATE EXTENSION IF NOT EXISTS btree_gin;   -- For multi-column GIN indexes

-- ── Additional Traffic Log Partitions (2026) ────────────────────────────────

CREATE TABLE IF NOT EXISTS traffic_logs_2026_07 PARTITION OF traffic_logs
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE IF NOT EXISTS traffic_logs_2026_08 PARTITION OF traffic_logs
  FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE IF NOT EXISTS traffic_logs_2026_09 PARTITION OF traffic_logs
  FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE IF NOT EXISTS traffic_logs_2026_10 PARTITION OF traffic_logs
  FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE IF NOT EXISTS traffic_logs_2026_11 PARTITION OF traffic_logs
  FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE IF NOT EXISTS traffic_logs_2026_12 PARTITION OF traffic_logs
  FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');

-- ── Future Partitions (2027 - First Quarter) ───────────────────────────────

CREATE TABLE IF NOT EXISTS traffic_logs_2027_01 PARTITION OF traffic_logs
  FOR VALUES FROM ('2027-01-01') TO ('2027-02-01');
CREATE TABLE IF NOT EXISTS traffic_logs_2027_02 PARTITION OF traffic_logs
  FOR VALUES FROM ('2027-02-01') TO ('2027-03-01');
CREATE TABLE IF NOT EXISTS traffic_logs_2027_03 PARTITION OF traffic_logs
  FOR VALUES FROM ('2027-03-01') TO ('2027-04-01');

-- ── Automated Partition Management Function ─────────────────────────────────

CREATE OR REPLACE FUNCTION create_traffic_partition(start_date DATE)
RETURNS TEXT AS $$
DECLARE
    partition_name TEXT;
    end_date DATE;
    partition_exists BOOLEAN;
BEGIN
    -- Generate partition name
    partition_name := 'traffic_logs_' || to_char(start_date, 'YYYY_MM');
    end_date := start_date + INTERVAL '1 month';
    
    -- Check if partition already exists
    SELECT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = partition_name
        AND n.nspname = 'public'
    ) INTO partition_exists;
    
    IF partition_exists THEN
        RETURN 'Partition ' || partition_name || ' already exists';
    END IF;
    
    -- Create partition
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF traffic_logs
         FOR VALUES FROM (%L) TO (%L)',
        partition_name, start_date, end_date
    );
    
    RETURN 'Created partition ' || partition_name || ' for range ' || 
           start_date || ' to ' || end_date;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- SELECT create_traffic_partition('2027-04-01');

-- ── Function to create next N months of partitions ──────────────────────────

CREATE OR REPLACE FUNCTION create_next_traffic_partitions(num_months INTEGER DEFAULT 3)
RETURNS TABLE(result TEXT) AS $$
DECLARE
    current_month DATE;
    i INTEGER;
BEGIN
    -- Start from the beginning of next month
    current_month := date_trunc('month', CURRENT_DATE) + INTERVAL '1 month';
    
    FOR i IN 1..num_months LOOP
        RETURN QUERY SELECT create_traffic_partition(current_month);
        current_month := current_month + INTERVAL '1 month';
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- SELECT * FROM create_next_traffic_partitions(6);  -- Creates next 6 months

-- ── Partition Cleanup Function (for retention policies) ────────────────────

CREATE OR REPLACE FUNCTION drop_old_traffic_partitions(retention_days INTEGER)
RETURNS TABLE(result TEXT) AS $$
DECLARE
    partition_record RECORD;
    partition_date DATE;
    cutoff_date DATE;
BEGIN
    cutoff_date := CURRENT_DATE - retention_days;
    
    FOR partition_record IN
        SELECT c.relname
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname LIKE 'traffic_logs_%'
        AND n.nspname = 'public'
        AND c.relname ~ '^traffic_logs_[0-9]{4}_[0-9]{2}$'
    LOOP
        -- Extract date from partition name (format: traffic_logs_YYYY_MM)
        partition_date := to_date(substring(partition_record.relname from 14), 'YYYY_MM');
        
        IF partition_date < cutoff_date THEN
            -- Drop the partition
            EXECUTE format('DROP TABLE IF EXISTS %I', partition_record.relname);
            RETURN QUERY SELECT 'Dropped partition ' || partition_record.relname::TEXT;
        END IF;
    END LOOP;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT 'No partitions older than ' || cutoff_date::TEXT || ' to drop';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- SELECT * FROM drop_old_traffic_partitions(90);  -- Drop partitions older than 90 days

-- ── Advanced Indexes for Traffic Logs ───────────────────────────────────────

-- GIN index for full-text search on request/response bodies
CREATE INDEX IF NOT EXISTS idx_traffic_logs_request_body_gin 
    ON traffic_logs USING gin(request_body);

CREATE INDEX IF NOT EXISTS idx_traffic_logs_response_body_gin 
    ON traffic_logs USING gin(response_body);

-- Trigram index for fast LIKE/ILIKE queries on path
CREATE INDEX IF NOT EXISTS idx_traffic_logs_path_trgm 
    ON traffic_logs USING gin(path gin_trgm_ops);

-- Composite index for common dashboard query patterns
CREATE INDEX IF NOT EXISTS idx_traffic_logs_project_method_status
    ON traffic_logs(project_id, method, status_code, timestamp DESC);

-- Partial index for error traffic (frequently queried)
CREATE INDEX IF NOT EXISTS idx_traffic_logs_errors
    ON traffic_logs(project_id, timestamp DESC)
    WHERE status_code >= 400;

-- Partial index for PII-redacted logs (for audit queries)
CREATE INDEX IF NOT EXISTS idx_traffic_logs_pii_redacted
    ON traffic_logs(project_id, timestamp DESC)
    WHERE pii_redacted = true;

-- Index on environment for filtering
CREATE INDEX IF NOT EXISTS idx_traffic_logs_environment
    ON traffic_logs(environment_id, timestamp DESC);

-- ── Advanced Indexes for Replay Results ─────────────────────────────────────

-- Index for filtering replay results by severity
CREATE INDEX IF NOT EXISTS idx_replay_results_severity_filter
    ON replay_results(replay_session_id, severity)
    WHERE severity IN ('error', 'breaking');

-- Partial index for mismatched results
CREATE INDEX IF NOT EXISTS idx_replay_results_mismatches
    ON replay_results(replay_session_id, timestamp DESC)
    WHERE body_match = false OR status_match = false;

-- GIN index for searching diff reports
CREATE INDEX IF NOT EXISTS idx_replay_results_diff_gin
    ON replay_results USING gin(diff_report);

-- ── Additional Indexes for Other Tables ─────────────────────────────────────

-- Schema versions: Index for version comparison queries
CREATE INDEX IF NOT EXISTS idx_schema_versions_version
    ON schema_versions(project_id, version);

-- Replay sessions: Composite index for status filtering
CREATE INDEX IF NOT EXISTS idx_replay_sessions_status_time
    ON replay_sessions(project_id, status, created_at DESC);

-- User organizations: Index for role-based queries
CREATE INDEX IF NOT EXISTS idx_user_orgs_role
    ON user_organizations(organization_id, role);

-- Environments: Index for source environment queries
CREATE INDEX IF NOT EXISTS idx_environments_source
    ON environments(project_id, is_source)
    WHERE is_source = true;

-- ── Query Performance Statistics ────────────────────────────────────────────

-- Enable query statistics tracking
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Set higher statistics target for frequently queried columns
ALTER TABLE traffic_logs ALTER COLUMN project_id SET STATISTICS 1000;
ALTER TABLE traffic_logs ALTER COLUMN path SET STATISTICS 1000;
ALTER TABLE traffic_logs ALTER COLUMN status_code SET STATISTICS 1000;
ALTER TABLE traffic_logs ALTER COLUMN timestamp SET STATISTICS 1000;

-- ── Vacuum and Analyze Settings ─────────────────────────────────────────────
-- These are tuned for high-write workload on traffic_logs

ALTER TABLE traffic_logs SET (
    autovacuum_vacuum_scale_factor = 0.05,      -- More aggressive vacuum
    autovacuum_analyze_scale_factor = 0.02,     -- More frequent analyze
    autovacuum_vacuum_cost_delay = 10,          -- Faster vacuum
    autovacuum_vacuum_cost_limit = 1000        -- Higher work limit
);

-- ── Materialized View for Dashboard Stats ───────────────────────────────────
-- Pre-compute expensive aggregations for dashboard

CREATE MATERIALIZED VIEW IF NOT EXISTS project_traffic_stats AS
SELECT 
    project_id,
    date_trunc('day', timestamp) as day,
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE status_code >= 400) as error_count,
    COUNT(*) FILTER (WHERE status_code < 400) as success_count,
    AVG(latency_ms) as avg_latency_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) as p95_latency_ms,
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY latency_ms) as p99_latency_ms,
    COUNT(DISTINCT path) as unique_paths,
    COUNT(DISTINCT ip_address) as unique_ips
FROM traffic_logs
GROUP BY project_id, date_trunc('day', timestamp);

CREATE UNIQUE INDEX IF NOT EXISTS idx_project_traffic_stats_pk
    ON project_traffic_stats(project_id, day);

-- Refresh the materialized view (can be scheduled via cron)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY project_traffic_stats;

-- ── Function to Refresh Stats (Call this in a scheduled job) ───────────────

CREATE OR REPLACE FUNCTION refresh_traffic_stats()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY project_traffic_stats;
END;
$$ LANGUAGE plpgsql;

-- ── Comments for Documentation ──────────────────────────────────────────────

COMMENT ON FUNCTION create_traffic_partition(DATE) IS 
    'Creates a new monthly partition for traffic_logs table';

COMMENT ON FUNCTION create_next_traffic_partitions(INTEGER) IS 
    'Creates N months of future partitions to ensure writes never fail';

COMMENT ON FUNCTION drop_old_traffic_partitions(INTEGER) IS 
    'Drops traffic_logs partitions older than specified retention days';

COMMENT ON FUNCTION refresh_traffic_stats() IS 
    'Refreshes the materialized view for dashboard statistics';

COMMENT ON MATERIALIZED VIEW project_traffic_stats IS 
    'Pre-computed daily statistics per project for fast dashboard queries';

-- ── Migration Complete ──────────────────────────────────────────────────────

DO $$
BEGIN
    RAISE NOTICE 'Database hardening migration completed successfully';
    RAISE NOTICE 'Total traffic_logs partitions: %', (
        SELECT COUNT(*) 
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname LIKE 'traffic_logs_%'
        AND n.nspname = 'public'
    );
END $$;
