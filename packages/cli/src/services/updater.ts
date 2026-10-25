import { Global } from "@deepthroat/util/global"
import { EffectFlock } from "@deepthroat/util/effect-flock"
import { deepthroatlocal, deepthroatversion } from "../version"
import { Context, Effect, FileSystem, Layer, Ref } from "effect"
import { parse, type ParseError } from "jsonc-parser"
import { createHash, randomBytes } from "node:crypto"
import path from "node:path"
import { RetainedImage } from "./retained-image"
import { action, parseReleaseVersion, type Policy } from "./updater-action"

export const methods = ["standalone", "curl"] as const
export type Method = (typeof methods)[number]
export type RunResult = { readonly type: "available" | "installed"; readonly version: string }
export type CheckResult = RunResult | { readonly type: "unavailable"; readonly message: string }

export class UpgradeError extends Error {
  readonly title: string
  readonly detail: string
  readonly command?: string
  readonly retry: string
  constructor(input: { readonly title: string; readonly detail: string; readonly command?: string; readonly retry: string }, options?: ErrorOptions) {
    super(input.detail, options)
    this.name = "UpgradeError"
    this.title = input.title
    this.detail = input.detail
    this.command = input.command
    this.retry = input.retry
  }
}

export interface Interface {
  readonly run: (onInstall?: (version: string) => void) => Effect.Effect<RunResult | undefined>
  readonly check: () => Effect.Effect<CheckResult | undefined, Error>
  readonly apply: (version: string) => Effect.Effect<void, Error>
  readonly method: () => Effect.Effect<Method | undefined>
  readonly latest: (method?: Method) => Effect.Effect<string, Error>
  readonly upgrade: (method: Method, version: string) => Effect.Effect<void, Error>
  readonly removal: (method: Method) => { readonly command: ReadonlyArray<string>; readonly run: Effect.Effect<void, Error> } | undefined
}

export class Service extends Context.Service<Service, Interface>()("@deepthroat/cli/Updater") {}

export function decodepolicy(text: string): Policy | undefined {
  const errors: ParseError[] = []
  const input: unknown = parse(text, errors, { allowTrailingComma: true })
  if (errors.length || typeof input !== "object" || input === null) return
  if ("update" in input) return input.update === "disable" || input.update === "notify" || input.update === "auto" ? input.update : undefined
  if (!("autoupdate" in input)) return
  if (input.autoupdate === false) return "disable"
  if (input.autoupdate === "notify") return "notify"
  if (input.autoupdate === true) return "auto"
}

export function releaseversion(value: unknown) {
  if (typeof value !== "object" || value === null || !("tag_name" in value) || typeof value.tag_name !== "string" || !/^v[0-9]+\.[0-9]+\.[0-9]+$/.test(value.tag_name) || !parseReleaseVersion(value.tag_name)) throw new Error("The DeepThroat release has an invalid version.")
  return value.tag_name.slice(1)
}

export function verifydownload(bytes: Uint8Array, sums: string, name: string) {
  const entries = sums.split(/\r?\n/).flatMap((line) => {
    const match = /^([a-fA-F0-9]{64})\s+\*?([^\s]+)$/.exec(line.trim())
    return match?.[2] === name ? [match[1].toLowerCase()] : []
  })
  if (entries.length !== 1 || createHash("sha256").update(bytes).digest("hex") !== entries[0]) throw new Error("The DeepThroat release checksum did not match.")
}

export async function downloadrelease(url: string, signal: AbortSignal, accept = "application/octet-stream") {
  const response = await fetch(url, { signal: AbortSignal.any([signal, AbortSignal.timeout(120000)]), headers: { "User-Agent": "DeepThroatCLI", Accept: accept } })
  if (!response.ok) throw new Error(`DeepThroat release download returned HTTP ${response.status}.`)
  return response
}

