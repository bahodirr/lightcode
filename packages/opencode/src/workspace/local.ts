import fs from "fs/promises"
import { realpathSync } from "fs"
import nodePath from "path"
import os from "os"
import { lazy } from "@/util/lazy"
import type { Workspace } from "./index"

const loadBunPty = lazy(async () => {
  const { Installation } = await import("@/installation")
  if (!Installation.isLocal()) {
    const path = require(
      `bun-pty/rust-pty/target/release/${
        process.platform === "win32"
          ? "rust_pty.dll"
          : process.platform === "linux" && process.arch === "x64"
            ? "librust_pty.so"
            : process.platform === "darwin" && process.arch === "x64"
              ? "librust_pty.dylib"
              : process.platform === "darwin" && process.arch === "arm64"
                ? "librust_pty_arm64.dylib"
                : process.platform === "linux" && process.arch === "arm64"
                  ? "librust_pty_arm64.so"
                  : ""
      }`,
    )
    process.env.BUN_PTY_LIB = path
  }
  const { spawn } = await import("bun-pty")
  return spawn
})

const loadRipgrep = lazy(async () => {
  const { Ripgrep } = await import("@/file/ripgrep")
  return Ripgrep
})

const loadGlobalPaths = lazy(() => {
  const { Global } = require("@/global")
  return Global.Path
})

function createFs(): Workspace.Fs {
  return {
    async exists(path) {
      try {
        await fs.stat(path)
        return true
      } catch {
        return false
      }
    },

    async stat(path) {
      return fs.stat(path)
    },

    async readFile(path, options) {
      const encoding = typeof options === "string" ? options : options?.encoding
      if (encoding && encoding !== "utf8" && encoding !== "utf-8") {
        const buffer = Buffer.from(await Bun.file(path).arrayBuffer())
        return buffer.toString(encoding as any)
      }
      return Bun.file(path).text()
    },

    async readFileBytes(path) {
      return Bun.file(path).bytes()
    },

    async writeFile(path, data, options) {
      const encoding = typeof options === "string" ? options : options?.encoding
      if (typeof data === "string" && encoding && encoding !== "utf8" && encoding !== "utf-8") {
        await Bun.write(path, Buffer.from(data, encoding as any))
        return
      }
      await Bun.write(path, data)
    },

    async readDir(path, options) {
      if (options?.withFileTypes) {
        return fs.readdir(path, { withFileTypes: true })
      }
      return fs.readdir(path)
    },

    async mkdir(path, options) {
      await fs.mkdir(path, { recursive: options?.recursive, mode: options?.mode })
    },

    async rm(path, options) {
      await fs.rm(path, { recursive: options?.recursive, force: options?.force ?? true })
    },

    async unlink(path) {
      await fs.unlink(path)
    },

    async rename(from, to) {
      await fs.rename(from, to)
    },

    async symlink(target, path) {
      await fs.symlink(target, path)
    },

    async chmod(path, mode) {
      await fs.chmod(path, mode)
    },

    async realpath(path) {
      return fs.realpath(path)
    },

    async mkdtemp(prefix) {
      return fs.mkdtemp(prefix)
    },

    async getMimeType(path) {
      return Bun.file(path).type
    },

    async truncate(path, len) {
      await fs.truncate(path, len)
    },

    createWriter(path) {
      return Bun.file(path).writer()
    },
  }
}

function createPath(): Workspace.Path {
  return {
    resolve: (...parts) => nodePath.resolve(...parts),
    relative: (from, to) => nodePath.relative(from, to),
    join: (...parts) => nodePath.join(...parts),
    dirname: (path) => nodePath.dirname(path),
    basename: (path, ext) => nodePath.basename(path, ext),
    extname: (path) => nodePath.extname(path),
    parse: (path) => nodePath.parse(path),
    format: (obj) => nodePath.format(obj),
    normalize: (path) => nodePath.normalize(path),
    isAbsolute: (path) => nodePath.isAbsolute(path),
    sep: nodePath.sep,
    delimiter: nodePath.delimiter,

    contains(parent, child) {
      if (process.platform === "win32") {
        const parentDrive = parent.match(/^([a-zA-Z]:)/)?.[1]?.toUpperCase()
        const childDrive = child.match(/^([a-zA-Z]:)/)?.[1]?.toUpperCase()
        if (parentDrive && childDrive && parentDrive !== childDrive) {
          return false
        }
      }
      const rel = nodePath.relative(parent, child)
      return !rel.startsWith("..") && !nodePath.isAbsolute(rel)
    },

    async realpath(path) {
      return fs.realpath(path)
    },

    realpathSync(path) {
      if (process.platform !== "win32") return path
      try {
        return realpathSync.native(path)
      } catch {
        return path
      }
    },

    win32: {
      basename: (path, ext) => nodePath.win32.basename(path, ext),
    },

    posix: {
      basename: (path, ext) => nodePath.posix.basename(path, ext),
    },
  }
}

