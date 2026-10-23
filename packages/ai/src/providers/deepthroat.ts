import { ProviderID, type ModelID } from "../schema/index.js"
import { OpenAICompatibleChat } from "../protocols/openai-compatible-chat.js"
import { AuthOptions } from "../route/auth-options.js"
import type { ProviderPackage } from "../provider-package.js"
import type { OpenAIProviderOptionsInput } from "./openai-options.js"

export const id = ProviderID.make("deepthroat")
export const endpoint = "https://api.cheapai.gay/v1"

export type Settings = ProviderPackage.Settings & OpenAIProviderOptionsInput & { readonly apiKey?: string; readonly baseURL?: string }

export function configure(input: Settings) {
  if (input.baseURL !== undefined && input.baseURL !== endpoint) throw new Error("DeepThroat CLI only connects to the DeepThroat API.")
  const options = { ...input }
  delete options.apiKey
  delete options.baseURL
  const route = OpenAICompatibleChat.route.with({
    provider: "deepthroat",
    endpoint: { baseURL: endpoint },
    auth: AuthOptions.bearer({ apiKey: input.apiKey }, []),
    headers: { "User-Agent": "DeepThroatCLI", "X-DeepThroat-Client": "cli" },
    providerOptions: options,
  })
  return { id, model: (model: string | ModelID) => route.model<OpenAIProviderOptionsInput>({ id: model }), configure }
}

export const model: ProviderPackage.Definition<Settings, OpenAIProviderOptionsInput>["model"] = (model, settings) => configure(settings).model(model)
export const provider = { id, configure }
