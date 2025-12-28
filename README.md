# OpenCode

AI-powered headless coding agent.

## Stack

| Tool | Purpose |
|------|---------|
| **Bun** | Runtime & package manager |
| **TypeScript** | Language |
| **Hono** | HTTP server |
| **Zod** | Schema validation |
| **Turbo** | Monorepo task runner |
| **Prettier** | Code formatting |
| **Husky** | Git hooks |

## Host vs Workspace

**Host (Global.Path.\*)**
- Machine running the opencode CLI/server process.
- Stores user-level, cross-project data (auth, config, global caches, logs).

**Workspace (Instance.ws.\*)**
- Sandbox where the repo and tools run.
- Stores project data and any tool/binary that must execute in the sandbox.

**Rule of thumb**
- Needs to run inside the repo sandbox → `Instance.ws.*`
- User data or host process deps → `Global.Path.*` / `BunProc`

## Current Change Review (Staged + Unstaged)

**Unstaged (workspace-scoped systems)**
- **Core workspace routing** `packages/opencode/src/workspace/`, `packages/opencode/src/project/instance.ts`, `packages/opencode/src/project/project.ts`, `packages/opencode/src/installation/index.ts`, `packages/opencode/src/pty/index.ts`, `packages/opencode/src/shell/shell.ts`, `packages/opencode/src/server/server.ts` (scope: workspace exec + env)
- **File IO + patching + VCS** `packages/opencode/src/file/index.ts`, `packages/opencode/src/file/ripgrep.ts`, `packages/opencode/src/file/time.ts`, `packages/opencode/src/file/watcher.ts`, `packages/opencode/src/patch/index.ts`, `packages/opencode/src/project/vcs.ts`, `packages/opencode/src/util/filesystem.ts`, `packages/opencode/src/util/archive.ts` (scope: workspace fs/path)
- **Tooling** `packages/opencode/src/tool/bash.ts`, `packages/opencode/src/tool/edit.ts`, `packages/opencode/src/tool/glob.ts`, `packages/opencode/src/tool/ls.ts`, `packages/opencode/src/tool/lsp-diagnostics.ts`, `packages/opencode/src/tool/lsp-hover.ts`, `packages/opencode/src/tool/lsp.ts`, `packages/opencode/src/tool/multiedit.ts`, `packages/opencode/src/tool/patch.ts`, `packages/opencode/src/tool/read.ts`, `packages/opencode/src/tool/registry.ts`, `packages/opencode/src/tool/skill.ts`, `packages/opencode/src/tool/write.ts` (scope: workspace proc/fs)
- **LSP + formatters** `packages/opencode/src/lsp/client.ts`, `packages/opencode/src/lsp/index.ts`, `packages/opencode/src/lsp/server.ts`, `packages/opencode/src/format/index.ts`, `packages/opencode/src/format/formatter.ts` (scope: workspace exec for installs/runs)
- **Sessions + snapshots + storage** `packages/opencode/src/session/prompt.ts`, `packages/opencode/src/session/summary.ts`, `packages/opencode/src/session/system.ts`, `packages/opencode/src/snapshot/index.ts`, `packages/opencode/src/storage/storage.ts` (scope: workspace data paths)

**Unstaged (host-scoped + mixed)**
- **Host cache + workspace install** `packages/opencode/src/bun/index.ts` (host Global.Path cache/lock), `packages/opencode/src/config/config.ts` (workspace bun install into config dir)
- **Docs** `README.md`

**Unstaged tests**
- `packages/opencode/test/agent/agent.test.ts`, `packages/opencode/test/config/agent-color.test.ts`, `packages/opencode/test/config/config.test.ts`, `packages/opencode/test/fixture/fixture.ts`, `packages/opencode/test/preload.ts`, `packages/opencode/test/project/project.test.ts`, `packages/opencode/test/snapshot/snapshot.test.ts`

**Staged tests**
- `packages/opencode/test/lsp/client.test.ts`, `packages/opencode/test/mcp/headers.test.ts`, `packages/opencode/test/provider/provider.test.ts`, `packages/opencode/test/session/session.test.ts`, `packages/opencode/test/skill/skill.test.ts`, `packages/opencode/test/tool/bash.test.ts`, `packages/opencode/test/tool/grep.test.ts`, `packages/opencode/test/tool/patch.test.ts`, `packages/opencode/test/tool/read.test.ts`

## Packages

```
packages/
├── opencode/   # Core headless agent server
├── sdk/        # Client SDK (@opencode-ai/sdk)
├── plugin/     # Plugin system (@opencode-ai/plugin)
└── util/       # Shared utilities
```

## Commands

```bash
# Install
bun install

# Dev (runs headless server)
bun dev

# Typecheck
bun run typecheck

# Format
bun run script/format.ts

# Test
bun test
```

## Config

| File | Purpose |
|------|---------|
| `.editorconfig` | Editor settings (indent, line endings) |
| `bunfig.toml` | Bun configuration |
| `turbo.json` | Turbo pipeline config |
| `tsconfig.json` | TypeScript config |
| `package.json` → `"prettier"` | Prettier config (no semi, 120 chars) |

## Publishing

```bash
# SDK
NPM_TAG=latest bun run packages/sdk/js/script/publish.ts

# Plugin
NPM_TAG=latest bun run packages/plugin/script/publish.ts
```


Host vs Workspace — quick mental model

  Host (Global.Path.*)

  - The machine where the opencode CLI/server process runs.
  - Holds user‑level, cross‑project data.
  - Good for:
      - Auth tokens, OAuth sessions
      - User config & rules
      - Global caches for SDKs/providers
      - Logs and model metadata cache
  - Example paths: Global.Path.data, Global.Path.cache, Global.Path.bin

  Workspace (Instance.ws.*)

  - The sandbox where the user’s repo and tools run.
  - Holds project‑specific data and anything that must execute in the sandbox.
  - Good for:
      - Project files
      - Tool installs executed inside the sandbox (LSP servers, formatters, rg)
      - Snapshots & per‑repo data
  - Example access: Instance.ws.fs, Instance.ws.proc, Instance.ws.env, Instance.ws.global.*

  ———

  1. Host server bootstraps and owns the process.
  2. A workspace provider is created per repo.
  3. All file/exec operations that touch repo or tools go through Instance.ws.
  4. User data and shared caches stay on the host (Global.Path.*).

  Workspace‑scoped execution

  - Use Instance.ws.proc.exec/spawn
  - Use Instance.ws.env.execPath for Bun
  - Use Instance.ws.fs for file IO
  - Use Instance.ws.global.{bin,cache,data} for workspace tool dirs

  Host‑scoped execution

  - Use BunProc.run/install (host Bun, global cache)
  - Use Global.Path.* for global data/cache/bin

  ———

  ## Current decisions (as of now)

  - Provider SDKs (AWS, etc): host‑scoped
    (BunProc.install into Global.Path.cache, imported by host process)
  - Plugins:
      - Installed globally (host cache)
      - Instantiated per workspace (state + workspace context)
  - Formatters & LSP installs:
    workspace‑scoped (run inside sandbox)
  - Config plugin install (@opencode-ai/plugin):
    now workspace‑scoped (runs in sandbox)
