package config

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestLoad_Defaults(t *testing.T) {
	cfg, err := Load("")
	require.NoError(t, err)

	assert.Equal(t, "0.0.0.0", cfg.Server.Host)
	assert.Equal(t, 8080, cfg.Server.Port)
	assert.Equal(t, ":8080", cfg.Proxy.ListenAddr)
	assert.Equal(t, 0.1, cfg.Proxy.SamplingRate)
	assert.Equal(t, 10000, cfg.Proxy.Buffer.QueueSize)
	assert.Equal(t, 20, cfg.Proxy.Buffer.Workers)
	assert.Equal(t, "info", cfg.Log.Level)
	assert.Equal(t, "json", cfg.Log.Format)
}

func TestLoad_FromFile(t *testing.T) {
	content := `
server:
  host: "127.0.0.1"
  port: 9090
log:
  level: "debug"
  format: "console"
`
	dir := t.TempDir()
	cfgPath := filepath.Join(dir, "tvc.yaml")
	require.NoError(t, os.WriteFile(cfgPath, []byte(content), 0644))

	cfg, err := Load(cfgPath)
	require.NoError(t, err)

	assert.Equal(t, "127.0.0.1", cfg.Server.Host)
	assert.Equal(t, 9090, cfg.Server.Port)
	assert.Equal(t, "debug", cfg.Log.Level)
	assert.Equal(t, "console", cfg.Log.Format)
}

func TestLoad_InvalidFile(t *testing.T) {
	_, err := Load("/nonexistent/path/config.yaml")
	assert.Error(t, err)
}

func TestLoad_EnvOverride(t *testing.T) {
	t.Setenv("TVC_SERVER_PORT", "3000")
	t.Setenv("TVC_LOG_LEVEL", "error")

	cfg, err := Load("")
	require.NoError(t, err)

	assert.Equal(t, 3000, cfg.Server.Port)
	assert.Equal(t, "error", cfg.Log.Level)
}

func TestLoadCLI_FromEnvVars(t *testing.T) {
	t.Setenv("SURGE_API_KEY", "tvc_live_testkey123")
	t.Setenv("SURGE_API_URL", "https://custom.api.com")
	t.Setenv("SURGE_PROJECT_ID", "proj-abc-123")

	cfg := LoadCLI()

	assert.Equal(t, "tvc_live_testkey123", cfg.APIKey)
	assert.Equal(t, "https://custom.api.com", cfg.APIURL)
	assert.Equal(t, "proj-abc-123", cfg.ProjectID)
}

func TestLoadCLI_FallbackToTVCPrefix(t *testing.T) {
	t.Setenv("TVC_API_KEY", "tvc_live_fallback")
	t.Setenv("TVC_PROJECT_ID", "tvc-proj-456")

	cfg := LoadCLI()

	assert.Equal(t, "tvc_live_fallback", cfg.APIKey)
	assert.Equal(t, "tvc-proj-456", cfg.ProjectID)
}

func TestLoadCLI_SURGEPrefixOverridesTVC(t *testing.T) {
	t.Setenv("SURGE_API_KEY", "tvc_live_surge_priority")
	t.Setenv("TVC_API_KEY", "tvc_live_tvc_fallback")

	cfg := LoadCLI()

	assert.Equal(t, "tvc_live_surge_priority", cfg.APIKey)
}

func TestLoadCLI_DefaultAPIURL(t *testing.T) {
	cfg := LoadCLI()

	assert.Equal(t, "https://api.driftsurge.com", cfg.APIURL)
}

func TestLoadCLI_FromDotEnvFile(t *testing.T) {
	// Save and restore CWD
	origDir, err := os.Getwd()
	require.NoError(t, err)
	defer os.Chdir(origDir)

	dir := t.TempDir()
	require.NoError(t, os.Chdir(dir))

	envContent := `# Driftsurge config
SURGE_API_KEY=tvc_live_dotenv_key
SURGE_PROJECT_ID=dotenv-project-id
SURGE_API_URL=https://test.api.com
`
	require.NoError(t, os.WriteFile(filepath.Join(dir, ".env"), []byte(envContent), 0644))

	cfg := LoadCLI()

	assert.Equal(t, "tvc_live_dotenv_key", cfg.APIKey)
	assert.Equal(t, "dotenv-project-id", cfg.ProjectID)
	assert.Equal(t, "https://test.api.com", cfg.APIURL)
}

func TestLoadCLI_EnvOverridesDotEnv(t *testing.T) {
	// Save and restore CWD
	origDir, err := os.Getwd()
	require.NoError(t, err)
	defer os.Chdir(origDir)

	dir := t.TempDir()
	require.NoError(t, os.Chdir(dir))

	envContent := `SURGE_API_KEY=tvc_live_from_dotenv`
	require.NoError(t, os.WriteFile(filepath.Join(dir, ".env"), []byte(envContent), 0644))

	// Real env var should override
	t.Setenv("SURGE_API_KEY", "tvc_live_from_real_env")

	cfg := LoadCLI()

	assert.Equal(t, "tvc_live_from_real_env", cfg.APIKey)
}
