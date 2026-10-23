import { expect, test } from "bun:test"
import { Effect } from "effect"
import { LLM, LLMClient } from "../src/index.js"
import { configure, endpoint } from "../src/providers/deepthroat.js"
import { dynamicResponse } from "./lib/http.js"
import { deltaChunk, finishChunk, usageChunk } from "./lib/openai-chunks.js"
import { sseEvents } from "./lib/sse.js"
import { it } from "./lib/effect.js"

test("the inference provider catalog exposes only DeepThroat", async () => {
  expect(Object.keys(await import("../src/providers.js"))).toEqual(["deepthroat"])
  expect(() => configure({ baseURL: "https://example.com/v1" })).toThrow("only connects")
})

it.effect("gateway requests preserve tools and actual usage without putting credentials in the body", () => Effect.gen(function* () {
  const model = configure({ apiKey: "account-fixture-secret" }).model("gpt-6.1-sol")
  const request = LLM.request({ model, prompt: "Read the project", tools: [{ name: "readfile", description: "Read a project file", inputSchema: { type: "object", properties: { path: { type: "string" } }, required: ["path"] } }] })
  const server = dynamicResponse((input) => Effect.sync(() => {
    expect(input.request.url).toBe(`${endpoint}/chat/completions`)
    expect(input.request.headers.authorization).toBe("Bearer account-fixture-secret")
    const body = JSON.parse(input.text)
    expect(body.model).toBe("gpt-6.1-sol")
    expect(body.tools[0].function.name).toBe("readfile")
    expect(input.text).not.toContain("account-fixture-secret")
    return input.respond(sseEvents(deltaChunk({ role: "assistant", content: "Ready" }), finishChunk("stop"), usageChunk({ prompt_tokens: 15, completion_tokens: 3, total_tokens: 18 })), { headers: { "content-type": "text/event-stream" } })
  }))
  const response = yield* LLMClient.generate(request).pipe(Effect.provide(server))
  expect(response.text).toBe("Ready")
  expect(response.usage?.inputTokens).toBe(15)
  expect(response.usage?.outputTokens).toBe(3)
}))
