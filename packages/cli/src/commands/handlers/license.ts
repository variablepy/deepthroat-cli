import { Effect } from "effect"
import { Commands } from "../commands"
import { Runtime } from "../../framework/runtime"
import license from "../../../../../LICENSE" with { type: "text" }

export default Runtime.handler(Commands.commands.license, () => Effect.sync(() => { process.stdout.write(license) }))
