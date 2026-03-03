package config

import (
	"fmt"
	"os"
	"strings"

	"github.com/spf13/viper"
)

func Load(cfgFile string) (*Config, error) {
	v := viper.New()

	v.SetDefault("server.host", "0.0.0.0")
	v.SetDefault("server.port", 8080)
	v.SetDefault("proxy.listen_addr", ":8080")
	v.SetDefault("proxy.sampling_rate", 0.1)
	v.SetDefault("proxy.buffer.queue_size", 10000)
	v.SetDefault("proxy.buffer.workers", 20)
	v.SetDefault("log.level", "info")
	v.SetDefault("log.format", "json")

	if cfgFile != "" {
		v.SetConfigFile(cfgFile)
	} else {
		v.SetConfigName("tvc")
		v.SetConfigType("yaml")
		v.AddConfigPath(".")
		v.AddConfigPath("$HOME/.tvc")
		v.AddConfigPath("/etc/tvc")
	}

	v.SetEnvPrefix("TVC")
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	v.AutomaticEnv()

	if err := v.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return nil, fmt.Errorf("reading config: %w", err)
		}
	}

	var cfg Config
	if err := v.Unmarshal(&cfg); err != nil {
		return nil, fmt.Errorf("unmarshaling config: %w", err)
	}

	return &cfg, nil
}

// LoadCLI loads CLI-specific configuration from environment variables and .env file.
// Priority: flags > SURGE_* env vars > TVC_* env vars > .env file > defaults
func LoadCLI() *CLIConfig {
	cfg := &CLIConfig{
		APIURL: "https://api.driftsurge.com",
	}

	// Try to load .env from current directory (best-effort, ignore errors)
	loadDotEnv()

	// SURGE_* env vars (primary)
	if v := os.Getenv("SURGE_API_KEY"); v != "" {
		cfg.APIKey = v
	}
	if v := os.Getenv("SURGE_API_URL"); v != "" {
		cfg.APIURL = v
	}
	if v := os.Getenv("SURGE_PROJECT_ID"); v != "" {
		cfg.ProjectID = v
	}

	// TVC_* fallback
	if cfg.APIKey == "" {
		if v := os.Getenv("TVC_API_KEY"); v != "" {
			cfg.APIKey = v
		}
	}
	if cfg.ProjectID == "" {
		if v := os.Getenv("TVC_PROJECT_ID"); v != "" {
			cfg.ProjectID = v
		}
	}

	return cfg
}

// loadDotEnv reads a .env file from the current directory and sets env vars.
func loadDotEnv() {
	data, err := os.ReadFile(".env")
	if err != nil {
		return
	}

	for _, line := range strings.Split(string(data), "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}
		key := strings.TrimSpace(parts[0])
		val := strings.TrimSpace(parts[1])
		// Remove surrounding quotes
		val = strings.Trim(val, `"'`)
		// Only set if not already set (env vars override .env)
		if os.Getenv(key) == "" {
			os.Setenv(key, val)
		}
	}
}
