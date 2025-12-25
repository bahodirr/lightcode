/**
 * Headless server entrypoint for OpenCode.
 *
 * This module provides a programmatic API to start/stop the OpenCode HTTP server
 * without any CLI or TUI dependencies.
 *
 * @example
 * ```ts
 * import { start, stop } from "opencode/headless"
 *
 * const { server, baseUrl } = await start({ port: 4096, hostname: "127.0.0.1" })
 * console.log(`Server running at ${baseUrl}`)
 *
 * // Later...
 * await stop(server)
 * ```
 */

import { Server } from "./server/server"
import { Instance } from "./project/instance"
import { InstanceBootstrap } from "./project/bootstrap"

export interface StartOptions {
  /** Port to listen on. Use 0 for auto-assign (defaults to 4096 if available). */
  port?: number
  /** Hostname to bind to. Defaults to "127.0.0.1". */
  hostname?: string
  /** Working directory for the OpenCode instance. Defaults to process.cwd(). */
  directory?: string
}

export interface ServerHandle {
  server: ReturnType<typeof Server.listen>
  baseUrl: string
}

/**
 * Start the headless OpenCode server.
 */
export async function start(options: StartOptions = {}): Promise<ServerHandle> {
  const { port = 0, hostname = "127.0.0.1", directory = process.cwd() } = options

  // Initialize the instance for the directory
  await Instance.provide({
    directory,
    init: InstanceBootstrap,
    async fn() {
      // Instance is now initialized
    },
  })

  const server = Server.listen({ port, hostname })
  const baseUrl = `http://${hostname}:${server.port}`

  return { server, baseUrl }
}

/**
 * Stop the headless OpenCode server.
 */
export async function stop(server: ReturnType<typeof Server.listen>): Promise<void> {
  await Instance.disposeAll()
  server.stop()
}

// Re-export useful types and namespaces for API consumers
export { Server } from "./server/server"
export { Session } from "./session"
export { SessionPrompt } from "./session/prompt"
export { Agent } from "./agent/agent"
export { Config } from "./config/config"
export { Provider } from "./provider/provider"
export { MCP } from "./mcp"
export { LSP } from "./lsp"
export { ToolRegistry } from "./tool/registry"
