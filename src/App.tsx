import { type FormEvent, useMemo, useState } from 'react'
import { runPerplexityAnalyzer } from './lib/analyzerClient'
import {
  buildAuditJson,
  buildAuditMarkdown,
  buildAuditSummaryText,
  buildExportFilename,
} from './lib/exportResult'
import { generatePrompts } from './lib/promptGenerator'
import { runMockAnalyzer } from './lib/mockAnalyzer'
import { buildAuditResult } from './lib/scoring'
import type { AuditFormInput, AuditResult, SearchEngine } from './lib/types'

const DEFAULT_FORM = {
  brandName: '',
  websiteUrl: '',
  industry: '',
  targetCountry: 'United States',
  targetLanguage: 'English',
  competitors: '',
  numberOfPrompts: 3,
  searchEngine: 'mock' as SearchEngine,
  accessCode: '',
}

type FormState = typeof DEFAULT_FORM

const parseCompetitors = (value: string): string[] =>
  value
    .split(/[\n,]+/)
    .map((competitor) => competitor.trim())
    .filter(Boolean)

const getMaxPromptCount = (engine: SearchEngine) =>
  engine === 'perplexity' ? 5 : 20

const clampPromptCount = (value: number, engine: SearchEngine) =>
  Math.min(getMaxPromptCount(engine), Math.max(1, value))

const formatPosition = (position: number | null, engine: SearchEngine) =>
  position === null && engine === 'perplexity'
    ? 'Not measured'
    : position === null
      ? 'Not found'
      : `#${position}`

const formatAveragePosition = (position: number | null, engine: SearchEngine) =>
  position === null && engine === 'perplexity'
    ? 'Not measured'
    : position === null
      ? 'Not found'
      : `#${position}`

const getPromptSourceUrls = (prompt: AuditResult['results'][number]) =>
  prompt.sourceUrls.length > 0 ? prompt.sourceUrls : (prompt.citations ?? [])

const getPromptSourceDomains = (prompt: AuditResult['results'][number]) =>
  prompt.sourceDomains.length > 0
    ? prompt.sourceDomains
    : getPromptSourceUrls(prompt).map(formatSourceHostname)

const hasRecommendationSignal = (prompt: AuditResult['results'][number]) =>
  prompt.recommendationSignal ?? (prompt.recommendationPosition !== null)

const formatSourceHostname = (sourceUrl: string) => {
  try {
    return new URL(sourceUrl).hostname.replace(/^www\./, '')
  } catch {
    return sourceUrl
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .split('/')[0]
  }
}

const getResultExpectedDomain = (result: AuditResult) =>
  result.results.find((prompt) => prompt.expectedDomain)?.expectedDomain ??
  formatSourceHostname(result.input.websiteUrl)

const getResultSourceDomains = (result: AuditResult) =>
  Array.from(
    new Set(result.results.flatMap((prompt) => getPromptSourceDomains(prompt))),
  )

const getResultMatchedDomains = (result: AuditResult) =>
  Array.from(
    new Set(
      result.results.flatMap((prompt) => prompt.matchedSourceDomains),
    ),
  )

const sourceDomainMatchesPrompt = (
  sourceUrl: string,
  prompt: AuditResult['results'][number],
) => prompt.matchedSourceDomains.includes(formatSourceHostname(sourceUrl))

const downloadTextFile = (
  filename: string,
  content: string,
  mimeType: string,
) => {
  const blob = new Blob([content], { type: mimeType })
  const downloadUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = downloadUrl
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(downloadUrl)
}

