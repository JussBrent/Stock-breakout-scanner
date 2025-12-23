import { createClient } from "@supabase/supabase-js"

interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_SUPABASE_ANON_KEY: string;
    // add other env variables here if needed
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

export const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!
)
