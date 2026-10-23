# DeepThroat CLI

An open-source terminal coding agent optimized for DeepThroat accounts.

## Account-powered inference

Connect to `https://api.cheapai.gay/v1` using your DeepThroat website account. External inference providers, manual provider keys, and custom inference URLs are disabled.

Build and Plan agents, custom agents, parallel subagents, project tools, permissions, MCP, language servers, and reusable skills remain part of the coding engine.

## Distribution

Standalone `deepthroat` executables and a desktop-bundled Windows CLI are being prepared. Desktop and CLI can be installed independently. The Windows CLI uses a separate binary directory to avoid colliding with the desktop executable.

## Develop

Use Bun 1.4.4. Run `bun install`, `bun run dev`, and `bun run build` from this repository.

## Layout

- `packages/cli`: commands and executable packaging
- `packages/tui`: terminal interface
- `packages/core`: sessions, tools, permissions, and DeepThroat account integration
- `packages/ai`: streaming protocols and the DeepThroat adapter
- `packages/schema`, `protocol`, `server`, `client`: shared contracts and local server
- `packages/plugin`: extensibility contracts

Configuration uses `deepthroat.json` or `deepthroat.jsonc`; project workflows live in `.deepthroat`. Internal workspace packages use `@deepthroat/*`.

See [distribution details](docs/distribution.md) and [LICENSE](LICENSE). Never commit credentials, environment files, databases, or backend configuration.
