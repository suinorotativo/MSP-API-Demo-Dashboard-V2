export const AUTH_URL = "https://auth.blumira.com/oauth/token"
export const API_BASE_URL = "https://api.blumira.com/public-api/v1"

// Rate-limit-aware fetch with retry
export async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, options)
    if (response.status === 429) {
      const retryAfter = response.headers.get("retry-after")
      const delay = retryAfter ? parseInt(retryAfter) * 1000 : 1000 * (i + 1)
      console.warn(`Rate limited, retrying in ${delay}ms...`)
      await new Promise((resolve) => setTimeout(resolve, delay))
      continue
    }
    return response
  }
  return fetch(url, options)
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

let cachedToken: { token: string; expiresAt: number } | null = null

export async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token
  }

  const clientId = process.env.BLUMIRA_CLIENT_ID
  const clientSecret = process.env.BLUMIRA_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error("BLUMIRA_CLIENT_ID and BLUMIRA_CLIENT_SECRET environment variables are required")
  }

  const payload = {
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    audience: "public-api",
  }

  const response = await fetch(AUTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const responseText = await response.text()
    throw new Error(`Authentication failed (${response.status}): ${responseText}`)
  }

  const data = await response.json()

  // Cache with expiry (default 24h if expires_in not provided)
  const expiresIn = (data.expires_in || 86400) * 1000
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + expiresIn,
  }

  return data.access_token
}
