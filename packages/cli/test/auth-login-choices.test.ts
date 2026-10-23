import { expect, test } from "bun:test"
import type { IntegrationInfo } from "@deepthroat/client"
import { loginchoices } from "../src/commands/handlers/auth/login"

const integration = (value: Partial<IntegrationInfo> & Pick<IntegrationInfo, "id" | "name">): IntegrationInfo => ({ methods: [{ type: "key" }], connections: [], ...value })

test("account login exposes only DeepThroat website authentication", () => {
  const account = integration({ id: "deepthroat", name: "DeepThroat", methods: [{ type: "oauth", id: "deepthroat-website", label: "Continue with website" }] })
  expect(loginchoices([
    integration({ id: "openai", name: "OpenAI" }),
    integration({ id: "custom", name: "Custom" }),
    integration({ id: "github", name: "GitHub", metadata: { source: "mcp" } }),
    account,
  ])).toEqual([{ value: "deepthroat", label: "DeepThroat", category: "Account", connected: false }])
})

test("manual key and unrelated OAuth methods cannot enable account login", () => {
  expect(loginchoices([integration({ id: "deepthroat", name: "DeepThroat" })])).toEqual([])
  expect(loginchoices([integration({ id: "deepthroat", name: "DeepThroat", methods: [{ type: "oauth", id: "other", label: "Other" }] })])).toEqual([])
})
