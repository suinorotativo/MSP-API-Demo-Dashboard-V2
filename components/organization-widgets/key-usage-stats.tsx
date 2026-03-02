"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Key, AlertCircle } from "lucide-react"
import type { AgentDevice, Organization } from "../organization-tabs/types"

interface KeyUsageStatsProps {
  organization: Organization
}

interface KeyStats {
  keyId: string
  keyName: string
  deviceCount: number
  onlineCount: number
  sleepingCount: number
  isolatedCount: number
  excludedCount: number
  percentage: number
}

export function KeyUsageStats({ organization }: KeyUsageStatsProps) {
  const devices = organization.agentDevices || []
  const keys = organization.agentKeys || []

  // Aggregate device counts by key
  const keyStatsMap = new Map<string, KeyStats>()

  devices.forEach((device) => {
    const keyId = device.key_id
    const keyName = device.keyname || "Unknown Key"

    if (!keyStatsMap.has(keyId)) {
      keyStatsMap.set(keyId, {
        keyId,
        keyName,
        deviceCount: 0,
        onlineCount: 0,
        sleepingCount: 0,
        isolatedCount: 0,
        excludedCount: 0,
        percentage: 0,
      })
    }

    const stats = keyStatsMap.get(keyId)!
    stats.deviceCount++

    if (device.is_excluded) stats.excludedCount++
    else if (device.is_isolated) stats.isolatedCount++
    else if (device.is_sleeping) stats.sleepingCount++
    else stats.onlineCount++
  })

  // Calculate percentages and sort by device count
  const keyStats = Array.from(keyStatsMap.values())
    .map((stats) => ({
      ...stats,
      percentage: devices.length > 0 ? Math.round((stats.deviceCount / devices.length) * 100) : 0,
    }))
    .sort((a, b) => b.deviceCount - a.deviceCount)

  // Find keys with no devices (unused keys)
  const usedKeyIds = new Set(keyStats.map((k) => k.keyId))
  const unusedKeys = keys.filter((key: any) => !usedKeyIds.has(key.key_id))

  if (keyStats.length === 0 && unusedKeys.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Agent Key Usage
          </CardTitle>
          <CardDescription>Device distribution across agent keys</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-gray-500">No agent key data available</div>
        </CardContent>
      </Card>
    )
  }

  const getHealthColor = (stats: KeyStats) => {
    const healthyPercentage = (stats.onlineCount / stats.deviceCount) * 100
    if (healthyPercentage >= 80) return "border-green-200 bg-green-50"
    if (healthyPercentage >= 60) return "border-yellow-200 bg-yellow-50"
    return "border-red-200 bg-red-50"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Agent Key Usage
        </CardTitle>
        <CardDescription>
          {keyStats.length} active key{keyStats.length !== 1 ? "s" : ""} managing {devices.length} devices
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Active Keys */}
          {keyStats.map((stats) => (
            <div key={stats.keyId} className={`p-4 border-l-4 rounded-lg ${getHealthColor(stats)}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="font-semibold text-lg">{stats.keyName}</div>
                  <div className="text-xs text-gray-500 font-mono mt-1">{stats.keyId.substring(0, 24)}...</div>
                </div>
                <Badge variant="outline" className="ml-2">
                  {stats.deviceCount} devices ({stats.percentage}%)
                </Badge>
              </div>

              {/* Device Status Breakdown */}
              <div className="grid grid-cols-4 gap-2 mt-3 text-sm">
                <div className="text-center p-2 bg-white rounded border">
                  <div className="text-xs text-gray-600">Online</div>
                  <div className="font-semibold text-green-600">{stats.onlineCount}</div>
                </div>
                <div className="text-center p-2 bg-white rounded border">
                  <div className="text-xs text-gray-600">Sleeping</div>
                  <div className="font-semibold text-yellow-600">{stats.sleepingCount}</div>
                </div>
                <div className="text-center p-2 bg-white rounded border">
                  <div className="text-xs text-gray-600">Isolated</div>
                  <div className="font-semibold text-red-600">{stats.isolatedCount}</div>
                </div>
                <div className="text-center p-2 bg-white rounded border">
                  <div className="text-xs text-gray-600">Excluded</div>
                  <div className="font-semibold text-gray-600">{stats.excludedCount}</div>
                </div>
              </div>
            </div>
          ))}

          {/* Unused Keys Warning */}
          {unusedKeys.length > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-yellow-900">Unused Agent Keys</div>
                  <div className="text-sm text-yellow-700 mt-1">
                    {unusedKeys.length} agent key{unusedKeys.length !== 1 ? "s" : ""} have no associated devices.
                    Consider removing unused keys to maintain security.
                  </div>
                  <div className="mt-2 space-y-1">
                    {unusedKeys.slice(0, 3).map((key: any) => (
                      <div key={key.key_id} className="text-xs text-yellow-800 font-mono">
                        • {key.key_name || key.name || "Unnamed Key"}
                      </div>
                    ))}
                    {unusedKeys.length > 3 && (
                      <div className="text-xs text-yellow-800">... and {unusedKeys.length - 3} more</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Summary Stats */}
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Total Keys</div>
                <div className="text-xl font-bold">{keys.length}</div>
              </div>
              <div>
                <div className="text-gray-600">Active Keys</div>
                <div className="text-xl font-bold text-green-600">{keyStats.length}</div>
              </div>
              <div>
                <div className="text-gray-600">Devices/Key Avg</div>
                <div className="text-xl font-bold text-blue-600">
                  {keyStats.length > 0 ? (devices.length / keyStats.length).toFixed(1) : "0"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
