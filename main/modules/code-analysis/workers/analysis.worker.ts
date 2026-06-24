// Placeholder worker entry for offloading heavy ts-morph parsing off the main
// process via `worker_threads`. In v1 `analysisService.run` executes inline on
// the import pipeline (gated by the clone step, so it is already off the UI
// thread for the renderer). When repos grow large enough to block the main
// process, move the scan/parse/extract pipeline here.
//
// Kept dependency-free (no Electron/SQLite imports) so it can run in a worker
// context. The orchestrator is structured so its pure phases (scan → parse →
// extract → graph) can be lifted into this file unchanged, with persistence
// (artifacts + SQLite) remaining on the main thread.

export {}
