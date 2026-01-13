interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OpenAIResponse {
  id: string
  choices: Array<{
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
}

export type AIModel = 'sean-v1' | 'sean-v2'

const MODEL_CONFIG = {
  'sean-v1': {
    name: 'Sean v1',
    openaiModel: 'gpt-4o-mini',
    description: 'Advanced analysis with deep market insights',
    systemPrompt: `You are Sean v1, an expert stock trading advisor specializing in breakout patterns and technical analysis. 
You provide clear, actionable insights on stock patterns, EMA trends, volume analysis, and risk management.
Keep responses concise but informative. Focus on practical trading strategies.`,
  },
  'sean-v2': {
    name: 'Sean v2',
    openaiModel: 'gpt-3.5-turbo',
    description: 'Fast analysis with quick trading insights',
    systemPrompt: `You are Sean v2, a quick-response stock trading assistant specializing in breakout patterns.
Provide fast, actionable trading insights. Keep responses brief and to the point.
Focus on immediate patterns, triggers, and key support/resistance levels.`,
  },
}

export async function callOpenAI(
  messages: OpenAIMessage[],
  model: AIModel = 'sean-v1'
): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('OpenAI API key not configured')
  }

  const config = MODEL_CONFIG[model]
  
  // Add system prompt to messages
  const fullMessages: OpenAIMessage[] = [
    { role: 'system', content: config.systemPrompt },
    ...messages,
  ]

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.openaiModel,
        messages: fullMessages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'OpenAI API request failed')
    }

    const data: OpenAIResponse = await response.json()
    return data.choices[0]?.message?.content || 'No response from AI'
  } catch (error) {
    console.error('OpenAI API Error:', error)
    throw error
  }
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
