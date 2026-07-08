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

## 3. Key Fix History

- `23c3156` Add Perplexity Sonar audit mode
- `a2181d3` Fix Perplexity serverless runtime import
- `b583724` Refine real API mode UI copy
- `638af04` Add Perplexity result diagnostics
- `1e53ca5` Improve result table readability
- `51e1875` Improve prompt generation quality
- `c39d4c9` Improve result explanation copy
- `e9116e7` Improve citation domain diagnostics

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

## 8. Important Product Findings

- AI answer mentions your brand does not mean it cites your official website.
- Mention, Recommendation, and Citation are separate visibility signals.
- Citation Rate 0 is not necessarily a bug. It may mean the AI answer used third-party sources instead of the official website.
- This separation can become one of LLM Lens's core value points: showing not only whether a brand appears, but whether the official site is used as a source.

## 9. Known Issues

- A single prompt can produce volatile results.
- Recommendation Signal may be too broad.
- Citation detection currently uses lightweight hostname matching without a public suffix library.
- The result table is still wide, but acceptable for the current diagnostic version.
- Login, database, saved reports, and paywall are not implemented.
- `noindex, nofollow` remains enabled, so the site is not intended for public search indexing yet.

## 10. Next Priorities

### P4: Small-sample validation across 10-20 brands

- Large brands
- Small brands
- User-owned projects
- Different industries
- Record differences between 1-prompt and 3-prompt runs
- Observe whether Mention, Citation, and Recommendation signals look reasonable

### P5: Decision point

- Decide whether to continue product optimization.
- Decide whether the product is ready to remove `noindex, nofollow`.
- Decide whether to build a landing page or public beta.
- Decide whether to add saved reports, export, login, or related SaaS features.

## 11. Not Now

- Do not remove `noindex, nofollow`.
- Do not add login.
- Do not add payment.
- Do not add a database.
- Do not add user accounts.
- Do not expand Gemini.
- Do not make a major UI redesign.
- Do not open the tool for large-scale external usage yet.

## 12. Run Checks

Run before committing future changes:

```powershell
npm run lint
npm run build
```
