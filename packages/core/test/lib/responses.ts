import { OpenAIResponses } from "@deepthroat/ai/protocols/openai-responses"
import { AuthOptions } from "@deepthroat/ai/route/auth-options"
import type { OpenAIProviderOptionsInput } from "@deepthroat/ai/providers/openai-options"

export * as responsesfixture from "./responses"

type settings = { apiKey?: string; baseURL?: string; headers?: Record<string, string>; providerOptions?: OpenAIProviderOptionsInput };

export function configure(input: settings = {}) {
  const endpoint = input.baseURL || "http://127.0.0.1:1/v1"
  if (!["127.0.0.1", "localhost", "[::1]"].includes(new URL(endpoint).hostname)) throw new Error("Transport fixtures only connect to loopback servers.")
  const route = OpenAIResponses.route.with({
    endpoint: { baseURL: endpoint },
    auth: AuthOptions.bearer({ apiKey: input.apiKey }, []),
    headers: input.headers,
    providerOptions: input.providerOptions,
  })
  return { responses: (id: string) => route.model<OpenAIProviderOptionsInput>({ id }) }
}

export const responses = (id: string) => configure().responses(id)
