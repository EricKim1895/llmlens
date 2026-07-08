import {
  getMatchedSourceDomains,
  getSourceDomains,
  normalizeHostname,
} from './domain'
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
