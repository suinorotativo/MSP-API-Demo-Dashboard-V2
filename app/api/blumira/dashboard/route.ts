import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getAccessToken, fetchWithRetry, API_BASE_URL } from "@/lib/blumira-api"

async function fetchMspAccounts(token: string) {
  const response = await fetchWithRetry(`${API_BASE_URL}/msp/accounts`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to fetch MSP accounts (${response.status}): ${text || response.statusText}`)
  }

  const data = await response.json()
  return data.data || []
}

async function fetchAllFindings(token: string) {
  const response = await fetchWithRetry(`${API_BASE_URL}/msp/accounts/findings`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  })

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error("Permission denied to fetch findings. Please check your API permissions.")
    }
    const text = await response.text()
    throw new Error(`Failed to fetch findings (${response.status}): ${text || response.statusText}`)
  }

  const data = await response.json()
  return data.data || []
}

export async function GET() {
  try {
    const session = await getSession()
    const userOrgId = session?.orgId
    const userOrgName = session?.orgName

    const token = await getAccessToken()

    let accounts: any[] = []
    let findings: any[] = []

    try {
      accounts = await fetchMspAccounts(token)
    } catch (accountsError) {
      console.warn("Failed to fetch accounts, continuing with findings:", accountsError)
    }

    try {
      findings = await fetchAllFindings(token)
    } catch (findingsError) {
      console.warn("Failed to fetch findings:", findingsError)
    }

    // Filter by user's organization if logged in (MSP role sees all orgs)
    if (userOrgId && session?.role !== "msp") {
      accounts = accounts.filter(
        (account: any) => account.account_id === userOrgId || account.id === userOrgId
      )
      findings = findings.filter(
        (finding: any) => finding.org_id === userOrgId || finding.org_name === userOrgName
      )
    }

    return NextResponse.json({
      accounts,
      findings,
      userOrg: userOrgName || null,
      debug: {
        accountsCount: accounts.length,
        findingsCount: findings.length,
        filteredByOrg: userOrgId || null,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Dashboard API error:", error)

    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json(
      {
        error: errorMessage,
        details: {
          message: errorMessage,
          timestamp: new Date().toISOString(),
          hasClientId: !!process.env.BLUMIRA_CLIENT_ID,
          hasClientSecret: !!process.env.BLUMIRA_CLIENT_SECRET,
        },
      },
      { status: 500 },
    )
  }
}
