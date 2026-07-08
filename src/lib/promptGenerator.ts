import type { AuditFormInput, GeneratedPrompt, PromptIntent } from './types'

const clampPromptCount = (count: number) => Math.min(20, Math.max(1, count))

const cleanText = (value: string) => value.trim().replace(/\s+/g, ' ')

const normalizeIndustry = (industry: string) =>
  industry
    .replace(/\bsoftware software\b/gi, 'software')
    .replace(/\btool tool\b/gi, 'tool')
    .replace(/\s+/g, ' ')
    .trim()

const getToolCategory = (industry: string) => {
  const normalized = industry.toLowerCase()

  if (
    normalized.endsWith('tools') ||
    normalized.endsWith('platforms') ||
    normalized.endsWith('apps')
  ) {
    return industry
  }

  if (normalized.endsWith('tool')) {
    return `${industry}s`
  }

  if (normalized.endsWith('platform')) {
    return `${industry}s`
  }

  if (normalized.endsWith('software')) {
    return `${industry} tools`
  }

  return `${industry} tools`
}

const getSingularTool = (industry: string) => {
  const normalized = industry.toLowerCase()

  if (
    normalized.endsWith('tool') ||
    normalized.endsWith('platform') ||
    normalized.endsWith('app')
  ) {
    return industry
  }

  if (normalized.endsWith('software')) {
    return `${industry} tool`
  }

  return `${industry} tool`
}

const getIndefiniteArticle = (phrase: string) =>
  /^[aeiou]/i.test(phrase.trim()) ? 'an' : 'a'

const getUseCase = (industry: string) => {
  const normalized = industry.toLowerCase()

  if (normalized.includes('ecommerce') || normalized.includes('shop')) {
    return 'selling products online'
  }

  if (normalized.includes('design') || normalized.includes('creative')) {
    return 'creating marketing visuals'
  }

  if (normalized.includes('writing') || normalized.includes('grammar')) {
    return 'editing business writing'
  }

  if (normalized.includes('productivity') || normalized.includes('project')) {
    return 'organizing team work'
  }

  if (normalized.includes('search') || normalized.includes('visibility')) {
    return 'tracking AI search visibility'
  }

  if (normalized.includes('calculator') || normalized.includes('fee')) {
    return 'calculating costs and profit'
  }

  return `solving ${industry} workflows`
}

const getAudience = (industry: string) => {
  const normalized = industry.toLowerCase()

  if (normalized.includes('ecommerce') || normalized.includes('shop')) {
    return 'online sellers'
  }

  if (normalized.includes('design') || normalized.includes('creative')) {
    return 'small marketing teams'
  }

  if (normalized.includes('writing') || normalized.includes('grammar')) {
    return 'content teams'
  }

  if (normalized.includes('productivity') || normalized.includes('project')) {
    return 'small teams'
  }

  if (normalized.includes('search') || normalized.includes('visibility')) {
    return 'small website owners'
  }

  if (normalized.includes('calculator') || normalized.includes('fee')) {
    return 'small business owners'
  }

  return 'small businesses'
}

const getJobToBeDone = (industry: string) => {
  const normalized = industry.toLowerCase()

  if (normalized.includes('ecommerce') || normalized.includes('shop')) {
    return 'manage an online store'
  }

  if (normalized.includes('design') || normalized.includes('creative')) {
    return 'create social media and ad graphics'
  }

  if (normalized.includes('writing') || normalized.includes('grammar')) {
    return 'write clearer emails and documents'
  }

  if (normalized.includes('productivity') || normalized.includes('project')) {
    return 'manage notes, tasks, and projects'
  }

  if (normalized.includes('search') || normalized.includes('visibility')) {
    return 'measure brand visibility in AI answers'
  }

  if (normalized.includes('calculator') || normalized.includes('fee')) {
    return 'calculate pricing, fees, and profit'
  }

  return `handle ${industry} work`
}

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
  const industry = normalizeIndustry(cleanText(input.industry))
  const toolCategory = getToolCategory(industry)
  const singularTool = getSingularTool(industry)
  const article = getIndefiniteArticle(singularTool)
  const country = cleanText(input.targetCountry || 'United States')
  const useCase = getUseCase(industry)
  const audience = getAudience(industry)
  const jobToBeDone = getJobToBeDone(industry)
  const firstCompetitor = input.competitors[0]
  const secondCompetitor = input.competitors[1]

  const templates: Array<{ text: string; intent: PromptIntent }> = [
    {
      text: `What are the best ${toolCategory} for small businesses?`,
      intent: 'best-tools',
    },
    {
      text: `Best ${industry} for ${useCase}`,
      intent: 'buyer-intent',
    },
    {
      text: `Which ${toolCategory} are recommended for ${audience}?`,
      intent: 'best-tools',
    },
    {
      text: `Tools to ${jobToBeDone}`,
      intent: 'buyer-intent',
    },
    {
      text: `Best ${toolCategory} for small teams in ${country}`,
      intent: 'buyer-intent',
    },
    {
      text: `How should ${audience} choose ${article} ${singularTool}?`,
      intent: 'how-to',
    },
    {
      text: `${brandName} alternatives for ${audience}`,
      intent: 'alternatives',
    },
    {
      text: `Best alternatives to ${brandName} for ${useCase}`,
      intent: 'alternatives',
    },
    {
      text: `Is ${brandName} a good ${industry} option for ${audience}?`,
      intent: 'comparison',
    },
    {
      text: `Compare ${brandName} with other ${toolCategory}`,
      intent: 'comparison',
    },
    {
      text: `Most practical ${toolCategory} for ${audience}`,
      intent: 'buyer-intent',
    },
    {
      text: `Affordable ${toolCategory} for small businesses`,
      intent: 'buyer-intent',
    },
    {
      text: `Top ${toolCategory} for ${useCase}`,
      intent: 'best-tools',
    },
    {
      text: `What should ${audience} look for in ${singularTool}?`,
      intent: 'how-to',
    },
    {
      text: `Which ${toolCategory} are easiest for small teams to adopt?`,
      intent: 'best-tools',
    },
    {
      text: `Recommended ${toolCategory} for companies in ${country}`,
      intent: 'buyer-intent',
    },
  ]

  if (firstCompetitor) {
    templates.push(
      {
        text: `${brandName} vs ${firstCompetitor} for ${industry}`,
        intent: 'comparison',
      },
      {
        text: `${firstCompetitor} alternatives for ${audience}`,
        intent: 'alternatives',
      },
      {
        text: `Compare ${brandName} and ${firstCompetitor} for ${useCase}`,
        intent: 'comparison',
      },
    )
  }

  if (secondCompetitor) {
    templates.push(
      {
        text: `${brandName} vs ${secondCompetitor} for ${industry}`,
        intent: 'comparison',
      },
      {
        text: `Compare ${brandName}, ${firstCompetitor}, and ${secondCompetitor} for ${audience}`,
        intent: 'comparison',
      },
    )
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
