# LLM Lens MVP Validation Summary

## 1. Project Status

- Project name: LLM Lens
- Local path: `D:\VibeCoding\LLMLens`
- GitHub: `EricKim1895/llmlens`
- Production URL: `https://llmlens-sigma.vercel.app`
- Current indexing status: temporary `noindex, nofollow` remains enabled
- Mock mode: available
- Real Perplexity mode: available
- Mock MVP: complete
- Real Perplexity MVP: complete
- P1 prompt generation: complete
- P2 result explanation: complete
- P3 citation/domain diagnostics: complete
- P5-1 three-prompt mini audit guidance: complete
- P5-2 recommendation signal tightening: complete
- P5-3 audit result export: complete
- P5-4 product copy polish: complete
- P5-5 cost control / usage guardrails: complete
- Public indexing and large-scale external usage: not enabled

## 2. Completed Capabilities

- Vite + React + TypeScript frontend
- Deterministic mock analyzer
- Prompt generation
- AI Visibility Score and supporting metrics
- Perplexity Sonar real API mode
- Vercel serverless API
- `PERPLEXITY_API_KEY` is read only on the backend
- Frontend does not read the API key
- Frontend does not call `api.perplexity.ai` directly
- Result diagnostics: Mentioned, Cited, Recommendation Signal, Competitors, Sources, Summary
- Sources display hostnames and remain clickable
- Citation diagnostics: Expected domain, Source domains, Matched source domains
- Matched official domains are marked in the Sources column
- Default prompt count is 3 for a recommended mini audit
- Perplexity Recommendation Signal now separates ordinary mention from stronger recommendation context

## 3. Key Fix History

- `23c3156` Add Perplexity Sonar audit mode
- `a2181d3` Fix Perplexity serverless runtime import
- `b583724` Refine real API mode UI copy
- `638af04` Add Perplexity result diagnostics
- `1e53ca5` Improve result table readability
- `51e1875` Improve prompt generation quality
- `c39d4c9` Improve result explanation copy
- `e9116e7` Improve citation domain diagnostics
- `43c1847` Recommend three-prompt mini audit
- `a46066b` Place prompt count guidance near input
- `7cfaa4c` Tighten recommendation signal detection
- `cd03764` Add Perplexity usage guardrails

## 4. Real Test Results

### Shopify / ecommerce platform

- Score: 60
- Mention Rate: 100%
- Recommendation Rate: 100%
- Citation Rate: 0%
- Sources did not include `shopify.com`, so Citation Rate 0 is reasonable.

### Canva / design tool

- Score: 60
- Mention Rate: 100%
- Recommendation Rate: 100%
- Citation Rate: 0%
- Sources included `uxpilot.ai`, `lightflows.co.uk`, and `youtube.com`.
- Sources did not include `canva.com`, so Citation Rate 0 is reasonable.

### Grammarly / writing assistant

- Score: 60
- Mention Rate: 100%
- Recommendation Rate: 100%
- Citation Rate: 0%

### Notion / productivity software

- One test returned Score 0.
- This may be affected by prompt wording and normal Perplexity answer variance.

### LLMLens / AI search visibility checker

- Score: 0
- This is reasonable because the site is new and still has `noindex, nofollow`.

## 5. P1 Prompt Generation Optimization

Commit: `51e1875` Improve prompt generation quality

Changes completed:

- Prompts moved from broad generic questions to stronger commercial-intent AI search questions.
- The first prompts no longer directly include the brand name, reducing artificial Mention Rate inflation.
- Prompt generation remains deterministic and does not call external APIs.

Example prompts:

- `What are the best ecommerce platforms for small businesses?`
- `Best design tool for creating marketing visuals`
- `What are the best productivity software tools for small businesses?`

### P1 Online Test Results

Shopify / ecommerce platform:

- 1 prompt: Score 60, Mention Rate 100%, Citation Rate 0%, Recommendation Rate 100%

Canva / design tool:

- 3 prompts: Score 68, Mention Rate 100%, Citation Rate 33%, Recommendation Rate 100%

Notion / productivity software:

- 1 prompt: Score 0
- 3 prompts: Score 40, Mention Rate 67%, Citation Rate 0%, Recommendation Rate 67%

Conclusion:

- The new prompts are closer to real commercial AI search queries.
- A 1-prompt run behaves like a single AI search snapshot and can vary significantly.
- A 3-prompt run behaves more like a small-sample visibility audit and gives a more stable signal.

## 6. P2 Result Explanation Optimization

Commit: `c39d4c9` Improve result explanation copy

Changes completed:

- Added `What this score means`.
- Added `Signal breakdown`.
- Clarified that Score is a visibility estimate, not an exact ranking.
- Explained Mention, Citation, and Recommendation as separate signals.
- When Mention Rate is greater than 0 and Citation Rate is 0, the UI explains that the brand was mentioned but the official website was not cited.
- When Score is 0, the UI explains that the brand was not detected in sampled prompts.

### P2 Online Validation

Canva / design tool:

