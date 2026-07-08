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
      .split(/[/?#]/)[0]
      .replace(/:\d+$/, '')
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

const getSourceDomains = (sourceUrls: string[]): string[] =>
  Array.from(
    new Set(
      sourceUrls
        .map((sourceUrl) => normalizeHostname(sourceUrl))
        .filter(Boolean),
    ),
  )

const getMatchedSourceDomains = (
  sourceUrls: string[],
  targetUrl: string,
): string[] =>
  getSourceDomains(sourceUrls).filter((sourceDomain) =>
    hostnamesMatch(sourceDomain, targetUrl),
  )

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

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const getBrandContextWindows = (
  answerText: string,
  brandName: string,
): string[] => {
  const trimmedBrand = brandName.trim()

  if (!trimmedBrand) {
    return []
  }

  const brandPattern = new RegExp(escapeRegExp(trimmedBrand), 'gi')
  const windows: string[] = []
  let match: RegExpExecArray | null

  while ((match = brandPattern.exec(answerText)) !== null) {
    const windowStart = Math.max(0, match.index - 160)
    const windowEnd = Math.min(
      answerText.length,
      match.index + trimmedBrand.length + 160,
    )
    const windowText = answerText.slice(windowStart, windowEnd)
    const brandIndexInWindow = match.index - windowStart
    const beforeBrand = windowText.slice(0, brandIndexInWindow)
    const afterBrand = windowText.slice(brandIndexInWindow)
    const sentenceStart = Math.max(
      beforeBrand.lastIndexOf('.'),
      beforeBrand.lastIndexOf('!'),
      beforeBrand.lastIndexOf('?'),
      beforeBrand.lastIndexOf('\n'),
    )
    const sentenceEndCandidates = ['.', '!', '?', '\n']
      .map((delimiter) => afterBrand.indexOf(delimiter))
      .filter((index) => index >= 0)
    const sentenceEnd =
      sentenceEndCandidates.length > 0
        ? Math.min(...sentenceEndCandidates)
        : afterBrand.length

    windows.push(
      windowText.slice(sentenceStart + 1, brandIndexInWindow + sentenceEnd),
    )
  }

  return windows
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

  const strongSignals = [
    'recommend',
    'recommended',
    'best',
    'top',
    'one of the best',
    'good choice',
    'strong option',
    'worth considering',
    'great choice',
    'solid choice',
    'leading',
    'popular choice',
  ]
  const weakSignals = ['option', 'alternative', 'useful', 'consider']
  const positiveModifiers = [
    'good',
    'strong',
    'best',
    'top',
    'recommended',
    'great',
    'solid',
    'leading',
  ]

  return getBrandContextWindows(answerText, brandName).some((window) => {
    const normalizedWindow = normalizeText(window)
    const normalizedBrand = normalizeText(brandName)
    const directBrandSignals = [
      `${normalizedBrand} is recommended`,
      `${normalizedBrand} are recommended`,
      `${normalizedBrand} is one of the best`,
      `${normalizedBrand} is among the best`,
      `${normalizedBrand} is a top`,
      `${normalizedBrand} is one of the top`,
      `${normalizedBrand} is a good choice`,
      `${normalizedBrand} is a great choice`,
      `${normalizedBrand} is a solid choice`,
      `${normalizedBrand} is a strong option`,
      `${normalizedBrand} is worth considering`,
      `${normalizedBrand} is a leading`,
      `${normalizedBrand} is a popular choice`,
      `recommend ${normalizedBrand}`,
      `recommended ${normalizedBrand}`,
    ]
    const hasDirectBrandSignal = directBrandSignals.some((signal) =>
      normalizedWindow.includes(signal),
    )
    const hasContrastRecommendation =
      /\b(but|however)\b.{0,80}\b(best|top|recommended|recommend)\b/.test(
        normalizedWindow,
      )

    if (hasContrastRecommendation && !hasDirectBrandSignal) {
      return false
    }

    return (
      strongSignals.some((signal) => normalizedWindow.includes(signal)) ||
      (weakSignals.some((signal) => normalizedWindow.includes(signal)) &&
        positiveModifiers.some((modifier) =>
          normalizedWindow.includes(modifier),
        ))
    )
  })
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
  const expectedDomain = normalizeHostname(input.websiteUrl)
  const sourceDomains = getSourceDomains(sourceUrls)
  const matchedSourceDomains = getMatchedSourceDomains(
    sourceUrls,
    input.websiteUrl,
  )
  const citedDomain = matchedSourceDomains.length > 0
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
    expectedDomain,
    sourceDomains,
    matchedSourceDomains,
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
