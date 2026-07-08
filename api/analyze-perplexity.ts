import type {
  AnalyzePerplexityRequest,
  AnalyzePerplexityResponse,
  ApiErrorResponse,
  AuditFormInput,
  GeneratedPrompt,
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

type PerplexitySearchResult = {
  url?: string
}

type PerplexityApiResponse = {
  citations?: string[]
  search_results?: PerplexitySearchResult[]
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

const MAX_PERPLEXITY_PROMPTS = 5
const PERPLEXITY_ENDPOINT = 'https://api.perplexity.ai/v1/sonar'

class PerplexityRequestError extends Error {
  statusCode: number

  constructor(statusCode: number) {
    super(`Perplexity request failed with status ${statusCode}`)
    this.statusCode = statusCode
  }
}

const normalizeHostname = (value: string): string => {
  const trimmed = value.trim()

  if (!trimmed) {
    return ''
  }

  try {
    const url = trimmed.includes('://')
      ? new URL(trimmed)
      : new URL(`https://${trimmed}`)

    return url.hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return trimmed
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .split('/')[0]
      .toLowerCase()
  }
}

const hostnamesMatch = (sourceUrl: string, targetUrl: string): boolean => {
  const source = normalizeHostname(sourceUrl)
  const target = normalizeHostname(targetUrl)

  if (!source || !target) {
    return false
  }

  return source === target || source.endsWith(`.${target}`)
}

const normalizeText = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const includesNormalized = (text: string, query: string): boolean => {
  const normalizedText = normalizeText(text)
  const normalizedQuery = normalizeText(query)

  return Boolean(normalizedQuery) && normalizedText.includes(normalizedQuery)
}

const extractPerplexitySourceUrls = (
  payload: PerplexityApiResponse,
): string[] => {
  const urls = [
    ...(payload.citations ?? []),
    ...(payload.search_results ?? [])
      .map((result) => result.url)
      .filter((url): url is string => Boolean(url)),
  ]

  return Array.from(new Set(urls))
}

const hasRecommendationSignal = (
  answerText: string,
  brandName: string,
): boolean => {
  if (!includesNormalized(answerText, brandName)) {
    return false
  }

  const normalizedAnswer = normalizeText(answerText)
  const signalWords = [
    'recommend',
    'recommended',
    'best',
    'top',
    'option',
    'alternative',
    'consider',
    'useful',
  ]

  return signalWords.some((word) => normalizedAnswer.includes(word))
}

const buildAnswerSummary = (
  input: AuditFormInput,
  mentionedBrand: boolean,
  citedDomain: boolean,
  competitorsMentioned: string[],
  recommendationSignal: boolean,
): string => {
  if (mentionedBrand && citedDomain) {
    return `The live answer mentions ${input.brandName} and cites the submitted website domain.`
  }

  if (mentionedBrand && recommendationSignal) {
    return `The live answer mentions ${input.brandName} in a possible recommendation context.`
  }

  if (mentionedBrand) {
    return `The live answer mentions ${input.brandName}, but no matching website citation was found.`
  }

  if (competitorsMentioned.length > 0) {
    return `The live answer mentions competing options but does not mention ${input.brandName}.`
  }

  return `The live answer does not mention ${input.brandName} for this prompt.`
}

const parsePerplexityPromptResult = ({
  input,
  prompt,
  answerText,
  sourceUrls,
}: {
  input: AuditFormInput
  prompt: GeneratedPrompt
  answerText: string
  sourceUrls: string[]
}): PromptResult => {
  const mentionedBrand = includesNormalized(answerText, input.brandName)
  const citedDomain = sourceUrls.some((sourceUrl) =>
    hostnamesMatch(sourceUrl, input.websiteUrl),
  )
  const competitorsMentioned = input.competitors.filter((competitor) =>
    includesNormalized(answerText, competitor),
  )
  const recommendationSignal = hasRecommendationSignal(
    answerText,
    input.brandName,
  )

  return {
    promptId: prompt.id,
    promptText: prompt.text,
    engine: 'perplexity',
    mentionedBrand,
    citedDomain,
    recommendationPosition: null,
    recommendationSignal,
    competitorsMentioned,
    answerSummary: buildAnswerSummary(
      input,
      mentionedBrand,
      citedDomain,
      competitorsMentioned,
      recommendationSignal,
    ),
    answerText,
    citations: sourceUrls,
    sourceUrls,
  }
}

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
    const errorText = await response.text()

    console.error('Perplexity API request failed', {
      status: response.status,
      body: errorText,
    })

    throw new PerplexityRequestError(response.status)
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
  } catch (error) {
    if (error instanceof PerplexityRequestError) {
      response.status(502).json({
        error: `Perplexity request failed with status ${error.statusCode}.`,
      })
      return
    }

    console.error('Perplexity audit failed', {
      message: error instanceof Error ? error.message : 'Unknown error',
    })

    response.status(502).json({
      error: 'Perplexity audit failed. Please try again later.',
    })
  }
}
