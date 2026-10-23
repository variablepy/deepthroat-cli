import manifest from "../../../package.json" with { type: "json" }
export const script = {
  channel: process.env.DEEPTHROAT_CHANNEL || "latest",
  version: manifest.version,
  preview: false,
  release: process.env.DEEPTHROAT_RELEASE === "1",
  team: ["variablepy"],
}
