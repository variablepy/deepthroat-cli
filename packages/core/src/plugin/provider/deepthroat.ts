import { Effect, Schedule, Schema, Stream } from "effect"
import { FetchHttpClient, HttpClient, HttpClientRequest, HttpClientResponse } from "effect/http"
import { createHash, randomBytes } from "node:crypto"
import { define } from "@deepthroat/plugin/effect/plugin"
import { Money } from "@deepthroat/schema/money"
import { Integration } from "@deepthroat/schema/integration"
import { Model } from "../../model.js"
import { Provider } from "../../provider.js"

const origin = "https://api.cheapai.gay"
const method = Integration.MethodID.make("deepthroat-website")
const started = Schema.Struct({ requestid: Schema.String, code: Schema.String, expires: Schema.Number })
const exchanged = Schema.Struct({ status: Schema.String, key: Schema.optional(Schema.String), name: Schema.optional(Schema.String) })
const catalog = Schema.Struct({ data: Schema.Array(Schema.Struct({
  id: Schema.String,
  display_name: Schema.optional(Schema.String),
  context_length: Schema.optional(Schema.Number),
  vision: Schema.optional(Schema.Boolean),
  efforts: Schema.optional(Schema.Array(Schema.String)),
  pricing: Schema.optional(Schema.Struct({ prompt: Schema.Finite, completion: Schema.Finite, cached_prompt: Schema.optional(Schema.NullOr(Schema.Finite)) })),
})) })

export const deepthroatplugin = define({
  id: "deepthroat.account",
  effect: Effect.fn(function* (ctx) {
    const http = HttpClient.filterStatusOk(yield* HttpClient.HttpClient)
    const loaded = { models: [] as typeof catalog.Type.data }
    const post = <A, I>(path: string, body: object, schema: Schema.Codec<A, I>) => HttpClientRequest.post(`${origin}/web/desktop/${path}`).pipe(
      HttpClientRequest.bodyJson(body),
      Effect.flatMap(http.execute),
      Effect.flatMap(HttpClientResponse.schemaBodyJson(schema)),
      Effect.provideService(FetchHttpClient.RequestInit, { redirect: "error" }),
      Effect.timeout("20 seconds"),
    )
    yield* ctx.integration.transform((integrations) => {
      integrations.update("deepthroat", (integration) => { integration.name = "DeepThroat" })
      integrations.method.update({
        integrationID: "deepthroat",
        method: { id: method, type: "oauth", label: "Continue with DeepThroat website" },
        authorize: () => Effect.gen(function* () {
          const verifier = randomBytes(32).toString("hex")
          const challenge = createHash("sha256").update(verifier).digest("hex")
          const result = yield* post("start", { challenge }, started)
          if (!/^[a-zA-Z0-9_-]{43}$/.test(result.requestid)) return yield* Effect.fail(new Error("Invalid DeepThroat sign-in response."))
          return {
            mode: "auto" as const,
            url: `https://cheapai.gay/desktop/connect?request=${result.requestid}`,
            instructions: `Compare this code before approving: ${result.code}. Sign in and choose your DeepThroat account key.`,
            expiresAt: Date.now() + 300000,
            callback: Effect.gen(function* () {
              for (let attempt = 0; attempt < 100; attempt++) {
                const response = yield* post("exchange", { requestid: result.requestid, verifier }, exchanged)
                if (response.status === "pending") { yield* Effect.sleep("3 seconds"); continue }
                if (response.status !== "approved" || !response.key?.startsWith("sk-hydro-")) return yield* Effect.fail(new Error("DeepThroat sign-in was not approved. Start again."))
                return { type: "oauth" as const, methodID: method, access: response.key, refresh: "", expires: Number.MAX_SAFE_INTEGER, metadata: { name: response.name || "DeepThroat account" } }
              }
              return yield* Effect.fail(new Error("DeepThroat sign-in expired. Start again."))
            }),
          }
        }),
        label: (credential) => typeof credential.metadata?.name === "string" ? credential.metadata.name : "DeepThroat account",
      })
    })
    yield* ctx.provider.transform((providers) => {
      providers.update("deepthroat", (provider) => {
        provider.name = "DeepThroat"
        provider.package = "@deepthroat/ai/providers/deepthroat"
        provider.integrationID = Integration.ID.make("deepthroat")
        provider.activation = "auto"
        provider.settings = { baseURL: `${origin}/v1`, headerTimeout: 120000, chunkTimeout: 300000 }
      })
      providers.models.set("deepthroat", loaded.models.map((item) => ({
        ...Model.Info.default(Provider.ID.make("deepthroat"), Model.ID.make(item.id)),
        name: item.display_name || item.id,
        cost: item.pricing ? [{ input: Money.USDPerMillionTokens.make(Math.max(0, item.pricing.prompt)), output: Money.USDPerMillionTokens.make(Math.max(0, item.pricing.completion)), cache: { read: Money.USDPerMillionTokens.make(Math.max(0, item.pricing.cached_prompt ?? item.pricing.prompt)), write: Money.USDPerMillionTokens.make(Math.max(0, item.pricing.prompt)) } }] : [],
        capabilities: { tools: true, input: item.vision ? ["text", "image"] : ["text"], output: ["text"] },
        compatibility: { reasoningField: "reasoning_content" as const, streamUsage: true },
        limit: { context: item.context_length || 128000, output: 32000 },
        variants: (item.efforts || []).map((effort) => ({ id: Model.VariantID.make(effort), settings: { reasoningEffort: effort } })),
      })))
    })
    const refresh = Effect.fn(function* () {
      const connection = yield* ctx.integration.connection.active("deepthroat")
      const credential = connection ? yield* ctx.integration.connection.resolve(connection) : undefined
      if (credential?.type !== "oauth" || credential.methodID !== method) {
        loaded.models = []
        yield* ctx.provider.reload()
        return
      }
      const response = yield* http.execute(HttpClientRequest.get(`${origin}/v1/models`).pipe(HttpClientRequest.bearerToken(credential.access)))
      loaded.models = (yield* HttpClientResponse.schemaBodyJson(catalog)(response)).data
      yield* ctx.provider.reload()
    })
    yield* refresh().pipe(Effect.catch(() => Effect.void))
    yield* ctx.event.subscribe().pipe(
      Stream.filter((event) => event.type === "credential.updated" || event.type === "credential.switched"),
      Stream.runForEach(() => refresh().pipe(Effect.catch(() => Effect.void))),
      Effect.forkScoped,
    )
    yield* refresh().pipe(Effect.catch(() => Effect.void), Effect.repeat(Schedule.spaced("5 minutes")), Effect.forkScoped)
  }),
})
