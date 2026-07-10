# Simulated User Test Report

## Test Environment

- Project: LLM Lens
- Production URL: `https://llmlens-sigma.vercel.app`
- Test date: 2026-07-10
- Test scope: production bundle and API negative paths, plus the current deterministic Mock implementation.
- Security boundary: no real `PERPLEXITY_API_KEY` or valid `LLM_LENS_ACCESS_CODE` was read, displayed, guessed, stored, or submitted.
- Browser interaction automation could load and inspect the production form, but timed out while filling and clicking controls. UI interaction results that could not be completed are explicitly marked below rather than inferred as passed.

## Executive Summary

LLM Lens is suitable for continued internal testing. Production guardrails reject missing and invalid access codes, invalid request engines, overlong fields, overlong prompts, and excessive competitors with the expected 403 or 400 responses. The production bundle contains the current three-prompt guidance, access-code UI, credit warning, source URL messaging, and export controls.

The original Mock citation inconsistency was resolved in the current working tree. A Mock result with `citedDomain: true` now includes the submitted website homepage as a deterministic simulated source, so Sources, source domains, matched source domains, and Citation Rate agree. The fix still needs normal code review and commit before it is part of the deployed Production build.

There is no blocker for further internal testing. `noindex, nofollow` should remain enabled.

## Passed Checks

### Production page and mode UI

- Production homepage returned HTTP 200.
- Default Number of prompts is 3.
- Mock mode is selected by default.
- Mock mode does not show an Access code field.
- The Mock mode callout states that it uses deterministic sample results and does not call external APIs.
- The deployed bundle includes:
  - `Recommended: 3 prompts`
  - the API-credit and `Keep tests small` warning
  - `source URL checks`
  - `Copy summary`, `Download Markdown`, and `Download JSON`
  - the Perplexity Access code label and helper text.
- The form presents required Brand name, Website URL, and Industry / niche fields, optional competitors, prompt guidance, and engine selection in a clear order.
- The hero, FAQ, product overview, and disclaimer explain that results are estimates rather than rankings or guaranteed citations/recommendations.

### Mock logic and exports

- Ten Mock scenarios completed with three prompts each.
- Re-running the Canva Mock analyzer with identical input produced byte-for-byte identical prompt results.
- Prompt-level mock results include mentioned/cited state, recommendation position, competitors, summary, sources, and citation-domain diagnostic fields.
- Markdown export generation contains Brand, Website, Score, Mention Rate, Citation Rate, Recommendation Rate, Prompt-Level Results, and Sources.
- JSON export generation contains `exportedAt`, `exportVersion: "1"`, and `result`.
- Generated export filenames are `llm-lens-canva-audit.md` and `llm-lens-canva-audit.json`.

### API negative paths and guardrails

- Missing Access code: `403 {"error":"Access code required."}`.
- Explicitly invalid test Access code: `403 {"error":"Access code required."}`.
- Non-Perplexity `searchEngine`: `400 {"error":"Invalid audit request."}`.
- `brandName` with 81 characters: `400`.
- Prompt text with 501 characters: `400`.
- Eleven competitors: `400`.
- The API responses used for negative testing exposed no API key, valid access code, authorization header, or complete request body.

### Responsive implementation review

- Desktop result tables have a 1420px minimum width inside a horizontal-scroll wrapper.
- At the mobile breakpoint, the prompt table switches to labelled stacked rows instead of forcing a page-wide table.
- Form, metric cards, explanation cards, and FAQ grids switch to a single-column layout at narrow widths.

## Functional Issues

### Resolved - Mock Citation Rate conflicted with Sources and domain diagnostics

Before the fix, Mock results could mark `citedDomain: true` without returning any `sourceUrls`, `sourceDomains`, or `matchedSourceDomains`. For example, the earlier three-prompt Mock tests for Shopify, Plausible, and ClearWord Lab reported a Citation Rate of 33%, while all Sources were empty and the domain diagnostics would show no matched source domain.

Fix applied in `src/lib/mockAnalyzer.ts`:

- When a deterministic Mock citation signal is true, `sourceUrls` receives the submitted website origin/homepage URL.
- `sourceDomains` and `matchedSourceDomains` are derived from that URL using the existing domain helpers.
- When the signal is false, all three source fields remain empty.
- The Mock summary now calls this a `simulated official-domain citation signal`.

Verification is recorded below after the Canva three-prompt self-check. The issue is resolved in the uncommitted working tree.

### Citation consistency self-check after the fix

- Canva, three prompts: Score 30, Citation Rate 0%. No prompt had a matched domain, and every non-citation result had an empty `matchedSourceDomains` array.
- Shopify, three prompts: Score 56, Citation Rate 33%. Its cited prompt now returns:
  - Source URL: `https://www.shopify.com/`
  - Source domain: `shopify.com`
  - Matched source domain: `shopify.com`
  - Summary: `The mock answer mentions Shopify and includes a simulated official-domain citation signal.`
- Repeated Canva and Shopify runs with identical inputs were deterministic.
- JSON export preserves the cited prompt's full source URL and matched source-domain array.
- Markdown export intentionally renders the source hostname `shopify.com` and includes `Matched source domains: shopify.com`.
- The current table matching rule compares the displayed normalized hostname with `matchedSourceDomains`, so this cited Mock source will render with the existing match indicator.

### Medium - Mock raw result omits explicit `recommendationSignal`

