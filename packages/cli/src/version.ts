import { Option, Schema } from "effect"

declare const deepthroatversion: string
declare const deepthroatchannel: string
declare const deepthroatartifact: string
declare const deepthroatreleasehighlights: string

const version = typeof deepthroatversion === "string" ? deepthroatversion : "local"
const channel = typeof deepthroatchannel === "string" ? deepthroatchannel : "local"
const artifact = typeof deepthroatartifact === "string" ? deepthroatartifact : "cli"
// Stable release builds embed the release notes' Highlights; every other build has none.
const highlights =
  typeof deepthroatreleasehighlights === "string"
    ? Option.getOrElse(
        Schema.decodeUnknownOption(
          Schema.fromJsonString(Schema.Array(Schema.Struct({ title: Schema.String, body: Schema.String }))),
        )(deepthroatreleasehighlights),
        () => [],
      )
    : []

export {
  version as deepthroatversion,
  channel as deepthroatchannel,
  artifact as deepthroatartifact,
  highlights as deepthroathighlights,
}
export const deepthroatlocal = channel === "local"
