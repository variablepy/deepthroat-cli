import { LLM } from "../src/index.js"
import { configure } from "../src/providers/deepthroat.js"

const model = configure({ apiKey: "account-fixture", baseURL: "https://api.cheapai.gay/v1" }).model("gpt-6.1-sol")
const request = LLM.request({ model, prompt: "Hello", providerOptions: { reasoningEffort: "high" } })
void request
