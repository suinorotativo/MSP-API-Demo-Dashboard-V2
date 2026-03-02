import type { AgentDevice, Finding, FilterState } from "../organization-tabs/types"

/**
 * Filter devices based on filter state
 */
export function filterDevices(devices: AgentDevice[], filters: FilterState): AgentDevice[] {
  return devices.filter((device) => {
    // Search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      const matchesSearch =
        device.hostname.toLowerCase().includes(searchLower) ||
        device.device_id.toLowerCase().includes(searchLower) ||
        device.keyname.toLowerCase().includes(searchLower)

      if (!matchesSearch) return false
    }

    // Platform filter
    if (filters.platform && filters.platform !== "all") {
      if (device.plat !== filters.platform) return false
    }

    // Status filter
    if (filters.status && filters.status !== "all") {
      switch (filters.status) {
        case "online":
          if (device.is_sleeping || device.is_isolated || device.is_excluded) return false
          break
        case "sleeping":
          if (!device.is_sleeping) return false
          break
        case "isolated":
          if (!device.is_isolated) return false
          break
        case "excluded":
          if (!device.is_excluded) return false
          break
      }
    }

    // Key filter
    if (filters.key && filters.key !== "all") {
      if (device.key_id !== filters.key) return false
    }

    return true
  })
}

/**
 * Sort devices based on criteria
 */
export function sortDevices(
  devices: AgentDevice[],
  sortBy: "hostname" | "alive" | "platform" | "health",
  sortOrder: "asc" | "desc" = "asc",
): AgentDevice[] {
  const sorted = [...devices].sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case "hostname":
        comparison = a.hostname.localeCompare(b.hostname)
        break
      case "alive":
        comparison = new Date(a.alive).getTime() - new Date(b.alive).getTime()
        break
      case "platform":
        comparison = a.plat.localeCompare(b.plat)
        break
      case "health":
        // Sort by health: healthy < warning < critical
        const healthScore = (device: AgentDevice) => {
          if (device.is_isolated || device.is_excluded) return 3
          const hours = (Date.now() - new Date(device.alive).getTime()) / 3600000
          if (hours > 168) return 3
          if (hours > 72 || device.is_sleeping) return 2
          return 1
        }
        comparison = healthScore(a) - healthScore(b)
        break
    }

    return sortOrder === "asc" ? comparison : -comparison
  })

  return sorted
}

/**
 * Filter findings based on filter state
 */
export function filterFindings(findings: Finding[], filters: FilterState): Finding[] {
  return findings.filter((finding) => {
    // Search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      const matchesSearch =
        finding.name.toLowerCase().includes(searchLower) ||
        finding.type_name.toLowerCase().includes(searchLower) ||
        finding.category_name?.toLowerCase().includes(searchLower) ||
        finding.finding_id.toLowerCase().includes(searchLower)

      if (!matchesSearch) return false
    }

    // Priority filter
    if (filters.priority && filters.priority !== "all") {
      if (finding.priority.toString() !== filters.priority) return false
    }

    // Status filter
    if (filters.status && filters.status !== "all") {
      if (finding.status_name !== filters.status) return false
    }

    return true
  })
}

/**
 * Sort findings based on criteria
 */
export function sortFindings(
  findings: Finding[],
  sortBy: "priority" | "created" | "modified" | "name",
  sortOrder: "asc" | "desc" = "asc",
): Finding[] {
  const sorted = [...findings].sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case "priority":
        comparison = a.priority - b.priority
        break
      case "created":
        comparison = new Date(a.created).getTime() - new Date(b.created).getTime()
        break
      case "modified":
        comparison = new Date(a.modified).getTime() - new Date(b.modified).getTime()
        break
      case "name":
        comparison = a.name.localeCompare(b.name)
        break
    }

    return sortOrder === "asc" ? comparison : -comparison
  })

  return sorted
}

/**
 * Get unique platforms from devices
 */
export function getUniquePlatforms(devices: AgentDevice[]): string[] {
  return [...new Set(devices.map((d) => d.plat))].sort()
}

/**
 * Get unique keys from devices
 */
export function getUniqueKeys(devices: AgentDevice[]): Array<{ id: string; name: string }> {
  const keyMap = new Map<string, string>()
  devices.forEach((device) => {
    if (!keyMap.has(device.key_id)) {
      keyMap.set(device.key_id, device.keyname)
    }
  })

  return Array.from(keyMap.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Get unique priorities from findings
 */
export function getUniquePriorities(findings: Finding[]): number[] {
  return [...new Set(findings.map((f) => f.priority))].sort()
}

/**
 * Get unique statuses from findings
 */
export function getUniqueStatuses(findings: Finding[]): string[] {
  return [...new Set(findings.map((f) => f.status_name))].sort()
}

/**
 * Highlight search term in text
 */
export function highlightSearchTerm(text: string, searchTerm: string): string {
  if (!searchTerm) return text

  const regex = new RegExp(`(${searchTerm})`, "gi")
  return text.replace(regex, "<mark>$1</mark>")
}
