import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getAccessToken, fetchWithRetry, sleep, API_BASE_URL } from "@/lib/blumira-api"

async function fetchAccountDetails(token: string, accountId: string) {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  }

  try {
    // Fetch specific account details
    let accountDetails = null
    try {
      const accountResponse = await fetchWithRetry(`${API_BASE_URL}/msp/accounts/${accountId}`, { headers })
      if (accountResponse.ok) {
        const accountData = await accountResponse.json()
        accountDetails = accountData.status === "OK" && accountData.data ? accountData.data : accountData
      }
    } catch (error) {
      console.warn(`Error fetching account details for ${accountId}:`, error)
    }

    // Fetch agents/devices
    let agentDevices: any[] = []
    let agentDevicesMeta = null
    try {
      const agentsResponse = await fetchWithRetry(`${API_BASE_URL}/msp/accounts/${accountId}/agents/devices`, { headers })
      if (agentsResponse.ok) {
        const agentsData = await agentsResponse.json()
        console.log(`[ORG ${accountId}] devices: status=${agentsData.status}, dataLen=${agentsData.data?.length ?? 'null'}, keys=${Object.keys(agentsData).join(',')}`)
        if (agentsData.status === "OK" && agentsData.data) {
          agentDevices = agentsData.data
          agentDevicesMeta = agentsData.meta
        } else if (Array.isArray(agentsData)) {
          // Some API versions return data directly as an array
          agentDevices = agentsData
          console.log(`[ORG ${accountId}] devices returned as direct array, len=${agentsData.length}`)
        }
      } else {
        console.warn(`[ORG ${accountId}] devices fetch failed: ${agentsResponse.status}`)
      }
    } catch (error) {
      console.warn(`Error fetching agents for ${accountId}:`, error)
    }

    // Fetch agent keys
    let agentKeys: any[] = []
    let agentKeysMeta = null
    try {
      const keysResponse = await fetchWithRetry(`${API_BASE_URL}/msp/accounts/${accountId}/agents/keys`, { headers })
      if (keysResponse.ok) {
        const keysData = await keysResponse.json()
        if (keysData.status === "OK" && keysData.data) {
          agentKeys = keysData.data
          agentKeysMeta = keysData.meta
        }
      }
    } catch (error) {
      console.warn(`Error fetching agent keys for ${accountId}:`, error)
    }

    // Fetch findings
    let findings: any[] = []
    let findingsMeta = null
    try {
      const findingsResponse = await fetchWithRetry(`${API_BASE_URL}/msp/accounts/${accountId}/findings`, { headers })
      if (findingsResponse.ok) {
        const findingsData = await findingsResponse.json()
        if (findingsData.status === "OK" && findingsData.data) {
          findings = findingsData.data
          findingsMeta = findingsData.meta
        }
      }
    } catch (error) {
      console.warn(`Error fetching findings for ${accountId}:`, error)
    }

    const onlineDevices = agentDevices.filter((d: any) => !d.is_sleeping && d.alive).length
    const sleepingDevices = agentDevices.filter((d: any) => d.is_sleeping).length
    const isolatedDevices = agentDevices.filter((d: any) => d.is_isolated).length
    const excludedDevices = agentDevices.filter((d: any) => d.is_excluded).length

    return {
      accountDetails,
      agentDevices,
      agentKeys,
      findings,
      agentDeviceCount: agentDevices.length,
      agentKeyCount: agentKeys.length,
      findingsCount: findings.length,
      criticalFindingsCount: findings.filter((f: any) => f.priority === 1).length,
      openFindingsCount: findings.filter((f: any) => f.status_name === "Open").length,
      onlineDevices,
      sleepingDevices,
      isolatedDevices,
      excludedDevices,
      agent_count_available: accountDetails?.agent_count_available || 0,
      agent_count_used: accountDetails?.agent_count_used || 0,
      license: accountDetails?.license || "Unknown",
      user_count: accountDetails?.user_count || 0,
      agentDevicesMeta,
      agentKeysMeta,
      findingsMeta,
    }
  } catch (error) {
    console.error(`Error fetching details for account ${accountId}:`, error)
    return {
      accountDetails: null, agentDevices: [], agentKeys: [], findings: [],
      agentDeviceCount: 0, agentKeyCount: 0, findingsCount: 0,
      criticalFindingsCount: 0, openFindingsCount: 0,
      onlineDevices: 0, sleepingDevices: 0, isolatedDevices: 0, excludedDevices: 0,
      agent_count_available: 0, agent_count_used: 0, license: "Unknown", user_count: 0,
      agentDevicesMeta: null, agentKeysMeta: null, findingsMeta: null,
    }
  }
}

