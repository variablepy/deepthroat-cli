import { expect, test } from "bun:test"
import { Env } from "../src/env"

test("session environment omits server credentials", () => {
  const previousPassword = process.env.DEEPTHROAT_PASSWORD
  const previousLegacyPassword = process.env.DEEPTHROAT_SERVER_PASSWORD
  const previousValue = process.env.DEEPTHROAT_SESSION_ENV_TEST
  process.env.DEEPTHROAT_PASSWORD = "password"
  process.env.DEEPTHROAT_SERVER_PASSWORD = "legacy"
  process.env.DEEPTHROAT_SESSION_ENV_TEST = "included"

  const environment = Env.session()

  if (previousPassword === undefined) delete process.env.DEEPTHROAT_PASSWORD
  else process.env.DEEPTHROAT_PASSWORD = previousPassword
  if (previousLegacyPassword === undefined) delete process.env.DEEPTHROAT_SERVER_PASSWORD
  else process.env.DEEPTHROAT_SERVER_PASSWORD = previousLegacyPassword
  if (previousValue === undefined) delete process.env.DEEPTHROAT_SESSION_ENV_TEST
  else process.env.DEEPTHROAT_SESSION_ENV_TEST = previousValue

  expect(environment.DEEPTHROAT_PASSWORD).toBeUndefined()
  expect(environment.DEEPTHROAT_SERVER_PASSWORD).toBeUndefined()
  expect(environment.DEEPTHROAT_SESSION_ENV_TEST).toBe("included")
})
