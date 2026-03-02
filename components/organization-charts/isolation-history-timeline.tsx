"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Ban, Eye, EyeOff, WifiOff } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { AgentDevice } from "../organization-tabs/types"

interface IsolationHistoryTimelineProps {
  devices: AgentDevice[]
}

interface DeviceEvent {
  deviceId: string
  hostname: string
  eventType: "isolated" | "excluded" | "sleeping" | "normal"
  timestamp: Date
  icon: React.ReactNode
  color: string
  bgColor: string
}

export function IsolationHistoryTimeline({ devices }: IsolationHistoryTimelineProps) {
  // Generate timeline events based on device status
  const events: DeviceEvent[] = []

  devices.forEach((device) => {
    const timestamp = new Date(device.modified)

    if (device.is_isolated) {
      events.push({
        deviceId: device.device_id,
        hostname: device.hostname,
        eventType: "isolated",
        timestamp,
        icon: <Ban className="h-4 w-4" />,
        color: "text-red-600",
        bgColor: "bg-red-50 border-red-200",
      })
    } else if (device.is_excluded) {
      events.push({
        deviceId: device.device_id,
        hostname: device.hostname,
        eventType: "excluded",
        timestamp,
        icon: <EyeOff className="h-4 w-4" />,
        color: "text-gray-600",
        bgColor: "bg-gray-50 border-gray-200",
      })
    } else if (device.is_sleeping) {
      events.push({
        deviceId: device.device_id,
        hostname: device.hostname,
        eventType: "sleeping",
        timestamp,
        icon: <WifiOff className="h-4 w-4" />,
        color: "text-yellow-600",
        bgColor: "bg-yellow-50 border-yellow-200",
      })
    }
  })

  // Sort by most recent first
  events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  // Count current status
  const isolatedCount = devices.filter((d) => d.is_isolated).length
  const excludedCount = devices.filter((d) => d.is_excluded).length
  const sleepingCount = devices.filter((d) => d.is_sleeping).length
  const normalCount = devices.length - isolatedCount - excludedCount - sleepingCount

  const getEventLabel = (eventType: string): string => {
    switch (eventType) {
      case "isolated":
        return "Device Isolated"
      case "excluded":
        return "Device Excluded"
      case "sleeping":
        return "Device Sleeping"
      default:
        return "Status Changed"
    }
  }

  const getEventDescription = (eventType: string): string => {
    switch (eventType) {
      case "isolated":
        return "Device has been isolated from the network for security"
      case "excluded":
        return "Device has been excluded from monitoring"
      case "sleeping":
        return "Device is in sleep mode or temporarily offline"
      default:
        return "Device status has changed"
    }
  }

  if (devices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Device Status History
          </CardTitle>
          <CardDescription>Timeline of isolation, exclusion, and status events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-gray-500">No device data available</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Device Status History
        </CardTitle>
        <CardDescription>Current device status distribution and recent events</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Status Summary */}
        <div className="grid gap-3 md:grid-cols-4 mb-6">
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Normal</div>
                <div className="text-2xl font-bold text-green-600">{normalCount}</div>
              </div>
              <Eye className="h-6 w-6 text-green-500" />
            </div>
          </div>

          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Sleeping</div>
                <div className="text-2xl font-bold text-yellow-600">{sleepingCount}</div>
              </div>
              <WifiOff className="h-6 w-6 text-yellow-500" />
            </div>
          </div>

          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Isolated</div>
                <div className="text-2xl font-bold text-red-600">{isolatedCount}</div>
              </div>
              <Ban className="h-6 w-6 text-red-500" />
            </div>
          </div>

          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Excluded</div>
                <div className="text-2xl font-bold text-gray-600">{excludedCount}</div>
              </div>
              <EyeOff className="h-6 w-6 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div>
          <h4 className="font-semibold mb-3">Recent Status Events</h4>
          {events.length === 0 ? (
            <div className="p-8 text-center text-gray-500 bg-gray-50 border rounded-lg">
              No recent status change events. All devices are operating normally.
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {events.slice(0, 20).map((event, index) => (
                <div key={`${event.deviceId}-${index}`} className={`p-4 border rounded-lg ${event.bgColor}`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${event.bgColor} ${event.color}`}>{event.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold">{getEventLabel(event.eventType)}</div>
                          <div className="text-sm text-gray-600 mt-1">{event.hostname}</div>
                          <div className="text-xs text-gray-500 mt-1">{getEventDescription(event.eventType)}</div>
                        </div>
                        <Badge variant="outline" className="flex-shrink-0">
                          {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500 mt-2 font-mono">ID: {event.deviceId.substring(0, 16)}...</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {events.length > 20 && (
            <div className="text-center text-sm text-gray-500 mt-3">Showing 20 of {events.length} events</div>
          )}
        </div>

        {/* Security Recommendations */}
        {isolatedCount > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
            <strong className="text-red-900">Security Alert:</strong>
            <span className="text-red-700 ml-1">
              {isolatedCount} device{isolatedCount !== 1 ? "s are" : " is"} currently isolated. Review these devices
              for security threats and take appropriate action.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
