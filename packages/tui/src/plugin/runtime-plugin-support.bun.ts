import { ensurePluginRuntime, provides } from "@deepthroat/plugin/runtime"
import { Plugin, PluginContextProvider, usePlugin } from "@deepthroat/plugin/tui"
import { ensureRuntimePluginSupport } from "@opentui/solid/runtime-plugin-support/configure"

ensurePluginRuntime()
ensureRuntimePluginSupport({
  additional: {
    "@deepthroat/plugin/tui": { Plugin, PluginContextProvider, usePlugin },
  },
  preserve: provides,
})
