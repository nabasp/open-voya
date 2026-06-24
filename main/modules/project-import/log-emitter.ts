import type { WebContents } from 'electron'

import { IpcChannels } from './ipc-contract'
import type { StatusEvent } from './ipc-contract'
import type { BuildLogEvent } from './types'

/** Streams a single BuildLogEvent to the window (no-op if it's gone). */
export function emitLog(wc: WebContents, event: BuildLogEvent): void {
  if (!wc.isDestroyed()) wc.send(IpcChannels.logs, event)
}

export function emitStatus(wc: WebContents, payload: StatusEvent): void {
  if (!wc.isDestroyed()) wc.send(IpcChannels.status, payload)
}

export function emitListChanged(wc: WebContents): void {
  if (!wc.isDestroyed()) wc.send(IpcChannels.listChanged, {})
}
