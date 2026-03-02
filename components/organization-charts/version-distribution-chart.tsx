"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, AlertTriangle } from "lucide-react"
import type { AgentDevice } from "../organization-tabs/types"

interface VersionDistributionChartProps {
  devices: AgentDevice[]
}

export function VersionDistributionChart({ devices }: VersionDistributionChartProps) {
  // Note: The API doesn't currently provide version information
  // This is a placeholder that shows platform distribution as a proxy
  // In a real implementation, you would aggregate by agent version

  const platformData = devices.reduce((acc, device) => {
    const platform = device.plat || "Unknown"
    acc[platform] = (acc[platform] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const chartData = Object.entries(platformData)
    .map(([platform, count]) => ({
      name: platform.charAt(0).toUpperCase() + platform.slice(1),
      value: count,
      percentage: Math.round((count / devices.length) * 100),
    }))
    .sort((a, b) => b.value - a.value)

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Agent Platform Distribution
          </CardTitle>
          <CardDescription>Distribution of agents by operating system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-gray-500">No device data available</div>
        </CardContent>
      </Card>
    )
  }

  // Check for platform diversity (good security practice)
  const isDiverse = chartData.length >= 2 && chartData[0].percentage < 80

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Agent Platform Distribution
            </CardTitle>
            <CardDescription>{devices.length} agents across {chartData.length} platforms</CardDescription>
          </div>
          {isDiverse ? (
            <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
              Diverse Platform Mix
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Platform Concentration
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip
              formatter={(value: number, name: string, props: any) => [
                `${value} agents (${props.payload.percentage}%)`,
                "Count",
              ]}
            />
            <Legend />
            <Bar dataKey="value" name="Agents" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Platform Breakdown */}
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {chartData.map((platform, index) => (
            <div
              key={platform.name}
              className="flex items-center justify-between p-3 border rounded-lg"
              style={{ borderLeftWidth: "4px", borderLeftColor: COLORS[index % COLORS.length] }}
            >
              <span className="font-medium">{platform.name}</span>
              <div className="text-right">
                <div className="font-semibold">{platform.value}</div>
                <div className="text-xs text-gray-500">{platform.percentage}%</div>
              </div>
            </div>
          ))}
        </div>

        {/* Note about version data */}
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600">
          <strong>Note:</strong> Agent version information is not currently available from the API. This chart shows
          platform distribution. Future updates may include agent version tracking.
        </div>
      </CardContent>
    </Card>
  )
}
