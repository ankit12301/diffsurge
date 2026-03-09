# Contributing to Diffsurge

Thanks for contributing to Diffsurge.

## Ways to contribute

- Report bugs and UX issues.
- Improve documentation and examples.
- Fix issues labeled `good first issue` and `help wanted`.
- Add tests for reliability and regressions.

## Local setup

1. Fork and clone the repository.
2. Copy environment templates:

   ```bash
   cp .env.example .env
   cp diffsurge-frontend/.env.example diffsurge-frontend/.env.local
   ```

3. Start services:

   ```bash
   docker compose up --build
   ```

4. Validate changes:

   ```bash
   cd diffsurge-go && make test && make build
   cd ../diffsurge-frontend && npm ci && npm run lint && npm run build
   ```

## Pull request guidelines

- Keep PRs focused and small when possible.
- Include a clear description of the problem and solution.
- Add or update tests when behavior changes.
- Update docs for user-facing changes.
- Link related issues in the PR description.

## Commit style

Use clear, imperative commit messages, for example:

- `feat(cli): add schema diff summary`
- `fix(proxy): handle timeout during upstream replay`
- `docs(readme): add docker quickstart`

## Review expectations

- CI must pass before merge.
- At least one maintainer approval is required.
- Security-sensitive changes require maintainer review from backend + frontend owners.

## Security

Do not open public issues for credentials or exploit details.
Report security concerns privately to maintainers first.