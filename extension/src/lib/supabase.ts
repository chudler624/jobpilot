import { createClient, type SupportedStorage } from "@supabase/supabase-js";
import type { Database } from "../../../types/supabase";

const SUPABASE_URL = "https://trhnfarcchrykrfnhqdc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_QGy1IOijuh7t8BJBb84LuQ_l7yVj3Wh";

// Same publishable key the main web app already ships in its own client
// bundle — not a new exposure, and RLS (not this key) is the actual
// security boundary, same as every other client of this database.
const chromeStorageAdapter: SupportedStorage = {
  getItem: async (key) => {
    const result = await chrome.storage.local.get(key);
    const value = result[key];
    return typeof value === "string" ? value : null;
  },
  setItem: async (key, value) => {
    await chrome.storage.local.set({ [key]: value });
  },
  removeItem: async (key) => {
    await chrome.storage.local.remove(key);
  },
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: chromeStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