const buildResultExplanation = (result: AuditResult) => {
  const { metrics } = result
  const isPerplexity = result.input.searchEngine === 'perplexity'
  const expectedDomain = getResultExpectedDomain(result)
  const matchedDomains = getResultMatchedDomains(result)
  const notes = [
    isPerplexity
      ? 'This score is a visibility estimate based on live Perplexity API responses. It is not an exact ranking.'
      : 'This score is a mock visibility estimate based on deterministic sample results. It is not an exact ranking.',
    'The score combines mention, citation, and recommendation signals from the sampled prompts.',
  ]

  if (metrics.mentionRate > 0 && metrics.citationRate === 0) {
    notes.push(
      'Your brand was mentioned, but the official website was not used as a source. This often means AI systems know the brand through third-party pages.',
    )
  }

  if (metrics.score === 0) {
    notes.push(
      'The brand was not detected in the sampled prompts. This may be due to prompt wording, AI answer variance, or low brand visibility.',
    )
  }

  if (metrics.citationRate > 0) {
    notes.push(
      `At least one returned source URL matched the submitted domain. Matched domains: ${matchedDomains.join(', ')}.`,
    )
  } else {
    notes.push(
      `Expected domain: ${expectedDomain}. No returned source URL matched this domain.`,
    )
  }

  return notes
}

