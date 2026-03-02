"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Monitor } from "lucide-react"
import type { AgentDevice } from "../organization-tabs/types"
import { aggregateByPlatform } from "../organization-utils/calculations"

interface PlatformDistributionChartProps {
  devices: AgentDevice[]
}

const PLATFORM_COLORS: Record<string, string> = {
  windows: "#0078d4", // Microsoft blue
  linux: "#fcc624", // Linux gold
  darwin: "#000000", // macOS black
  macos: "#000000",
  unix: "#ff6600",
  other: "#6b7280",
}

const getPlatformColor = (platform: string): string => {
  const platformLower = platform.toLowerCase()
  for (const [key, color] of Object.entries(PLATFORM_COLORS)) {
    if (platformLower.includes(key)) {
      return color
    }
  }
  return PLATFORM_COLORS.other
}

export function PlatformDistributionChart({ devices }: PlatformDistributionChartProps) {
  const platformData = aggregateByPlatform(devices)

  const chartData = Object.entries(platformData)
    .map(([platform, count]) => ({
      name: platform,
      value: count,
      percentage: Math.round((count / devices.length) * 100),
      color: getPlatformColor(platform),
    }))
    .sort((a, b) => b.value - a.value)

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Platform Distribution
          </CardTitle>
          <CardDescription>Operating system breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-gray-500">No devices data available</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          Platform Distribution
        </CardTitle>
        <CardDescription>{devices.length} devices across {chartData.length} platforms</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name}: ${percentage}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string, props: any) => [
                `${value} devices (${props.payload.percentage}%)`,
                props.payload.name,
              ]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>

        {/* Platform Summary List */}
        <div className="mt-4 space-y-2">
          {chartData.map((platform) => (
            <div key={platform.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: platform.color }} />
                <span className="font-medium">{platform.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-600">{platform.value} devices</span>
                <span className="text-gray-500 font-mono">{platform.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
