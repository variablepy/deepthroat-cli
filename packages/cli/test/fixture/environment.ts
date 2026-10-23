import os from "node:os"
import path from "node:path"

// Each isolated home gets its own XDG_CACHE_HOME, where Bun would otherwise keep its transpiler cache,
// so every spawned CLI process would transpile the source from scratch. Share one cache instead.
export const transpilerCache = path.join(os.tmpdir(), "deepthroat-test-transpiler-cache")

export function isolatedEnv(root: string, overrides: Record<string, string | undefined> = {}) {
  return {
    ...process.env,
    BUN_RUNTIME_TRANSPILER_CACHE_PATH: transpilerCache,
    HOME: root,
    DEEPTHROAT_CLI_CONFIG_CONTENT: undefined,
    DEEPTHROAT_CONFIG_CONTENT: "{}",
    DEEPTHROAT_CONFIG_DIR: path.join(root, "config"),
    DEEPTHROAT_DB: path.join(root, "deepthroat.db"),
    DEEPTHROAT_DISABLE_FILEWATCHER: "true",
    DEEPTHROAT_DISABLE_MODELS_FETCH: "true",
    DEEPTHROAT_TEST_HOME: root,
    XDG_CACHE_HOME: path.join(root, "cache"),
    XDG_CONFIG_HOME: path.join(root, "xdg-config"),
    XDG_DATA_HOME: path.join(root, "data"),
    XDG_STATE_HOME: path.join(root, "state"),
    ...overrides,
  }
}
