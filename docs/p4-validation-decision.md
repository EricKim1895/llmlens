# P4 Validation Decision

## 1. Current Validation Conclusion

P4 completed two rounds of small-sample validation across large brands, small/mid brands, and user projects.

Key findings:

- Large brands are more likely to be mentioned or recommended in live Perplexity answers, including Shopify, Canva, Grammarly, and Mailchimp.
- Official website citation is much rarer than brand mention.
- Mailchimp is the clearest positive sample for official citation, with source URLs matching `mailchimp.com`.
- Notion, Beehiiv, and Tally showed meaningful variance between 1 prompt and 3 prompts.
- Plausible, Framer, and Linear scored 0 in broad generic prompts, which suggests stronger competitors dominate those query patterns.
- User projects such as LLMLens and ClearWord Lab were mostly 0, which is expected for new, low-awareness, noindex sites.
- Ecommerce Calculators showed a weak signal in 1 prompt, but the signal dropped clearly in the 3-prompt sample.

## 2. Product Value Judgment

LLM Lens can now separate three useful AI visibility signals:

- Mention: whether the AI answer names the brand.
- Citation: whether returned source URLs include the submitted official website domain.
- Recommendation: whether the answer appears to recommend or positively position the brand.

The validation confirms an important product insight: being mentioned by AI is not the same as having the official website cited as a source.

Sources and matched domains make Citation Rate explainable. They help users understand whether a low citation score is a bug or whether the AI answer relied on third-party sources instead of the official site.

The tests also show that 3 prompts are more useful than 1 prompt for a small-sample audit. A single prompt behaves more like a quick snapshot, while 3 prompts better reveal trend-level visibility.

The tool has enough validated behavior to continue development.

## 3. Current Main Issues

- The validation sample is still small.
- Perplexity answers vary between runs.
- Recommendation Signal may be too broad.
- Prompts are improved but still somewhat generic; industry and use-case specificity can be stronger.
- Score weighting has not been calibrated with enough real examples.
- There is no report saving, export, or sharing workflow.
- The site still has `noindex, nofollow`, so it is not ready for public search discovery.

## 4. Noindex Recommendation

Recommendation: do not remove `noindex, nofollow` yet.

Reasons:

- The core feature works, but score explanation and product positioning still need refinement.
- There is no landing page, pricing, or onboarding flow.
- Abuse prevention and cost controls are not ready for public usage.
- Real API mode consumes Perplexity credits.
- The current product is better suited for internal validation than public indexing.

## 5. Next Stage Recommendation

Proceed to P5: Productization Decision / MVP polish.

Recommended priorities:

### P5-1: Recommend 3 Prompts By Default

- Explain that 1 prompt is a quick check.
- Explain that 3 prompts are a better small-sample audit.
- Keep the 1-5 prompt option for Real Perplexity mode.

### P5-2: Improve Recommendation Signal

- Reduce overly broad recommendation detection.
- Separate positive mention from actual recommendation.

### P5-3: Result Export

- Add Copy summary.
- Add Download JSON.
- Add Download Markdown.
- Do not add a database yet.

### P5-4: Landing Page Copy

- Clarify the core value: AI mention vs official citation.
- Keep `noindex, nofollow` for now.

### P5-5: Cost Control

- Make it clear that Real API mode may consume credits.
- Keep prompt limits conservative before any public usage.

## 6. Do Not Do Yet

- Do not add login.
- Do not add a database.
- Do not add payments.
- Do not add Gemini.
- Do not open the product for broad public usage.
- Do not remove `noindex, nofollow`.
- Do not make a major UI redesign.

## 7. Final Stage Judgment

LLM Lens is no longer just a Mock MVP. It is now a working Real Perplexity diagnostic MVP.

The project should continue, but the next phase should focus on internal validation and MVP polish rather than public launch.