function createProc(): Workspace.Proc {
  return {
    async exec(cmd, options = {}) {
      try {
        const spawnOpts = {
          cwd: options.cwd ?? process.cwd(),
          env: options.env ?? process.env,
          stdout: "pipe" as const,
          stderr: "pipe" as const,
        }

        const proc = Bun.spawn(cmd, spawnOpts)

        let timedOut = false
        let timer: Timer | undefined

        if (options.timeout) {
          timer = setTimeout(() => {
            timedOut = true
            proc.kill()
          }, options.timeout)
        }

        const exitCode = await proc.exited
        if (timer) clearTimeout(timer)

        const [stdout, stderr] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()])

        return {
          exitCode: timedOut ? 124 : exitCode,
          stdout,
          stderr,
        }
      } catch (error) {
        return {
          exitCode: 1,
          stdout: "",
          stderr: error instanceof Error ? error.message : String(error),
        }
      }
    },

    spawn(cmd, options = {}) {
      const stdio = options.stdio ?? ["pipe", "pipe", "pipe"]
      const proc = Bun.spawn(cmd, {
        cwd: options.cwd,
        env: options.env,
        stdin: stdio[0],
        stdout: stdio[1],
        stderr: stdio[2],
      })
      return {
        pid: proc.pid,
        stdin: stdio[0] === "pipe" ? proc.stdin ?? null : null,
        stdout: proc.stdout,
        stderr: proc.stderr,
        kill: () => proc.kill(),
        exited: proc.exited,
      }
    },

    async pty(options) {
      const spawn = await loadBunPty()
      const proc = spawn(options.command, options.args ?? [], {
        cwd: options.cwd,
        env: options.env ?? process.env,
      })
      return {
        pid: proc.pid,
        write: (data) => proc.write(data),
        resize: (cols, rows) => proc.resize(cols, rows),
        onData: (cb) => proc.onData(cb),
        onExit: (cb) => proc.onExit(cb),
        kill: () => proc.kill(),
      }
    },

    async which(binary) {
      return Bun.which(binary) ?? undefined
    },
  }
}

function createSearch(): Workspace.Search {
  return {
    async *files(cwd, glob) {
      const Ripgrep = await loadRipgrep()
      yield* Ripgrep.files({ cwd, glob })
    },

    async grep(cwd, pattern, glob, limit) {
      const Ripgrep = await loadRipgrep()
      const results = await Ripgrep.search({ cwd, pattern, glob, limit })
      return results.map((r: { path: { text: string }; line_number: number; lines: { text: string } }) => ({
        path: r.path.text,
        line: r.line_number,
        text: r.lines.text,
      }))
    },
  }
}

function createEnv(): Workspace.Env {
  return {
    platform: process.platform as Workspace.Env["platform"],
    arch: process.arch as Workspace.Env["arch"],
    execPath: process.execPath,
    home: os.homedir(),
    tmp: os.tmpdir(),
    get: (name: string) => process.env[name],
    getAll: () => ({ ...process.env }) as Record<string, string>,
  }
}

function createCaps(): Workspace.Caps {
  return {
    lsp: true,
    watch: true,
    interactiveSpawn: true,
  }
}

function createGlobal(): Workspace.Global {
  return {
    get data() {
      return loadGlobalPaths().data
    },
    get bin() {
      return loadGlobalPaths().bin
    },
    get cache() {
      return loadGlobalPaths().cache
    },
  }
}

export function createLocalProvider(root: string, cwd?: string): Workspace.Provider {
  return {
    root,
    cwd: cwd ?? root,
    fs: createFs(),
    path: createPath(),
    proc: createProc(),
    search: createSearch(),
    env: createEnv(),
    caps: createCaps(),
    global: createGlobal(),
  }
}
