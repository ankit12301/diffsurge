-- ============================================================================
-- TVC — Database Maintenance Jobs
-- These functions should be called by a scheduler (pg_cron, external cron, etc.)
-- ============================================================================

-- ── Job 1: Auto-create future partitions (Run weekly) ──────────────────────
-- This creates 3 months of future partitions to ensure we never run out
-- Recommended schedule: Every Monday at 2 AM
-- Cron expression: 0 2 * * 1

SELECT cron.schedule(
    'create_future_traffic_partitions',
    '0 2 * * 1',  -- Every Monday at 2 AM
    $$SELECT * FROM create_next_traffic_partitions(3)$$
);

-- ── Job 2: Refresh materialized views (Run hourly) ─────────────────────────
-- Keep dashboard statistics up to date
-- Recommended schedule: Every hour at :05
-- Cron expression: 5 * * * *

SELECT cron.schedule(
    'refresh_dashboard_stats',
    '5 * * * *',  -- Every hour at :05
    $$SELECT refresh_traffic_stats()$$
);

-- ── Job 3: Cleanup old partitions (Run monthly) ────────────────────────────
-- Remove partitions based on retention policy
-- Pro tier: 30 days, Enterprise: 90 days
-- Recommended schedule: First day of month at 3 AM
-- Cron expression: 0 3 1 * *

-- NOTE: Adjust retention_days based on subscription tier
-- This example uses 90 days for enterprise, 30 for pro
-- You'll need to implement tier-based logic in your application

SELECT cron.schedule(
    'cleanup_old_traffic_partitions',
    '0 3 1 * *',  -- First day of month at 3 AM
    $$SELECT * FROM drop_old_traffic_partitions(90)$$  -- Change to your retention policy
);

-- ── Job 4: Vacuum analyze on high-churn tables (Run daily) ─────────────────
-- Ensure query planner has fresh statistics
-- Recommended schedule: Every day at 1 AM
-- Cron expression: 0 1 * * *

SELECT cron.schedule(
    'vacuum_analyze_traffic',
    '0 1 * * *',  -- Every day at 1 AM
    $$VACUUM ANALYZE traffic_logs$$
);

-- ── Job 5: Reindex GIN indexes (Run weekly) ────────────────────────────────
-- GIN indexes can become bloated, periodic reindexing helps
-- Recommended schedule: Every Sunday at 4 AM
-- Cron expression: 0 4 * * 0

SELECT cron.schedule(
    'reindex_jsonb_indexes',
    '0 4 * * 0',  -- Every Sunday at 4 AM
    $$
    REINDEX INDEX CONCURRENTLY idx_traffic_logs_request_body_gin;
    REINDEX INDEX CONCURRENTLY idx_traffic_logs_response_body_gin;
    REINDEX INDEX CONCURRENTLY idx_replay_results_diff_gin;
    $$
);

-- ── View scheduled jobs ─────────────────────────────────────────────────────

-- To see all scheduled jobs:
-- SELECT * FROM cron.job;

-- To see job run history:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;

-- ── Unschedule jobs (if needed) ─────────────────────────────────────────────

-- To remove a job:
-- SELECT cron.unschedule('job_name');

-- Examples:
-- SELECT cron.unschedule('create_future_traffic_partitions');
-- SELECT cron.unschedule('refresh_dashboard_stats');
-- SELECT cron.unschedule('cleanup_old_traffic_partitions');
-- SELECT cron.unschedule('vacuum_analyze_traffic');
-- SELECT cron.unschedule('reindex_jsonb_indexes');

-- ── Manual execution commands ───────────────────────────────────────────────

-- Create next 6 months of partitions (manual)
-- SELECT * FROM create_next_traffic_partitions(6);

-- Drop partitions older than 30 days (manual)
-- SELECT * FROM drop_old_traffic_partitions(30);

-- Refresh stats immediately (manual)
-- SELECT refresh_traffic_stats();

-- Check partition list (manual)
/*
SELECT 
    c.relname as partition_name,
    pg_get_expr(c.relpartbound, c.oid) as partition_range,
    pg_size_pretty(pg_relation_size(c.oid)) as size
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname LIKE 'traffic_logs_%'
AND n.nspname = 'public'
ORDER BY c.relname;
*/

-- ── Monitoring Queries ──────────────────────────────────────────────────────

-- Check table and index sizes
/*
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
*/

-- Check slow queries (requires pg_stat_statements)
/*
SELECT 
    substring(query, 1, 50) AS short_query,
    calls,
    total_exec_time,
    mean_exec_time,
    stddev_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
*/

-- Check index usage
/*
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan AS index_scans,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;
*/

-- Check table bloat (requires pgstattuple extension)
/*
CREATE EXTENSION IF NOT EXISTS pgstattuple;

SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    n_dead_tup,
    n_live_tup,
    ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_tuple_percent
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_dead_tup DESC;
*/

-- ============================================================================
-- Notes on Implementation
-- ============================================================================

/*
For Supabase:
1. pg_cron extension is available in Supabase Pro and above
2. Enable it in the Supabase dashboard under Database > Extensions
3. Run the SELECT cron.schedule() commands above
4. Monitor jobs in the Supabase dashboard or via SQL queries

For Self-hosted PostgreSQL:
1. Install pg_cron extension: apt-get install postgresql-XX-cron
2. Add to postgresql.conf: shared_preload_libraries = 'pg_cron'
3. Add to postgresql.conf: cron.database_name = 'your_database'
4. Restart PostgreSQL and CREATE EXTENSION pg_cron
5. Run the SELECT cron.schedule() commands above

Alternative (if pg_cron not available):
- Use external cron on the application server
- Call these functions via psql or application code
- Example crontab entries:

# Create partitions every Monday at 2 AM
0 2 * * 1 psql -U user -d tvc_db -c "SELECT * FROM create_next_traffic_partitions(3);"

# Refresh stats every hour
5 * * * * psql -U user -d tvc_db -c "SELECT refresh_traffic_stats();"

# Cleanup old partitions on first of month
0 3 1 * * psql -U user -d tvc_db -c "SELECT * FROM drop_old_traffic_partitions(90);"
*/
