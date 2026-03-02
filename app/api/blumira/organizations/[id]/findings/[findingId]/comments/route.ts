import { NextResponse } from "next/server"
import { getAccessToken, fetchWithRetry, API_BASE_URL } from "@/lib/blumira-api"

async function tryFetchComments(url: string, token: string): Promise<{ ok: boolean; data?: any }> {
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

    const endpoints = [
      `${API_BASE_URL}/msp/accounts/${id}/findings/${findingId}/comments`,
      `${API_BASE_URL}/org/findings/${findingId}/comments`,
    ]

    for (const url of endpoints) {
      const result = await tryFetchComments(url, token)
      if (result.ok && result.data) {
        return NextResponse.json(result.data)
      }
    }

    return NextResponse.json({ status: "OK", data: [] })
  } catch (error) {
    console.error("Finding comments API error:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json(
      { error: errorMessage, timestamp: new Date().toISOString() },
      { status: 500 },
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; findingId: string }> },
) {
  try {
    const { id, findingId } = await params
    const token = await getAccessToken()
    const body = await request.json()

    const endpoints = [
      `${API_BASE_URL}/msp/accounts/${id}/findings/${findingId}/comments`,
      `${API_BASE_URL}/org/findings/${findingId}/comments`,
    ]

    for (const url of endpoints) {
      try {
        const response = await fetchWithRetry(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(body),
        })

        if (response.ok) {
          const data = await response.json()
          return NextResponse.json(data)
        }
      } catch {
        // try next endpoint
      }
    }

    throw new Error("Failed to add comment via all available endpoints")
  } catch (error) {
    console.error("Add comment API error:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json(
      { error: errorMessage, timestamp: new Date().toISOString() },
      { status: 500 },
    )
  }
}
