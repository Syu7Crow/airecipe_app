type CacheEntry<T> = {
  data: T
  timestamp: number
}

const store = new Map<string, CacheEntry<unknown>>()

const MAX_AGE_MS = 5 * 60 * 1000

export function getCache<T>(key: string): T | null {
  const entry = store.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > MAX_AGE_MS) {
    store.delete(key)
    return null
  }
  return entry.data as T
}

export function setCache<T>(key: string, data: T): void {
  store.set(key, { data, timestamp: Date.now() })
}

export function clearCache(): void {
  store.clear()
}

export function invalidateCache(pattern: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(pattern)) {
      store.delete(key)
    }
  }
}

const RELATED_CACHE_PREFIXES = [
  'inventory:',
  'home:',
  'cooking-history:',
  'recipe-generate:',
]

function invalidateAllRelated(): void {
  for (const prefix of RELATED_CACHE_PREFIXES) {
    invalidateCache(prefix)
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('inventory-updated', invalidateAllRelated)
  window.addEventListener('preferences-updated', () => {
    invalidateCache('home:')
    invalidateCache('recipe-generate:')
  })
}