const repository = "https://github.com/variablepy/deepthroat-cli/releases"
const make = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem
  const global = yield* Global.Service
  const flock = yield* EffectFlock.Service
  const installed = yield* Ref.make(deepthroatversion)
  const executable = yield* fs.realPath(process.execPath).pipe(Effect.orElseSucceed(() => process.execPath))
  const bundled = /[\\/]binaries[\\/]windows[\\/]deepthroat\.exe$/i.test(executable)
  const method = () => Effect.succeed<Method | undefined>(!deepthroatlocal && !bundled && /^deepthroat(?:\.exe)?$/i.test(path.basename(executable)) ? "standalone" : undefined)
  const request = (url: string, accept?: string) => Effect.tryPromise({
    try: (signal) => downloadrelease(url, signal, accept),
    catch: (cause) => new Error(`Could not download the DeepThroat release. ${cause instanceof Error ? cause.message : String(cause)}`, { cause }),
  })
  const latest = (selected?: Method) => request("https://api.github.com/repos/variablepy/deepthroat-cli/releases/latest", "application/vnd.github+json").pipe(
    Effect.flatMap((response) => Effect.tryPromise({ try: () => response.json(), catch: (cause) => new Error("Invalid release information.", { cause }) })),
    Effect.flatMap((value) => Effect.try(() => releaseversion(value))),
  )
  const policy = Effect.gen(function* () {
    const values = yield* Effect.forEach(["config.json", "deepthroat.json", "deepthroat.jsonc"], (name) => fs.readFileString(path.join(global.config, name)).pipe(Effect.map(decodepolicy), Effect.orElseSucceed(() => undefined)))
    return values.findLast((value) => value !== undefined) ?? "notify"
  })
  const upgrade = (selected: Method, input: string) => Effect.scoped(Effect.gen(function* () {
    const version = input.trim().replace(/^v/, "")
    if (!/^[0-9]+\.[0-9]+\.[0-9]+$/.test(version) || !parseReleaseVersion(version)) return yield* Effect.fail(new Error("Invalid DeepThroat release version."))
    if (!(yield* method())) return yield* Effect.fail(new Error(bundled ? "Update DeepThroat Desktop to update its bundled CLI." : "Install a standalone DeepThroat release before updating."))
    const platform = process.platform === "win32" ? "windows" : process.platform
    if (!["windows", "linux", "darwin"].includes(platform) || !["x64", "arm64"].includes(process.arch)) return yield* Effect.fail(new Error("This platform has no standalone release."))
    const name = `deepthroat-${platform}-${process.arch}${process.platform === "win32" ? ".exe" : ""}`
    yield* flock.acquire("cli-upgrade", undefined, { timeoutMs: 300000 })
    const response = yield* request(`${repository}/download/v${version}/${name}`)
    const bytes = new Uint8Array(yield* Effect.tryPromise({ try: () => response.arrayBuffer(), catch: (cause) => new Error("Incomplete executable download.", { cause }) }))
    const checksums = yield* request(`${repository}/download/v${version}/SHA256SUMS`)
    const sums = yield* Effect.tryPromise({ try: () => checksums.text(), catch: (cause) => new Error("Incomplete checksum download.", { cause }) })
    yield* Effect.try(() => verifydownload(bytes, sums, name))
    const staged = `${executable}.${randomBytes(8).toString("hex")}.new`
    yield* Effect.acquireRelease(fs.writeFile(staged, bytes).pipe(Effect.as(staged)), (file) => fs.remove(file, { force: true }).pipe(Effect.ignore))
    if (process.platform !== "win32") yield* fs.chmod(staged, 0o755)
    if (process.platform === "win32") yield* RetainedImage.retain(path.dirname(executable), "upgrade").pipe(Effect.provideService(FileSystem.FileSystem, fs))
    yield* fs.rename(staged, executable)
    yield* Ref.set(installed, version)
  })).pipe(Effect.mapError((cause) => new UpgradeError({ title: "Could not update DeepThroat CLI", detail: cause instanceof Error ? cause.message : String(cause), retry: "Try deepthroat upgrade again, or download the release manually." }, { cause })))
  const apply = (version: string) => upgrade("standalone", version)
  const check = () => Effect.gen(function* () {
    if (deepthroatlocal || bundled) return { type: "unavailable" as const, message: bundled ? "Update the bundled CLI through DeepThroat Desktop." : "Source checkouts are updated through Git." }
    const version = yield* latest()
    const current = yield* Ref.get(installed)
    if (action(current, version, "notify") === "none") return current === deepthroatversion ? undefined : { type: "installed" as const, version: current }
    return { type: "available" as const, version }
  })
  const run = (notify: (version: string) => void = () => {}) => Effect.gen(function* () {
    if (deepthroatlocal || bundled || ["1", "true"].includes(process.env.DEEPTHROAT_DISABLE_AUTOUPDATE?.toLowerCase() ?? "")) return
    const preference = yield* policy
    if (preference === "disable") return
    const result = yield* check()
    if (!result || result.type !== "available") return result?.type === "installed" ? result : undefined
    if (preference === "notify") return result
    notify(result.version)
    yield* apply(result.version)
    return { type: "installed" as const, version: result.version }
  }).pipe(Effect.catch((error) => Effect.logWarning("DeepThroat update check failed", { error }).pipe(Effect.as(undefined))))
  return Service.of({ run, check, apply, method, latest, upgrade, removal: () => undefined })
})

export const layer = Layer.effect(Service, make)
export * as Updater from "./updater"
export { action, type Action, type Policy } from "./updater-action"
