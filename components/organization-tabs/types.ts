// Shared types for organization components

export interface AgentDevice {
  device_id: string
  hostname: string
  alive: string
  arch: string
  created: string
  is_excluded: boolean
  is_isolated: boolean
  is_sleeping: boolean
  isolation_requested: boolean
  key_id: string
  keyname: string
  modified: string
  org_id: string
  plat: string
}

export interface AgentKey {
  key_id: string
  key_name?: string
  name?: string
  status?: string
  created_at?: string
}

export interface Finding {
  finding_id: string
  name: string
  priority: number
  status_name: string
  type_name: string
  category_name?: string
  resolution_name?: string
  created: string
  modified: string
  org_id: string
  org_name?: string
  analysis?: string
}

export interface Organization {
  id: string
  account_id: string
  name: string
  open_findings: number
  agentDevices: AgentDevice[]
  agentKeys: AgentKey[]
  findings: Finding[]
  agentDeviceCount: number
  agentKeyCount: number
  findingsCount: number
  criticalFindingsCount: number
  openFindingsCount: number
  onlineDevices: number
  sleepingDevices: number
  isolatedDevices: number
  excludedDevices: number
  agent_count_available: number
  agent_count_used: number
  license: string
  user_count: number
  agentDevicesMeta?: {
    total_items?: number
    page?: number
    page_size?: number
  }
  agentKeysMeta?: {
    total_items?: number
    page?: number
    page_size?: number
  }
  findingsMeta?: {
    total_items?: number
    page?: number
    page_size?: number
  }
  accountDetails?: any
}

export interface OrganizationsData {
  organizations: Organization[]
  meta?: any
  totals?: {
    totalAgentDevices: number
    totalAgentKeys: number
    totalFindings: number
    totalCriticalFindings: number
    totalOpenFindings: number
    totalOnlineDevices: number
    totalSleepingDevices: number
    totalIsolatedDevices: number
    totalExcludedDevices: number
    totalAgentCountAvailable: number
    totalAgentCountUsed: number
    totalUserCount: number
    licenseBreakdown: Record<string, number>
  }
  debug?: any
  error?: string
}

export type DeviceHealth = "healthy" | "warning" | "critical"

export type SecurityGrade = "A" | "B" | "C" | "D" | "F"

export interface FilterState {
  searchTerm: string
  platform?: string
  status?: string
  priority?: string
  key?: string
}

export interface FindingComment {
  id: string
  finding_id: string
  author: string
  text: string
  timestamp: string
}

export interface FindingDetails extends Finding {
  details?: string
  comments?: FindingComment[]
  history?: Array<{
    action: string
    by: string
    timestamp: string
    change?: string
  }>
}
