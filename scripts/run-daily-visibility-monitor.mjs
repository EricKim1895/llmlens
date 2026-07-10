import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const MONITOR_VERSION = '1.0.0'
const API_URL = 'https://llmlens-sigma.vercel.app/api/analyze-perplexity'
const REQUEST_DELAY_MS = 2_000
const REQUEST_TIMEOUT_MS = 45_000
const MAX_ATTEMPTS = 2
const REPORTS_ROOT = join(process.cwd(), 'reports', 'daily-monitor')

const brands = [
  ['Shopify', 'https://www.shopify.com', 'ecommerce platform', ['Wix', 'BigCommerce', 'Squarespace']],
  ['Canva', 'https://www.canva.com', 'design tool', ['Adobe Express', 'Figma', 'Visme']],
  ['Notion', 'https://www.notion.com', 'productivity software', ['Coda', 'ClickUp', 'Asana']],
  ['Beehiiv', 'https://www.beehiiv.com', 'newsletter platform', ['Substack', 'Kit', 'Mailchimp']],
  ['LLMLens', 'https://llmlens-sigma.vercel.app', 'AI search visibility checker', ['Profound', 'Peec AI', 'Otterly AI']],
].map(([brandName, websiteUrl, industry, competitors]) => ({
  brandName,
  websiteUrl,
  industry,
  competitors,
  targetCountry: 'United States',
  targetLanguage: 'English',
  numberOfPrompts: 3,
  searchEngine: 'perplexity',
}))

const delay = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds))

const cleanText = (value) => value.trim().replace(/\s+/g, ' ')

const normalizeIndustry = (industry) =>
  industry
    .replace(/\bsoftware software\b/gi, 'software')
    .replace(/\btool tool\b/gi, 'tool')
    .replace(/\s+/g, ' ')
    .trim()

const getToolCategory = (industry) => {
  const normalized = industry.toLowerCase()
  if (normalized.endsWith('tools') || normalized.endsWith('platforms') || normalized.endsWith('apps')) return industry
  if (normalized.endsWith('tool') || normalized.endsWith('platform')) return `${industry}s`
  return `${industry} tools`
}

const getUseCase = (industry) => {
  const normalized = industry.toLowerCase()
  if (normalized.includes('ecommerce') || normalized.includes('shop')) return 'selling products online'
  if (normalized.includes('design') || normalized.includes('creative')) return 'creating marketing visuals'
  if (normalized.includes('productivity') || normalized.includes('project')) return 'organizing team work'
  if (normalized.includes('search') || normalized.includes('visibility')) return 'tracking AI search visibility'
  return `solving ${industry} workflows`
}

const getAudience = (industry) => {
  const normalized = industry.toLowerCase()
  if (normalized.includes('ecommerce') || normalized.includes('shop')) return 'online sellers'
  if (normalized.includes('design') || normalized.includes('creative')) return 'small marketing teams'
  if (normalized.includes('productivity') || normalized.includes('project')) return 'small teams'
  if (normalized.includes('search') || normalized.includes('visibility')) return 'small website owners'
  return 'small businesses'
}

// Kept in sync with the first three templates in src/lib/promptGenerator.ts.
const generateThreePrompts = (input) => {
  const industry = normalizeIndustry(cleanText(input.industry))
  const toolCategory = getToolCategory(industry)
  const useCase = getUseCase(industry)
  const audience = getAudience(industry)
  return [
    ['best-tools', `What are the best ${toolCategory} for small businesses?`],
    ['buyer-intent', `Best ${industry} for ${useCase}`],
    ['best-tools', `Which ${toolCategory} are recommended for ${audience}?`],
  ].map(([intent, text], index) => ({ id: `prompt-${index + 1}`, intent, text }))
}

