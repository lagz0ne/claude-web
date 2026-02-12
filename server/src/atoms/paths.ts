import { atom } from "@pumped-fn/lite"
import { join } from "path"
import { homedir } from "os"

export type AppPaths = {
  configPath: string
  dataDir: string
}

export const pathsAtom = atom<AppPaths>({
  factory: () => ({
    configPath: join(
      process.env.XDG_CONFIG_HOME || join(homedir(), ".config"),
      "claude-ui",
      "config.json"
    ),
    dataDir: join(
      process.env.XDG_DATA_HOME || join(homedir(), ".local", "share"),
      "claude-ui"
    ),
  }),
})
