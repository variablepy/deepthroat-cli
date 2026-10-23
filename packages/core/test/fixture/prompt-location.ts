import type { FileSystem } from "@deepthroat/core/filesystem"
import { Bus } from "@deepthroat/core/bus"
import { Image } from "@deepthroat/core/image"
import { LocationServiceMap } from "@deepthroat/core/location-service-map"
import type { LocationServices } from "@deepthroat/core/location-services"
import { Plugin } from "@deepthroat/core/plugin"
import { PluginHooks } from "@deepthroat/core/plugin/hooks"
import { Skill } from "@deepthroat/core/skill"
import type { Location } from "@deepthroat/schema/location"
import { makeGlobalNode } from "@deepthroat/util/effect/app-node"
import { LayerNode } from "@deepthroat/util/effect/layer-node"
import { Effect, Layer, LayerMap } from "effect"

// Plain-prompt unit fixtures use virtual directories.
export const promptLocationNode = makeGlobalNode({
  service: LocationServiceMap.Service,
  layer: Layer.effect(
    LocationServiceMap.Service,
    Effect.gen(function* () {
      const bus = yield* Bus.Service
      return yield* LayerMap.make(
        (_ref: Location.Ref) =>
          LayerNode.compile(LayerNode.group([PluginHooks.node, Image.node, Skill.node, Plugin.node]), {
            replacements: [
              Bus.node.replace(Layer.succeed(Bus.Service, bus)),
              Plugin.node.replace(Layer.mock(Plugin.Service, { awaitActivation: Effect.void })),
            ],
          }) as unknown as Layer.Layer<LocationServices, FileSystem.DirectoryNotFoundError>,
      )
    }),
  ),
  deps: [Bus.node],
})
