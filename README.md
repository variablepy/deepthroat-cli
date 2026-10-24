# DeepThroat CLI

An open-source terminal coding agent connected to your DeepThroat account.

[Download CLI](https://github.com/variablepy/deepthroat-cli/releases/latest) ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· [Apps](https://cheapai.gay/apps) ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· [Distribution](docs/distribution.md)

## Start building

Download the Windows x64 ZIP from the release page and extract it. Run `deepthroat.exe` directly, or download and review the versioned `install.ps1` to install the `deepthroat` command on your user PATH:

```powershell
.\install.ps1 -version v0.1.8
deepthroat auth login
deepthroat
```

Sign in on the website, compare the approval code, and select an existing account key. Your account's models, context limits, image-input support, and reasoning choices load automatically. Inference connects only to `https://api.cheapai.gay/v1`; external inference providers, manual provider keys, and custom inference URLs are disabled.

Token-cost figures in the terminal are estimates. Your account's billing is authoritative and may include request fees, context tiers, or plan rules.

## Coding tools

- Build and Plan agents, custom agents, and parallel subagents.
- Project search, file edits, terminal tools, and permission prompts.
- MCP tools, language servers, reusable skills, and persistent sessions.
- Verified standalone updates through `deepthroat upgrade`.

Windows x64 and Linux x64/ARM64 releases are standalone executables and require no Node.js or Bun installation. Linux requires glibc; Alpine/musl is not supported by the installer. Desktop remains a separate Windows download.

## Linux

Download and review the versioned installer, then run:

```bash
curl -fsSL https://github.com/variablepy/deepthroat-cli/releases/download/v0.1.8/install.sh -o install.sh
bash install.sh --version v0.1.8
export PATH="$HOME/.local/bin:$PATH"
deepthroat auth login
deepthroat
```

The installer detects x64 or ARM64, verifies the exact SHA-256 checksum and executable version, and atomically installs into `~/.local/bin` without sudo. Add the PATH line to your shell configuration if needed. Use `--directory /absolute/path/to/bin` for a custom directory. Reinstalling and `deepthroat upgrade` preserve account data.

## Develop

Use Bun 1.4.4. Run `bun install`, `bun run dev`, and `bun run verify` from this repository. The verification gate covers account restrictions, coding sessions, permissions, transports, PTY, updater/install behavior, terminal rendering, and themes, plus all workspace type checks.

Configuration uses `deepthroat.json` or `deepthroat.jsonc`; project workflows live in `.deepthroat`. Workspace packages use `@deepthroat/*`.

| Package | Responsibility |
| --- | --- |
| `packages/cli` | Commands, executable builds, and updates |
| `packages/tui` | Terminal interface |
| `packages/core` | Sessions, tools, permissions, and account integration |
| `packages/ai` | Streaming protocols and the DeepThroat adapter |
| `packages/schema`, `protocol`, `server`, `client` | Contracts and local server |
| `packages/plugin` | Extensibility contracts |

Never commit credentials, environment files, databases, or private backend configuration. See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), and [LICENSE](LICENSE). The executable exposes its required attribution through `deepthroat license`.