const normalizeHostname = (value) => {
  try {
    return new URL(value.includes('://') ? value : `https://${value}`).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return value.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split(/[/?#]/)[0].toLowerCase()
  }
}

const unique = (values) => [...new Set(values.filter(Boolean))]

const calculateMetrics = (input, results) => {
  const total = results.length || 1
  const mentionRate = Math.round((results.filter((result) => result.mentionedBrand).length / total) * 100)
  const citationRate = Math.round((results.filter((result) => result.citedDomain).length / total) * 100)
  const recommendationRate = Math.round((results.filter((result) => result.recommendationSignal ?? result.recommendationPosition !== null).length / total) * 100)
  const positions = results.map((result) => result.recommendationPosition).filter((position) => Number.isFinite(position))
  const averagePosition = positions.length ? Math.round((positions.reduce((sum, position) => sum + position, 0) / positions.length) * 10) / 10 : null
  const positionSignal = averagePosition === null ? 0 : Math.max(0, (4 - averagePosition) / 3)
  const score = Math.min(100, Math.max(0, Math.round((mentionRate / 100) * 35 + (citationRate / 100) * 25 + (recommendationRate / 100) * 25 + positionSignal * 15)))
  const competitorShare = Object.fromEntries(input.competitors.map((competitor) => [competitor, results.filter((result) => result.competitorsMentioned?.includes(competitor)).length]))
  return { score, mentionRate, citationRate, recommendationRate, averagePosition, competitorShare }
}

const requestAudit = async (input, accessCode) => {
  const prompts = generateThreePrompts(input)
  let lastError = 'Unknown request error.'
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, prompts, accessCode }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.results) {
        throw new Error(payload?.error || `Request failed with status ${response.status}.`)
      }
      const results = payload.results
      return {
        input,
        expectedDomain: normalizeHostname(input.websiteUrl),
        matchedSourceDomains: unique(results.flatMap((result) => result.matchedSourceDomains ?? [])),
        sources: unique(results.flatMap((result) => result.sourceUrls ?? result.citations ?? [])),
        promptResults: results,
        metrics: calculateMetrics(input, results),
        request: { status: 'success', attempts: attempt },
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown request error.'
      if (attempt < MAX_ATTEMPTS) await delay(REQUEST_DELAY_MS)
    }
  }
  return {
    input,
    expectedDomain: normalizeHostname(input.websiteUrl),
    matchedSourceDomains: [],
    sources: [],
    promptResults: [],
    metrics: null,
    request: { status: 'failed', attempts: MAX_ATTEMPTS, error: lastError },
  }
}

const getPreviousResults = async (currentDate) => {
  const dates = await readdir(REPORTS_ROOT, { withFileTypes: true }).catch(() => [])
  const previousDate = dates.filter((entry) => entry.isDirectory() && entry.name < currentDate).map((entry) => entry.name).sort().at(-1)
  if (!previousDate) return null
  try {
    return JSON.parse(await readFile(join(REPORTS_ROOT, previousDate, 'audit-results.json'), 'utf8'))
  } catch {
    return null
  }
}

const formatPercent = (value) => value === null || value === undefined ? 'N/A' : `${value}%`
const change = (current, previous) => previous === null || previous === undefined || current === null || current === undefined ? 'N/A' : `${current - previous >= 0 ? '+' : ''}${current - previous}`

