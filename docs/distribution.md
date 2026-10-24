# Distribution

The CLI is a standalone executable. Users do not need Node.js or Bun installed.

## Windows release preparation

From the repository root on Windows:

```powershell
bun install
bun run --cwd packages/cli script/build.ts --single --skip-install --skip-web-ui
bun run packages/cli/script/package-release.ts
```

The packager writes `artifacts/deepthroat-windows-x64.zip`, `artifacts/deepthroat-windows-x64.exe`, and `artifacts/SHA256SUMS`. The ZIP contains `deepthroat.exe` its required `LICENSE.txt` attribution, and the shared Windows `integration.ps1` helper. The executable also exposes `deepthroat license`. Publish all three files together under a versioned GitHub release in `variablepy/deepthroat-cli`.

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

## Verified release

[CLI v0.1.0](https://github.com/variablepy/deepthroat-cli/releases/tag/v0.1.0) is published. [The release workflow](https://github.com/variablepy/deepthroat-cli/actions/runs/40034084660) passed types, regression checks, compiled-executable smoke tests, and a fresh Windows installation from the public release, including PATH resolution and launch.

Desktop bundling and live executable-replacement verification are being completed separately.

## Existing installations

The standalone CLI stays preferred when Desktop installs its optional bundled CLI. Each uses a separate directory. Desktop uninstall removes only its owned PATH entry and never removes the standalone binary or registration. Recognized legacy launchers that point to the retired Python entry.py are backed up and migrated; custom launchers are preserved.

## Linux releases

The release workflow builds and runs the CLI natively on Linux x64 and ARM64 before publishing the platform assets together. The x64 build uses the baseline CPU target. Each platform includes a raw executable for the updater and a tar.gz archive containing its license. SHA256SUMS covers the executables, archives and installers.

Download install.sh from the versioned release, review it, and run `bash install.sh --version v0.1.8`. It detects the architecture and installs to `~/.local/bin` without sudo. Linux requires glibc; Alpine/musl is not supported by this installer. The optional `--directory` must be an absolute path. The installer preserves the current executable when verification fails and leaves shell configuration and account data unchanged.
