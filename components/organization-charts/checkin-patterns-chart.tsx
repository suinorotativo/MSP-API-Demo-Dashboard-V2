"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity } from "lucide-react"
import type { AgentDevice } from "../organization-tabs/types"

interface CheckinPatternsChartProps {
  devices: AgentDevice[]
}

export function CheckinPatternsChart({ devices }: CheckinPatternsChartProps) {
  // Calculate check-in recency buckets
  const now = Date.now()
  const buckets = {
    "< 1 hour": 0,
    "1-6 hours": 0,
    "6-24 hours": 0,
    "1-3 days": 0,
    "3-7 days": 0,
    "> 7 days": 0,
  }

  devices.forEach((device) => {
    const hoursSince = (now - new Date(device.alive).getTime()) / 3600000

    if (hoursSince < 1) buckets["< 1 hour"]++
    else if (hoursSince < 6) buckets["1-6 hours"]++
    else if (hoursSince < 24) buckets["6-24 hours"]++
    else if (hoursSince < 72) buckets["1-3 days"]++
    else if (hoursSince < 168) buckets["3-7 days"]++
    else buckets["> 7 days"]++
  })

  const chartData = Object.entries(buckets).map(([range, count]) => ({
    range,
    count,
    percentage: devices.length > 0 ? Math.round((count / devices.length) * 100) : 0,
  }))

  const getBarColor = (range: string) => {
    if (range === "< 1 hour" || range === "1-6 hours") return "bg-green-500"
    if (range === "6-24 hours" || range === "1-3 days") return "bg-yellow-500"
    if (range === "3-7 days") return "bg-orange-500"
    return "bg-red-500"
  }

  const getBarLabelColor = (range: string) => {
    if (range === "< 1 hour" || range === "1-6 hours") return "text-green-700"
    if (range === "6-24 hours" || range === "1-3 days") return "text-yellow-700"
    if (range === "3-7 days") return "text-orange-700"
    return "text-red-700"
  }

  if (devices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Check-in Patterns
          </CardTitle>
          <CardDescription>Device check-in recency distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-gray-500">No device data available</div>
        </CardContent>
      </Card>
    )
  }

  // Calculate health score based on check-ins
  const healthyDevices = buckets["< 1 hour"] + buckets["1-6 hours"] + buckets["6-24 hours"]
  const healthPercentage = Math.round((healthyDevices / devices.length) * 100)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Check-in Patterns
            </CardTitle>
            <CardDescription>Distribution of device check-in recency</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">{healthPercentage}%</div>
            <div className="text-sm text-gray-600">Healthy Check-ins</div>
            <div className="text-xs text-gray-500">&lt; 24 hours</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {chartData.map((item) => {
            const maxCount = Math.max(...chartData.map((d) => d.count))
            const widthPercentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0

            return (
              <div key={item.range} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium w-32">{item.range}</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${getBarLabelColor(item.range)}`}>
                      {item.count} devices
                    </span>
                    <span className="text-gray-500">({item.percentage}%)</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                  <div
                    className={`h-full flex items-center justify-end pr-3 text-white text-sm font-semibold transition-all duration-300 ${getBarColor(
                      item.range
                    )}`}
                    style={{ width: `${Math.max(widthPercentage, 5)}%` }}
                  >
                    {item.count > 0 && item.count}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Check-in Health Summary */}
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-sm text-gray-600">Healthy</div>
            <div className="text-xl font-bold text-green-600">{healthyDevices}</div>
            <div className="text-xs text-gray-500">&lt; 24 hours</div>
          </div>
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-sm text-gray-600">Warning</div>
            <div className="text-xl font-bold text-yellow-600">
              {buckets["1-3 days"] + buckets["3-7 days"]}
            </div>
            <div className="text-xs text-gray-500">1-7 days</div>
          </div>
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-sm text-gray-600">Stale</div>
            <div className="text-xl font-bold text-red-600">{buckets["> 7 days"]}</div>
            <div className="text-xs text-gray-500">&gt; 7 days</div>
          </div>
        </div>

        {/* Recommendations */}
        {buckets["> 7 days"] > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
            <strong className="text-red-900">Action Required:</strong>
            <span className="text-red-700 ml-1">
              {buckets["> 7 days"]} device{buckets["> 7 days"] !== 1 ? "s" : ""} haven't checked in for over 7 days.
              These may be offline, decommissioned, or experiencing connectivity issues.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
