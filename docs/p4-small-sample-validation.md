# P4 Small-Sample Validation

## 1. Test Purpose

Validate the result quality of LLM Lens Real Perplexity mode across different brands, industries, and levels of brand awareness.

## 2. Test Method

For each brand, run two tests:

- Number of prompts = 1
- Number of prompts = 3
- Search engine = Perplexity Sonar

Record:

- Score
- Mention Rate
- Citation Rate
- Recommendation Rate
- Average Position
- Expected domain
- Matched source domains
- Whether Sources include the official website
- Whether the result matches intuition
- Notes

## 3. Test Brand List

### Large Brands

| Brand | Website URL | Industry / niche | Competitors |
| --- | --- | --- | --- |
| Shopify | `https://www.shopify.com` | ecommerce platform | Wix, BigCommerce, Squarespace |
| Canva | `https://www.canva.com` | design tool | Adobe Express, Figma, Visme |
| Notion | `https://www.notion.com` | productivity software | Coda, ClickUp, Asana |
| Grammarly | `https://www.grammarly.com` | writing assistant | QuillBot, ProWritingAid, Wordtune |
| Mailchimp | `https://mailchimp.com` | email marketing platform | Klaviyo, Constant Contact, Brevo |

### Small And Mid-Sized Brands

| Brand | Website URL | Industry / niche | Competitors |
| --- | --- | --- | --- |
| Beehiiv | `https://www.beehiiv.com` | newsletter platform | Substack, ConvertKit, Mailchimp |
| Tally | `https://tally.so` | form builder | Typeform, Google Forms, Jotform |
| Plausible | `https://plausible.io` | web analytics tool | Google Analytics, Fathom, Simple Analytics |
| Framer | `https://www.framer.com` | website builder | Webflow, Wix, Squarespace |
| Linear | `https://linear.app` | project management tool | Jira, Asana, ClickUp |

### User Projects

| Brand | Website URL | Industry / niche | Competitors |
| --- | --- | --- | --- |
| LLMLens | `https://llmlens-sigma.vercel.app` | AI search visibility checker | Profound, Peec AI, AthenaHQ |
| Ecommerce Calculators | `https://ecommerce-calculators-eta.vercel.app` | ecommerce calculator tools | Omni Calculator, Salecalc, Calculator.net |
| ClearWord Lab | `https://clearwordlab.com` | English learning tool | Grammarly, Cambridge Dictionary, WordReference |

## 4. Test Result Template

