import { atom } from "@pumped-fn/lite"
import { readFileSync, readdirSync, statSync } from "fs"
import { resolve, join } from "path"
import type { AppConfig, PresetConfig, Workspace } from "../types"

type RawConfig = {
  port?: number
  baseDir?: string
  presets?: PresetConfig[]
}

export const configAtom = atom({
  factory: () => {
    const configPath = resolve(process.cwd(), "..", "config.json")
    let raw: RawConfig = {}
    try {
      raw = JSON.parse(readFileSync(configPath, "utf-8"))
    } catch {
      // fall back to defaults
    }

    // Also try legacy presets.json
    if (!raw.baseDir && !raw.presets) {
      const presetsPath = resolve(process.cwd(), "..", "presets.json")
      try {
        const legacy = JSON.parse(readFileSync(presetsPath, "utf-8"))
        if (Array.isArray(legacy)) {
          raw.presets = legacy.map((p: any) => ({ name: p.name, prompt: p.description }))
          // Derive baseDir from first preset cwd
          if (legacy[0]?.cwd) {
            raw.baseDir = resolve(legacy[0].cwd, "..")
          }
        }
      } catch {
        // no config at all
      }
    }

    return {
      port: raw.port ?? (Number(process.env.PORT) || 3111),
      baseDir: raw.baseDir ?? process.cwd(),
      presets: raw.presets ?? [],
    }
  },
})

export function listWorkspaces(config: AppConfig): Workspace[] {
  const { baseDir, presets } = config

  let dirs: string[]
  try {
    dirs = readdirSync(baseDir).filter((name) => {
      if (name.startsWith(".")) return false
      try {
        return statSync(join(baseDir, name)).isDirectory()
      } catch {
        return false
      }
    })
  } catch {
    dirs = []
  }

  dirs.sort((a, b) => a.localeCompare(b))

  // Presets go first (in config order), then remaining dirs
  const result: Workspace[] = []
  const seen = new Set<string>()

  for (const p of presets) {
    if (dirs.includes(p.name)) {
      result.push({ name: p.name, cwd: join(baseDir, p.name), prompt: p.prompt })
      seen.add(p.name)
    }
  }

  for (const name of dirs) {
    if (!seen.has(name)) {
      result.push({ name, cwd: join(baseDir, name) })
    }
  }

  return result
}
