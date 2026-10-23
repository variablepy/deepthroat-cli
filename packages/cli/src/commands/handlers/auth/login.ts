import { intro, log, outro, spinner, text } from "@clack/prompts"
import { Effect, Option } from "effect"
import type { FormAnswer, IntegrationInfo, DeepThroatClient } from "@deepthroat/client"
import { Commands } from "../../commands"
import { Runtime } from "../../../framework/runtime"
import type { IntegrationChoice } from "../../../ui/integration-picker"
import { handlePromptErrors, openUrl, prompt, requireInteractive } from "../../../ui/prompt"
import { answerForm } from "./form"
import { createClient, loadIntegrations, location, request, resolveIntegration, type ConnectMethod } from "./shared"

export default Runtime.handler(
  Commands.commands.auth.commands.login,
  Effect.fn("cli.auth.login")((input) => login({
    target: Option.getOrUndefined(input.target) || "deepthroat",
    method: Option.getOrUndefined(input.method),
    answer: input.answer,
    server: Option.getOrUndefined(input.server),
    standalone: input.standalone,
  }).pipe(handlePromptErrors)),
)

const login = Effect.fn("cli.auth.login.run")(function* (input: {
  target: string
  method?: string
  answer?: ReadonlyArray<string>
  server?: string
  standalone: boolean
}) {
  if (input.target.toLowerCase() !== "deepthroat") return yield* Effect.fail(new Error("Sign in with your DeepThroat website account. External inference providers and manual keys are not supported."))
  intro("Connect your DeepThroat account")
  const client = yield* createClient({ server: input.server, standalone: input.standalone })
  const integrations = yield* loadIntegrations(client)
  if (!loginchoices(integrations).length) return yield* Effect.fail(new Error("DeepThroat website sign-in is unavailable. Restart the CLI and try again."))
  const integration = yield* resolveIntegration(integrations, "deepthroat")
  const method = integration.methods.find((method) => method.type === "oauth" && method.id === "deepthroat-website")
  if (!method || method.type !== "oauth") return yield* Effect.fail(new Error("DeepThroat website sign-in is unavailable."))
  if (input.method && ![method.id, method.label.toLowerCase()].includes(input.method.toLowerCase())) return yield* Effect.fail(new Error("Use the deepthroat-website sign-in method."))
  const answer = yield* answerForm(method.form, input.answer)
  yield* oauthlogin(client, integration, method, answer)
  outro("Connected to DeepThroat")
})

export function loginchoices(integrations: IntegrationInfo[]): IntegrationChoice[] {
  return integrations.filter((integration) => integration.id === "deepthroat" && integration.methods.some((method) => method.type === "oauth" && method.id === "deepthroat-website")).map((integration) => ({ value: integration.id, label: "DeepThroat", category: "Account", connected: integration.connections.length > 0 }))
}

export const oauthlogin = Effect.fn("cli.auth.login.oauth")(function* (
  client: DeepThroatClient,
  integration: IntegrationInfo,
  method: Extract<ConnectMethod, { type: "oauth" }>,
  answer?: FormAnswer,
  label?: string,
) {
  const progress = spinner()
  progress.start("Starting authorization...")
  const started = yield* request((signal) =>
    client.integration.oauth.connect(
      { integrationID: integration.id, methodID: method.id, answer, label, location },
      { signal },
    ),
  ).pipe(Effect.tapCause(() => Effect.sync(() => progress.stop("Authentication failed", 1))))
  const attempt = started.data
  yield* Effect.addFinalizer(() =>
    request(() =>
      client.integration.oauth.cancel(
        { integrationID: integration.id, attemptID: attempt.attemptID, location },
        { signal: AbortSignal.timeout(5_000) },
      ),
    ).pipe(Effect.ignore),
  )
  progress.stop("Authorization started")
  log.info(attempt.instructions)
  log.info(attempt.url)
  if (process.stdin.isTTY && process.stdout.isTTY) yield* openUrl(attempt.url)

  if (attempt.mode === "code") {
    yield* requireInteractive("This login requires an interactive terminal to enter the authorization code")
    const code = yield* prompt<string>(() =>
      text({ message: "Paste the authorization code", validate: (value) => (!value ? "Required" : undefined) }),
    )
    const completing = spinner()
    completing.start("Completing authorization...")
    yield* request((signal) =>
      client.integration.oauth.complete(
        { integrationID: integration.id, attemptID: attempt.attemptID, code, location },
        { signal },
      ),
    ).pipe(
      Effect.tap(() => Effect.sync(() => completing.stop(`Connected to ${integration.name}`))),
      Effect.tapCause(() => Effect.sync(() => completing.stop("Authentication failed", 1))),
    )
    return
  }

  // Clack's spinner captures Ctrl+C and exits the process directly, which would skip the finalizer that
  // cancels the attempt. Waits that can last minutes use plain log lines so Ctrl+C interrupts normally.
  log.step("Waiting for authorization...")
  const status = yield* waitforoauth(client, integration.id, attempt.attemptID)
  if (status.status === "complete") {
    log.success(`Connected to ${integration.name}`)
    return
  }
  if (status.status === "failed") yield* Effect.fail(new Error(status.message))
  yield* Effect.fail(new Error("Authorization expired"))
})

const waitforoauth = Effect.fn("cli.auth.login.oauth.wait")(function* (
  client: DeepThroatClient,
  integrationID: string,
  attemptID: string,
) {
  while (true) {
    const response = yield* request((signal) =>
      client.integration.oauth.status({ integrationID, attemptID, location }, { signal }),
    )
    if (response.data.status !== "pending") return response.data
    yield* Effect.sleep(500)
  }
})

