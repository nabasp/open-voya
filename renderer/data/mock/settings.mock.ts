import type { InstalledModel } from "@/types";

export const APP_VERSION = "1.0.0";
export const ACTIVE_MODEL = "qwen2.5-3b";
export const LANCEDB_DOC_COUNT = "1,204";
export const STORAGE_PATH = "~/.agent-builder";

export const INSTALLED_MODELS: InstalledModel[] = [
  { name: "qwen2.5-3b-instruct.Q4_K_M.gguf", size: "2.1 GB", isDefault: true },
  { name: "gemma-3-1b.Q4_K_M.gguf", size: "0.8 GB" },
];
