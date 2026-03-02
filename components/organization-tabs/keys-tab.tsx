"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Key, ExternalLink, Plus, AlertCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { Organization } from "./types"
import { KeyUsageChart } from "../organization-charts/key-usage-chart"

interface KeysTabProps {
  organization: Organization
}

export function KeysTab({ organization }: KeysTabProps) {
  const keys = organization.agentKeys || []
  const devices = organization.agentDevices || []

  // Calculate device count per key
  const deviceCountByKey = new Map<string, number>()
  devices.forEach((device) => {
    const keyId = device.key_id
    deviceCountByKey.set(keyId, (deviceCountByKey.get(keyId) || 0) + 1)
  })

  // Find unused keys
  const unusedKeys = keys.filter((key: any) => !deviceCountByKey.has(key.key_id))

  return (
    <div className="space-y-6">
      {/* Key Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Total Keys</div>
            <div className="text-3xl font-bold text-blue-600">{keys.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Active Keys</div>
            <div className="text-3xl font-bold text-green-600">{keys.length - unusedKeys.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Unused Keys</div>
            <div className="text-3xl font-bold text-gray-600">{unusedKeys.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Total Devices</div>
            <div className="text-3xl font-bold text-purple-600">{devices.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Key Usage Chart */}
      <KeyUsageChart devices={devices} />

      {/* Unused Keys Warning */}
      {unusedKeys.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-900">
              <AlertCircle className="h-5 w-5" />
              Unused Agent Keys
            </CardTitle>
            <CardDescription>
              {unusedKeys.length} agent key{unusedKeys.length !== 1 ? "s have" : " has"} no associated devices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-yellow-800 mb-3">
              Consider removing unused keys to maintain security and reduce clutter in your agent key management.
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {unusedKeys.slice(0, 4).map((key: any) => (
                <div key={key.key_id} className="p-2 bg-white border border-yellow-200 rounded text-xs">
                  <div className="font-semibold">{key.key_name || key.name || "Unnamed Key"}</div>
                  <div className="text-gray-500 font-mono mt-1">{key.key_id.substring(0, 24)}...</div>
                </div>
              ))}
            </div>
            {unusedKeys.length > 4 && (
              <div className="text-sm text-yellow-800 mt-2">... and {unusedKeys.length - 4} more unused keys</div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Keys List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Agent Keys</CardTitle>
              <CardDescription>Manage deployment keys for this organization</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {keys.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Key className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>No agent keys found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {keys.map((key: any, index: number) => {
                const deviceCount = deviceCountByKey.get(key.key_id) || 0
                const isUnused = deviceCount === 0

                return (
                  <div
                    key={key.key_id || index}
                    className={`p-4 border rounded-lg ${
                      isUnused
                        ? "border-yellow-200 bg-yellow-50"
                        : deviceCount > 10
                        ? "border-green-200 bg-green-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Key className="h-4 w-4 text-gray-600" />
                          <span className="font-semibold text-lg">{key.key_name || key.name || `Key ${index + 1}`}</span>
                          {key.status && (
                            <Badge variant={key.status === "active" ? "default" : "secondary"}>{key.status}</Badge>
                          )}
                          {isUnused && <Badge variant="outline">Unused</Badge>}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-sm text-gray-600">
                          <div>
                            <span className="text-gray-500">Key ID:</span>{" "}
                            <span className="font-mono text-xs">{key.key_id.substring(0, 16)}...</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Devices:</span>{" "}
                            <span className={`font-semibold ${deviceCount > 0 ? "text-green-600" : "text-gray-600"}`}>
                              {deviceCount}
                            </span>
                          </div>
                          {key.created_at && (
                            <div>
                              <span className="text-gray-500">Created:</span>{" "}
                              {formatDistanceToNow(new Date(key.created_at), { addSuffix: true })}
                            </div>
                          )}
                          {key.modified_at && (
                            <div>
                              <span className="text-gray-500">Modified:</span>{" "}
                              {formatDistanceToNow(new Date(key.modified_at), { addSuffix: true })}
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
