# driftsurge

**API Traffic Capture, Diff, Schema Comparison & Replay CLI**

Driftsurge helps you detect breaking API changes before they reach production.

## Install

```bash
npm install -g driftsurge
```

Or use Docker:

```bash
docker run equixankit/driftsurge-cli --help
```

## Usage

```bash
# Compare two API response files
surge diff --old response-v1.json --new response-v2.json

# Compare API schemas
surge schema diff --old api-v1.yaml --new api-v2.yaml --fail-on-breaking

# Replay captured traffic
surge replay --source captured.json --target http://localhost:8080
```

## Links

- [Documentation](https://github.com/ankit12301/tvc)
- [Docker Hub](https://hub.docker.com/u/equixankit)
