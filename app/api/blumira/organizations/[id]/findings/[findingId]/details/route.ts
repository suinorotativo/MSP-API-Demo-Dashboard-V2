import { NextResponse } from "next/server"
import { getAccessToken, fetchWithRetry, API_BASE_URL } from "@/lib/blumira-api"

async function tryFetch(url: string, token: string): Promise<{ ok: boolean; data?: any }> {
  try {
    const response = await fetchWithRetry(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    })

    if (!response.ok) return { ok: false }

    const data = await response.json()
    return { ok: true, data }
  } catch {
    return { ok: false }
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; findingId: string }> },
) {
  try {
    const { id, findingId } = await params
    const token = await getAccessToken()

    // Try multiple endpoint patterns
    const endpoints = [
      `${API_BASE_URL}/msp/accounts/${id}/findings/${findingId}/details`,
      `${API_BASE_URL}/msp/accounts/${id}/findings/${findingId}`,
      `${API_BASE_URL}/org/findings/${findingId}/details`,
      `${API_BASE_URL}/org/findings/${findingId}`,
    ]

    for (const url of endpoints) {
      const result = await tryFetch(url, token)
      if (result.ok && result.data) {
        return NextResponse.json(result.data)
      }
    }

    // Return minimal data if all endpoints fail
    return NextResponse.json({
      status: "OK",
      data: {
        finding_id: findingId,
        message: "Detailed finding data is not available through the current API endpoints",
      },
    })
  } catch (error) {
    console.error("Finding details API error:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json(
      { error: errorMessage, timestamp: new Date().toISOString() },
      { status: 500 },
    )
  }
}
