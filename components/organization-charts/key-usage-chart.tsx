"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Key } from "lucide-react"
import type { AgentDevice } from "../organization-tabs/types"

interface KeyUsageChartProps {
  devices: AgentDevice[]
}

export function KeyUsageChart({ devices }: KeyUsageChartProps) {
  // Aggregate devices by key
  const keyUsageMap = new Map<string, { keyName: string; count: number; keyId: string }>()

  devices.forEach((device) => {
    const keyId = device.key_id
    const keyName = device.keyname || "Unknown Key"

    if (!keyUsageMap.has(keyId)) {
      keyUsageMap.set(keyId, { keyName, count: 0, keyId })
    }
    keyUsageMap.get(keyId)!.count++
  })

  // Convert to array and sort by count
  const chartData = Array.from(keyUsageMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10) // Show top 10 keys
    .map((item, index) => ({
      ...item,
      name: item.keyName.length > 20 ? item.keyName.substring(0, 20) + "..." : item.keyName,
      fullName: item.keyName,
      percentage: devices.length > 0 ? Math.round((item.count / devices.length) * 100) : 0,
      fill: `hsl(${(index * 360) / 10}, 70%, 60%)`,
    }))

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Agent Key Usage Distribution
          </CardTitle>
          <CardDescription>Device count per agent key</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-gray-500">No agent key data available</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Agent Key Usage Distribution
        </CardTitle>
        <CardDescription>
          Device distribution across {chartData.length} most-used agent keys
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={150} />
            <Tooltip
              formatter={(value: number, name: string, props: any) => [
                `${value} devices (${props.payload.percentage}%)`,
                props.payload.fullName,
              ]}
            />
            <Legend />
            <Bar dataKey="count" name="Devices" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Key Statistics */}
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="p-3 bg-gray-50 border rounded-lg">
            <div className="text-sm text-gray-600">Total Keys</div>
            <div className="text-2xl font-bold">{keyUsageMap.size}</div>
          </div>
          <div className="p-3 bg-gray-50 border rounded-lg">
            <div className="text-sm text-gray-600">Most Used</div>
            <div className="text-lg font-bold truncate" title={chartData[0]?.fullName}>
              {chartData[0]?.name}
            </div>
            <div className="text-xs text-gray-500">{chartData[0]?.count} devices</div>
          </div>
          <div className="p-3 bg-gray-50 border rounded-lg">
            <div className="text-sm text-gray-600">Avg per Key</div>
            <div className="text-2xl font-bold">
              {keyUsageMap.size > 0 ? (devices.length / keyUsageMap.size).toFixed(1) : "0"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
