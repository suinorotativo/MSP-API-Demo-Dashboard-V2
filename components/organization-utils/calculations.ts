import type { Finding, AgentDevice, DeviceHealth, SecurityGrade, GlobalBenchmark, Organization } from "../organization-tabs/types"

/**
 * Calculate the global benchmark across all organizations.
 * Returns the average critical and high finding rates (as fraction of total findings).
 */
export function calculateGlobalBenchmark(organizations: Organization[]): GlobalBenchmark {
  let totalFindings = 0
  let totalCritical = 0
  let totalHigh = 0

  for (const org of organizations) {
    const findings = org.findings || []
    totalFindings += findings.length
    totalCritical += findings.filter((f) => f.priority === 1).length
    totalHigh += findings.filter((f) => f.priority === 2).length
  }

  const denominator = Math.max(totalFindings, 1)
  return {
    globalCriticalRate: totalCritical / denominator,
    globalHighRate: totalHigh / denominator,
    totalFindings,
  }
}

/**
 * Calculate security score for an organization based on deviation from global benchmark.
 * A site at the global average scores ~100 (before device adjustments).
 * Sites with more criticals/highs than average score lower; fewer score higher.
 */
export function calculateSecurityScore(findings: Finding[], devices: AgentDevice[], benchmark?: GlobalBenchmark): number {
  const totalFindings = Math.max(findings.length, 1)
  const siteCriticalRate = findings.filter((f) => f.priority === 1).length / totalFindings
  const siteHighRate = findings.filter((f) => f.priority === 2).length / totalFindings

  const globalCriticalRate = benchmark?.globalCriticalRate ?? siteCriticalRate
  const globalHighRate = benchmark?.globalHighRate ?? siteHighRate

  // Deviation: positive = worse than average
  const criticalDeviation = siteCriticalRate - globalCriticalRate
  const highDeviation = siteHighRate - globalHighRate

  // Scale deviations into point penalties/bonuses
  const criticalPenalty = criticalDeviation * 200  // 10% worse → -20 pts
  const highPenalty = highDeviation * 100           // 10% worse → -10 pts

  const totalDevices = devices.length
  const onlineDevices = devices.filter((d) => !d.is_sleeping && !d.is_excluded && !d.is_isolated).length
  const deviceHealthBonus = totalDevices > 0 ? (onlineDevices / totalDevices) * 20 : 0

  const offlinePercentage = totalDevices > 0 ? ((totalDevices - onlineDevices) / totalDevices) * 100 : 0
  const offlinePenalty = offlinePercentage * 0.2

  const score = Math.min(100, Math.max(0, 100 - criticalPenalty - highPenalty + deviceHealthBonus - offlinePenalty))
  return Math.round(score)
}

/**
 * Convert security score to letter grade
 */
export function calculateSecurityGrade(score: number): SecurityGrade {
  if (score >= 90) return "A"
  if (score >= 80) return "B"
  if (score >= 70) return "C"
  if (score >= 60) return "D"
  return "F"
}

/**
 * Calculate device health based on check-in time and status
 */
export function calculateDeviceHealth(device: AgentDevice): DeviceHealth {
  if (device.is_isolated || device.is_excluded) return "critical"

  const hoursSinceCheckIn = (Date.now() - new Date(device.alive).getTime()) / 3600000

  if (hoursSinceCheckIn > 168) return "critical" // >7 days
  if (hoursSinceCheckIn > 72 || device.is_sleeping) return "warning" // >3 days
  return "healthy"
}

/**
 * Calculate agent coverage percentage
 */
export function calculateCoveragePercentage(used: number, available: number): number {
  if (available === 0) return 0
  return Math.round((used / available) * 100)
}

/**
 * Calculate findings velocity (new findings per day)
 */
export function calculateVelocity(findings: Finding[], days: number = 7): number {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)

  const recentFindings = findings.filter((f) => new Date(f.created) >= cutoffDate)

  return Number((recentFindings.length / days).toFixed(2))
}

/**
 * Calculate Mean Time to Resolution by priority
 */
export function calculateMTTR(findings: Finding[]): Record<number, number> {
  const resolvedFindings = findings.filter(
    (f) => (f.status_name === "Closed" || f.status_name === "Resolved") && f.resolution_name,
  )

  const mttrByPriority: Record<number, number[]> = {}

  resolvedFindings.forEach((f) => {
    const resolutionTime = (new Date(f.modified).getTime() - new Date(f.created).getTime()) / 3600000 // hours

    if (!mttrByPriority[f.priority]) mttrByPriority[f.priority] = []
    mttrByPriority[f.priority].push(resolutionTime)
  })

  return Object.entries(mttrByPriority).reduce(
    (acc, [priority, times]) => {
      acc[Number(priority)] = Math.round(times.reduce((a, b) => a + b, 0) / times.length)
      return acc
    },
    {} as Record<number, number>,
  )
}

/**
 * Aggregate findings by category
 */
