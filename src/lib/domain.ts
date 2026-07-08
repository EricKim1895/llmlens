export const normalizeHostname = (value: string): string => {
  const trimmed = value.trim()

  if (!trimmed) {
    return ''
  }

  try {
    const url = trimmed.includes('://')
      ? new URL(trimmed)
      : new URL(`https://${trimmed}`)

    return url.hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return trimmed
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .split(/[/?#]/)[0]
      .replace(/:\d+$/, '')
      .toLowerCase()
  }
}

export const hostnamesMatch = (sourceUrl: string, targetUrl: string): boolean => {
  const source = normalizeHostname(sourceUrl)
  const target = normalizeHostname(targetUrl)

  if (!source || !target) {
    return false
  }

  return source === target || source.endsWith(`.${target}`)
}

export const getSourceDomains = (sourceUrls: string[]): string[] =>
  Array.from(
    new Set(
      sourceUrls
        .map((sourceUrl) => normalizeHostname(sourceUrl))
        .filter(Boolean),
    ),
  )

export const getMatchedSourceDomains = (
  sourceUrls: string[],
  targetUrl: string,
): string[] =>
  getSourceDomains(sourceUrls).filter((sourceDomain) =>
    hostnamesMatch(sourceDomain, targetUrl),
  )
