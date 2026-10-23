import { createHash } from "node:crypto"
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import { $ } from "bun"

const root = path.resolve(import.meta.dir, "../../..")
const output = path.join(root, "artifacts")
const build = process.argv.includes("--baseline") ? "cli-windows-x64-baseline" : "cli-windows-x64"
const source = path.join(import.meta.dir, "../dist", build, "bin/deepthroat.exe")
const archive = path.join(output, "deepthroat-windows-x64.zip")

if (process.platform !== "win32") throw new Error("Run the Windows release packager on Windows.")
await mkdir(output, { recursive: true })
await rm(archive, { force: true })
const command = `$ErrorActionPreference = 'Stop'; Add-Type -AssemblyName System.IO.Compression; Add-Type -AssemblyName System.IO.Compression.FileSystem; $archive = [IO.Compression.ZipFile]::Open('${archive.replaceAll("'", "''")}', [IO.Compression.ZipArchiveMode]::Create); try { $null = [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, '${source.replaceAll("'", "''")}', 'deepthroat.exe', [IO.Compression.CompressionLevel]::Optimal); $null = [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, '${path.join(root, "LICENSE").replaceAll("'", "''")}', 'LICENSE.txt', [IO.Compression.CompressionLevel]::Optimal) } finally { $archive.Dispose() }`
await $`powershell -NoProfile -NonInteractive -Command ${command}`
const checksum = createHash("sha256").update(await readFile(archive)).digest("hex")
const executable = path.join(output, "deepthroat-windows-x64.exe")
await copyFile(source, executable)
await copyFile(path.join(root, "LICENSE"), path.join(output, "LICENSE.txt"))
const binaryhash = createHash("sha256").update(await readFile(executable)).digest("hex")
await writeFile(path.join(output, "SHA256SUMS"), `${checksum}  deepthroat-windows-x64.zip\n${binaryhash}  deepthroat-windows-x64.exe\n`, "utf8")
console.log(`Packaged ${archive}`)
