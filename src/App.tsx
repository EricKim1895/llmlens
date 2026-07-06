import { type FormEvent, useMemo, useState } from 'react'
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
  numberOfPrompts: 10,
  searchEngine: 'mock' as SearchEngine,
}

type FormState = typeof DEFAULT_FORM

const parseCompetitors = (value: string): string[] =>
  value
    .split(/[\n,]+/)
    .map((competitor) => competitor.trim())
    .filter(Boolean)

const clampPromptCount = (value: number) => Math.min(20, Math.max(5, value))

const formatPosition = (position: number | null) =>
  position === null ? 'Not found' : `#${position}`

const formatAveragePosition = (position: number | null) =>
  position === null ? 'Not found' : `#${position}`

function App() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [result, setResult] = useState<AuditResult | null>(null)
  const [error, setError] = useState('')

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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!form.brandName.trim() || !form.websiteUrl.trim() || !form.industry.trim()) {
      setError('Brand name, website URL, and industry / niche are required.')
      return
    }

    const input: AuditFormInput = {
      brandName: form.brandName.trim(),
      websiteUrl: form.websiteUrl.trim(),
      industry: form.industry.trim(),
      targetCountry: form.targetCountry.trim() || 'United States',
      targetLanguage: form.targetLanguage.trim() || 'English',
      competitors,
      numberOfPrompts: clampPromptCount(form.numberOfPrompts),
      searchEngine: 'mock',
    }

    const prompts = generatePrompts(input)
    const promptResults = runMockAnalyzer(input, prompts)

    setError('')
    setResult(buildAuditResult(input, prompts, promptResults))
  }

  return (
    <main className="app-shell">
      <nav className="top-nav" aria-label="Primary navigation">
        <a className="nav-brand" href="/">
          LLM Lens
        </a>
        <span className="nav-badge">Mock MVP</span>
      </nav>

      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">AI visibility audit</p>
          <h1>AI Search Visibility Checker</h1>
          <p className="hero-lede">
            Estimate whether your brand is mentioned, cited,
            <br className="desktop-break" /> or recommended in AI search-style
            answers.
          </p>
          <div className="hero-actions">
            <a href="#audit-form" className="primary-link">
              Run mock audit
            </a>
            <span className="mode-note">Mock mode only · No real API calls</span>
          </div>
        </div>
      </section>

      <section className="form-section">
        <form id="audit-form" className="audit-form" onSubmit={handleSubmit}>
          <div>
            <p className="eyebrow">Start a mock audit</p>
            <h2>Start a mock audit</h2>
            <p className="muted">
              Enter your brand, website, and niche to generate deterministic
              mock visibility signals.
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
                min={5}
                max={20}
                type="number"
                value={form.numberOfPrompts}
                onChange={(event) =>
                  updateField(
                    'numberOfPrompts',
                    clampPromptCount(Number(event.target.value)),
                  )
                }
              />
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
              <label className="radio-option disabled">
                <input disabled name="searchEngine" type="radio" />
                Perplexity <span>Coming soon</span>
              </label>
              <label className="radio-option disabled">
                <input disabled name="searchEngine" type="radio" />
                Gemini <span>Coming soon</span>
              </label>
            </fieldset>
          </div>

          {error ? <p className="form-error">{error}</p> : null}

          <button type="submit">Run mock audit</button>
        </form>
      </section>

      <section className="results-section">
        <section className="results-panel" aria-live="polite">
          {result ? (
            <>
              <div className="result-header">
                <p className="eyebrow">Mock audit result</p>
                <h2>{result.input.brandName} visibility estimate</h2>
                <p className="muted">
                  These results are deterministic mock signals, not live AI
                  search engine output.
                </p>
              </div>

              <div className="score-card">
                <span>AI Visibility Score</span>
                <strong>{result.metrics.score}</strong>
                <p>0-100 mock estimate</p>
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
                    {formatAveragePosition(result.metrics.averagePosition)}
                  </strong>
                </article>
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
                    The brand appeared in every generated mock prompt result.
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
                    No competitor-only prompts were found in this mock audit.
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
                  <thead>
                    <tr>
                      <th>Prompt</th>
                      <th>Engine</th>
                      <th>Mentioned</th>
                      <th>Cited</th>
                      <th>Position</th>
                      <th>Competitors</th>
                      <th>Summary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.results.map((prompt) => (
                      <tr key={prompt.promptId}>
                        <td data-label="Prompt">{prompt.promptText}</td>
                        <td data-label="Engine">Mock mode</td>
                        <td data-label="Mentioned">
                          {prompt.mentionedBrand ? 'Yes' : 'No'}
                        </td>
                        <td data-label="Cited">
                          {prompt.citedDomain ? 'Yes' : 'No'}
                        </td>
                        <td data-label="Position">
                          {formatPosition(prompt.recommendationPosition)}
                        </td>
                        <td data-label="Competitors">
                          {prompt.competitorsMentioned.join(', ') || 'None'}
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
                Run a mock audit to see visibility score, mention rate,
                citations, competitor appearances, and prompt-level findings.
              </p>
            </div>
          )}
        </section>
      </section>

      <section className="section intro-section">
        <div>
          <p className="eyebrow">Product overview</p>
          <h2>Estimate how visible your site looks in AI search answers.</h2>
        </div>
        <p>
          LLM Lens helps small teams review prompt-level visibility signals:
          brand mentions, website citations, recommendation position, and
          competitor appearances. This MVP uses deterministic mock data so the
          workflow can be evaluated before connecting real AI search APIs.
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
              No. This MVP uses Mock mode so the workflow and reporting can be
              tested before live API integrations are added.
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
              Perplexity and Gemini are shown as coming soon. Future versions
              should call those APIs through a backend or serverless layer.
            </p>
          </article>
        </div>
      </section>

      <section className="disclaimer">
        <h2>Disclaimer</h2>
        <p>
          Current results are generated in Mock mode and do not represent real
          AI search engine output. Scores are estimates intended for product
          evaluation and planning, not proof of actual AI visibility.
        </p>
      </section>
    </main>
  )
}

export default App
