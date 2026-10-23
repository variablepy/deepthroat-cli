export const available = true

export async function resolveBinary() {
  return process.env.DEEPTHROAT_PTY_BIN || "deepthroat-pty"
}
