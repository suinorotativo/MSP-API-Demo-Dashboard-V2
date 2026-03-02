"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Building2,
  Monitor,
  Search,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  Key,
  AlertTriangle,
  Activity,
  HardDrive,
  Wifi,
  WifiOff,
  Ban,
  EyeOff,
  Users,
  Shield,
  Gauge,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { FindingsTab } from "./organization-tabs/findings-tab"
import { DevicesTab } from "./organization-tabs/devices-tab"
import { SecurityPostureTab } from "./organization-tabs/security-posture-tab"
import { AgentHealthTab } from "./organization-tabs/agent-health-tab"
import { OverviewTab } from "./organization-tabs/overview-tab"
import { KeysTab } from "./organization-tabs/keys-tab"

interface AgentDevice {
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

interface Organization {
  id: string
  account_id: string
  name: string
  open_findings: number
  agentDevices: AgentDevice[]
  agentKeys: any[]
  findings: any[]
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
  agentDevicesMeta?: any
  agentKeysMeta?: any
  findingsMeta?: any
  accountDetails?: any
}

interface OrganizationsData {
  organizations: Organization[]
  meta?: any
  totals?: any
  debug?: any
  error?: string
}

export function OrganizationsView() {
  const [data, setData] = useState<OrganizationsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async () => {
    try {
      setError(null)
      const response = await fetch("/api/blumira/organizations")
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch organizations")
      }

      console.log("Organizations data received:", {
        organizationCount: result.organizations?.length || 0,
        totals: result.totals,
        debug: result.debug,
      })

      setData(result)
    } catch (err) {
      console.error("Fetch error:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
  }

  const getLicenseColor = (license: string) => {
    switch (license.toUpperCase()) {
      case "FREE":
        return "bg-gray-100 text-gray-800"
      case "TRIAL":
        return "bg-yellow-100 text-yellow-800"
      case "BASIC":
        return "bg-blue-100 text-blue-800"
      case "PREMIUM":
        return "bg-purple-100 text-purple-800"
      case "ENTERPRISE":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getLicenseIcon = (license: string) => {
    switch (license.toUpperCase()) {
      case "FREE":
        return <Shield className="h-4 w-4 text-gray-600" />
      case "TRIAL":
        return <Shield className="h-4 w-4 text-yellow-600" />
      case "BASIC":
        return <Shield className="h-4 w-4 text-blue-600" />
      case "PREMIUM":
        return <Shield className="h-4 w-4 text-purple-600" />
      case "ENTERPRISE":
        return <Shield className="h-4 w-4 text-green-600" />
      default:
        return <Shield className="h-4 w-4 text-gray-600" />
    }
  }

  const getDeviceStatusIcon = (device: AgentDevice) => {
    if (device.is_excluded) return <EyeOff className="h-4 w-4 text-gray-500" />
    if (device.is_isolated) return <Ban className="h-4 w-4 text-red-500" />
    if (device.is_sleeping) return <WifiOff className="h-4 w-4 text-yellow-500" />
    return <Wifi className="h-4 w-4 text-green-500" />
  }

  const getDeviceStatusBadge = (device: AgentDevice) => {
    if (device.is_excluded) return <Badge variant="secondary">Excluded</Badge>
    if (device.is_isolated) return <Badge variant="destructive">Isolated</Badge>
    if (device.is_sleeping) return <Badge variant="outline">Sleeping</Badge>
    return <Badge variant="default">Online</Badge>
  }

  const getDeviceStatusColor = (device: AgentDevice) => {
    if (device.is_excluded) return "border-gray-200 bg-gray-50"
    if (device.is_isolated) return "border-red-200 bg-red-50"
    if (device.is_sleeping) return "border-yellow-200 bg-yellow-50"
    return "border-green-200 bg-green-50"
  }

  const getAgentUtilizationColor = (used: number, available: number) => {
    if (available === 0) return "text-gray-600"
    const percentage = (used / available) * 100
    if (percentage >= 90) return "text-red-600"
    if (percentage >= 75) return "text-orange-600"
    if (percentage >= 50) return "text-yellow-600"
    return "text-green-600"
  }

  if (loading) {
    return <OrganizationsSkeleton />
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button variant="outline" size="sm" className="ml-4" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const organizations = data?.organizations || []
  const totals = data?.totals || {}

  // Filter organizations based on search
  const filteredOrganizations = organizations.filter(
    (org) =>
      org.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.license?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">MSP Organizations</h2>
          <p className="text-gray-600">Manage MSP client organizations, agents, and security findings</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{organizations.length}</div>
            <p className="text-xs text-gray-500 mt-1">MSP accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
            <Users className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totals.totalUserCount || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Across all accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Agent Capacity</CardTitle>
            <Gauge className="h-4 w-4 text-cyan-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {totals.totalAgentCountUsed || 0}/{totals.totalAgentCountAvailable || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Used/Available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Agent Devices</CardTitle>
            <HardDrive className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totals.totalAgentDevices || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Deployed devices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Online Devices</CardTitle>
            <Wifi className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totals.totalOnlineDevices || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Active monitoring</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Agent Keys</CardTitle>
            <Key className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totals.totalAgentKeys || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Deployment keys</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Open Findings</CardTitle>
            <Activity className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totals.totalOpenFindings || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Critical Findings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totals.totalCriticalFindings || 0}</div>
            <p className="text-xs text-gray-500 mt-1">High priority</p>
          </CardContent>
        </Card>
      </div>

      {/* License Breakdown */}
      {totals.licenseBreakdown && Object.keys(totals.licenseBreakdown).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              License Distribution
            </CardTitle>
            <CardDescription>Breakdown of organizations by license type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(totals.licenseBreakdown).map(([license, count]: [string, any]) => (
                <Badge key={license} className={getLicenseColor(license)}>
                  {getLicenseIcon(license)}
                  <span className="ml-1">
                    {license}: {count}
                  </span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Organizations List */}
      <div className="space-y-4">
        {filteredOrganizations.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Organizations Found</h3>
              <p className="text-gray-500">
                {searchTerm ? "No organizations match your search criteria." : "No organizations available."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredOrganizations.map((org) => (
            <Card key={org.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      {org.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Account ID: {org.account_id}
                      {org.open_findings !== undefined && (
                        <span className="ml-4">Open Findings: {org.open_findings}</span>
                      )}
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge className={getLicenseColor(org.license)}>
                      {getLicenseIcon(org.license)}
                      <span className="ml-1">{org.license}</span>
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="devices">
                      Devices ({org.agentDeviceCount})
                      {org.agentDevicesMeta?.total_items && org.agentDevicesMeta.total_items > org.agentDeviceCount && (
                        <span className="ml-1 text-xs">+{org.agentDevicesMeta.total_items - org.agentDeviceCount}</span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="keys">Keys ({org.agentKeyCount})</TabsTrigger>
                    <TabsTrigger value="findings">Findings ({org.findingsCount})</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="health">Agent Health</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="mt-4">
                    <OverviewTab organization={org} onRefresh={handleRefresh} />
                  </TabsContent>

                  <TabsContent value="devices" className="mt-4">
                    <DevicesTab organization={org} />
                  </TabsContent>

                  <TabsContent value="keys" className="mt-4">
                    <KeysTab organization={org} />
                  </TabsContent>

                  <TabsContent value="findings" className="mt-4">
                    <FindingsTab organization={org} />
                  </TabsContent>

                  <TabsContent value="security" className="mt-4">
                    <SecurityPostureTab organization={org} />
                  </TabsContent>

                  <TabsContent value="health" className="mt-4">
                    <AgentHealthTab organization={org} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Results Summary */}
      {searchTerm && (
        <div className="text-center text-sm text-gray-500">
          Showing {filteredOrganizations.length} of {organizations.length} organizations
        </div>
      )}

      {/* Debug Information */}
      {data?.debug && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800 text-sm">Debug Information</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-700">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>Organizations: {data.debug.organizationCount}</div>
              <div>Total Users: {data.debug.totalUserCount}</div>
              <div>
                Agent Capacity: {data.debug.totalAgentCountUsed}/{data.debug.totalAgentCountAvailable}
              </div>
              <div>Total Devices: {data.debug.totalAgentDevices}</div>
              <div>Online Devices: {data.debug.totalOnlineDevices}</div>
              <div>Total Findings: {data.debug.totalFindings}</div>
            </div>
            <div className="mt-2 text-xs">Last updated: {data.debug.timestamp}</div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function OrganizationsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex justify-between items-start">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* Summary cards skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Organizations list skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
