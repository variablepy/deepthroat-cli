// TODO: Keep additional network capabilities inside Schema and Protocol as the client grows; /effect must never import
// Core or Server. Preserve these datatype exports so internal model reorganizations do not require caller migrations.
import type { Effect } from "effect"
import type { deepthroat } from "./client.js"

export * from "./generated/index"
export { deepthroat } from "./client.js"
export type {
  AgentApi,
  AppApi,
  CommandApi,
  ConfigApi,
  EventApi,
  IntegrationApi,
  ModelApi,
  PluginApi,
  ProviderApi,
  ReferenceApi,
  RpcApi,
  RpcClient,
  WebSearchApi,
  SessionApi,
  SkillApi,
} from "./api.js"
export { Agent } from "@deepthroat/schema/agent"
export { Command } from "@deepthroat/schema/command"
export { Config } from "@deepthroat/schema/config"
export { Credential } from "@deepthroat/schema/credential"
export { Event } from "@deepthroat/schema/event"
export { EventLog } from "@deepthroat/schema/event-log"
export { FileSystem } from "@deepthroat/schema/filesystem"
export { Form } from "@deepthroat/schema/form"
export { Integration } from "@deepthroat/schema/integration"
export { Location } from "@deepthroat/schema/location"
export { Model } from "@deepthroat/schema/model"
export { Permission } from "@deepthroat/schema/permission"
export { PermissionSaved } from "@deepthroat/schema/permission-saved"
export { Project } from "@deepthroat/schema/project"
export { Worktree } from "@deepthroat/schema/worktree"
export { Vcs } from "@deepthroat/schema/vcs"
export { Provider } from "@deepthroat/schema/provider"
export { Pty } from "@deepthroat/schema/pty"
export { Question } from "@deepthroat/schema/question"
export { Reference } from "@deepthroat/schema/reference"
export { WebSearch } from "@deepthroat/schema/websearch"
export { AbsolutePath, RelativePath } from "@deepthroat/schema/schema"
export { Session } from "@deepthroat/schema/session"
export { SessionInbox } from "@deepthroat/schema/session-inbox"
export { SessionMessage } from "@deepthroat/schema/session-message"
export { Skill } from "@deepthroat/schema/skill"
export { Prompt } from "@deepthroat/schema/prompt"
export { PromptInput } from "@deepthroat/schema/prompt-input"
export type { deepthroatevent } from "@deepthroat/protocol/groups/event"
export type DeepThroatClient = Effect.Success<ReturnType<typeof deepthroat.make>>