export async function GET() {
  try {
    const session = await getSession()
    const userOrgId = session?.orgId
    const userOrgName = session?.orgName

    const token = await getAccessToken()

    // Use fetchWithRetry for the initial accounts call too
    const accountsResponse = await fetchWithRetry(`${API_BASE_URL}/msp/accounts`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    })

    if (!accountsResponse.ok) {
      throw new Error(`Failed to fetch MSP accounts: ${accountsResponse.status}`)
    }

    const accountsData = await accountsResponse.json()

    if (accountsData.status !== "OK" || !accountsData.data) {
      throw new Error("Invalid response format from MSP accounts endpoint")
    }

    let accounts = accountsData.data
    if (userOrgId && session?.role !== "msp") {
      accounts = accounts.filter(
        (account: any) => account.account_id === userOrgId || account.name === userOrgName
      )
    }
    const accountsMeta = accountsData.meta

    // Fetch details sequentially to avoid rate limiting
    const accountsWithDetails = []
    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i]
      if (i > 0) await sleep(500)
      const details = await fetchAccountDetails(token, account.account_id)
      accountsWithDetails.push({
        ...account,
        ...details,
        id: account.account_id,
        name: account.name,
        open_findings: account.open_findings || details.openFindingsCount,
        // Preserve original account-level data when detail fetch returned defaults
        agent_count_available: details.agent_count_available || account.agent_count_available || 0,
        agent_count_used: details.agent_count_used || account.agent_count_used || 0,
        license: details.license !== "Unknown" ? details.license : (account.license || "Unknown"),
        user_count: details.user_count || account.user_count || 0,
      })
    }

    const totals = {
      totalAgentDevices: accountsWithDetails.reduce((sum, org) => sum + org.agentDeviceCount, 0),
      totalAgentKeys: accountsWithDetails.reduce((sum, org) => sum + org.agentKeyCount, 0),
      totalFindings: accountsWithDetails.reduce((sum, org) => sum + org.findingsCount, 0),
      totalCriticalFindings: accountsWithDetails.reduce((sum, org) => sum + org.criticalFindingsCount, 0),
      totalOpenFindings: accountsWithDetails.reduce((sum, org) => sum + org.openFindingsCount, 0),
      totalOnlineDevices: accountsWithDetails.reduce((sum, org) => sum + org.onlineDevices, 0),
      totalSleepingDevices: accountsWithDetails.reduce((sum, org) => sum + org.sleepingDevices, 0),
      totalIsolatedDevices: accountsWithDetails.reduce((sum, org) => sum + org.isolatedDevices, 0),
      totalExcludedDevices: accountsWithDetails.reduce((sum, org) => sum + org.excludedDevices, 0),
      totalAgentCountAvailable: accountsWithDetails.reduce((sum, org) => sum + org.agent_count_available, 0),
      totalAgentCountUsed: accountsWithDetails.reduce((sum, org) => sum + org.agent_count_used, 0),
      totalUserCount: accountsWithDetails.reduce((sum, org) => sum + org.user_count, 0),
      licenseBreakdown: accountsWithDetails.reduce((acc: any, org) => {
        acc[org.license] = (acc[org.license] || 0) + 1
        return acc
      }, {}),
    }

    return NextResponse.json({
      organizations: accountsWithDetails,
      meta: accountsMeta,
      totals,
      userOrg: userOrgName || null,
      debug: {
        organizationCount: accountsWithDetails.length,
        filteredByOrg: userOrgId || null,
        ...totals,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Organizations API error:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json(
      { error: errorMessage, timestamp: new Date().toISOString() },
      { status: 500 },
    )
  }
}
