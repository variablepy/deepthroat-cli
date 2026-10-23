import { NodeFileSystem } from "@effect/platform-node"
import { compile, emitEffectImported, emitEffectShape, emitPromise, write } from "@deepthroat/httpapi-codegen"
import { ClientApi, effectOmitEndpoints, groupNames, promiseOmitEndpoints } from "@deepthroat/protocol/client"
import { Agent } from "@deepthroat/schema/agent"
import { Command } from "@deepthroat/schema/command"
import { Config } from "@deepthroat/schema/config"
import { Credential } from "@deepthroat/schema/credential"
import { Event } from "@deepthroat/schema/event"
import { EventLog } from "@deepthroat/schema/event-log"
import { FileDiff } from "@deepthroat/schema/file-diff"
import { FileSystem } from "@deepthroat/schema/filesystem"
import { Form } from "@deepthroat/schema/form"
import { Instruction } from "@deepthroat/schema/instruction"
import { InstructionEntry } from "@deepthroat/schema/instruction-entry"
import { Integration } from "@deepthroat/schema/integration"
import { Location } from "@deepthroat/schema/location"
import { Mcp } from "@deepthroat/schema/mcp"
import { Model } from "@deepthroat/schema/model"
import { Money } from "@deepthroat/schema/money"
import { Permission } from "@deepthroat/schema/permission"
import { PermissionSaved } from "@deepthroat/schema/permission-saved"
import { Plugin } from "@deepthroat/schema/plugin"
import { Project } from "@deepthroat/schema/project"
import { Worktree } from "@deepthroat/schema/worktree"
import { AgentAttachment, FileAttachment, Prompt, PromptMention } from "@deepthroat/schema/prompt"
import { PromptInput } from "@deepthroat/schema/prompt-input"
import { Provider } from "@deepthroat/schema/provider"
import { Pty } from "@deepthroat/schema/pty"
import { PtyTicket } from "@deepthroat/schema/pty-ticket"
import { Question } from "@deepthroat/schema/question"
import { Reference } from "@deepthroat/schema/reference"
import { AbsolutePath, RelativePath } from "@deepthroat/schema/schema"
import { Session } from "@deepthroat/schema/session"
import { SessionMessage } from "@deepthroat/schema/session-message"
import { SessionInbox } from "@deepthroat/schema/session-inbox"
import { Shell } from "@deepthroat/schema/shell"
import { Skill } from "@deepthroat/schema/skill"
import { Snapshot } from "@deepthroat/schema/snapshot"
import { Vcs } from "@deepthroat/schema/vcs"
import { WebSearch } from "@deepthroat/schema/websearch"
import { Workspace } from "@deepthroat/schema/workspace"
import { Effect, Schema } from "effect"
import { fileURLToPath } from "url"