- Citation Rate: 33%
- The explanation area correctly showed that at least one source URL matched the submitted website domain.

Notion / productivity software:

- Score: 0
- The explanation area correctly showed that the sampled prompts did not detect the brand.

## 7. P3 Citation / Domain Diagnostics Optimization

Commit: `e9116e7` Improve citation domain diagnostics

Changes completed:

- Added Expected domain.
- Added Source domains.
- Added Matched source domains.
- Sources that match the submitted official website domain show a check mark in the Sources column.

Domain matching rules:

- `www` and non-`www` are normalized.
- `http` and `https` do not affect matching.
- URL path, query, and hash do not affect matching.
- `help.shopify.com` can match `shopify.com`.
- `blog.canva.com` can match `canva.com`.
- No public suffix dependency is used.

### P3 Online Validation

Canva / design tool:

- Expected domain: `canva.com`
- Matched source domains: `canva.com`
- Citation Rate: 33%
- This shows that at least one returned source URL matched the official website domain.

Notion / productivity software:

- Expected domain: `notion.com`
- Matched source domains: None
- Citation Rate: 0%
- This shows that no returned source URL matched the official website domain.

## 8. P5-1 Three-Prompt Mini Audit

Initial commit: `43c1847` Recommend three-prompt mini audit

Follow-up fix: `a46066b` Place prompt count guidance near input

Changes completed:

- Default `numberOfPrompts` changed from 10 to 3.
- Mock mode still allows 1-20 prompts.
- Perplexity mode still allows 1-5 prompts.
- Switching to Perplexity still clamps prompt count to 5 when needed.
- The UI explains:
  - `1 prompt = quick snapshot.`
  - `3 prompts = recommended mini audit.`
  - `More prompts may use more API credits.`
- Perplexity mode shows `Recommended: 3 prompts`.

Online validation:

- Production deployment was confirmed on commit `a46066b`.
- The production bundle contained `numberOfPrompts:3`.
- The prompt guidance appeared near the Number of prompts input.

## 9. P5-2 Recommendation Signal Tightening

Commit: `7cfaa4c` Tighten recommendation signal detection

Changes completed:

- `recommendationSignal` no longer uses broad full-answer keyword matching.
- The brand must be mentioned before Recommendation Signal can be true.
- Recommendation matching now checks brand-near context and the sentence containing the brand.
- Weak terms such as `option`, `alternative`, `useful`, and `consider` no longer trigger alone.
- Added a contrast guard to reduce false positives such as: `Notion was mentioned, but the top tools were ClickUp and Asana.`

No changes were made to:

- Scoring weights
- Prompt generation
- Citation/domain matching
- Perplexity API request flow
- SEO, `noindex`, robots, sitemap
- API keys or environment variables

### P5-2 Online Validation

Canva / design tool:

- Score: 52
- Mention Rate: 100%
- Citation Rate: 33%
- Recommendation Rate: 33%
- Matched domain: `canva.com`
- Judgment: ordinary mention is no longer always counted as recommendation.

Shopify / ecommerce platform:

- Score: 60
- Mention Rate: 100%
- Citation Rate: 0%
- Recommendation Rate: 100%
- Judgment: Shopify is still strongly recommended in ecommerce platform context, which is reasonable.

Beehiiv / newsletter platform:

- Score: 32
- Mention Rate: 67%
- Citation Rate: 0%
- Recommendation Rate: 33%
- Judgment: the signal is more conservative and reasonable.

Notion / productivity software:

- Score: 32
- Mention Rate: 67%
- Citation Rate: 0%
- Recommendation Rate: 33%
- Judgment: ordinary mention and recommendation are now separated more clearly.

Conclusion:

- P5-1 and P5-2 passed validation.
- Recommendation Signal should not be tightened further until more real samples are collected.
- `noindex, nofollow` should remain enabled.

## 10. P5-3 Audit Result Export

Commit: `104ab3d` Add audit result export actions

Capabilities added:

- Copy summary
- Download Markdown
- Download JSON

New file:

- `src/lib/exportResult.ts`

Implementation notes:

- Export is a frontend-only feature.
- No database is required.
- No login is required.
- Results are not saved to a server.
- No share link is generated.

### P5-3 Online Validation

Production validation confirmed:

- The production bundle contains the P5-3 export implementation.
- Export buttons are hidden before an audit result exists.
- Export buttons appear after an audit completes:
  - Copy summary
  - Download Markdown
  - Download JSON
- Copy summary works and displays `Summary copied.`
- Markdown download works with filename `llm-lens-canva-audit.md`.
- JSON download works with filename `llm-lens-canva-audit.json`.
- JSON export includes:
  - `exportedAt`
  - `exportVersion: "1"`
  - `result`
- Markdown export includes:
  - Brand
  - Website
  - Score
  - Mention Rate
  - Citation Rate
  - Recommendation Rate
  - Prompt-Level Results
  - Sources

Conclusion:

- P5-1, P5-2, and P5-3 passed validation.
- `noindex, nofollow` should remain enabled.
- Login, database, payment, public launch, and Gemini remain out of scope for now.

