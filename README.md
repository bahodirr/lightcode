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

