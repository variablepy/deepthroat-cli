import { define } from "@deepthroat/plugin/effect/plugin"
import { Integration } from "@deepthroat/schema/integration"
import { Effect, Schema } from "effect"
import { FetchHttpClient, HttpClient, HttpClientRequest } from "effect/http"
import { collectBoundedResponseBody } from "../../tool/http-body.js"

export const endpoint = "https://api.cheapai.gay/v1/search"
const method = Integration.MethodID.make("deepthroat-website")
const response = Schema.fromJsonString(Schema.Struct({ sources: Schema.Array(Schema.Struct({
  url: Schema.String,
  title: Schema.String,
  snippet: Schema.String,
  published: Schema.optional(Schema.String),
})) }))

export const search = (http: HttpClient.HttpClient, token: string, query: string) => Effect.scoped(Effect.gen(function* () {
  if (!query.trim() || query.trim().length > 500) return yield* Effect.fail(new Error("Search queries must contain 1 to 500 characters."))
  const request = yield* HttpClientRequest.post(endpoint).pipe(
    HttpClientRequest.bearerToken(token),
    HttpClientRequest.acceptJson,
    HttpClientRequest.bodyJson({ query: query.trim(), max_results: 8 }),
  )
  const result = yield* HttpClient.filterStatusOk(http).execute(request)
  const body = yield* collectBoundedResponseBody(result, 1048576, () => new Error("Search response exceeded its size limit."))
  const decoded = yield* Schema.decodeUnknownEffect(response)(body.toString("utf8"))
  return decoded.sources.map(item => {
    const published = item.published ? Date.parse(item.published) : NaN
    return { url: item.url, title: item.title, content: item.snippet, time: Number.isFinite(published) ? { published } : {} }
  })
})).pipe(
  Effect.provideService(FetchHttpClient.RequestInit, { redirect: "error" }),
  Effect.timeout("30 seconds"),
  Effect.mapError(() => new Error("DeepThroat web search could not complete. Check your connection and try again shortly.")),
)

export const searchplugin = define({
  id: "deepthroat.websearch.account",
  effect: Effect.fn(function* (ctx) {
    const http = yield* HttpClient.HttpClient
    yield* ctx.websearch.transform(editor => editor.add({
      id: "deepthroat",
      name: "DeepThroat",
      execute: input => Effect.gen(function* () {
        const connection = yield* ctx.integration.connection.active("deepthroat")
        const credential = connection ? yield* ctx.integration.connection.resolve(connection) : undefined
        if (credential?.type !== "oauth" || credential.methodID !== method) return yield* Effect.fail(new Error("Sign in through your DeepThroat website account to use web search."))
        return yield* search(http, credential.access, input.query)
      }),
    }))
  }),
})
