import type {
  AnalyzePerplexityRequest,
  AnalyzePerplexityResponse,
  ApiErrorResponse,
  PromptResult,
} from './types'

export const runPerplexityAnalyzer = async (
  request: AnalyzePerplexityRequest,
): Promise<PromptResult[]> => {
  const response = await fetch('/api/analyze-perplexity', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  const rawPayload = await response.text()
  let payload: AnalyzePerplexityResponse | ApiErrorResponse | null = null

  try {
    payload = JSON.parse(rawPayload) as
      | AnalyzePerplexityResponse
      | ApiErrorResponse
  } catch {
    payload = null
  }

  if (!payload) {
    throw new Error('Perplexity audit failed. Please try again later.')
  }

  if (!response.ok || 'error' in payload) {
    throw new Error(
      'error' in payload
        ? payload.error
        : 'Perplexity audit failed. Please try again later.',
    )
  }

  return payload.results
}
