import { createClient } from "@supabase/supabase-js";
import { writable } from "svelte/store";

export const user: any = writable({});
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
