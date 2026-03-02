import type { Organization, Finding, AgentDevice } from "../organization-tabs/types"

/**
 * Export findings to CSV format
 */
export function exportFindingsToCSV(findings: Finding[]): string {
  const headers = [
    "Finding ID",
    "Name",
    "Priority",
    "Status",
    "Type",
    "Category",
    "Resolution",
    "Created",
    "Modified",
    "Organization",
  ]

  const rows = findings.map((finding) => [
    finding.finding_id,
    `"${finding.name.replace(/"/g, '""')}"`, // Escape quotes
    finding.priority.toString(),
    finding.status_name,
    finding.type_name,
    finding.category_name || "",
    finding.resolution_name || "",
    finding.created,
    finding.modified,
    finding.org_name || finding.org_id,
  ])

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
}

/**
 * Export devices to CSV format
 */
export function exportDevicesToCSV(devices: AgentDevice[]): string {
  const headers = [
    "Device ID",
    "Hostname",
    "Platform",
    "Architecture",
    "Key Name",
    "Status",
    "Last Alive",
    "Created",
    "Modified",
    "Organization",
  ]

  const rows = devices.map((device) => {
    let status = "Online"
    if (device.is_excluded) status = "Excluded"
    else if (device.is_isolated) status = "Isolated"
    else if (device.is_sleeping) status = "Sleeping"

    return [
      device.device_id,
      `"${device.hostname.replace(/"/g, '""')}"`,
      device.plat,
      device.arch,
      `"${device.keyname.replace(/"/g, '""')}"`,
      status,
      device.alive,
      device.created,
      device.modified,
      device.org_id,
    ]
  })

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
}

/**
 * Export organizations summary to CSV format
 */
export function exportOrganizationsSummaryToCSV(organizations: Organization[]): string {
  const headers = [
    "Organization ID",
    "Name",
    "License",
    "Users",
    "Agent Capacity (Used/Available)",
    "Devices",
    "Online Devices",
    "Sleeping Devices",
    "Isolated Devices",
    "Total Findings",
    "Critical Findings",
    "Open Findings",
  ]

  const rows = organizations.map((org) => [
    org.account_id,
    `"${org.name.replace(/"/g, '""')}"`,
    org.license,
    org.user_count.toString(),
    `${org.agent_count_used}/${org.agent_count_available}`,
    org.agentDeviceCount.toString(),
    org.onlineDevices.toString(),
    org.sleepingDevices.toString(),
    org.isolatedDevices.toString(),
    org.findingsCount.toString(),
    org.criticalFindingsCount.toString(),
    org.openFindingsCount.toString(),
  ])

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

/**
 * Export findings to CSV and download
 */
export function downloadFindingsCSV(findings: Finding[], filename: string = "findings.csv"): void {
  const csv = exportFindingsToCSV(findings)
  downloadCSV(csv, filename)
}

/**
 * Export devices to CSV and download
 */
export function downloadDevicesCSV(devices: AgentDevice[], filename: string = "devices.csv"): void {
  const csv = exportDevicesToCSV(devices)
  downloadCSV(csv, filename)
}

/**
 * Export organizations summary to CSV and download
 */
export function downloadOrganizationsSummaryCSV(
  organizations: Organization[],
  filename: string = "organizations.csv",
): void {
  const csv = exportOrganizationsSummaryToCSV(organizations)
  downloadCSV(csv, filename)
}

/**
 * Format data for PDF export (returns structured data that can be sent to server)
 */
export function preparePDFExportData(organization: Organization) {
  return {
    organization: {
      id: organization.account_id,
      name: organization.name,
      license: organization.license,
      userCount: organization.user_count,
    },
    metrics: {
      agentCapacity: {
        used: organization.agent_count_used,
        available: organization.agent_count_available,
        percentage: Math.round((organization.agent_count_used / organization.agent_count_available) * 100),
      },
      devices: {
        total: organization.agentDeviceCount,
        online: organization.onlineDevices,
        sleeping: organization.sleepingDevices,
        isolated: organization.isolatedDevices,
        excluded: organization.excludedDevices,
      },
      findings: {
        total: organization.findingsCount,
        critical: organization.criticalFindingsCount,
        open: organization.openFindingsCount,
      },
    },
    findings: organization.findings.slice(0, 50), // Limit to 50 for PDF
    devices: organization.agentDevices.slice(0, 50), // Limit to 50 for PDF
  }
}
