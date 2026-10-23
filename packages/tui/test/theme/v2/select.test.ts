import { expect, test } from "bun:test"
import { selectTheme, selectThemeMode, supportsThemeMode, themeModes } from "@deepthroat/theme/tui"
import { getdeepthroattheme } from "../../../src/theme"

test("selects complete light and dark themes independently", () => {
  const light = selectTheme(getdeepthroattheme(), "light")
  const dark = selectTheme(getdeepthroattheme(), "dark")
  expect(selectTheme(getdeepthroattheme())).toEqual(light)
  expect(light.hue).toEqual(getdeepthroattheme().light.hue)
  expect(dark.text).toEqual(getdeepthroattheme().base.text)
  expect(dark.hue).toEqual(getdeepthroattheme().dark.hue)
  expect(selectThemeMode(getdeepthroattheme(), "dark")).toEqual({ theme: dark, mode: "dark" })
})

test("selects the available mode when the requested mode is missing", () => {
  const lightOnly = { base: getdeepthroattheme().base, light: getdeepthroattheme().light } as const
  const darkOnly = { base: getdeepthroattheme().base, dark: getdeepthroattheme().dark } as const

  expect(themeModes(lightOnly)).toEqual(["light"])
  expect(themeModes(darkOnly)).toEqual(["dark"])
  expect(supportsThemeMode(lightOnly, "light")).toBeTrue()
  expect(supportsThemeMode(lightOnly, "dark")).toBeFalse()
  expect(selectThemeMode(lightOnly, "dark")).toEqual({ theme: selectTheme(getdeepthroattheme(), "light"), mode: "light" })
  expect(selectThemeMode(darkOnly, "light")).toEqual({ theme: selectTheme(getdeepthroattheme(), "dark"), mode: "dark" })
})
