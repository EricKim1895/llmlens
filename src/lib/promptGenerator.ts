import type { AuditFormInput, GeneratedPrompt, PromptIntent } from './types'

const clampPromptCount = (count: number) => Math.min(20, Math.max(1, count))

const cleanText = (value: string) => value.trim().replace(/\s+/g, ' ')

const createPrompt = (
  text: string,
  intent: PromptIntent,
  index: number,
): GeneratedPrompt => ({
  id: `prompt-${index + 1}`,
  text,
  intent,
})

export const generatePrompts = (input: AuditFormInput): GeneratedPrompt[] => {
  const brandName = cleanText(input.brandName)
  const industry = cleanText(input.industry)
  const country = cleanText(input.targetCountry || 'United States')
  const language = cleanText(input.targetLanguage || 'English')
  const firstCompetitor = input.competitors[0]
  const secondCompetitor = input.competitors[1]

  const templates: Array<{ text: string; intent: PromptIntent }> = [
    {
      text: `What is the best ${industry}?`,
      intent: 'best-tools',
    },
    {
      text: `Best ${industry} tools for small teams in ${country}`,
      intent: 'buyer-intent',
    },
    {
      text: `How can ${industry} users compare reliable tools?`,
      intent: 'how-to',
    },
    {
      text: `${brandName} alternatives for ${industry} users`,
      intent: 'alternatives',
    },
    {
      text: `Which ${industry} tool is most useful for small websites?`,
      intent: 'best-tools',
    },
    {
      text: `Best ${industry} software in ${language}`,
      intent: 'buyer-intent',
    },
    {
      text: `Is ${brandName} a good option for ${industry}?`,
      intent: 'comparison',
    },
    {
      text: `Compare ${brandName} with other ${industry} tools`,
      intent: 'comparison',
    },
    {
      text: `What tools help with ${industry} research and reporting?`,
      intent: 'how-to',
    },
    {
      text: `Top ${industry} platforms for independent operators`,
      intent: 'best-tools',
    },
    {
      text: `What should small teams look for in a ${industry} tool?`,
      intent: 'how-to',
    },
    {
      text: `Most practical ${industry} tools for content sites`,
      intent: 'buyer-intent',
    },
    {
      text: `Does ${brandName} get mentioned among leading ${industry} tools?`,
      intent: 'comparison',
    },
    {
      text: `Affordable ${industry} tools for small brands`,
      intent: 'buyer-intent',
    },
    {
      text: `How to choose between ${industry} tools`,
      intent: 'how-to',
    },
    {
      text: `Best ${industry} tools with clear reporting`,
      intent: 'best-tools',
    },
  ]

  if (firstCompetitor) {
    templates.push(
      {
        text: `${brandName} vs ${firstCompetitor} for ${industry}`,
        intent: 'comparison',
      },
      {
        text: `Best alternatives to ${firstCompetitor} for ${industry}`,
        intent: 'alternatives',
      },
    )
  }

  if (secondCompetitor) {
    templates.push({
      text: `Compare ${brandName}, ${firstCompetitor}, and ${secondCompetitor}`,
      intent: 'comparison',
    })
  }

  const seen = new Set<string>()
  const uniquePrompts = templates.filter(({ text }) => {
    const key = text.toLowerCase()
    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })

  return uniquePrompts
    .slice(0, clampPromptCount(input.numberOfPrompts))
    .map(({ text, intent }, index) => createPrompt(text, intent, index))
}
