import { describe, expect } from "bun:test"
import { Effect, Layer } from "effect"
import { Database } from "@deepthroat/core/database/database"
import { AppNodeBuilder } from "@deepthroat/core/effect/app-node-builder"
import { LayerNode } from "@deepthroat/util/effect/layer-node"
import { Bus } from "@deepthroat/core/bus"
import { Location } from "@deepthroat/core/location"
import { Project } from "@deepthroat/core/project"
import { AbsolutePath } from "@deepthroat/core/schema"
import { Session } from "@deepthroat/core/session"
import { SessionProjector } from "@deepthroat/core/session/projector"
import { SessionExecution } from "@deepthroat/core/session/execution"
import { SessionStore } from "@deepthroat/core/session/store"
import { testEffect } from "./lib/effect"
import { globalProjectNode } from "./lib/project"

const location = Location.Ref.make({ directory: AbsolutePath.make("/project") })
const awaited: Session.ID[] = []
const execution = Layer.mock(SessionExecution.Service, {
  awaitIdle: (sessionID) => Effect.sync(() => awaited.push(sessionID)),
})
const it = testEffect(
  AppNodeBuilder.build(
    LayerNode.group([Database.node, Bus.node, SessionProjector.node, SessionStore.node, Session.node]),
    [Project.node.replace(globalProjectNode), SessionExecution.node.replace(execution)],
  ),
)

describe("Session.wait", () => {
  it.effect("delegates to SessionExecution.awaitIdle", () =>
    Effect.gen(function* () {
      awaited.length = 0
      const sessions = yield* Session.Service
      const session = yield* sessions.create({ location })

      yield* sessions.wait(session.id)

      expect(awaited).toEqual([session.id])
    }),
  )
})
