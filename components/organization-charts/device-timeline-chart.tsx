"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"
import type { AgentDevice } from "../organization-tabs/types"

interface DeviceTimelineChartProps {
  devices: AgentDevice[]
  days?: number
}

export function DeviceTimelineChart({ devices, days = 90 }: DeviceTimelineChartProps) {
  // Generate timeline data for device additions
  const generateTimelineData = () => {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Create date buckets
    const timeline: Record<string, number> = {}
    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      const dateKey = date.toISOString().split("T")[0]
      timeline[dateKey] = 0
    }

    // Count devices added each day
    devices.forEach((device) => {
      const dateKey = device.created.split("T")[0]
      if (timeline[dateKey] !== undefined) {
        timeline[dateKey]++
      }
    })

    // Convert to cumulative count
    let cumulative = 0
    return Object.entries(timeline)
      .map(([date, count]) => {
        cumulative += count
        return {
          date,
          added: count,
          total: cumulative,
        }
      })
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  const timelineData = generateTimelineData()

  if (devices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Device Growth Timeline
          </CardTitle>
          <CardDescription>Cumulative device additions over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-gray-500">No devices data available</div>
        </CardContent>
      </Card>
    )
  }

  const totalAdded = timelineData.reduce((sum, day) => sum + day.added, 0)
  const avgPerDay = (totalAdded / days).toFixed(1)
  const currentTotal = timelineData[timelineData.length - 1]?.total || 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Device Growth Timeline
        </CardTitle>
        <CardDescription>Device additions over the last {days} days</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={timelineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => {
                const date = new Date(value)
                return `${date.getMonth() + 1}/${date.getDate()}`
              }}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(label) => {
                const date = new Date(label)
                return date.toLocaleDateString()
              }}
              formatter={(value: number, name: string) => {
                if (name === "added") return [value, "Added this day"]
                return [value, "Total devices"]
              }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorTotal)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div className="flex flex-col items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-2xl font-bold text-blue-700">{currentTotal}</span>
            <span className="text-xs text-blue-600">Total Devices</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-green-50 border border-green-200 rounded-lg">
            <span className="text-2xl font-bold text-green-700">{totalAdded}</span>
            <span className="text-xs text-green-600">Added ({days}d)</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <span className="text-2xl font-bold text-purple-700">{avgPerDay}</span>
            <span className="text-xs text-purple-600">Avg/Day</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
