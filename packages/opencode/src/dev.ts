#!/usr/bin/env bun
/**
 * Development entry point for running the headless OpenCode server.
 */
import { start } from "./headless"

const { baseUrl } = await start({
  port: 4096,
  hostname: "127.0.0.1",
  directory: process.cwd(),
})

console.log(`OpenCode server running at ${baseUrl}`)
console.log(`API docs: ${baseUrl}/doc`)

