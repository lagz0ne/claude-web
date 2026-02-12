import { atom } from "@pumped-fn/lite"
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from "fs"
import { join, dirname } from "path"
import { pathsAtom } from "./paths"
import type { AppConfig, PresetConfig, Workspace } from "../types"

type RawConfig = {
  port?: number
  baseDir?: string
  presets?: PresetConfig[]
}

export const configAtom = atom({
  deps: { paths: pathsAtom },
  factory: (_ctx, { paths }) => {
    let raw: RawConfig = {}
    try {
      raw = JSON.parse(readFileSync(paths.configPath, "utf-8"))
    } catch {
      // First run — create default config
      const defaultConfig: RawConfig = {
        port: 3111,
        baseDir: process.env.HOME || "~",
        presets: [],
      }
      mkdirSync(dirname(paths.configPath), { recursive: true })
      writeFileSync(paths.configPath, JSON.stringify(defaultConfig, null, 2))
      raw = defaultConfig
    }

    return {
      port: raw.port ?? (Number(process.env.PORT) || 3111),
      baseDir: raw.baseDir ?? process.cwd(),
      presets: raw.presets ?? [],
      dangerouslySkipPermissions: (raw as any).dangerouslySkipPermissions === true,
    } satisfies AppConfig
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
