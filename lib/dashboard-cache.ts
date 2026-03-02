interface DashboardData {
  accounts: any[]
  findings: any[]
  userOrg: string | null
  debug?: any
}

interface CacheEntry {
  data: DashboardData
  timestamp: number
}

const CACHE_TTL = 2 * 60 * 1000 // 2 minutes

let cache: CacheEntry | null = null

export async function getDashboardData(forceRefresh = false): Promise<DashboardData> {
  // Return cached data if fresh
  if (!forceRefresh && cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return cache.data
  }

  const response = await fetch("/api/blumira/dashboard")
  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || "Failed to fetch data")
  }

  const data: DashboardData = {
    accounts: result.accounts || [],
    findings: result.findings || [],
    userOrg: result.userOrg || null,
    debug: result.debug,
  }

  cache = { data, timestamp: Date.now() }
  return data
}

export function invalidateDashboardCache() {
  cache = null
}
