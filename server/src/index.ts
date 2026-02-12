import { resolve } from "path"
import { startServer } from "./server"

startServer({
  configPath: resolve(process.cwd(), "..", "config.json"),
  dataDir: resolve(process.cwd(), "..", "data"),
  distPath: resolve(process.cwd(), "..", "web", "dist"),
})