function App() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [result, setResult] = useState<AuditResult | null>(null)
  const [error, setError] = useState('')
  const [exportMessage, setExportMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const competitors = useMemo(
    () => parseCompetitors(form.competitors),
    [form.competitors],
  )

  const updateField = <Key extends keyof FormState>(
    field: Key,
    value: FormState[Key],
  ) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!form.brandName.trim() || !form.websiteUrl.trim() || !form.industry.trim()) {
      setError('Brand name, website URL, and industry / niche are required.')
      return
    }

    const searchEngine = form.searchEngine
    const input: AuditFormInput = {
      brandName: form.brandName.trim(),
      websiteUrl: form.websiteUrl.trim(),
      industry: form.industry.trim(),
      targetCountry: form.targetCountry.trim() || 'United States',
      targetLanguage: form.targetLanguage.trim() || 'English',
      competitors,
      numberOfPrompts: clampPromptCount(form.numberOfPrompts, searchEngine),
      searchEngine,
    }

    const prompts = generatePrompts(input)
    const analyzedPrompts =
      searchEngine === 'perplexity' ? prompts.slice(0, 5) : prompts

    setError('')
    setExportMessage('')
    setIsLoading(true)

    try {
      const promptResults =
        searchEngine === 'perplexity'
          ? await runPerplexityAnalyzer({
              input,
              prompts: analyzedPrompts,
              accessCode: form.accessCode.trim() || undefined,
            })
          : runMockAnalyzer(input, analyzedPrompts)

      setResult(buildAuditResult(input, analyzedPrompts, promptResults))
    } catch (caughtError) {
      setResult(null)
      setExportMessage('')
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'The audit failed. Please try again later.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  const isPerplexityMode = form.searchEngine === 'perplexity'
  const submitLabel = isPerplexityMode
    ? 'Run Perplexity audit'
    : 'Run mock audit'
  const formTitle = isPerplexityMode
    ? 'Start a Perplexity audit'
    : 'Start a mock audit'
  const modeBadge = isPerplexityMode ? 'Real API mode' : 'Mock mode'

  const handleCopySummary = async (auditResult: AuditResult) => {
    try {
      await navigator.clipboard.writeText(buildAuditSummaryText(auditResult))
      setExportMessage('Summary copied.')
    } catch {
      setExportMessage('Copy failed. You can still download the report.')
    }
  }

  const handleDownloadMarkdown = (auditResult: AuditResult) => {
    downloadTextFile(
      buildExportFilename(auditResult, 'md'),
      buildAuditMarkdown(auditResult),
      'text/markdown;charset=utf-8',
    )
    setExportMessage('Markdown report downloaded.')
  }

  const handleDownloadJson = (auditResult: AuditResult) => {
    downloadTextFile(
      buildExportFilename(auditResult, 'json'),
      buildAuditJson(auditResult),
      'application/json;charset=utf-8',
    )
    setExportMessage('JSON report downloaded.')
  }

  return (
    <main className="app-shell">
      <nav className="top-nav" aria-label="Primary navigation">
        <a className="nav-brand" href="/">
          LLM Lens
        </a>
        <span className="nav-badge">{modeBadge}</span>
      </nav>

      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">AI visibility audit</p>
          <h1>AI Search Visibility Checker</h1>
          <p className="hero-lede">
            Estimate whether AI search-style answers mention your brand, cite
            your official website, or recommend you in relevant buying contexts.
          </p>
          <div className="hero-actions">
            <a href="#audit-form" className="primary-link">
              {submitLabel}
            </a>
            <span className="mode-note">
              {isPerplexityMode
                ? 'Real API mode · Uses Perplexity Sonar · Limited to 5 prompts'
                : 'Mock mode only · No real API calls'}
            </span>
          </div>
        </div>
      </section>

      <section className="form-section">
        <form id="audit-form" className="audit-form" onSubmit={handleSubmit}>
          <div>
            <p className="eyebrow">{formTitle}</p>
            <h2>{formTitle}</h2>
            <p className="muted">
              {isPerplexityMode
                ? 'Run a limited live Perplexity audit using sampled prompts and source URL checks.'
                : 'Enter your brand, website, and niche to run a sampled AI visibility audit.'}
            </p>
          </div>

          <label>
            Brand name
            <input
              required
              value={form.brandName}
              onChange={(event) => updateField('brandName', event.target.value)}
              placeholder="ExampleTool"
            />
          </label>

          <label>
            Website URL
            <input
              required
              value={form.websiteUrl}
              onChange={(event) => updateField('websiteUrl', event.target.value)}
              placeholder="https://example.com"
              type="url"
            />
          </label>

          <label>
            Industry / niche
            <input
              required
              value={form.industry}
              onChange={(event) => updateField('industry', event.target.value)}
              placeholder="Etsy fee calculator"
            />
          </label>

          <div className="field-row">
            <label>
              Target country
              <input
                value={form.targetCountry}
                onChange={(event) =>
                  updateField('targetCountry', event.target.value)
                }
              />
            </label>
            <label>
              Target language
              <input
                value={form.targetLanguage}
                onChange={(event) =>
                  updateField('targetLanguage', event.target.value)
                }
              />
            </label>
          </div>

          <label>
            Competitors
            <textarea
              value={form.competitors}
              onChange={(event) => updateField('competitors', event.target.value)}
              placeholder="Competitor A, Competitor B&#10;Competitor C"
              rows={4}
            />
            <span className="help-text">
              Optional. Add one per line or separate with commas.
            </span>
          </label>

          <div className="field-row">
            <label>
              Number of prompts
              <input
                min={1}
                max={getMaxPromptCount(form.searchEngine)}
                type="number"
                value={form.numberOfPrompts}
                onChange={(event) =>
                  updateField(
                    'numberOfPrompts',
                    clampPromptCount(
                      Number(event.target.value),
                      form.searchEngine,
                    ),
                  )
                }
              />
              <span className="help-text prompt-help">
                1 prompt = quick snapshot. 3 prompts = recommended mini audit.
                More prompts may use more API credits.
                {isPerplexityMode ? (
                  <strong>Recommended: 3 prompts</strong>
                ) : null}
              </span>
            </label>
            <fieldset>
              <legend>Search engine</legend>
              <label className="radio-option">
                <input
                  checked={form.searchEngine === 'mock'}
                  name="searchEngine"
                  onChange={() => updateField('searchEngine', 'mock')}
                  type="radio"
                />
                Mock mode
              </label>
              <label className="radio-option">
                <input
                  checked={form.searchEngine === 'perplexity'}
                  name="searchEngine"
                  onChange={() =>
                    setForm((current) => ({
                      ...current,
                      searchEngine: 'perplexity',
                      numberOfPrompts: clampPromptCount(
                        current.numberOfPrompts,
                        'perplexity',
                      ),
                    }))
                  }
                  type="radio"
                />
                Perplexity <span>Sonar | Access-code beta</span>
              </label>
              <label className="radio-option disabled">
                <input disabled name="searchEngine" type="radio" />
                Gemini <span>Coming soon</span>
              </label>
            </fieldset>
          </div>

          <p className="mode-callout">
            {isPerplexityMode
              ? 'Real API mode uses live Perplexity responses and may consume API credits. Keep tests small. Live Perplexity audits are currently available to invited testers.'
              : 'Mock mode uses deterministic sample results and does not call external APIs.'}
          </p>

          {isPerplexityMode ? (
            <label>
              Access code
              <input
                autoComplete="off"
                value={form.accessCode}
                onChange={(event) =>
                  updateField('accessCode', event.target.value)
                }
                placeholder="Access code"
                type="password"
              />
              <span className="help-text">
                Required for live Perplexity audits when enabled. This access code is for the limited beta and is not an account password.
              </span>
            </label>
          ) : null}

          {error ? <p className="form-error">{error}</p> : null}

          <button disabled={isLoading} type="submit">
            {isLoading ? 'Running audit...' : submitLabel}
          </button>
        </form>
      </section>

      <section className="results-section">
        <section className="results-panel" aria-live="polite">
          {result ? (
            <>
              <div className="result-header">
                <p className="eyebrow">
                  {result.input.searchEngine === 'perplexity'
                    ? 'Perplexity Sonar result'
                    : 'Mock audit result'}
                </p>
                <h2>{result.input.brandName} visibility estimate</h2>
                <p className="muted">
                  {result.input.searchEngine === 'perplexity'
                    ? 'Engine: Perplexity Sonar. These results are based on live API responses, but AI answers may vary.'
                    : 'These results are deterministic mock signals, not live AI search engine output.'}
                </p>
                <div className="export-actions" aria-label="Export audit result">
                  <button
                    onClick={() => void handleCopySummary(result)}
                    type="button"
                  >
                    Copy summary
                  </button>
                  <button
                    onClick={() => handleDownloadMarkdown(result)}
                    type="button"
                  >
                    Download Markdown
                  </button>
                  <button
                    onClick={() => handleDownloadJson(result)}
                    type="button"
                  >
                    Download JSON
                  </button>
                </div>
                {exportMessage ? (
                  <p className="export-message">{exportMessage}</p>
                ) : null}
              </div>

              <div className="score-card">
                <span>AI Visibility Score</span>
                <strong>{result.metrics.score}</strong>
                <p>
                  {result.input.searchEngine === 'perplexity'
                    ? '0-100 visibility estimate'
                    : '0-100 mock estimate'}
                </p>
              </div>

              <div className="metric-grid">
                <article>
                  <span>Mention Rate</span>
                  <strong>{result.metrics.mentionRate}%</strong>
                </article>
                <article>
                  <span>Citation Rate</span>
                  <strong>{result.metrics.citationRate}%</strong>
                </article>
                <article>
                  <span>Recommendation Rate</span>
                  <strong>{result.metrics.recommendationRate}%</strong>
                </article>
                <article>
                  <span>Average Position</span>
                  <strong>
                    {formatAveragePosition(
                      result.metrics.averagePosition,
                      result.input.searchEngine,
                    )}
                  </strong>
                </article>
              </div>

              <div className="explanation-grid">
                <article className="explanation-card">
                  <h3>What this score means</h3>
                  <ul>
                    {buildResultExplanation(result).map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </article>
                <article className="explanation-card">
                  <h3>Signal breakdown</h3>
                  <dl>
                    <div>
                      <dt>Mention Rate</dt>
                      <dd>
                        Whether the AI answer text mentions your brand in the
                        sampled prompts.
                      </dd>
                    </div>
                    <div>
                      <dt>Citation Rate</dt>
                      <dd>
                        Whether the returned source URLs include the submitted
                        website domain.
                      </dd>
                    </div>
                    <div>
                      <dt>Recommendation Rate</dt>
                      <dd>
                        Recommendation Signal checks whether the brand appears
                        near stronger recommendation language. It is a
                        contextual signal, not a guaranteed ranking.
                      </dd>
                    </div>
                  </dl>
                </article>
              </div>

              <div className="domain-diagnostics">
                <h3>Citation domain diagnostics</h3>
                <dl>
                  <div>
                    <dt>Expected domain</dt>
                    <dd>{getResultExpectedDomain(result)}</dd>
                  </div>
                  <div>
                    <dt>Source domains</dt>
                    <dd>
                      {getResultSourceDomains(result).length > 0
                        ? getResultSourceDomains(result).join(', ')
                        : 'None'}
                    </dd>
                  </div>
                  <div>
                    <dt>Matched source domains</dt>
                    <dd>
                      {getResultMatchedDomains(result).length > 0
                        ? getResultMatchedDomains(result).join(', ')
                        : 'None'}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="insight-section">
                <h3>Competitor appearance counts</h3>
                {Object.keys(result.metrics.competitorShare).length > 0 ? (
                  <div className="competitor-list">
                    {Object.entries(result.metrics.competitorShare).map(
                      ([competitor, count]) => (
                        <span key={competitor}>
                          {competitor}: <b>{count}</b>
                        </span>
                      ),
                    )}
                  </div>
                ) : (
                  <p className="muted">No competitors were provided.</p>
                )}
              </div>

              <div className="insight-section">
                <h3>Prompts where your brand was not mentioned</h3>
                {result.missingBrandPrompts.length > 0 ? (
                  <ul>
                    {result.missingBrandPrompts.map((prompt) => (
                      <li key={prompt.promptId}>{prompt.promptText}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">
                    {result.input.searchEngine === 'perplexity'
                      ? 'The brand appeared in every analyzed prompt result.'
                      : 'The brand appeared in every generated mock prompt result.'}
                  </p>
                )}
              </div>

              <div className="insight-section">
                <h3>Competitors appeared but your brand did not</h3>
                {result.competitorOnlyPrompts.length > 0 ? (
                  <ul>
                    {result.competitorOnlyPrompts.map((prompt) => (
                      <li key={prompt.promptId}>
                        {prompt.promptText} -{' '}
                        {prompt.competitorsMentioned.join(', ')}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">
                    {result.input.searchEngine === 'perplexity'
                      ? 'No competitor-only prompts were found in this audit.'
                      : 'No competitor-only prompts were found in this mock audit.'}
                  </p>
                )}
              </div>

              <div className="insight-section">
                <h3>Conservative recommendations</h3>
                <ul>
                  {result.recommendations.map((recommendation) => (
                    <li key={recommendation}>{recommendation}</li>
                  ))}
                </ul>
              </div>

              <div className="table-wrap">
                <table>
                  <colgroup>
                    <col className="prompt-col" />
                    <col className="engine-col" />
                    <col className="flag-col" />
                    <col className="flag-col" />
                    <col className="signal-col" />
                    <col className="position-col" />
                    <col className="competitors-col" />
                    <col className="sources-col" />
                    <col className="summary-col" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Prompt</th>
                      <th>Engine</th>
                      <th>Mentioned</th>
                      <th>Cited</th>
                      <th>Recommendation Signal</th>
                      <th>Position</th>
                      <th>Competitors</th>
                      <th>Sources</th>
                      <th>Summary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.results.map((prompt) => (
                      <tr key={prompt.promptId}>
                        <td data-label="Prompt">{prompt.promptText}</td>
                        <td data-label="Engine">
                          {prompt.engine === 'perplexity'
                            ? 'Perplexity Sonar'
                            : 'Mock mode'}
                        </td>
                        <td data-label="Mentioned">
                          {prompt.mentionedBrand ? 'Yes' : 'No'}
                        </td>
                        <td data-label="Cited">
                          {prompt.citedDomain ? 'Yes' : 'No'}
                        </td>
                        <td data-label="Recommendation Signal">
                          {hasRecommendationSignal(prompt) ? 'Yes' : 'No'}
                        </td>
                        <td data-label="Position">
                          {formatPosition(
                            prompt.recommendationPosition,
                            prompt.engine,
                          )}
                        </td>
                        <td data-label="Competitors">
                          {prompt.competitorsMentioned.join(', ') || 'None'}
                        </td>
                        <td data-label="Sources">
                          {getPromptSourceUrls(prompt).length > 0 ? (
                            <ul className="source-list">
                              {getPromptSourceUrls(prompt)
                                .slice(0, 3)
                                .map((sourceUrl) => (
                                  <li key={sourceUrl}>
                                    <a
                                      href={sourceUrl}
                                      rel="noreferrer"
                                      target="_blank"
                                    >
                                      {formatSourceHostname(sourceUrl)}
                                      {sourceDomainMatchesPrompt(
                                        sourceUrl,
                                        prompt,
                                      ) ? (
                                        <span className="source-match">
                                          {' '}
                                          ✓
                                        </span>
                                      ) : null}
                                    </a>
                                  </li>
                                ))}
                            </ul>
                          ) : (
                            'None'
                          )}
                        </td>
                        <td data-label="Summary">{prompt.answerSummary}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <p>
                Run an audit to see visibility score, mention rate, citations,
                competitor appearances, and prompt-level findings.
              </p>
            </div>
          )}
        </section>
      </section>

      <section className="section intro-section">
        <div>
          <p className="eyebrow">Product overview</p>
          <h2>Separate brand mentions from official website citations.</h2>
        </div>
        <p>
          LLM Lens helps small teams review prompt-level visibility signals:
          brand mentions, official website citations, recommendation context,
          competitor appearances, and source domains. Mock mode uses
          deterministic sample data, while Perplexity mode uses live API
          responses for a limited diagnostic audit.
        </p>
      </section>

      <section className="section faq-section">
        <div>
          <p className="eyebrow">FAQ</p>
          <h2>Common questions</h2>
        </div>
        <div className="faq-grid">
          <article>
            <h3>What is AI search visibility?</h3>
            <p>
              It is a practical way to review whether AI-style answers mention,
              cite, or recommend a brand for relevant prompts.
            </p>
          </article>
          <article>
            <h3>Is this using real AI search data?</h3>
            <p>
              Mock mode uses deterministic sample data. Perplexity mode uses
              live API responses.
            </p>
          </article>
          <article>
            <h3>Does a brand mention mean my website was cited?</h3>
            <p>
              No. An AI answer can mention a brand while citing third-party
              sources. LLM Lens separates Mention Rate from Citation Rate so you
              can see whether returned source URLs matched your submitted
              domain.
            </p>
          </article>
          <article>
            <h3>Can this guarantee recommendations?</h3>
            <p>
              No. LLM Lens provides visibility estimates and content ideas. It
              does not guarantee ranking, citations, or recommendations.
            </p>
          </article>
          <article>
            <h3>Which engines are planned?</h3>
            <p>
              Perplexity Sonar is available as a limited real API mode. Gemini
              remains planned for a later version.
            </p>
          </article>
        </div>
      </section>

      <section className="disclaimer">
        <h2>Disclaimer</h2>
        <p>
          Mock results do not represent real AI search engine output. Perplexity
          results are based on live API responses, but AI answers may vary.
          Scores are estimates for diagnostic review. They are not rankings,
          traffic forecasts, or proof that an AI system will cite or recommend a
          brand.
        </p>
        <p className="privacy-link">
          <a href="/privacy.html">Privacy</a>
        </p>
      </section>
    </main>
  )
}

export default App
