import { NextResponse } from "next/server"
import { getAccessToken, fetchWithRetry, sleep, API_BASE_URL } from "@/lib/blumira-api"

async function fetchOrganizationData(token: string, organizationId: string) {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  }

  const accountResponse = await fetchWithRetry(`${API_BASE_URL}/msp/accounts/${organizationId}`, { headers })
  if (!accountResponse.ok) {
    throw new Error(`Failed to fetch account ${organizationId}`)
  }
  const accountData = await accountResponse.json()

  let findings: any[] = []
  const findingsResponse = await fetchWithRetry(`${API_BASE_URL}/msp/accounts/${organizationId}/findings`, { headers })
  if (findingsResponse.ok) {
    const findingsData = await findingsResponse.json()
    findings = findingsData.data || []
  }

  let devices: any[] = []
  const devicesResponse = await fetchWithRetry(`${API_BASE_URL}/msp/accounts/${organizationId}/agents/devices`, { headers })
  if (devicesResponse.ok) {
    const devicesData = await devicesResponse.json()
    devices = devicesData.data || []
  }

  return {
    account: accountData.data || accountData,
    findings,
    devices,
  }
}

function generateCSV(data: any[], type: "findings" | "devices" | "summary"): string {
  if (type === "findings") {
    const headers = [
      "Finding ID", "Name", "Priority", "Status", "Type",
      "Category", "Created", "Modified", "Organization",
    ]
    const rows = data.map((f: any) => [
      f.finding_id || "",
      `"${(f.name || "").replace(/"/g, '""')}"`,
      f.priority?.toString() || "",
      f.status_name || "",
      f.type_name || "",
      f.category_name || "",
      f.created || "",
      f.modified || "",
      f.org_name || f.org_id || "",
    ])
    return [headers.join(","), ...rows.map((r: string[]) => r.join(","))].join("\n")
  }

  if (type === "devices") {
    const headers = [
      "Device ID", "Hostname", "Platform", "Architecture",
      "Key Name", "Status", "Last Alive", "Created", "Organization",
    ]
    const rows = data.map((d: any) => {
      let status = "Online"
      if (d.is_excluded) status = "Excluded"
      else if (d.is_isolated) status = "Isolated"
      else if (d.is_sleeping) status = "Sleeping"
      return [
        d.device_id || "",
        `"${(d.hostname || "").replace(/"/g, '""')}"`,
        d.plat || "",
        d.arch || "",
        `"${(d.keyname || "").replace(/"/g, '""')}"`,
        status,
        d.alive || "",
        d.created || "",
        d.org_id || "",
      ]
    })
    return [headers.join(","), ...rows.map((r: string[]) => r.join(","))].join("\n")
  }

  // Summary
  const headers = [
    "Organization ID", "Name", "Total Findings",
    "Critical Findings", "Total Devices", "Online Devices",
  ]
  const rows = data.map((org: any) => [
    org.organizationId || "",
    `"${(org.organizationName || "").replace(/"/g, '""')}"`,
    org.totalFindings?.toString() || "0",
    org.criticalFindings?.toString() || "0",
    org.totalDevices?.toString() || "0",
    org.onlineDevices?.toString() || "0",
  ])
  return [headers.join(","), ...rows.map((r: string[]) => r.join(","))].join("\n")
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { organizationIds, format, dataType } = body

    if (!organizationIds || organizationIds.length === 0) {
      return NextResponse.json({ error: "No organizations selected" }, { status: 400 })
    }

    if (format !== "csv") {
      return NextResponse.json({ error: "Only CSV format is currently supported" }, { status: 400 })
    }

    const token = await getAccessToken()

    // Fetch data sequentially with delays to avoid rate limiting
    const validData: any[] = []
    for (let i = 0; i < organizationIds.length; i++) {
      if (i > 0) await sleep(500)
      try {
        const data = await fetchOrganizationData(token, organizationIds[i])
        validData.push(data)
      } catch (err) {
        console.error(`Failed to fetch data for org ${organizationIds[i]}:`, err)
      }
    }

    if (validData.length === 0) {
      return NextResponse.json({ error: "Failed to fetch data for any organization" }, { status: 500 })
    }

    let csvContent: string
    let filename: string

    if (dataType === "findings") {
      csvContent = generateCSV(validData.flatMap((org: any) => org.findings), "findings")
      filename = `findings_export_${new Date().toISOString().split("T")[0]}.csv`
    } else if (dataType === "devices") {
      csvContent = generateCSV(validData.flatMap((org: any) => org.devices), "devices")
      filename = `devices_export_${new Date().toISOString().split("T")[0]}.csv`
    } else {
      const summaryData = validData.map((org: any, index) => ({
        organizationId: organizationIds[index],
        organizationName: org.account?.name || "Unknown",
        totalFindings: org.findings.length,
        criticalFindings: org.findings.filter((f: any) => f.priority === 1).length,
        totalDevices: org.devices.length,
        onlineDevices: org.devices.filter((d: any) => !d.is_sleeping && !d.is_excluded && !d.is_isolated).length,
      }))
      csvContent = generateCSV(summaryData, "summary")
      filename = `summary_export_${new Date().toISOString().split("T")[0]}.csv`
    }

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Export API error:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json(
      { error: errorMessage, timestamp: new Date().toISOString() },
      { status: 500 },
    )
  }
}
