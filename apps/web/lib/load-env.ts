import { loadEnvConfig } from "@next/env"

let envLoaded = false

export function ensureEnvLoaded() {
  if (envLoaded) {
    return
  }

  loadEnvConfig(process.cwd())
  envLoaded = true
}
