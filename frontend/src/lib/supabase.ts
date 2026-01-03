import { createClient } from "@supabase/supabase-js"

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  // add other env variables here if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

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

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockClient()
