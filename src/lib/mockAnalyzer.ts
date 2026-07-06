import type { AuditFormInput, GeneratedPrompt, PromptResult } from './types'

const hashString = (value: string): number => {
  let hash = 2166136261

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

const seededRatio = (seed: string): number => hashString(seed) / 4294967295

const domainFromUrl = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
  }
}

const includesBrand = (prompt: string, brandName: string) =>
  prompt.toLowerCase().includes(brandName.toLowerCase())

const selectCompetitors = (
  input: AuditFormInput,
  prompt: GeneratedPrompt,
): string[] => {
  return input.competitors.filter((competitor, index) => {
    const promptMentionsCompetitor = prompt.text
      .toLowerCase()
      .includes(competitor.toLowerCase())
    const threshold =
      prompt.intent === 'best-tools' || prompt.intent === 'comparison'
        ? 0.58
        : 0.36

    return (
      promptMentionsCompetitor ||
      seededRatio(`${input.brandName}:${prompt.text}:${competitor}:${index}`) <
        threshold
    )
  })
}

const getMentionThreshold = (
  input: AuditFormInput,
  prompt: GeneratedPrompt,
): number => {
  const brandInPrompt = includesBrand(prompt.text, input.brandName)
  const hasCompetitors = input.competitors.length > 0

  if (brandInPrompt && prompt.intent === 'comparison') {
    return 0.84
  }

  if (brandInPrompt) {
    return 0.78
  }

  if (prompt.intent === 'best-tools' || prompt.intent === 'buyer-intent') {
    return hasCompetitors ? 0.36 : 0.44
  }

  if (prompt.intent === 'alternatives') {
    return 0.48
  }

  return hasCompetitors ? 0.28 : 0.34
}

const summarizeAnswer = (
  input: AuditFormInput,
  mentionedBrand: boolean,
  citedDomain: boolean,
  competitorsMentioned: string[],
): string => {
  if (mentionedBrand && citedDomain) {
    return `The mock answer mentions ${input.brandName} and includes the website domain as a possible visibility signal.`
  }

  if (mentionedBrand) {
    return `The mock answer mentions ${input.brandName} as one possible option, but does not cite the website domain.`
  }

  if (competitorsMentioned.length > 0) {
    return `The mock answer discusses competing options but does not mention ${input.brandName}.`
  }

  return `The mock answer gives general ${input.industry} guidance without naming the brand.`
}

export const runMockAnalyzer = (
  input: AuditFormInput,
  prompts: GeneratedPrompt[],
): PromptResult[] => {
  const domain = domainFromUrl(input.websiteUrl)

  return prompts.map((prompt) => {
    const baseSeed = `${input.brandName}:${domain}:${input.industry}:${prompt.text}`
    const mentionThreshold = getMentionThreshold(input, prompt)
    const mentionedBrand =
      seededRatio(`${baseSeed}:mention`) < mentionThreshold ||
      includesBrand(prompt.text, input.brandName)
    const citedDomain =
      mentionedBrand && seededRatio(`${baseSeed}:citation`) < 0.54
    const recommended =
      mentionedBrand && seededRatio(`${baseSeed}:recommend`) < 0.68
    const recommendationPosition = recommended
      ? 1 + Math.floor(seededRatio(`${baseSeed}:position`) * 3)
      : null
    const competitorsMentioned = selectCompetitors(input, prompt)

    return {
      promptId: prompt.id,
      promptText: prompt.text,
      engine: 'mock',
      mentionedBrand,
      citedDomain,
      recommendationPosition,
      competitorsMentioned,
      answerSummary: summarizeAnswer(
        input,
        mentionedBrand,
        citedDomain,
        competitorsMentioned,
      ),
    }
  })
}
