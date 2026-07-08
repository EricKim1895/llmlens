import {
  extractPerplexitySourceUrls,
  parsePerplexityPromptResult,
  type PerplexityResponsePayload,
} from '../src/lib/perplexityResultParser'
import type {
  AnalyzePerplexityRequest,
  AnalyzePerplexityResponse,
  ApiErrorResponse,
  PromptResult,
} from '../src/lib/types'

type VercelRequest = {
  method?: string
  body?: unknown
}

type VercelResponse = {
  status: (statusCode: number) => {
    json: (body: AnalyzePerplexityResponse | ApiErrorResponse) => void
  }
}

type PerplexityApiResponse = PerplexityResponsePayload & {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

const MAX_PERPLEXITY_PROMPTS = 5
const PERPLEXITY_ENDPOINT = 'https://api.perplexity.ai/v1/sonar'

const getRequestBody = (body: unknown): AnalyzePerplexityRequest | null => {
  if (!body || typeof body !== 'object') {
    return null
  }

  return body as AnalyzePerplexityRequest
}

const isValidRequest = (body: AnalyzePerplexityRequest | null): boolean =>
  Boolean(
    body?.input?.brandName &&
      body.input.websiteUrl &&
      body.input.industry &&
      Array.isArray(body.prompts),
  )

const callPerplexity = async ({
  apiKey,
  promptText,
}: {
  apiKey: string
  promptText: string
}): Promise<PerplexityApiResponse> => {
  const response = await fetch(PERPLEXITY_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content:
            'Answer conservatively. Include relevant tools, brands, and sources when available. Do not invent citations.',
        },
        {
          role: 'user',
          content: promptText,
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`Perplexity request failed with status ${response.status}`)
  }

  return (await response.json()) as PerplexityApiResponse
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed.' })
    return
  }

  const apiKey = process.env.PERPLEXITY_API_KEY

  if (!apiKey) {
    response
      .status(500)
      .json({ error: 'Perplexity API key is not configured.' })
    return
  }

  const body = getRequestBody(request.body)

  if (!isValidRequest(body)) {
    response.status(400).json({ error: 'Invalid audit request.' })
    return
  }

  const auditRequest = body as AnalyzePerplexityRequest

  try {
    const prompts = auditRequest.prompts.slice(0, MAX_PERPLEXITY_PROMPTS)
    const results: PromptResult[] = []

    for (const prompt of prompts) {
      const perplexityResponse = await callPerplexity({
        apiKey,
        promptText: prompt.text,
      })
      const answerText =
        perplexityResponse.choices?.[0]?.message?.content?.trim() ?? ''
      const sourceUrls = extractPerplexitySourceUrls(perplexityResponse)

      results.push(
        parsePerplexityPromptResult({
          input: auditRequest.input,
          prompt,
          answerText,
          sourceUrls,
        }),
      )
    }

    response.status(200).json({ results })
  } catch {
    response.status(502).json({
      error:
        'Perplexity audit failed. Please check the API configuration and try again later.',
    })
  }
}
