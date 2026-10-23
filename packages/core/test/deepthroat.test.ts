import { expect, test } from "bun:test"
import { Effect } from "effect"
import { configure, endpoint } from "@deepthroat/ai/providers/deepthroat"
import { Credential } from "@deepthroat/core/credential"
import { Integration } from "@deepthroat/core/integration"
import { Model } from "@deepthroat/core/model"
import { ModelResolver } from "@deepthroat/core/model-resolver"
import { Provider } from "@deepthroat/core/provider"
import { it } from "./lib/effect"

function account(): Credential.OAuth {
  return { type: "oauth", methodID: Integration.MethodID.make("deepthroat-website"), access: "sk-hydro-test-only", refresh: "", expires: Number.MAX_SAFE_INTEGER }
}

function model(): Model.Info {
  return { ...Model.Info.default(Provider.ID.make("deepthroat"), Model.ID.make("gpt-6-sol")), package: "@deepthroat/ai/providers/deepthroat", settings: { baseURL: endpoint } }
}

test("the adapter pins the DeepThroat inference origin", () => {
  const resolved = configure({ apiKey: "sk-hydro-test-only" }).model("gpt-6-sol")
  expect(resolved.route.endpoint.baseURL).toBe(endpoint)
  expect(String(resolved.provider)).toBe("deepthroat")
  expect(() => configure({ apiKey: "sk-hydro-test-only", baseURL: "https://example.com/v1" })).toThrow("only connects")
})

it.effect("website accounts construct models without contacting a provider", () => Effect.gen(function* () {
  const resolved = yield* ModelResolver.fromCatalogModel(model(), account())
  expect(resolved.route.endpoint.baseURL).toBe(endpoint)
  expect(String(resolved.provider)).toBe("deepthroat")
}))

it.effect("manual keys cannot substitute for website sign-in", () => Effect.gen(function* () {
  const error = yield* ModelResolver.fromCatalogModel(model(), { type: "key", key: "sk-hydro-manual" }).pipe(Effect.flip)
  expect(error).toBeInstanceOf(ModelResolver.ModelConfigurationError)
}))

it.effect("external providers and alternate API packages are rejected", () => Effect.gen(function* () {
  for (const candidate of [
    { ...model(), providerID: Provider.ID.make("openai") },
    { ...model(), package: "@deepthroat/ai/providers/openai-compatible" },
    { ...model(), settings: { baseURL: "https://example.com/v1" } },
  ]) {
    const error = yield* ModelResolver.fromCatalogModel(candidate, account()).pipe(Effect.flip)
    expect(error).toBeInstanceOf(ModelResolver.ModelConfigurationError)
  }
}))

it.effect("sign-in from another provider cannot authorize the gateway", () => Effect.gen(function* () {
  const error = yield* ModelResolver.fromCatalogModel(model(), { ...account(), methodID: Integration.MethodID.make("external-account") }).pipe(Effect.flip)
  expect(error).toBeInstanceOf(ModelResolver.ModelConfigurationError)
}))
