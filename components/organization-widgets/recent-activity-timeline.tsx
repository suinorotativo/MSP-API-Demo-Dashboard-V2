"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, AlertTriangle, HardDrive, Shield, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { Finding, AgentDevice } from "../organization-tabs/types"

interface RecentActivityTimelineProps {
  findings: Finding[]
  devices: AgentDevice[]
  limit?: number
}

interface ActivityEvent {
  id: string
  type: "finding" | "device"
  action: string
  title: string
  timestamp: Date
  priority?: number
  icon: React.ReactNode
  color: string
}

export function RecentActivityTimeline({ findings, devices, limit = 10 }: RecentActivityTimelineProps) {
  const events: ActivityEvent[] = []

  // Add recent findings (within last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  findings
    .filter((f) => new Date(f.created) >= thirtyDaysAgo)
    .slice(0, limit)
    .forEach((finding) => {
      events.push({
        id: finding.finding_id,
        type: "finding",
        action: "New Finding",
        title: finding.name,
        timestamp: new Date(finding.created),
        priority: finding.priority,
        icon: <AlertTriangle className="h-4 w-4" />,
        color: finding.priority === 1 ? "text-red-600" : finding.priority === 2 ? "text-orange-600" : "text-yellow-600",
      })
    })

  // Add recent device additions (within last 30 days)
  devices
    .filter((d) => new Date(d.created) >= thirtyDaysAgo)
    .slice(0, limit)
    .forEach((device) => {
      events.push({
        id: device.device_id,
        type: "device",
        action: "Device Added",
        title: device.hostname,
        timestamp: new Date(device.created),
        icon: <HardDrive className="h-4 w-4" />,
        color: "text-blue-600",
      })
    })

  // Sort by most recent first
  events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  const recentEvents = events.slice(0, limit)

  const getEventBadgeColor = (event: ActivityEvent): string => {
    if (event.type === "finding" && event.priority) {
      if (event.priority === 1) return "destructive"
      if (event.priority === 2) return "default"
      return "secondary"
    }
    return "outline"
  }

  const getEventBgColor = (event: ActivityEvent): string => {
    if (event.type === "finding" && event.priority) {
      if (event.priority === 1) return "bg-red-50 border-red-200"
      if (event.priority === 2) return "bg-orange-50 border-orange-200"
      return "bg-yellow-50 border-yellow-200"
    }
    return "bg-blue-50 border-blue-200"
  }

  if (recentEvents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest events and changes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-48 text-gray-500">
            <Clock className="h-12 w-12 mb-2 text-gray-400" />
            <p>No recent activity in the last 30 days</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>Latest {recentEvents.length} events from the last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentEvents.map((event, index) => (
            <div key={event.id} className="relative">
              {/* Timeline connector */}
              {index < recentEvents.length - 1 && (
                <div className="absolute left-6 top-12 w-px h-8 bg-gray-200" />
              )}

              {/* Event card */}
              <div className={`flex items-start gap-3 p-3 border rounded-lg ${getEventBgColor(event)}`}>
                <div className={`p-2 rounded-full ${getEventBgColor(event)} ${event.color}`}>{event.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <Badge variant={getEventBadgeColor(event)} className="mb-1">
                        {event.action}
                      </Badge>
                      <div className="font-medium text-sm truncate">{event.title}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Activity Summary */}
        <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <span className="text-gray-600">
              {events.filter((e) => e.type === "finding").length} new findings
            </span>
          </div>
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-blue-500" />
            <span className="text-gray-600">{events.filter((e) => e.type === "device").length} devices added</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
