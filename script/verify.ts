import { mkdtemp, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"

const root = path.resolve(import.meta.dir, "..")
const temporary = await mkdtemp(path.join(os.tmpdir(), "dt-"))
const environment = {
  ...process.env,
  DEEPTHROAT_TEST_HOME: temporary,
  DEEPTHROAT_DISABLE_AUTOUPDATE: "1",
  XDG_DATA_HOME: path.join(temporary, "data"),
  XDG_CONFIG_HOME: path.join(temporary, "config"),
  XDG_STATE_HOME: path.join(temporary, "state"),
  XDG_CACHE_HOME: path.join(temporary, "cache"),
  TEMP: temporary,
  TMP: temporary,
}
const suites = [
  { directory: "ai", files: ["test/deepthroat.test.ts", "test/testing.test.ts"] },
  { directory: "core", files: ["test/plugin/deepthroat-search.test.ts", "test/deepthroat.test.ts", "test/permission.test.ts", "test/agent.test.ts", "test/session-create.test.ts", "test/session-diff.test.ts", "test/session-execution.test.ts", "test/session-checkpoint-transport.test.ts", "test/session-compaction-transport.test.ts", "test/session-native-compaction.test.ts", "test/session-model-transport-live.test.ts", "test/persistent-pty-daemon.test.ts", "test/pty/info-schema.test.ts", "test/pty/protocol.test.ts"] },
  { directory: "cli", files: ["test/auth-login-choices.test.ts", "src/services/updater.test.ts", "test/updater-install.test.ts", "test/upgrade.test.ts", "test/retained-image.test.ts"] },
  { directory: "tui", files: ["test/cli/cmd/tui/integration-options.test.ts", "test/theme/v2/resolve.test.ts", "test/theme/v2/v1-migrate.test.ts", "test/cli/tui/inline-tool-wrap-snapshot.test.tsx"] },
  { directory: "theme", files: ["test/theme.test.ts"] },
]

try {
  for (const suite of suites) {
    console.log(`Checking DeepThroat ${suite.directory}`)
    const child = Bun.spawn([process.execPath, "test", "--timeout", "30000", ...suite.files], { cwd: path.join(root, "packages", suite.directory), env: environment, stdin: "ignore", stdout: "inherit", stderr: "inherit" })
    const status = await child.exited
    if (status !== 0) throw new Error(`${suite.directory} regression checks failed with exit ${status}`)
  }
} finally {
  const target = path.resolve(temporary)
  const parent = path.resolve(os.tmpdir()) + path.sep
  if (target.startsWith(parent) && path.basename(target).startsWith("dt-")) await rm(target, { recursive: true, force: true })
}
