export namespace Workspace {
  export interface Stat {
    size: number
    mtime: Date
    isDirectory(): boolean
    isFile(): boolean
    isSymbolicLink(): boolean
  }

  export interface DirEntry {
    name: string
    isDirectory(): boolean
    isFile(): boolean
    isSymbolicLink(): boolean
  }

  export interface FileSink {
    write(data: string | Uint8Array): number
    flush(): void
    end(): void
  }

  export interface Fs {
    exists(path: string): Promise<boolean>
    stat(path: string): Promise<Stat>
    readFile(path: string, options?: { encoding?: string } | string): Promise<string>
    readFileBytes(path: string): Promise<Uint8Array>
    writeFile(path: string, data: string | Uint8Array, options?: { encoding?: string } | string): Promise<void>
    readDir(path: string, options?: { withFileTypes?: boolean }): Promise<string[] | DirEntry[]>
    mkdir(path: string, options?: { recursive?: boolean; mode?: number }): Promise<void>
    rm(path: string, options?: { recursive?: boolean; force?: boolean }): Promise<void>
    unlink(path: string): Promise<void>
    rename(from: string, to: string): Promise<void>
    symlink(target: string, path: string): Promise<void>
    chmod(path: string, mode: number | string): Promise<void>
    realpath(path: string): Promise<string>
    mkdtemp(prefix: string): Promise<string>
    getMimeType(path: string): Promise<string>
    truncate(path: string, len?: number): Promise<void>
    createWriter(path: string): FileSink
  }

  export interface ParsedPath {
    root: string
    dir: string
    base: string
    ext: string
    name: string
  }

  export interface PlatformPath {
    basename(path: string, ext?: string): string
  }

  export interface Path {
    resolve(...parts: string[]): string
    relative(from: string, to: string): string
    join(...parts: string[]): string
    dirname(path: string): string
    basename(path: string, ext?: string): string
    extname(path: string): string
    parse(path: string): ParsedPath
    format(pathObject: Partial<ParsedPath>): string
    normalize(path: string): string
    isAbsolute(path: string): boolean
    sep: string
    delimiter: string
    contains(parent: string, child: string): boolean
    realpath(path: string): Promise<string>
    realpathSync(path: string): string
    win32: PlatformPath
    posix: PlatformPath
  }

  export interface ExecOptions {
    cwd?: string
    env?: Record<string, string>
    timeout?: number
  }

  export interface ExecResult {
    exitCode: number
    stdout: string
    stderr: string
  }

  export interface SpawnOptions {
    cwd?: string
    env?: Record<string, string>
    shell?: boolean
    stdio?: ["ignore" | "pipe" | "inherit", "ignore" | "pipe" | "inherit", "ignore" | "pipe" | "inherit"]
    detached?: boolean
  }

  export interface SpawnHandle {
    pid: number | undefined
    stdin: FileSink | WritableStream<Uint8Array> | null
    stdout: ReadableStream<Uint8Array> | null
    stderr: ReadableStream<Uint8Array> | null
    kill(): void
    exited: Promise<number>
  }

  export interface PtyOptions {
    command: string
    args?: string[]
    cwd?: string
    env?: Record<string, string>
  }

  export interface PtyHandle {
    pid: number
    write(data: string): void
    resize(cols: number, rows: number): void
    onData(cb: (data: string) => void): void
    onExit(cb: (info: { exitCode: number }) => void): void
    kill(): void
  }

  export interface Proc {
    exec(cmd: string[], options?: ExecOptions): Promise<ExecResult>
    spawn(cmd: string[], options?: SpawnOptions): SpawnHandle
    pty(options: PtyOptions): Promise<PtyHandle>
    which(binary: string): Promise<string | undefined>
  }

  export interface SearchMatch {
    path: string
    line: number
    text: string
  }

  export interface Search {
    files(cwd: string, glob?: string[]): AsyncIterable<string>
    grep(cwd: string, pattern: string, glob?: string[], limit?: number): Promise<SearchMatch[]>
  }

  export interface WatchEvent {
    path: string
    type: "create" | "update" | "delete"
  }

  export interface Watch {
    subscribe(paths: string[], cb: (events: WatchEvent[]) => void): Promise<() => Promise<void>>
  }

  export interface Env {
    platform: "darwin" | "linux" | "win32"
    arch: "x64" | "arm64" | "ia32"
    execPath: string
    home: string
    tmp: string
    /** Get an environment variable value, returns undefined if not set */
    get(name: string): string | undefined
    /** Get all environment variables */
    getAll(): Record<string, string>
  }

  export interface Caps {
    lsp: boolean
    watch: boolean
    interactiveSpawn: boolean
  }

  /** Workspace-scoped global paths for tools, binaries, cache */
  export interface Global {
    /** Data directory (XDG data) */
    data: string
    /** Binary directory */
    bin: string
    /** Cache directory */
    cache: string
  }

  export interface Provider {
    root: string
    cwd: string
    fs: Fs
    path: Path
    proc: Proc
    search: Search
    watch?: Watch
    env: Env
    caps: Caps
    /** Workspace-scoped global paths for tools, cache, etc. */
    global: Global
  }
}
