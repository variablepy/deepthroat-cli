import { createHash } from "node:crypto"
import { chmod, copyFile, mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { $ } from "bun"

const root = path.resolve(import.meta.dir, "../../..")
const architecture = process.arch
if (process.platform !== "linux" || !["x64", "arm64"].includes(architecture)) throw new Error("Package Linux releases on their native Linux architecture.")
const target = `cli-linux-${architecture}${architecture === "x64" ? "-baseline" : ""}`
const output = path.join(root, "artifacts")
const name = `deepthroat-linux-${architecture}`
const executable = path.join(output, name)
const archive = `${name}.tar.gz`
await mkdir(output, { recursive: true })
await copyFile(path.join(root, "packages/cli/dist", target, "bin/deepthroat"), executable)
await chmod(executable, 0o755)
await copyFile(path.join(root, "LICENSE"), path.join(output, "LICENSE.txt"))
await $`tar -czf ${path.join(output, archive)} -C ${output} ${name} LICENSE.txt`
const sums = await Promise.all([name, archive].map(async (file) => `${createHash("sha256").update(await readFile(path.join(output, file))).digest("hex")}  ${file}`))
await writeFile(path.join(output, `SHA256SUMS.linux-${architecture}`), sums.join("\n") + "\n")
console.log(`Packaged Linux ${architecture} executable and archive`)
