import { expect, test } from "bun:test"
import { Effect } from "effect"
import { HttpClient, HttpClientResponse } from "effect/http"
import { endpoint, search } from "../../src/plugin/websearch/deepthroat"

test("account search sends only the query to our authenticated endpoint and preserves sources", async () => {
  const http = HttpClient.make(request => Effect.sync(() => {
    expect(request.url).toBe(endpoint)
    expect(request.headers.authorization).toBe("Bearer fixture-token")
    if (request.body._tag !== "Uint8Array") throw Error("Missing JSON request")
    expect(JSON.parse(new TextDecoder().decode(request.body.body))).toEqual({ query: "current releases", max_results: 8 })
    return HttpClientResponse.fromWeb(request, new Response(JSON.stringify({ sources: [{ url: "https://example.org/news", title: "Official release", snippet: "Verified release notes", published: "2026-10-24" }] })))
  }))
  const results = await Effect.runPromise(search(http, "fixture-token", " current releases "))
  expect(results).toEqual([{ url: "https://example.org/news", title: "Official release", content: "Verified release notes", time: { published: Date.parse("2026-10-24") } }])
})

test("search failures never expose account credentials or accept malformed results", async () => {
  for (const response of [new Response("private-token", { status: 401 }), new Response("broken json"), new Response('{"sources":[{}]}')]) {
    const http = HttpClient.make(request => Effect.succeed(HttpClientResponse.fromWeb(request, response)))
    await expect(Effect.runPromise(search(http, "private-token", "current releases"))).rejects.toThrow("DeepThroat web search could not complete")
  }
})