| Group | Brand | Prompt count | Score | Mention Rate | Citation Rate | Recommendation Rate | Average Position | Expected domain | Matched source domains | Sources include official site? | Matches intuition? | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- | --- | --- | --- |
| Large brand | Shopify | 1 | 60 | 100% | 0% | 100% | Not measured | shopify.com | None | No | Yes | Mentioned and recommended, but sources were third-party domains. |
| Large brand | Shopify | 3 | 60 | 100% | 0% | 100% | Not measured | shopify.com | None | No | Yes | Stable mention/recommendation signal; no official-site citation. |
| Large brand | Canva | 1 | 60 | 100% | 0% | 100% | Not measured | canva.com | None | No | Yes | Mentioned and recommended, but first prompt used third-party sources. |
| Large brand | Canva | 3 | 68 | 100% | 33% | 100% | Not measured | canva.com | canva.com | Yes | Yes | One sampled answer cited the official domain. |
| Large brand | Notion | 1 | 0 | 0% | 0% | 0% | Not measured | notion.com | None | No | Mostly | First generic productivity prompt mentioned competitors but not Notion. |
| Large brand | Notion | 3 | 40 | 67% | 0% | 67% | Not measured | notion.com | None | No | Yes | Broader sample detected Notion in later prompts, but no official citation. |
| Large brand | Grammarly | 1 | 60 | 100% | 0% | 100% | Not measured | grammarly.com | None | No | Yes | Mentioned and recommended, but sources were third-party domains. |
| Large brand | Grammarly | 3 | 40 | 67% | 0% | 67% | Not measured | grammarly.com | None | No | Yes | Wider sample lowered visibility; no official-domain citation. |
| Large brand | Mailchimp | 1 | 85 | 100% | 100% | 100% | Not measured | mailchimp.com | mailchimp.com | Yes | Yes | Strong result; official domain matched in the single prompt. |
| Large brand | Mailchimp | 3 | 68 | 100% | 33% | 100% | Not measured | mailchimp.com | mailchimp.com | Yes | Yes | Stable mention signal with one official-domain citation. |
| Small/mid brand | Beehiiv | 1 | 60 | 100% | 0% | 100% | Not measured | beehiiv.com | None | No | Yes | Mentioned and recommended in the first prompt; no official citation. |
| Small/mid brand | Beehiiv | 3 | 28 | 33% | 33% | 33% | Not measured | beehiiv.com | beehiiv.com | Yes | Yes | Wider sample lowered visibility but found one official-domain citation. |
| Small/mid brand | Tally | 1 | 60 | 100% | 0% | 100% | Not measured | tally.so | None | No | Yes | Mentioned and recommended, but no official-domain citation. |
| Small/mid brand | Tally | 3 | 40 | 67% | 0% | 67% | Not measured | tally.so | None | No | Yes | Broader sample reduced visibility; sources stayed third-party. |
| Small/mid brand | Plausible | 1 | 0 | 0% | 0% | 0% | Not measured | plausible.io | None | No | Yes | Generic web analytics prompt favored competitors and did not mention Plausible. |
| Small/mid brand | Plausible | 3 | 0 | 0% | 0% | 0% | Not measured | plausible.io | None | No | Yes | No sampled prompt detected Plausible; no official-domain citation. |
| Small/mid brand | Framer | 1 | 0 | 0% | 0% | 0% | Not measured | framer.com | None | No | Mostly | Generic website builder prompt mentioned stronger mainstream competitors. |
| Small/mid brand | Framer | 3 | 0 | 0% | 0% | 0% | Not measured | framer.com | None | No | Mostly | Framer was not detected in this small sample. |
| Small/mid brand | Linear | 1 | 0 | 0% | 0% | 0% | Not measured | linear.app | None | No | Mostly | Generic project management prompt favored Jira, Asana, and ClickUp. |
| Small/mid brand | Linear | 3 | 0 | 0% | 0% | 0% | Not measured | linear.app | None | No | Mostly | Linear was not detected in this small sample. |
| User project | LLMLens | 1 | 0 | 0% | 0% | 0% | Not measured | llmlens-sigma.vercel.app | None | No | Yes | New noindex site was not detected; competitors appeared instead. |
| User project | LLMLens | 3 | 0 | 0% | 0% | 0% | Not measured | llmlens-sigma.vercel.app | None | No | Yes | Expected for a new noindex project; no official-domain citation. |
| User project | Ecommerce Calculators | 1 | 60 | 100% | 0% | 100% | Not measured | ecommerce-calculators-eta.vercel.app | None | No | Mixed | Brand phrase was detected, but sources did not cite the submitted site. |
| User project | Ecommerce Calculators | 3 | 20 | 33% | 0% | 33% | Not measured | ecommerce-calculators-eta.vercel.app | None | No | Mixed | Wider sample mostly mentioned generic calculator competitors. |
| User project | ClearWord Lab | 1 | 0 | 0% | 0% | 0% | Not measured | clearwordlab.com | None | No | Yes | New/small project was not detected; Grammarly appeared as a competitor. |
| User project | ClearWord Lab | 3 | 0 | 0% | 0% | 0% | Not measured | clearwordlab.com | None | No | Yes | No sampled prompt detected ClearWord Lab or cited the official domain. |

## 5. Initial Evaluation Criteria

- Large brands are expected to have a higher Mention Rate.
- Smaller brands may have a lower Mention Rate.
- User projects may have low or zero visibility. LLMLens is expected to remain low because it is new and still uses `noindex, nofollow`.
- A low Citation Rate is not necessarily a bug. Check matched source domains before judging the result.
- 3 prompts are better than 1 prompt for judging trends.
- 1 prompt should be treated as a single AI search snapshot.

## 6. Notes

- Do not modify code as part of this validation document.
- Do not commit this document until the test plan is reviewed.
