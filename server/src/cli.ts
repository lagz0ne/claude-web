#!/usr/bin/env bun

import { parseArgs } from "util"
import { resolve, join, dirname } from "path"
import { homedir } from "os"
import { existsSync, mkdirSync, writeFileSync } from "fs"

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    port: { type: "string", short: "p" },
    host: { type: "string", short: "H" },
    config: { type: "string", short: "c" },
    help: { type: "boolean", short: "h" },
    version: { type: "boolean", short: "v" },
  },
})

if (values.help) {
  console.log(`claude-ui — Web interface for Claude Agent SDK

Usage: claude-ui [options]

Options:
  -p, --port <number>    Server port (default: 3111)
  -H, --host <addr>      Bind address (default: 127.0.0.1)
  -c, --config <path>    Config file path
  -h, --help             Show this help
  -v, --version          Show version

Defaults:
  Config: ~/.config/claude-ui/config.json
  Data:   ~/.local/share/claude-ui/`)
  process.exit(0)
}

if (values.version) {
  // Read version from package.json relative to this file
  const pkgPath = join(dirname(import.meta.dirname!), "..", "package.json")
  try {
    const pkg = JSON.parse(await Bun.file(pkgPath).text())
    console.log(pkg.version ?? "0.0.0")
  } catch {
    console.log("0.0.0")
  }
  process.exit(0)
}

// Resolve XDG paths
const xdgConfig = process.env.XDG_CONFIG_HOME || join(homedir(), ".config")
const xdgData = process.env.XDG_DATA_HOME || join(homedir(), ".local", "share")

const configPath = values.config
  ? resolve(values.config)
  : join(xdgConfig, "claude-ui", "config.json")

const dataDir = join(xdgData, "claude-ui")

// Ensure directories exist
mkdirSync(dirname(configPath), { recursive: true })
mkdirSync(join(dataDir, "messages"), { recursive: true })

// Create default config if missing
if (!existsSync(configPath)) {
  const defaultConfig = {
    port: 3111,
    baseDir: homedir(),
    presets: [],
  }
  writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2))
  console.log(`Created default config at ${configPath}`)
}

// Resolve dist path relative to package root
// cli.ts is at <pkg>/server/src/cli.ts → package root is ../../
const packageRoot = join(import.meta.dirname!, "..", "..")
const distPath = join(packageRoot, "web", "dist")

const { startServer } = await import("./server")

await startServer({
  configPath,
  dataDir,
  distPath,
  portOverride: values.port ? Number(values.port) : undefined,
  hostname: values.host,
})
