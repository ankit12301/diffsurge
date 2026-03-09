-- ============================================================================
-- Diffsurge — Initial Schema
-- Run this in Supabase SQL Editor or via `supabase db push`
-- ============================================================================

-- ── Enums ──────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE org_role AS ENUM ('owner', 'admin', 'member');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE replay_status AS ENUM ('pending', 'running', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE diff_severity AS ENUM ('info', 'warning', 'error', 'breaking');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE schema_type AS ENUM ('openapi', 'graphql', 'grpc');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'enterprise');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ── Organizations ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  slug        VARCHAR(100) UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);


-- ── User ↔ Organization mapping ────────────────────────────────────────────
-- References Supabase's built-in auth.users table.

CREATE TABLE IF NOT EXISTS user_organizations (
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role            org_role    NOT NULL DEFAULT 'member',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, organization_id)
);


-- ── Projects (API services being monitored) ────────────────────────────────

CREATE TABLE IF NOT EXISTS projects (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID         NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  slug            VARCHAR(100) NOT NULL,
  description     TEXT,
  config          JSONB        NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE (organization_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_projects_org ON projects(organization_id);


-- ── Environments (production, staging, development) ─────────────────────────

CREATE TABLE IF NOT EXISTS environments (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID         NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name       VARCHAR(100) NOT NULL,
  base_url   VARCHAR(500) NOT NULL,
  is_source  BOOLEAN      NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE (project_id, name)
);

CREATE INDEX IF NOT EXISTS idx_environments_project ON environments(project_id);


-- ── Traffic Logs (partitioned by month) ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS traffic_logs (
  id               UUID        DEFAULT gen_random_uuid(),
  project_id       UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  environment_id   UUID        NOT NULL REFERENCES environments(id) ON DELETE CASCADE,

  method           VARCHAR(10) NOT NULL,
  path             TEXT        NOT NULL,
  query_params     JSONB,
  request_headers  JSONB,
  request_body     JSONB,

  status_code      INTEGER     NOT NULL,
  response_headers JSONB,
  response_body    JSONB,

  timestamp        TIMESTAMPTZ NOT NULL DEFAULT now(),
  latency_ms       INTEGER,
  ip_address       INET,
  user_agent       TEXT,
  pii_redacted     BOOLEAN     NOT NULL DEFAULT false,

  PRIMARY KEY (id, timestamp)
) PARTITION BY RANGE (timestamp);

-- Monthly partitions — extend as needed
CREATE TABLE IF NOT EXISTS traffic_logs_2026_02 PARTITION OF traffic_logs
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE IF NOT EXISTS traffic_logs_2026_03 PARTITION OF traffic_logs
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE IF NOT EXISTS traffic_logs_2026_04 PARTITION OF traffic_logs
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE IF NOT EXISTS traffic_logs_2026_05 PARTITION OF traffic_logs
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE IF NOT EXISTS traffic_logs_2026_06 PARTITION OF traffic_logs
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

CREATE INDEX IF NOT EXISTS idx_traffic_project_time
  ON traffic_logs(project_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_traffic_path
  ON traffic_logs(project_id, path, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_traffic_status
  ON traffic_logs(project_id, status_code, timestamp DESC);


-- ── Replay Sessions ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS replay_sessions (
  id                      UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id              UUID          NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source_environment_id   UUID          NOT NULL REFERENCES environments(id),
  target_environment_id   UUID          NOT NULL REFERENCES environments(id),

  name                    VARCHAR(255),
  description             TEXT,
  traffic_filter          JSONB,
  start_time              TIMESTAMPTZ,
  end_time                TIMESTAMPTZ,
  sample_size             INTEGER,

  status                  replay_status NOT NULL DEFAULT 'pending',

  total_requests          INTEGER       NOT NULL DEFAULT 0,
  successful_requests     INTEGER       NOT NULL DEFAULT 0,
  failed_requests         INTEGER       NOT NULL DEFAULT 0,
  mismatched_responses    INTEGER       NOT NULL DEFAULT 0,

  created_by              UUID          REFERENCES auth.users(id),
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT now(),
  started_at              TIMESTAMPTZ,
  completed_at            TIMESTAMPTZ,

  CONSTRAINT replay_valid_dates CHECK (end_time > start_time OR end_time IS NULL)
);

CREATE INDEX IF NOT EXISTS idx_replay_project
  ON replay_sessions(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_replay_status
  ON replay_sessions(status);


-- ── Replay Results (individual request comparisons) ─────────────────────────

CREATE TABLE IF NOT EXISTS replay_results (
  id                       UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  replay_session_id        UUID          NOT NULL REFERENCES replay_sessions(id) ON DELETE CASCADE,
  original_traffic_log_id  UUID          NOT NULL,

  target_status_code       INTEGER,
  target_response_body     JSONB,
  target_latency_ms        INTEGER,

  status_match             BOOLEAN,
  body_match               BOOLEAN,
  diff_report              JSONB,
  severity                 diff_severity,

  error_message            TEXT,
  timestamp                TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_results_session
  ON replay_results(replay_session_id);
CREATE INDEX IF NOT EXISTS idx_results_severity
  ON replay_results(replay_session_id, severity);


-- ── Schema Versions ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS schema_versions (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version        VARCHAR(100) NOT NULL,
  schema_type    schema_type NOT NULL,
  schema_content JSONB       NOT NULL,
  git_commit     VARCHAR(100),
  git_branch     VARCHAR(100),
  created_by     UUID        REFERENCES auth.users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, version)
);

CREATE INDEX IF NOT EXISTS idx_schema_versions_project
  ON schema_versions(project_id, created_at DESC);


-- ── Schema Diffs ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS schema_diffs (
  id                  UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID    NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  from_version_id     UUID    REFERENCES schema_versions(id),
  to_version_id       UUID    REFERENCES schema_versions(id),

  diff_report         JSONB   NOT NULL,
  has_breaking_changes BOOLEAN NOT NULL DEFAULT false,
  breaking_changes    JSONB,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_schema_diffs_project
  ON schema_diffs(project_id, created_at DESC);


-- ── Subscriptions ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS subscriptions (
  id                      UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         UUID              NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  tier                    subscription_tier   NOT NULL DEFAULT 'free',
  status                  subscription_status NOT NULL DEFAULT 'active',

  stripe_customer_id      VARCHAR(100),
  stripe_subscription_id  VARCHAR(100),

  monthly_traffic_limit   INTEGER,
  monthly_replay_limit    INTEGER,

  current_period_start    TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_org
  ON subscriptions(organization_id);


-- ── Usage Tracking ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS usage_tracking (
  id                      UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         UUID    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  traffic_requests_count  INTEGER NOT NULL DEFAULT 0,
  replay_requests_count   INTEGER NOT NULL DEFAULT 0,

  period_start            TIMESTAMPTZ NOT NULL,
  period_end              TIMESTAMPTZ NOT NULL,

  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (organization_id, period_start),
  CONSTRAINT usage_non_negative CHECK (
    traffic_requests_count >= 0 AND replay_requests_count >= 0
  )
);

CREATE INDEX IF NOT EXISTS idx_usage_org_period
  ON usage_tracking(organization_id, period_start DESC);


-- ── Utility: auto-update updated_at ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ── RLS Policies (enable later per-table as auth is integrated) ─────────────
-- ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE projects      ENABLE ROW LEVEL SECURITY;
-- ...
-- Policies will be added in a separate migration once auth is wired up.
