export type SearchEngine = 'mock' | 'perplexity' | 'gemini'

export type PromptIntent =
  | 'best-tools'
  | 'how-to'
  | 'alternatives'
  | 'comparison'
  | 'buyer-intent'

export interface AuditFormInput {
  brandName: string
  websiteUrl: string
  industry: string
  targetCountry: string
  targetLanguage: string
  competitors: string[]
  numberOfPrompts: number
  searchEngine: SearchEngine
}

export interface GeneratedPrompt {
  id: string
  text: string
  intent: PromptIntent
}

export interface PromptResult {
  promptId: string
  promptText: string
  engine: SearchEngine
  mentionedBrand: boolean
  citedDomain: boolean
  recommendationPosition: number | null
  recommendationSignal?: boolean
  competitorsMentioned: string[]
  answerSummary: string
  answerText?: string
  citations?: string[]
  sourceUrls: string[]
  expectedDomain: string
  sourceDomains: string[]
  matchedSourceDomains: string[]
}

export interface VisibilityMetrics {
  score: number
  mentionRate: number
  citationRate: number
  recommendationRate: number
  averagePosition: number | null
  competitorShare: Record<string, number>
}

export interface AuditResult {
  input: AuditFormInput
  prompts: GeneratedPrompt[]
  results: PromptResult[]
  metrics: VisibilityMetrics
  missingBrandPrompts: PromptResult[]
  competitorOnlyPrompts: PromptResult[]
  recommendations: string[]
}

export interface AnalyzePerplexityRequest {
  input: AuditFormInput
  prompts: GeneratedPrompt[]
  accessCode?: string
}

export interface AnalyzePerplexityResponse {
  results: PromptResult[]
}

export interface ApiErrorResponse {
  error: string
}