## 11. P5-4 Product Copy Polish

Commit: `62f3bea` Polish AI visibility product copy

Goal:

- Help first-time visitors understand the core value of LLM Lens more quickly.

Core product message:

- Whether AI search-style answers mention your brand.
- Whether AI search-style answers cite your official website.
- Whether AI search-style answers recommend you in relevant buying contexts.
- Mention does not equal Citation.
- Citation Rate is based on whether returned source URLs matched the submitted domain.
- Recommendation Signal is a contextual signal, not a guaranteed ranking.

### P5-4 Online Validation

Production validation confirmed:

- Vercel deployed commit `62f3bea`.
- Production deployment status: `READY`.
- Hero copy correctly explains brand mentions, official website citations, and buying-context recommendations.
- Form intro includes `sampled AI visibility audit`.
- Perplexity intro includes `limited live Perplexity audit`, `sampled prompts`, and `source URL checks`.
- Product overview heading is: `Separate brand mentions from official website citations.`
- FAQ includes: `Does a brand mention mean my website was cited?`
- Disclaimer now states:
  - Scores are estimates.
  - Scores are not rankings.
  - Scores are not traffic forecasts.
  - Scores are not proof that an AI system will cite or recommend a brand.
- No `recommendation position` copy remains.

Conclusion:

- P5-1, P5-2, P5-3, and P5-4 passed validation.
- `noindex, nofollow` should remain enabled.
- Login, database, payment, public launch, and Gemini remain out of scope for now.

## 12. P5-5 Cost Control / Usage Guardrails

Commit: `cd03764` Add Perplexity usage guardrails

Modified files:

- `.env.example`
- `api/analyze-perplexity.ts`
- `src/App.tsx`
- `src/lib/types.ts`

Implementation:

- Perplexity mode supports an optional access code.
- The access code is read from the Vercel environment variable `LLM_LENS_ACCESS_CODE`.
- The access code is limited to the request layer and does not enter `AuditResult`.
- The access code is not included in Markdown or JSON exports.
- Mock mode does not display, require, or submit an access code.

Backend limits:

- Maximum prompts per Perplexity request: 5
- Maximum prompt text length: 500 characters
- Maximum `brandName` length: 80 characters
- Maximum `websiteUrl` length: 300 characters
- Maximum `industry` length: 120 characters
- Maximum `targetCountry` length: 80 characters
- Maximum `targetLanguage` length: 80 characters
- Maximum competitors: 10
- Maximum competitor name length: 80 characters
- Maximum request body size: approximately 20 KB

Error handling:

- Missing or invalid access code: `403 Access code required.`
- Invalid request structure or field limits: `400 Invalid audit request.`
- Perplexity error logging truncates the response body to 800 characters.
- API keys, access codes, authorization headers, and complete request bodies are not logged.

Online validation:

- The Production environment variable is configured.
- Redeploy completed.
- Mock mode remains available and does not show the Access code field.
- Perplexity mode shows the Access code field and API credit warning.
- A missing access code returns 403.
- An incorrect access code returns 403.
- A non-Perplexity request returns 400.
- Overlong brand and prompt fields return 400.
- A competitor list over the configured limit returns 400.

Conclusion:

- P5-5 usage guardrails are active in Production.
- `noindex, nofollow` should remain enabled while the product is limited to internal validation.

## 13. Important Product Findings

- AI answer mentions your brand does not mean it cites your official website.
- Mention, Recommendation, and Citation are separate visibility signals.
- Citation Rate 0 is not necessarily a bug. It may mean the AI answer used third-party sources instead of the official website.
- This separation can become one of LLM Lens's core value points: showing not only whether a brand appears, but whether the official site is used as a source.

## 14. Known Issues

- A single prompt can produce volatile results.
- Recommendation Signal is now more conservative, but should continue to be reviewed against more real samples.
- Citation detection currently uses lightweight hostname matching without a public suffix library.
- The result table is still wide, but acceptable for the current diagnostic version.
- Login, database, saved reports, and paywall are not implemented.
- `noindex, nofollow` remains enabled, so the site is not intended for public search indexing yet.

## 15. Next Priorities

### Final pre-public checklist

- Confirm whether `noindex, nofollow` should remain enabled.
- Re-check API key safety and frontend bundle exposure.
- Re-check rate limits, cost controls, and error messages.
- Decide whether the product is ready for a small public beta.
- Track the remaining release decisions in `docs/final-pre-public-checklist.md`.

### Later decision points

- Decide whether to continue product optimization.
- Decide whether the product is ready to remove `noindex, nofollow`.
- Decide whether to build a landing page or public beta.
- Decide whether to add saved reports, login, or related SaaS features.

## 16. Not Now

- Do not remove `noindex, nofollow`.
- Do not add login.
- Do not add payment.
- Do not add a database.
- Do not add user accounts.
- Do not expand Gemini.
- Do not make a major UI redesign.
- Do not open the tool for large-scale external usage yet.

## 17. Run Checks

Run before committing future changes:

```powershell
npm run lint
npm run build
```