Mock results use `recommendationPosition` and the UI correctly falls back to it when displaying Recommendation Signal. However, the raw Mock `PromptResult` does not include an explicit `recommendationSignal` field, while Perplexity results do. This is not a current UI failure, but it makes exported JSON less uniform for consumers that inspect raw fields.

Recommended fix: populate `recommendationSignal` in Mock results from the existing `recommended` boolean.

### Medium - No server-side rate limit or quota

The access code, prompt cap, request-size limits, and sequential calls reduce risk, but they do not provide an IP rate limit, daily quota, or shared usage ceiling. This is acceptable for internal access-code-protected testing, but remains a release consideration before a broader beta.

### Low - Some generated prompt wording is repetitive

Examples include `Best email marketing platform for solving email marketing platform workflows` and similar repetitions for newsletter, form, and analytics scenarios. The prompts remain understandable, but they do not read like a polished customer query.

## Usability Issues

### Observation only - Export actions could not be clicked end-to-end in this run

The production bundle and pure export functions were verified, but the test browser timed out while performing form interactions. Copy-to-clipboard feedback and actual browser download events therefore require one manual confirmation in a normal browser session.

### Observation only - Mock results can look more authoritative than they are

The page explains Mock mode, but deterministic scores vary independently of real-world brand awareness. In this run, Mailchimp scored 0 while smaller or new brands could receive non-zero scores. This is expected from a mock generator, but new users may still read the score as an external visibility measurement.

Recommended action: retain the current Mock-mode warning and consider a slightly stronger label near the score such as `Simulated example signal`.

## Mobile Issues

No source-level overflow issue was found: the CSS uses one-column form and card layouts below 640px, and converts the wide result table into labelled stacked rows.

Visual verification at an actual 390px browser viewport was not completed because browser-control interactions timed out. This remains a manual check before inviting external testers, especially for export-action wrapping, long source hostnames, and FAQ card height.

## Result Quality Observations

### Mock three-prompt scenarios

| Brand | Score | Mention | Citation | Recommendation | Ease of interpretation | Observation |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| Shopify | 56 | 67% | 33% | 67% | Clear after the citation fix | Citation is deterministic simulated data. |
| Canva | 30 | 33% | 0% | 33% | Clear as a mock result | Generic prompts do not force a mention. |
| Mailchimp | 0 | 0% | 0% | 0% | Clear but counterintuitive | Demonstrates that Mock scores do not represent brand awareness. |
| Beehiiv | 35 | 33% | 0% | 33% | Clear as a mock result | Competitors appeared more often. |
| Tally | 25 | 33% | 0% | 33% | Clear as a mock result | Prompt wording is somewhat repetitive. |
| Plausible | 38 | 33% | 33% | 33% | Clear after the citation fix | Citation is deterministic simulated data. |
| Linear | 0 | 0% | 0% | 0% | Clear as a mock result | Competitor-only signal is plausible within the simulation. |
| LLMLens | 12 | 33% | 0% | 0% | Clear as a mock result | Low simulated signal is consistent with the tool's new-brand framing. |
| ClearWord Lab | 33 | 33% | 33% | 33% | Clear after the citation fix | Citation is deterministic simulated data. |
| Ecommerce Calculators | 0 | 0% | 0% | 0% | Clear as a mock result | Generic query may favor listed competitors. |

The mock scores are deterministic and useful for exercising the UI. They are not suitable for judging whether a named brand should be visible in real AI responses.

## Perplexity Variance Observations

Live Perplexity audits with the correct access code were not run. The user did not manually provide a valid access code through a safe interaction channel, so no valid code was entered or transmitted.

The following checks require a manual follow-up with the user already signed into the production page and having entered the correct code themselves:

- Shopify, Canva, Notion, Beehiiv, and LLMLens with three prompts.
- Per-prompt Recommendation Signal, Sources, summaries, expected domains, and matched domains.
- Two consecutive live runs of one brand to measure response variance.
- Loading-state disabled button behavior during a successful live request.

No conclusion about live-result stability or real recommendation/citation accuracy is made in this report.

## Security / Cost Guardrail Checks

- Perplexity mode is limited to five prompts in the frontend and backend contract.
- Missing and invalid access codes are rejected before a live API call.
- Invalid engine and field-limit requests are rejected with 400.
- API key and access-code environment variables are only referenced in the serverless API and empty placeholders in `.env.example`; frontend code does not read `PERPLEXITY_API_KEY` or call `api.perplexity.ai` directly.
- Server-side Perplexity error-body logs are capped at 800 characters.
- Remaining pre-public limitation: there is no rate limit or daily quota.

## Recommended Fixes

1. Medium: Add a lightweight rate-limit or usage quota decision before broader access-code sharing.
2. Low: Refine repetitive prompt templates.
3. Observation only: Manually verify 390px mobile export actions in a normal browser.

## Final Conclusion

LLM Lens is appropriate for continued internal testing. There is no Critical issue and no blocker for a tightly controlled internal test group. The Mock citation contradiction is resolved in the current working tree and should be committed only after the listed self-checks pass.

Keep `noindex, nofollow` enabled. The next three recommended actions are:

1. Run the deferred live Perplexity sample after the user manually enters a valid access code.
2. Complete a manual 390px mobile browser pass focused on export actions and prompt-result cards.
3. Decide on rate limiting or a daily quota before sharing the access code more broadly.
