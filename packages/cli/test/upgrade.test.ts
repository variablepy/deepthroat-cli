import { describe, expect, test } from "bun:test"
import { mkdtemp, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"

describe("upgrade command", () => {
  test("is registered in root help and documents its options", async () => {
    const root = await cli(["--help"], {}, "../src/index.ts")
    const help = await cli(["upgrade", "--help"], {}, "../src/index.ts")
    expect(root.exitCode).toBe(0)
    expect(root.stdout).toContain("upgrade")
    expect(help.exitCode).toBe(0)
    expect(help.stdout).toContain("[<target>]")
    expect(help.stdout).toContain("--method")
    expect(help.stdout).toContain("-m")
  })

  test("detects the installation method and resolves the latest version", async () => {
    const result = await cli([])
    expect(result.exitCode).toBe(0)
    expect(result.events).toEqual(["method", { latest: "standalone" }, { method: "standalone", version: "0.2.0" }])
    expect(result.stdout).toContain("Upgrade complete")
  })

  test("resolves the latest version for an explicit method without detection", async () => {
    const result = await cli(["--method", "curl"], { UPGRADE_TEST_METHOD: "standalone" })
    expect(result.exitCode).toBe(0)
    expect(result.events).toEqual([{ latest: "curl" }, { method: "curl", version: "0.2.0" }])
  })

  test("accepts an explicit version and method without detection or a version lookup", async () => {
    const result = await cli(["v0.3.0", "--method", "curl"])
    expect(result.exitCode).toBe(0)
    expect(result.events).toEqual([{ method: "curl", version: "v0.3.0" }])
    expect(result.stdout).toContain("0.1.0 → 0.3.0")
  })

  test("accepts the short method flag and an explicit major upgrade", async () => {
    const result = await cli(["2.0.0", "-m", "standalone"])
    expect(result.exitCode).toBe(0)
    expect(result.events).toEqual([{ method: "standalone", version: "2.0.0" }])
  })

  test("accepts standalone as an explicit installation method", async () => {
    const result = await cli(["2.0.0", "--method", "standalone"])
    expect(result.exitCode).toBe(0)
    expect(result.events).toEqual([{ method: "standalone", version: "2.0.0" }])
  })

  test("skips the already installed version", async () => {
    const result = await cli(["v0.1.0"])
    expect(result.exitCode).toBe(0)
    expect(result.events).toEqual(["method"])
    expect(result.stdout).toContain("already installed")
  })

  test("requires an explicit method when detection fails", async () => {
    const result = await cli([], { UPGRADE_TEST_METHOD: "unknown" })
    expect(result.exitCode).toBe(1)
    expect(result.events).toEqual(["method"])
    expect(result.stdout).toContain("Pass --method")
  })

  test("rejects unsupported methods before attempting an upgrade", async () => {
    const result = await cli(["--method", "apt"])
    expect(result.exitCode).not.toBe(0)
    expect(result.events).toEqual([])
  })

  test("reports version lookup failures without installing", async () => {
    const result = await cli([], { UPGRADE_TEST_LATEST_ERROR: "1" })
    expect(result.exitCode).toBe(1)
    expect(result.events).toEqual(["method", { latest: "standalone" }])
    expect(result.stdout).toContain("Update check failed")
  })

  test("reports installation failures with a nonzero exit code", async () => {
    const result = await cli([], { UPGRADE_TEST_INSTALL_ERROR: "1" })
    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain("Upgrade failed")
    expect(result.stdout).toContain("Permission denied")
    expect(result.stdout).not.toContain("Upgrade complete")
  })
})

async function cli(args: string[], env: Record<string, string> = {}, entry = "fixture/upgrade.ts") {
  const root = await mkdtemp(path.join(os.tmpdir(), "deepthroat-upgrade-"))
  try {
    const child = Bun.spawn(
      [process.execPath, "--define", 'deepthroatversion="0.1.0"', path.join(import.meta.dir, entry), ...args],
      {
        cwd: path.join(import.meta.dir, ".."),
        env: {
          ...process.env,
          DEEPTHROAT_TEST_HOME: root,
          XDG_DATA_HOME: path.join(root, "data"),
          XDG_CONFIG_HOME: path.join(root, "config"),
          XDG_CACHE_HOME: path.join(root, "cache"),
          XDG_STATE_HOME: path.join(root, "state"),
          DEEPTHROAT_DISABLE_AUTOUPDATE: "1",
          ...env,
        },
        stdout: "pipe",
        stderr: "pipe",
      },
    )
    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ])
    const events = stdout
      .split("\n")
      .filter((line) => line.startsWith("EVENT "))
      .map((line) => JSON.parse(line.slice(6)))
    expect(await Bun.file(path.join(root, "state", "deepthroat", "service-local.json")).exists()).toBe(false)
    return { stdout, stderr, exitCode, events }
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}
