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
      .split('/')[0]
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
