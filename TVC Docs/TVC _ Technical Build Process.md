**Technical Build Process: TVC**

Tech Stack Recommendation

- **Core Language :** Go (High concurrency, single binary distribution for CLI).
- **Data Store :** ClickHouse (High volume log storage) or Postgres (if MVP traffic is low). Let's start with Postgres for MVP simplicity, migrate to ClickHouse later. We can use supabase for Postgres.
- **Message Queue :** Redis (for buffering traffic before storage).
- **Proxy Layer :** Custom Go Reverse Proxy (using httputil).
- **Frontend :** Next.js \+ TailwindCSS.

**Sprint 1: The Core Engine (MVP \- Local & CLI)**  
Goal: Create a local tool that can diff two JSONs/Schemas. No cloud component yet.

**Feature 1.1: JSON Schema Diffing Engine**  
 **Task :** Implement a Go struct for handling generic JSON payloads.  
 **Task :** Implement a DeepDiff algorithm to compare two JSON objects (Expected vs. Actual).  
 **Task :** Create output formatting: Generate a readable report of differences (Field Added, Removed, Type Changed).  
 **Test :** Unit test with complex nested JSONs. Verify accuracy of diff.

**Testing Result :** \[ \] Pass \[ \] Fail

**Feature 1.2: OpenAPI Parser**  
 **Task :** Integrate a library to parse OpenAPI/Swagger specs (e.g., getkin/kin-openapi).  
 **Task :** Write logic to compare two spec files.  
 **Task :** Define "Breaking Change Rules" (e.g., changing required field status).  
 **Test :** Feed two versions of a Swagger file; assert correct breaking change detection.

**Testing Result :** \[ \] Pass \[ \] Fail

**Feature 1.3: The CLI Interface**  
 **Task :** Setup Cobra CLI framework in Go.  
 **Task :** Command: tvc diff \--file-old spec_v1.json \--file-new spec_v2.json.  
 **Test :** Run binary locally on Mac/Linux. Check exit codes (0 for no change, 1 for breaking change).

**Testing Result :** \[ \] Pass \[ \] Fail

**Sprint 2: The Traffic Proxy (Infrastructure)**  
Goal: Build the mechanism to capture traffic.

**Feature 2.1: Reverse Proxy Skeleton**  
 **Task :** Build a simple Go HTTP server that accepts requests on port :8080.  
 **Task :** Implement httputil.NewSingleHostReverseProxy to forward traffic to a target URL (the actual API server).  
 **Task :** Implement a "Middleware" hook to intercept Response bodies before forwarding to the client.  
 **Test :** Curl the proxy, ensure request reaches target server and response returns to client.

**Testing Result :** \[ \] Pass \[ \] Fail

**Feature 2.2: Request/Response Capture**  
 **Task :** Define a schema for storing traffic (RequestHeaders, RequestBody, ResponseBody, Timestamp, Latency).  
 **Task :** Implement a buffer mechanism (write to channel) to avoid blocking the proxy response.  
 **Task :** Worker pool to read from channel and save to Postgres.  
 **Test :** Send 100 RPS (Requests Per Second) to the proxy. Verify DB entries match requests.

**Testing Result :** \[ \] Pass \[ \] Fail

**Feature 2.3: Configuration & Routing**  
 **Task :** Config file (YAML) support to define target endpoints.  
 **Task :** Dynamic routing logic (Route /api/v1/users \-\> users-service:8000).  
 **Test :** Update config without restarting proxy (hot reload check).

**Testing Result :** \[ \] Pass \[ \] Fail

**Sprint 3: The Replay Engine (The Value)**  
Goal: Replaying captured traffic against a new deployment.

**Feature 3.1: Traffic Selection & Filtering**  
 **Task :** SQL queries to fetch specific traffic samples (e.g., "Give me 50 requests from last hour").  
 **Task :** Filter sensitive headers (Authorization) before replaying.  
 **Test :** Verify replayed requests do not contain real auth tokens (use test tokens).

**Testing Result :** \[ \] Pass \[ \] Fail

**Feature 3.2: The Replayer Client**  
 **Task :** Build a high-concurrency HTTP client in Go.  
 **Task :** Read from DB \-\> Construct HTTP Request \-\> Send to "Target URL" (Staging).  
 **Task :** Capture Staging Response.  
 **Test :** Replay traffic against a dummy server. Verify it handles high load.

**Testing Result :** \[ \] Pass \[ \] Fail

**Feature 3.3: Comparison Logic**  
 **Task :** Integrate the Diff Engine from Sprint 1\.  
 **Task :** Compare "Stored Production Response" vs "Live Staging Response".  
 **Task :** Store the Diff Result in DB.  
 **Test :** Intentionally break the Staging API (change field name). Run replay. Verify system catches the error.

**Testing Result :** \[ \] Pass \[ \] Fail

**Sprint 4: PII Redaction & Cloud Dashboard**  
Goal: Security compliance and User Interface.

**Feature 4.1: PII Auto-Detection**  
 **Task :** Regex patterns for Emails, Phones, Credit Cards.  
 **Task :** Implementation: Mask detected PII with \*\*\* before writing to DB.  
 **Test :** Send request with email: "test@example.com". Check DB shows email: "\*\*\*".

**Testing Result :** \[ \] Pass \[ \] Fail

**Feature 4.2: User Dashboard (Web)**  
 **Task :** Next.js setup with API routes.  
 **Task :** Page: "Traffic Stream" (Live view of requests).  
 **Task :** Page: "Replay Report" (Show list of failing requests).  
 **Test :** User logs in, triggers a replay, sees the results on the screen.

**Testing Result :** \[ \] Pass \[ \] Fail

**Feature 4.3: Authentication & Billing**  
 **Task :** Integrate Clerk or Supabase Auth.  
 **Task :** Integrate Stripe Checkout.  
 **Task :** Lock "Replay" feature behind subscription check.  
 **Test :** Attempt replay without subscription \-\> Block access. Subscribe \-\> Allow access.

**Testing Result :** \[ \] Pass \[ \] Fail
