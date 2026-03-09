package cli

import (
	"encoding/json"
	"fmt"

	"github.com/spf13/cobra"
)

var whoamiCmd = &cobra.Command{
	Use:   "whoami",
	Short: "Verify your API key and show account info",
	Long: `Check that your API key is valid and display the associated account information.

Useful for debugging authentication issues.

Setup:
  1. Create an API key in the dashboard (Settings → API Keys)
  2. Add to your .env file: SURGE_API_KEY=diffsurge_live_...
  3. Run: surge whoami`,
	RunE: runWhoami,
}

func init() {
	rootCmd.AddCommand(whoamiCmd)
}

func runWhoami(cmd *cobra.Command, args []string) error {
	if cliCfg == nil || cliCfg.APIKey == "" {
		return fmt.Errorf("API key not configured.\n\nSet SURGE_API_KEY in your .env file or environment:\n  echo 'SURGE_API_KEY=diffsurge_live_...' >> .env")
	}

	// Mask the API key for display
	keyDisplay := cliCfg.APIKey
	if len(keyDisplay) > 20 {
		keyDisplay = keyDisplay[:16] + "..." + keyDisplay[len(keyDisplay)-4:]
	}

	client := NewAPIClient(cliCfg.APIURL, cliCfg.APIKey)

	fmt.Fprintf(cmd.OutOrStdout(), "🔑 Diffsurge CLI\n\n")
	fmt.Fprintf(cmd.OutOrStdout(), "   API Key:  %s\n", keyDisplay)
	fmt.Fprintf(cmd.OutOrStdout(), "   API URL:  %s\n", cliCfg.APIURL)

	if cliCfg.ProjectID != "" {
		fmt.Fprintf(cmd.OutOrStdout(), "   Project:  %s\n", cliCfg.ProjectID)
	}

	fmt.Fprintln(cmd.OutOrStdout())

	// Verify the key works by hitting a protected endpoint
	fmt.Fprintf(cmd.OutOrStdout(), "→ Verifying API key... ")

	resp, err := client.Get("/api/v1/organizations")
	if err != nil {
		fmt.Fprintf(cmd.OutOrStdout(), "✗\n\n")
		return fmt.Errorf("authentication failed: %w", err)
	}
	defer resp.Body.Close()

	var orgsData struct {
		Data []struct {
			ID   string `json:"id"`
			Name string `json:"name"`
		} `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&orgsData); err == nil && len(orgsData.Data) > 0 {
		fmt.Fprintf(cmd.OutOrStdout(), "✓\n\n")
		fmt.Fprintf(cmd.OutOrStdout(), "   Organization: %s\n", orgsData.Data[0].Name)
		fmt.Fprintf(cmd.OutOrStdout(), "   Org ID:       %s\n", orgsData.Data[0].ID)
	} else {
		fmt.Fprintf(cmd.OutOrStdout(), "✓ (authenticated)\n")
	}

	fmt.Fprintf(cmd.OutOrStdout(), "\n✓ API key is valid\n")
	return nil
}
