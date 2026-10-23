# Distribution

The CLI is a standalone executable. Users do not need Node.js or Bun installed.

## Windows release preparation

From the repository root on Windows:

```powershell
bun install
bun run --cwd packages/cli script/build.ts --single --skip-install --skip-web-ui
bun run packages/cli/script/package-release.ts
```

The packager writes `artifacts/deepthroat-windows-x64.zip`, `artifacts/deepthroat-windows-x64.exe`, and `artifacts/SHA256SUMS`. The ZIP contains `deepthroat.exe` and its required `LICENSE.txt` attribution. The executable also exposes `deepthroat license`. Publish all three files together under a versioned GitHub release in `variablepy/deepthroat-cli`.

## Standalone Windows installation

After a release is published, download `install.ps1` from that release's source tag, review it, and run:

```powershell
.\install.ps1 -version v0.1.0
deepthroat auth login
```

The installer verifies the release checksum, checks the archive layout and executable version, installs into `%LOCALAPPDATA%\DeepThroatCLI\bin`, and adds that directory to the current user's PATH. Open a new terminal for the PATH change to apply to other sessions. Re-running the installer replaces the executable and preserves account data.

`-directory` selects a different installation directory. It must be separate from the desktop application's executable directory: Windows treats `DeepThroat.exe` and `deepthroat.exe` as the same filename.

Sign in through the DeepThroat website and select an existing account key. External inference providers and custom inference endpoints are rejected by the runtime.

## Updates

`deepthroat upgrade` checks the stable release in `variablepy/deepthroat-cli`. The updater downloads the platform executable and `SHA256SUMS`, verifies the exact asset checksum, stages the executable beside the installed binary, and replaces it under the upgrade lock. A failed download or checksum check leaves the installed executable in place.

The CLI bundled with the desktop app must update through the desktop installer, keeping the two components on the tested release pair. Source checkouts update through Git. Use the standalone installer for terminal-only installations.

Set `update` to `disable`, `notify`, or `auto` in the CLI's `deepthroat.json` configuration. The default is `notify`. `DEEPTHROAT_DISABLE_AUTOUPDATE=1` disables automatic checks.

## Release readiness

The public release, desktop bundling, and full installation and live-upgrade tests are still being prepared. The updater implementation has local policy, metadata, and checksum checks; it has not yet been verified against a published DeepThroat release. The existence of a locally packaged archive does not establish that these distribution channels are live.
