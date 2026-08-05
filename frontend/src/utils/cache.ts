const CACHE_PREFIX = "cms_cache_";
const DEFAULT_MAX_AGE = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

function getCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    return entry.data;
  } catch {
    return null;
  }
}

function setCache<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // localStorage full or unavailable
  }
}

function isFresh(key: string, maxAge = DEFAULT_MAX_AGE): boolean {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return false;
    const entry: CacheEntry<unknown> = JSON.parse(raw);
    return Date.now() - entry.timestamp < maxAge;
  } catch {
    return false;
  }
}

export async function cachedFetch<T>(
  url: string,
  cacheKey: string,
  options?: RequestInit
): Promise<T> {
  const cached = getCache<T>(cacheKey);

  if (cached && isFresh(cacheKey)) {
    return cached;
  }

  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`Failed to fetch ${cacheKey}`);
  const data: T = await res.json();
  setCache(cacheKey, data);
  return data;
}

export function invalidateCache(keyPattern?: string): void {
  const keys = Object.keys(localStorage).filter((k) => k.startsWith(CACHE_PREFIX));
  for (const key of keys) {
    if (!keyPattern || key.includes(keyPattern)) {
      localStorage.removeItem(key);
    }
  }
}