const buildReport = (report, previous) => {
  const successful = report.brands.filter((brand) => brand.request.status === 'success')
  const failed = report.brands.length - successful.length
  const sorted = [...successful].sort((a, b) => b.metrics.score - a.metrics.score)
  const cited = successful.filter((brand) => brand.matchedSourceDomains.length > 0).map((brand) => brand.input.brandName)
  const failures = report.brands.filter((brand) => brand.request.status === 'failed').map((brand) => `${brand.input.brandName}: ${brand.request.error}`)
  const previousByBrand = new Map((previous?.brands ?? []).map((brand) => [brand.input.brandName, brand]))
  const lines = [
    '# LLM Lens Daily Visibility Report', '', '## Executive Summary',
    `- Successful brands: ${successful.length}`, `- Failed brands: ${failed}`,
    `- Highest visibility: ${sorted[0] ? `${sorted[0].input.brandName} (${sorted[0].metrics.score})` : 'N/A'}`,
    `- Lowest visibility: ${sorted.at(-1) ? `${sorted.at(-1).input.brandName} (${sorted.at(-1).metrics.score})` : 'N/A'}`,
    `- Official website citation positives: ${cited.length ? cited.join(', ') : 'None'}`,
    `- Main exceptions: ${failures.length ? failures.join('; ') : 'None'}`, '', '## Brand Results', '',
  ]
  for (const brand of report.brands) {
    lines.push(`### ${brand.input.brandName}`)
    if (brand.request.status === 'failed') {
      lines.push(`- Request status: Failed (${brand.request.error})`, '')
      continue
    }
    lines.push(`- Score: ${brand.metrics.score}`, `- Mention Rate: ${formatPercent(brand.metrics.mentionRate)}`, `- Citation Rate: ${formatPercent(brand.metrics.citationRate)}`, `- Recommendation Rate: ${formatPercent(brand.metrics.recommendationRate)}`, `- Matched domains: ${brand.matchedSourceDomains.join(', ') || 'None'}`, `- Main competitors: ${Object.entries(brand.metrics.competitorShare).filter(([, count]) => count > 0).map(([name, count]) => `${name} (${count})`).join(', ') || 'None'}`, `- Important sources: ${brand.sources.join(', ') || 'None'}`, '')
  }
  lines.push('## Changes Since Previous Run', '')
  if (!previous) {
    lines.push('- First recorded run. No prior report is available for comparison.', '')
  } else {
    for (const brand of report.brands) {
      const prior = previousByBrand.get(brand.input.brandName)
      lines.push(`### ${brand.input.brandName}`)
      if (!prior || brand.request.status !== 'success' || prior.request?.status !== 'success') {
        lines.push('- Comparison unavailable because a successful matching run is not available.', '')
        continue
      }
      const addedDomains = brand.matchedSourceDomains.filter((domain) => !prior.matchedSourceDomains.includes(domain))
      const removedDomains = prior.matchedSourceDomains.filter((domain) => !brand.matchedSourceDomains.includes(domain))
      const currentCompetitors = Object.entries(brand.metrics.competitorShare).filter(([, count]) => count > 0).map(([name]) => name)
      const priorCompetitors = Object.entries(prior.metrics.competitorShare ?? {}).filter(([, count]) => count > 0).map(([name]) => name)
      lines.push(`- Score delta: ${change(brand.metrics.score, prior.metrics.score)}`, `- Mention Rate delta: ${change(brand.metrics.mentionRate, prior.metrics.mentionRate)} pp`, `- Citation Rate delta: ${change(brand.metrics.citationRate, prior.metrics.citationRate)} pp`, `- Recommendation Rate delta: ${change(brand.metrics.recommendationRate, prior.metrics.recommendationRate)} pp`, `- New matched domains: ${addedDomains.join(', ') || 'None'}`, `- Disappeared matched domains: ${removedDomains.join(', ') || 'None'}`, `- Newly observed main competitors: ${currentCompetitors.filter((name) => !priorCompetitors.includes(name)).join(', ') || 'None'}`, '')
    }
  }
  lines.push('Daily results may be affected by AI response variance; a single-day change does not necessarily represent a long-term trend.', '')
  return lines.join('\n')
}

const main = async () => {
  const accessCode = process.env.LLM_LENS_ACCESS_CODE?.trim()
  if (!accessCode) {
    console.error('LLM_LENS_ACCESS_CODE is not configured.')
    process.exitCode = 1
    return
  }
  const currentDate = new Date().toISOString().slice(0, 10)
  const outputDirectory = join(REPORTS_ROOT, currentDate)
  const previous = await getPreviousResults(currentDate)
  const results = []
  for (const input of brands) {
    results.push(await requestAudit(input, accessCode))
    if (results.length < brands.length) await delay(REQUEST_DELAY_MS)
  }
  const report = { generatedAt: new Date().toISOString(), monitorVersion: MONITOR_VERSION, apiUrl: API_URL, brands: results }
  await mkdir(outputDirectory, { recursive: true })
  await writeFile(join(outputDirectory, 'audit-results.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  await writeFile(join(outputDirectory, 'audit-report.md'), buildReport(report, previous), 'utf8')
  console.log(`Daily visibility report saved to ${outputDirectory}`)
  console.log(`Completed: ${results.filter((brand) => brand.request.status === 'success').length} successful, ${results.filter((brand) => brand.request.status === 'failed').length} failed.`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Daily monitor failed.')
  process.exitCode = 1
})
