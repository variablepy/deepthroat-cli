import { Schema } from "effect"
import { ThemeDocument } from "../src/tui/schema.js"

const document = Schema.toJsonSchemaDocument(ThemeDocument)
const schema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://raw.githubusercontent.com/variablepy/deepthroat-cli/deepthroat/packages/theme/tui.schema.json",
  ...document.schema,
  ...(Object.keys(document.definitions).length ? { $defs: document.definitions } : {}),
}
await Bun.write(new URL("../tui.schema.json", import.meta.url), JSON.stringify(schema, null, 2) + "\n")
