import { createClient } from "@supabase/supabase-js"

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

function createMockClient() {
  return {
    auth: {
      async getUser() {
        return { data: { user: null }, error: new Error("Supabase not configured") }
      },
      onAuthStateChange(callback: any) {
        return { data: { subscription: { unsubscribe() {} } } }
      },
    },
  } as any
}

export const supabase = url && key ? createClient(url, key) : createMockClient()
