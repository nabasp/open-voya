import type { LogFn } from '../../project-import/types'

// Helpers that prefix pipeline log lines with the spec's `[INFO]` / `[SUCCESS]`
// markers while still flowing through the existing streaming LogFn.
export function info(log: LogFn, message: string, progressKey?: string): void {
  log('info', `[INFO] ${message}`, progressKey)
}

export function success(log: LogFn, message: string): void {
  log('info', `[SUCCESS] ${message}`)
}

export function warn(log: LogFn, message: string): void {
  log('warning', `[WARN] ${message}`)
}
