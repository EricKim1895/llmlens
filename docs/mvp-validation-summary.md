# LLM Lens MVP Validation Summary

## 1. Project Status

- Project name: LLM Lens
- Local path: `D:\VibeCoding\LLMLens`
- GitHub: `EricKim1895/llmlens`
- Production URL: `https://llmlens-sigma.vercel.app`
- Current indexing status: temporary `noindex, nofollow` remains enabled
- Mock mode: available
- Real Perplexity mode: available

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

## 3. Key Fix History

- `23c3156` Add Perplexity Sonar audit mode
- `a2181d3` Fix Perplexity serverless runtime import
- `b583724` Refine real API mode UI copy
- `638af04` Add Perplexity result diagnostics
- `1e53ca5` Improve result table readability

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

## 5. Important Product Findings

- AI answer mentions your brand does not mean it cites your official website.
- Mention, Recommendation, and Citation are separate visibility signals.
- Citation Rate 0 is not necessarily a bug. It may mean the AI answer used third-party sources instead of the official website.
- This separation can become one of LLM Lens's core value points: showing not only whether a brand appears, but whether the official site is used as a source.

## 6. Known Issues

- Prompt generation is still broad in some cases, for example `What is the best design tool?`
- A single prompt can produce volatile results.
- Recommendation Signal may be too broad.
- Citation detection currently checks whether source URLs match the submitted official domain.
- The result table is still wide, but acceptable for the current diagnostic version.
- Login, database, saved reports, and paywall are not implemented.
- `noindex, nofollow` remains enabled, so the site is not intended for public search indexing yet.

## 7. Next Priorities

### P1: Improve prompt generation

- Move from broad generic questions to stronger commercial-intent prompts.
- Example prompt types:
  - `best X for small business`
  - `X alternatives`
  - `tools for Y use case`

### P2: Improve result explanation

- Explain more clearly why a score is 60 or 0.
- Separately explain Mentioned, Cited, and Recommended signals.

### P3: Improve citation and domain matching

- Handle `www` and non-`www` consistently.
- Handle subdomains clearly.
- Show matched domain and expected domain in the diagnostics.

### P4: Run small-sample testing across 10-20 brands

- Large brands
- Small brands
- User-owned projects
- Different industries

## 8. Not Now

- Do not remove `noindex, nofollow`.
- Do not add login.
- Do not add payment.
- Do not add a database.
- Do not add user accounts.
- Do not expand Gemini.
- Do not make a major UI redesign.
- Do not open the tool for large-scale external usage yet.

## 9. Run Checks

Run before committing future changes:

```powershell
npm run lint
npm run build
```
