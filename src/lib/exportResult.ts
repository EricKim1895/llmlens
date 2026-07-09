import type { AuditResult, SearchEngine } from './types'

type ExportExtension = 'md' | 'json'

const formatEngine = (engine: SearchEngine): string =>
  engine === 'perplexity'
    ? 'Perplexity Sonar'
    : engine === 'mock'
      ? 'Mock mode'
      : 'Gemini'

const formatAveragePosition = (
  position: number | null,
  engine: SearchEngine,
): string =>
  position === null && engine === 'perplexity'
    ? 'Not measured'
    : position === null
      ? 'Not found'
      : `#${position}`

const formatHostname = (sourceUrl: string): string => {
  try {
    return new URL(sourceUrl).hostname.replace(/^www\./, '')
  } catch {
    return sourceUrl
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .split('/')[0]
  }
}

const getExpectedDomain = (result: AuditResult): string =>
  result.results.find((prompt) => prompt.expectedDomain)?.expectedDomain ??
  formatHostname(result.input.websiteUrl)

const getMatchedDomains = (result: AuditResult): string[] =>
  Array.from(
    new Set(result.results.flatMap((prompt) => prompt.matchedSourceDomains)),
  )

const getPromptSources = (prompt: AuditResult['results'][number]): string[] =>
  prompt.sourceUrls.length > 0 ? prompt.sourceUrls : (prompt.citations ?? [])

const getRecommendationSignal = (
  prompt: AuditResult['results'][number],
): boolean =>
  prompt.recommendationSignal ?? (prompt.recommendationPosition !== null)

const escapeMarkdownTableCell = (value: string): string =>
  value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim()

const sanitizeFilenamePart = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const buildAuditSummaryText = (result: AuditResult): string => {
  const matchedDomains = getMatchedDomains(result)

  return [
    `LLM Lens audit summary for ${result.input.brandName}`,
    `Website: ${result.input.websiteUrl}`,
    `Engine: ${formatEngine(result.input.searchEngine)}`,
    `Prompts: ${result.prompts.length}`,
    `Score: ${result.metrics.score}/100`,
    `Mention Rate: ${result.metrics.mentionRate}%`,
    `Citation Rate: ${result.metrics.citationRate}%`,
    `Recommendation Rate: ${result.metrics.recommendationRate}%`,
    `Average Position: ${formatAveragePosition(
      result.metrics.averagePosition,
      result.input.searchEngine,
    )}`,
    `Expected domain: ${getExpectedDomain(result)}`,
    `Matched source domains: ${
      matchedDomains.length > 0 ? matchedDomains.join(', ') : 'None'
    }`,
  ].join('\n')
}

export const buildAuditMarkdown = (result: AuditResult): string => {
  const exportedAt = new Date().toISOString()
  const matchedDomains = getMatchedDomains(result)
  const promptRows = result.results.map((prompt) => {
    const sources = getPromptSources(prompt)
      .slice(0, 5)
      .map(formatHostname)
      .join(', ')

    return [
      escapeMarkdownTableCell(prompt.promptText),
      prompt.mentionedBrand ? 'Yes' : 'No',
      prompt.citedDomain ? 'Yes' : 'No',
      getRecommendationSignal(prompt) ? 'Yes' : 'No',
      escapeMarkdownTableCell(sources || 'None'),
      escapeMarkdownTableCell(prompt.answerSummary),
    ].join(' | ')
  })

  return [
    '# LLM Lens Audit Summary',
    '',
    '## Overview',
    '',
    `- Brand: ${result.input.brandName}`,
    `- Website: ${result.input.websiteUrl}`,
    `- Search engine: ${formatEngine(result.input.searchEngine)}`,
    `- Number of prompts: ${result.prompts.length}`,
    `- Exported at: ${exportedAt}`,
    '',
    '## Score',
    '',
    `- AI Visibility Score: ${result.metrics.score}/100`,
    `- Mention Rate: ${result.metrics.mentionRate}%`,
    `- Citation Rate: ${result.metrics.citationRate}%`,
    `- Recommendation Rate: ${result.metrics.recommendationRate}%`,
    `- Average Position: ${formatAveragePosition(
      result.metrics.averagePosition,
      result.input.searchEngine,
    )}`,
    '',
    '## Citation Domains',
    '',
    `- Expected domain: ${getExpectedDomain(result)}`,
    `- Matched source domains: ${
      matchedDomains.length > 0 ? matchedDomains.join(', ') : 'None'
    }`,
    '',
    '## Prompt-Level Results',
    '',
    '| Prompt | Mentioned | Cited | Recommendation Signal | Sources | Summary |',
    '| --- | --- | --- | --- | --- | --- |',
    ...promptRows.map((row) => `| ${row} |`),
    '',
    '## Conservative Recommendations',
    '',
    ...result.recommendations.map(
      (recommendation) => `- ${recommendation}`,
    ),
    '',
  ].join('\n')
}

export const buildAuditJson = (result: AuditResult): string =>
  JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      exportVersion: '1',
      result,
    },
    null,
    2,
  )

export const buildExportFilename = (
  result: AuditResult,
  extension: ExportExtension,
): string => {
  const brandPart = sanitizeFilenamePart(result.input.brandName)

  return brandPart
    ? `llm-lens-${brandPart}-audit.${extension}`
    : `llm-lens-audit.${extension}`
}
