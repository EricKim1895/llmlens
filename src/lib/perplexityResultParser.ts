import { hostnamesMatch } from './domain'
import type { AuditFormInput, GeneratedPrompt, PromptResult } from './types'

export interface PerplexitySearchResult {
  url?: string
}

export interface PerplexityResponsePayload {
  citations?: string[]
  search_results?: PerplexitySearchResult[]
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

export const extractPerplexitySourceUrls = (
  payload: PerplexityResponsePayload,
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

export const parsePerplexityPromptResult = ({
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
