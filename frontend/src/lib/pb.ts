import PocketBase from "pocketbase";

const PB_URL = import.meta.env.VITE_PB_URL || "/";

export const pb = new PocketBase(PB_URL);

// Re-export common types
export type { RecordModel } from "pocketbase";
