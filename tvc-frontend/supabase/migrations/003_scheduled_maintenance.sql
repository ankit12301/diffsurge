-- ============================================================================
-- TVC — Database Maintenance Jobs
-- These functions should be called by a scheduler (pg_cron, external cron, etc.)
-- ============================================================================

-- ── Enable pg_cron extension (if available) ─────────────────────────────────
-- NOTE: In Supabase, pg_cron is available on Pro tier and above
-- If not available, you'll need to use external scheduling (see notes below)

DO $$
BEGIN
    -- Try to create the extension
    CREATE EXTENSION IF NOT EXISTS pg_cron;
    RAISE NOTICE 'pg_cron extension enabled successfully';
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE NOTICE 'pg_cron extension requires superuser privileges. Use Supabase dashboard to enable it or use external scheduling.';
    WHEN undefined_file THEN
        RAISE NOTICE 'pg_cron extension is not available. Use external scheduling (see notes at end of file).';
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not enable pg_cron: %. Use external scheduling.', SQLERRM;
END $$;

-- ── Helper Function for Reindexing ─────────────────────────────────────────
-- pg_cron needs a single statement, so we wrap multiple reindex operations in a function

CREATE OR REPLACE FUNCTION reindex_gin_indexes()
RETURNS TABLE(result TEXT) AS $$
BEGIN
    -- Reindex request body GIN index
    EXECUTE 'REINDEX INDEX CONCURRENTLY idx_traffic_logs_request_body_gin';
    RETURN QUERY SELECT 'Reindexed idx_traffic_logs_request_body_gin'::TEXT;
    
    -- Reindex response body GIN index
    EXECUTE 'REINDEX INDEX CONCURRENTLY idx_traffic_logs_response_body_gin';
    RETURN QUERY SELECT 'Reindexed idx_traffic_logs_response_body_gin'::TEXT;
    
    -- Reindex diff report GIN index
    EXECUTE 'REINDEX INDEX CONCURRENTLY idx_replay_results_diff_gin';
    RETURN QUERY SELECT 'Reindexed idx_replay_results_diff_gin'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ── Schedule Maintenance Jobs (Only if pg_cron is available) ───────────────
-- These commands will only execute if pg_cron extension is enabled

DO $$
BEGIN
    -- Check if pg_cron is available
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        
        -- Job 1: Auto-create future partitions (Run weekly)
        -- Creates 3 months of future partitions to ensure we never run out
        -- Schedule: Every Monday at 2 AM (0 2 * * 1)
        PERFORM cron.schedule(
            'create_future_traffic_partitions',
            '0 2 * * 1',
            $$SELECT * FROM create_next_traffic_partitions(3)$$
        );
        
        -- Job 2: Refresh materialized views (Run hourly)
        -- Keep dashboard statistics up to date
        -- Schedule: Every hour at :05 (5 * * * *)
        PERFORM cron.schedule(
            'refresh_dashboard_stats',
            '5 * * * *',
            $$SELECT refresh_traffic_stats()$$
        );
        
        -- Job 3: Cleanup old partitions (Run monthly)
        -- Remove partitions based on retention policy
        -- Schedule: First day of month at 3 AM (0 3 1 * *)
        -- NOTE: Adjust retention_days (90) based on your subscription tier
        PERFORM cron.schedule(
            'cleanup_old_traffic_partitions',
            '0 3 1 * *',
            $$SELECT * FROM drop_old_traffic_partitions(90)$$
        );
        
        -- Job 4: Vacuum analyze on high-churn tables (Run daily)
        -- Ensure query planner has fresh statistics
        -- Schedule: Every day at 1 AM (0 1 * * *)
        PERFORM cron.schedule(
            'vacuum_analyze_traffic',
            '0 1 * * *',
            $$VACUUM ANALYZE traffic_logs$$
        );
        
        -- Job 5: Reindex GIN indexes (Run weekly)
        -- GIN indexes can become bloated, periodic reindexing helps
        -- Schedule: Every Sunday at 4 AM (0 4 * * 0)
        PERFORM cron.schedule(
            'reindex_jsonb_indexes',
            '0 4 * * 0',
            $$SELECT * FROM reindex_gin_indexes()$$
        );
        
        RAISE NOTICE 'All maintenance jobs scheduled successfully';
    ELSE
        RAISE NOTICE 'pg_cron extension not available. Maintenance jobs NOT scheduled.';
        RAISE NOTICE 'See manual scheduling options at the end of this file.';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error scheduling maintenance jobs: %. Jobs NOT scheduled.', SQLERRM;
END $$;

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