const promiseContract = compile(ClientApi, { groupNames, omitEndpoints: promiseOmitEndpoints })
const effectContract = compile(ClientApi, { groupNames, omitEndpoints: effectOmitEndpoints })
const effectTypeReferences = [
  ...namespaceTypes("Agent", "@deepthroat/schema/agent", Agent),
  ...namespaceTypes("Command", "@deepthroat/schema/command", Command),
  ...namespaceTypes("Config", "@deepthroat/schema/config", Config),
  ...namespaceTypes("Credential", "@deepthroat/schema/credential", Credential),
  ...namespaceTypes("Event", "@deepthroat/schema/event", Event),
  ...namespaceTypes("EventLog", "@deepthroat/schema/event-log", EventLog),
  ...namespaceTypes("FileDiff", "@deepthroat/schema/file-diff", FileDiff),
  ...namespaceTypes("FileSystem", "@deepthroat/schema/filesystem", FileSystem),
  ...namespaceTypes("Form", "@deepthroat/schema/form", Form),
  ...namespaceTypes("Instruction", "@deepthroat/schema/instruction", Instruction),
  ...namespaceTypes("InstructionEntry", "@deepthroat/schema/instruction-entry", InstructionEntry),
  ...namespaceTypes("Integration", "@deepthroat/schema/integration", Integration),
  typeReference("Location.PublicRef", "@deepthroat/schema/location", Location.PublicRef),
  typeReference("Location.PublicInfo", "@deepthroat/schema/location", Location.PublicInfo),
  ...namespaceTypes("Mcp", "@deepthroat/schema/mcp", Mcp),
  ...namespaceTypes("Model", "@deepthroat/schema/model", Model),
  ...namespaceTypes("Money", "@deepthroat/schema/money", Money),
  ...namespaceTypes("Permission", "@deepthroat/schema/permission", Permission),
  ...namespaceTypes("PermissionSaved", "@deepthroat/schema/permission-saved", PermissionSaved),
  ...namespaceTypes("Plugin", "@deepthroat/schema/plugin", Plugin),
  ...namespaceTypes("Project", "@deepthroat/schema/project", Project),
  ...namespaceTypes("Worktree", "@deepthroat/schema/worktree", Worktree),
  ...namespaceTypes("PromptInput", "@deepthroat/schema/prompt-input", PromptInput),
  ...namespaceTypes("Provider", "@deepthroat/schema/provider", Provider),
  ...namespaceTypes("Pty", "@deepthroat/schema/pty", Pty),
  ...namespaceTypes("PtyTicket", "@deepthroat/schema/pty-ticket", PtyTicket),
  ...namespaceTypes("Question", "@deepthroat/schema/question", Question),
  ...namespaceTypes("Reference", "@deepthroat/schema/reference", Reference),
  ...namespaceTypes("Session", "@deepthroat/schema/session", Session),
  ...namespaceTypes("SessionMessage", "@deepthroat/schema/session-message", SessionMessage),
  ...namespaceTypes("SessionInbox", "@deepthroat/schema/session-inbox", SessionInbox),
  ...namespaceTypes("Shell", "@deepthroat/schema/shell", Shell),
  ...namespaceTypes("Skill", "@deepthroat/schema/skill", Skill),
  ...namespaceTypes("Snapshot", "@deepthroat/schema/snapshot", Snapshot),
  ...namespaceTypes("Vcs", "@deepthroat/schema/vcs", Vcs),
  ...namespaceTypes("WebSearch", "@deepthroat/schema/websearch", WebSearch),
  ...namespaceTypes("Workspace", "@deepthroat/schema/workspace", Workspace),
  typeReference("Prompt", "@deepthroat/schema/prompt", Prompt),
  typeReference("PromptMention", "@deepthroat/schema/prompt", PromptMention),
  typeReference("FileAttachment", "@deepthroat/schema/prompt", FileAttachment),
  typeReference("AgentAttachment", "@deepthroat/schema/prompt", AgentAttachment),
  typeReference("AbsolutePath", "@deepthroat/schema/schema", AbsolutePath),
  typeReference("RelativePath", "@deepthroat/schema/schema", RelativePath),
]

await Effect.runPromise(
  Effect.all(
    [
      write(
        emitPromise(promiseContract, {
          mutableOutputs: true,
        }),
        fileURLToPath(new URL("../src/promise/generated", import.meta.url)),
      ),
      write(
        emitEffectImported(effectContract, {
          module: "../../contract",
          api: "ClientApi",
          shapeModule: "../api/api.js",
        }),
        fileURLToPath(new URL("../src/effect/generated", import.meta.url)),
      ),
      write(
        emitEffectShape(effectContract, {
          typeReferences: effectTypeReferences,
          outputTypes: {
            "event.subscribe": {
              name: "deepthroatevent",
              import: 'import type { deepthroatevent } from "@deepthroat/protocol/groups/event"',
            },
          },
        }),
        fileURLToPath(new URL("../src/effect/api", import.meta.url)),
      ),
    ],
    { concurrency: 3, discard: true },
  ).pipe(Effect.provide(NodeFileSystem.layer)),
)

function namespaceTypes(namespace: string, module: string, values: object) {
  return Object.entries(values).flatMap(([name, schema]) =>
    Schema.isSchema(schema) ? [typeReference(`${namespace}.${name}`, module, schema)] : [],
  )
}

function typeReference(name: string, module: string, schema: Schema.Top) {
  return {
    schema,
    name,
    import: `import type { ${name.split(".")[0]} } from ${JSON.stringify(module)}`,
  }
}
