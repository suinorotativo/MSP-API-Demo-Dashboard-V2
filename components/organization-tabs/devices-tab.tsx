"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Download, ExternalLink, HardDrive } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { Organization, AgentDevice } from "./types"
import { PlatformDistributionChart } from "../organization-charts/platform-distribution-chart"
import { ArchitectureBreakdownChart } from "../organization-charts/architecture-breakdown-chart"
import { DeviceTimelineChart } from "../organization-charts/device-timeline-chart"
import { DeviceHealthIndicator, DeviceHealthSummary } from "../organization-widgets/device-health-indicator"
import { DeviceFilters } from "../organization-widgets/device-filters"
import { filterDevices, sortDevices } from "../organization-utils/filters"
import { downloadDevicesCSV } from "../organization-utils/export"
import { calculateDeviceHealth } from "../organization-utils/calculations"

interface DevicesTabProps {
  organization: Organization
}

export function DevicesTab({ organization }: DevicesTabProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [platformFilter, setPlatformFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [keyFilter, setKeyFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"hostname" | "alive" | "platform" | "health">("health")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [showFilters, setShowFilters] = useState(false)

  const devices = organization.agentDevices || []

  console.log(`[DevicesTab] ${organization.name}: agentDevices length=${devices.length}, agentDeviceCount=${organization.agentDeviceCount}, raw type=${typeof organization.agentDevices}, isArray=${Array.isArray(organization.agentDevices)}`)

  // Apply filters and sorting
  const filteredAndSortedDevices = useMemo(() => {
    let result = filterDevices(devices, {
      searchTerm,
      platform: platformFilter,
      status: statusFilter,
      key: keyFilter,
    })

    result = sortDevices(result, sortBy, sortOrder)

    return result
  }, [devices, searchTerm, platformFilter, statusFilter, keyFilter, sortBy, sortOrder])

  const clearFilters = () => {
    setSearchTerm("")
    setPlatformFilter("all")
    setStatusFilter("all")
    setKeyFilter("all")
  }

  const hasActiveFilters = searchTerm || platformFilter !== "all" || statusFilter !== "all" || keyFilter !== "all"

  const handleExport = () => {
    const filename = `${organization.name.replace(/[^a-z0-9]/gi, "_")}_devices_${new Date().toISOString().split("T")[0]}.csv`
    downloadDevicesCSV(filteredAndSortedDevices, filename)
  }

  // Count stale devices (>7 days offline)
  const staleDevices = devices.filter((device) => {
    const hoursSince = (Date.now() - new Date(device.alive).getTime()) / 3600000
    return hoursSince > 168
  }).length

  return (
    <div className="space-y-6">
      {/* Health Summary */}
      <DeviceHealthSummary devices={devices} />

      {/* Visualization Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <PlatformDistributionChart devices={devices} />
        <ArchitectureBreakdownChart devices={devices} />
      </div>

      <DeviceTimelineChart devices={devices} days={90} />

      {/* Alert for Stale Devices */}
      {staleDevices > 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <HardDrive className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-900">Stale Devices Detected</h4>
              <p className="text-sm text-yellow-700 mt-1">
                {staleDevices} device{staleDevices !== 1 ? "s" : ""} haven't checked in for more than 7 days. These
                devices may be offline or disconnected.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  setStatusFilter("all")
                  setSortBy("alive")
                  setSortOrder("asc")
                  setShowFilters(true)
                }}
              >
                View Stale Devices
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Devices List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Devices List {hasActiveFilters && `(${filteredAndSortedDevices.length} of ${devices.length})`}
          </h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
              Filters {hasActiveFilters && <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">!</Badge>}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={filteredAndSortedDevices.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <DeviceFilters
            devices={devices}
            searchTerm={searchTerm}
            platformFilter={platformFilter}
            statusFilter={statusFilter}
            keyFilter={keyFilter}
            onSearchChange={setSearchTerm}
            onPlatformChange={setPlatformFilter}
            onStatusChange={setStatusFilter}
            onKeyChange={setKeyFilter}
            onClearFilters={clearFilters}
            filteredCount={filteredAndSortedDevices.length}
            totalCount={devices.length}
          />
        )}

        {/* Sort Options */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600">Sort by:</span>
          <Button
            variant={sortBy === "health" ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              setSortBy("health")
              setSortOrder(sortBy === "health" && sortOrder === "asc" ? "desc" : "asc")
            }}
          >
            Health {sortBy === "health" && (sortOrder === "asc" ? "↑" : "↓")}
          </Button>
          <Button
            variant={sortBy === "hostname" ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              setSortBy("hostname")
              setSortOrder(sortBy === "hostname" && sortOrder === "asc" ? "desc" : "asc")
            }}
          >
            Name {sortBy === "hostname" && (sortOrder === "asc" ? "↑" : "↓")}
          </Button>
          <Button
            variant={sortBy === "alive" ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              setSortBy("alive")
              setSortOrder(sortBy === "alive" && sortOrder === "asc" ? "desc" : "asc")
            }}
          >
            Last Seen {sortBy === "alive" && (sortOrder === "asc" ? "↑" : "↓")}
          </Button>
          <Button
            variant={sortBy === "platform" ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              setSortBy("platform")
              setSortOrder(sortBy === "platform" && sortOrder === "asc" ? "desc" : "asc")
            }}
          >
            Platform {sortBy === "platform" && (sortOrder === "asc" ? "↑" : "↓")}
          </Button>
        </div>

        {/* Devices List */}
        <div className="space-y-3">
          {filteredAndSortedDevices.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12 text-gray-500">
                {hasActiveFilters ? "No devices match your filters" : "No devices found"}
              </CardContent>
            </Card>
          ) : (
            filteredAndSortedDevices.map((device) => (
              <Card key={device.device_id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <DeviceHealthIndicator device={device} size="sm" />
                        <Badge variant="outline">{device.plat}</Badge>
                        <Badge variant="secondary">{device.arch}</Badge>
                        {device.isolation_requested && <Badge variant="destructive">Isolation Requested</Badge>}
                      </div>
                      <h4 className="font-semibold text-lg mb-1">{device.hostname}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-sm text-gray-600">
                        <div>
                          <span className="text-gray-500">Key:</span> {device.keyname}
                        </div>
                        <div>
                          <span className="text-gray-500">Last Alive:</span>{" "}
                          {formatDistanceToNow(new Date(device.alive), { addSuffix: true })}
                        </div>
                        <div>
                          <span className="text-gray-500">Created:</span>{" "}
                          {formatDistanceToNow(new Date(device.created), { addSuffix: true })}
                        </div>
                        <div>
                          <span className="text-gray-500">ID:</span>{" "}
                          <span className="font-mono text-xs">{device.device_id.substring(0, 8)}...</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination hint */}
        {filteredAndSortedDevices.length > 50 && (
          <div className="text-center text-sm text-gray-500 py-4">
            Showing all {filteredAndSortedDevices.length} devices. Consider using filters to narrow down results.
          </div>
        )}
      </div>
    </div>
  )
}
