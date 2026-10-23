import { Plugin } from "@deepthroat/plugin/tui"
import { createMermaidCodeBlockRenderer } from "./markdown.js"
import { resolvedeepthroatdiagrampalette } from "./palette.js"

export default Plugin.define({
  id: "deepthroat.merman",
  setup(context) {
    context.markdown.registerCodeBlockRenderer(
      "mermaid",
      createMermaidCodeBlockRenderer(context.renderer, () => ({
        colors: resolvedeepthroatdiagrampalette(context.theme, context.themeMode),
      })),
    )
  },
})
