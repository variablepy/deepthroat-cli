import path from "node:path"
import { deepthroatchannel } from "./version"

export function databasePath(data: string) {
  const filename =
    process.env.DEEPTHROAT_DB ??
    (["latest", "dev", "beta", "next", "prod"].includes(deepthroatchannel) ||
    process.env.DEEPTHROAT_DISABLE_CHANNEL_DB === "1" ||
    process.env.DEEPTHROAT_DISABLE_CHANNEL_DB === "true"
      ? "deepthroat.db"
      : `deepthroat-${deepthroatchannel.replace(/[^a-zA-Z0-9._-]/g, "-")}.db`)
  return filename === ":memory:" ? filename : path.resolve(data, filename)
}
