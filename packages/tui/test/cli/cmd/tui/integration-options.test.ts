import { describe, expect, test } from "bun:test"
import type { IntegrationInfo } from "@deepthroat/client"
import {
  connectionSummary,
  connectmethods,
  credentialConnections,
  integrationoptions,
} from "../../../../src/component/dialog-integration"

const integration = (value: Partial<IntegrationInfo> & Pick<IntegrationInfo, "id" | "name">): IntegrationInfo => ({
  methods: [],
  connections: [],
  ...value,
})

describe("integrationoptions", () => {
  test("shows DeepThroat and MCP tools without external inference providers", () => {
    expect(integrationoptions([
      integration({ id: "openai", name: "OpenAI" }),
      integration({ id: "custom", name: "Custom" }),
      integration({ id: "linear", name: "Linear", metadata: { source: "mcp" } }),
      integration({ id: "deepthroat", name: "DeepThroat" }),
      integration({ id: "github", name: "GitHub", metadata: { source: "mcp" } }),
    ]).map((item) => item.id)).toEqual(["deepthroat", "github", "linear"])
  })
})

describe("connectmethods", () => {
  test("DeepThroat permits only website sign-in", () => {
    expect(connectmethods(integration({ id: "deepthroat", name: "DeepThroat", methods: [
      { type: "key", label: "API key" },
      { type: "oauth", id: "other", label: "Other" },
      { type: "oauth", id: "deepthroat-website", label: "Continue with website" },
    ] })).map((method) => method.type === "key" ? "key" : method.id)).toEqual(["deepthroat-website"])
  })
  test("MCP authentication remains available", () => {
    expect(connectmethods(integration({ id: "github", name: "GitHub", metadata: { source: "mcp" }, methods: [
      { type: "env", names: ["MCP_TOKEN"] },
      { type: "key", label: "Access token" },
      { type: "oauth", id: "account", label: "Account" },
    ] })).map((method) => method.type)).toEqual(["oauth", "key"])
  })
  test("unregistered inference integrations cannot offer manual keys", () => {
    expect(connectmethods(integration({ id: "other", name: "Other", methods: [{ type: "key" }] }))).toEqual([])
  })
})

describe("credentialConnections", () => {
  test("returns removable credential connections only", () => {
    expect(
      credentialConnections(
        integration({
          id: "example",
          name: "Example",
          connections: [
            { type: "env", name: "EXAMPLE_KEY" },
            { type: "credential", method: "key", id: "cred_1", label: "Work" },
          ],
        }),
      ),
    ).toEqual([{ type: "credential", method: "key", id: "cred_1", label: "Work" }])
  })
})

describe("connectionSummary", () => {
  test("counts several connections", () => {
    expect(
      connectionSummary(
        integration({
          id: "example",
          name: "Example",
          connections: [
            { type: "credential", method: "key", id: "cred_1", label: "Work" },
            { type: "env", name: "EXAMPLE_KEY" },
          ],
        }),
      ),
    ).toBe("2 connections")
  })
})
