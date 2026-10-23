import { expect, test } from "bun:test"
import { createHash } from "node:crypto"
import { methods, releaseversion, verifydownload } from "../src/services/updater"

const bytes = new TextEncoder().encode("deepthroat release fixture")
const name = "deepthroat-windows-x64.exe"
const hash = createHash("sha256").update(bytes).digest("hex")

test("only standalone installation methods are exposed", () => {
  expect(methods).toEqual(["standalone", "curl"])
})

test("release metadata accepts stable version tags", () => {
  expect(releaseversion({ tag_name: "v0.1.0" })).toBe("0.1.0")
  for (const value of [null, {}, { tag_name: "v01.2.3" }, { tag_name: "v1.2.3/../../other" }, { tag_name: "1.2.3" }, { tag_name: "v1.2.3-beta" }]) {
    expect(() => releaseversion(value)).toThrow("invalid version")
  }
})

test("verifies the exact asset checksum among multiple release artifacts", () => {
  expect(() => verifydownload(bytes, `${hash}  unrelated.zip\n${hash}  ${name}\n`, name)).not.toThrow()
  expect(() => verifydownload(bytes, `${hash.toUpperCase()} *${name}\r\n`, name)).not.toThrow()
})

test("rejects corrupted binaries, missing checksums and duplicate entries", () => {
  for (const sums of ["", `${hash}  other.exe`, `${"0".repeat(64)}  ${name}`, `${hash}  ${name}\n${hash}  ${name}`]) {
    expect(() => verifydownload(bytes, sums, name)).toThrow("checksum")
  }
  expect(() => verifydownload(new Uint8Array([1, 2, 3]), `${hash}  ${name}`, name)).toThrow("checksum")
})
