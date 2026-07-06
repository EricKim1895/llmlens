import type {
  AuditFormInput,
  AuditResult,
  GeneratedPrompt,
  PromptResult,
  VisibilityMetrics,
} from './types'

const roundPercent = (value: number) => Math.round(value * 100)

const clampScore = (score: number) => Math.min(100, Math.max(0, score))

export const calculateMetrics = (
  input: AuditFormInput,
  results: PromptResult[],
): VisibilityMetrics => {
  const total = results.length || 1
  const mentions = results.filter((result) => result.mentionedBrand).length
  const citations = results.filter((result) => result.citedDomain).length
  const recommendations = results.filter(
    (result) => result.recommendationPosition !== null,
  )
  const positions = recommendations
    .map((result) => result.recommendationPosition)
    .filter((position): position is number => position !== null)
  const averagePosition =
    positions.length > 0
      ? positions.reduce((sum, position) => sum + position, 0) /
        positions.length
      : null
  const competitorShare = input.competitors.reduce<Record<string, number>>(
    (share, competitor) => {
      share[competitor] = results.filter((result) =>
        result.competitorsMentioned.includes(competitor),
      ).length
      return share
    },
    {},
  )

  const mentionRate = mentions / total
  const citationRate = citations / total
  const recommendationRate = recommendations.length / total
  const positionSignal =
    averagePosition === null ? 0 : Math.max(0, (4 - averagePosition) / 3)

  const score = clampScore(
    Math.round(
      mentionRate * 35 +
        citationRate * 25 +
        recommendationRate * 25 +
        positionSignal * 15,
    ),
  )

  return {
    score,
    mentionRate: roundPercent(mentionRate),
    citationRate: roundPercent(citationRate),
    recommendationRate: roundPercent(recommendationRate),
    averagePosition:
      averagePosition === null ? null : Math.round(averagePosition * 10) / 10,
    competitorShare,
  }
}

const buildRecommendations = (
  input: AuditFormInput,
  results: PromptResult[],
): string[] => {
  const missingBrandCount = results.filter(
    (result) => !result.mentionedBrand,
  ).length
  const citedCount = results.filter((result) => result.citedDomain).length
  const competitorOnlyCount = results.filter(
    (result) =>
      !result.mentionedBrand && result.competitorsMentioned.length > 0,
  ).length

  const recommendations = [
    `Add a comparison page targeting "best ${input.industry} tools".`,
    'Create a clear FAQ section that explains who the tool is for.',
    'Make the homepage clearly mention your main use case and audience.',
  ]

  if (input.competitors.length > 0 || competitorOnlyCount > 0) {
    recommendations.push('Add careful competitor comparison content.')
  }

  if (missingBrandCount > results.length / 2) {
    recommendations.push('Publish pages targeting buyer-intent search queries.')
  }

  if (citedCount < results.length / 3) {
    recommendations.push(
      'Make key product pages easier to cite with concise summaries and sourceable facts.',
    )
  }

  return recommendations.slice(0, 5)
}

export const buildAuditResult = (
  input: AuditFormInput,
  prompts: GeneratedPrompt[],
  results: PromptResult[],
): AuditResult => ({
  input,
  prompts,
  results,
  metrics: calculateMetrics(input, results),
  missingBrandPrompts: results.filter((result) => !result.mentionedBrand),
  competitorOnlyPrompts: results.filter(
    (result) =>
      !result.mentionedBrand && result.competitorsMentioned.length > 0,
  ),
  recommendations: buildRecommendations(input, results),
})
