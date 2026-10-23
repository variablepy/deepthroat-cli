import type { deepthroat } from "./client.js"

export * from "./generated/index.js"
export { deepthroat } from "./client.js"
export type {
  AgentApi,
  CommandApi,
  ConfigApi,
  EventApi,
  IntegrationApi,
  ModelApi,
  PluginApi,
  ProviderApi,
  ReferenceApi,
  RpcApi,
  RpcCallOptions,
  RpcClient,
  RpcEventPayload,
  WebSearchApi,
  SessionApi,
  SkillApi,
} from "./api.js"
export type { EventSubscribeOutput as deepthroatevent } from "./generated/types.js"
export type DeepThroatClient = ReturnType<typeof deepthroat.make>
