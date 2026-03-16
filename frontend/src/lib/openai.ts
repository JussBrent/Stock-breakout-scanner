// AI client — calls backend /api/ai/chat which uses Claude

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export type AIModel = 'sean-v1' | 'sean-v2'

const MODEL_CONFIG = {
  'sean-v1': {
    name: 'Sean',
    description: 'Advanced stock analysis powered by Claude',
  },
  'sean-v2': {
    name: 'Sean (Fast)',
    description: 'Quick trading insights',
  },
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { supabase } = await import("./supabase")
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export async function callOpenAI(
  messages: ChatMessage[],
  _model: AIModel = 'sean-v1',
  scanContext?: string
): Promise<string> {
  const headers = await getAuthHeaders()

  const response = await fetch(`${API_URL}/api/ai/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      messages,
      scan_context: scanContext || null,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'AI request failed')
  }

  const data = await response.json()
  return data.reply
}

export function getModelInfo(model: AIModel) {
  return MODEL_CONFIG[model]
}

export function getAllModels() {
  return Object.entries(MODEL_CONFIG).map(([key, value]) => ({
    id: key as AIModel,
    name: value.name,
    description: value.description,
  }))
}