export function aggregateByCategory(findings: Finding[]): Record<string, number> {
  return findings.reduce(
    (acc, finding) => {
      const category = finding.category_name || "Unknown"
      acc[category] = (acc[category] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )
}

/**
 * Aggregate findings by priority
 */
export function aggregateByPriority(findings: Finding[]): Record<number, number> {
  return findings.reduce(
    (acc, finding) => {
      acc[finding.priority] = (acc[finding.priority] || 0) + 1
      return acc
    },
    {} as Record<number, number>,
  )
}

/**
 * Aggregate findings by status
 */
export function aggregateByStatus(findings: Finding[]): Record<string, number> {
  return findings.reduce(
    (acc, finding) => {
      acc[finding.status_name] = (acc[finding.status_name] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )
}

/**
 * Aggregate findings by type
 */
export function aggregateByType(findings: Finding[]): Record<string, number> {
  return findings.reduce(
    (acc, finding) => {
      acc[finding.type_name] = (acc[finding.type_name] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )
}

/**
 * Aggregate devices by platform
 */
export function aggregateByPlatform(devices: AgentDevice[]): Record<string, number> {
  return devices.reduce(
    (acc, device) => {
      acc[device.plat] = (acc[device.plat] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )
}

/**
 * Aggregate devices by architecture
 */
export function aggregateByArchitecture(devices: AgentDevice[]): Record<string, number> {
  return devices.reduce(
    (acc, device) => {
      acc[device.arch] = (acc[device.arch] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )
}

/**
 * Generate timeline data for findings (daily buckets)
 */
export function generateFindingsTimeline(findings: Finding[], days: number = 30): Array<{
  date: string
  total: number
  P1: number
  P2: number
  P3: number
  P4: number
  P5: number
}> {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const timeline: Record<string, { total: number; P1: number; P2: number; P3: number; P4: number; P5: number }> = {}

  // Initialize all dates
  for (let i = 0; i <= days; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    const dateKey = date.toISOString().split("T")[0]
    timeline[dateKey] = { total: 0, P1: 0, P2: 0, P3: 0, P4: 0, P5: 0 }
  }

  // Count findings by date
  findings.forEach((finding) => {
    const dateKey = finding.created.split("T")[0]
    if (timeline[dateKey]) {
      timeline[dateKey].total++
      const priorityKey = `P${finding.priority}` as "P1" | "P2" | "P3" | "P4" | "P5"
      timeline[dateKey][priorityKey]++
    }
  })

  return Object.entries(timeline)
    .map(([date, counts]) => ({ date, ...counts }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Calculate weekly velocity comparison (this week vs last week)
 */
export function calculateVelocityComparison(findings: Finding[]): {
  thisWeek: number
  lastWeek: number
  change: number
  percentChange: number
} {
  const now = new Date()
  const thisWeekStart = new Date(now)
  thisWeekStart.setDate(thisWeekStart.getDate() - 7)

  const lastWeekStart = new Date(now)
  lastWeekStart.setDate(lastWeekStart.getDate() - 14)
  const lastWeekEnd = new Date(now)
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 7)

  const thisWeekFindings = findings.filter((f) => new Date(f.created) >= thisWeekStart)
  const lastWeekFindings = findings.filter(
    (f) => new Date(f.created) >= lastWeekStart && new Date(f.created) < lastWeekEnd,
  )

  const thisWeek = thisWeekFindings.length
  const lastWeek = lastWeekFindings.length
  const change = thisWeek - lastWeek
  const percentChange = lastWeek > 0 ? Math.round((change / lastWeek) * 100) : 0

  return { thisWeek, lastWeek, change, percentChange }
}

/**
 * Get color for device health status
 */
export function getDeviceHealthColor(health: DeviceHealth): string {
  switch (health) {
    case "healthy":
      return "text-green-600 bg-green-50 border-green-200"
    case "warning":
      return "text-yellow-600 bg-yellow-50 border-yellow-200"
    case "critical":
      return "text-red-600 bg-red-50 border-red-200"
    default:
      return "text-gray-600 bg-gray-50 border-gray-200"
  }
}

/**
 * Get color for security grade
 */
export function getSecurityGradeColor(grade: SecurityGrade): string {
  switch (grade) {
    case "A":
      return "text-green-600 bg-green-100 border-green-300"
    case "B":
      return "text-blue-600 bg-blue-100 border-blue-300"
    case "C":
      return "text-yellow-600 bg-yellow-100 border-yellow-300"
    case "D":
      return "text-orange-600 bg-orange-100 border-orange-300"
    case "F":
      return "text-red-600 bg-red-100 border-red-300"
    default:
      return "text-gray-600 bg-gray-100 border-gray-300"
  }
}

/**
 * Get color for priority level
 */
export function getPriorityColor(priority: number): string {
  switch (priority) {
    case 1:
      return "#ef4444" // red-500
    case 2:
      return "#f97316" // orange-500
    case 3:
      return "#7c3aed" // violet-600
    case 4:
      return "#22c55e" // green-500
    case 5:
      return "#6b7280" // gray-500
    default:
      return "#9ca3af" // gray-400
  }
}

/**
 * Format hours to human-readable duration
 */
export function formatDuration(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} min`
  if (hours < 24) return `${Math.round(hours)} hrs`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? "" : "s"}`
}
