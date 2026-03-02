"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Finding } from "../organization-tabs/types"
import { aggregateByStatus } from "../organization-utils/calculations"

interface StatusBreakdownChartProps {
  findings: Finding[]
}

const STATUS_COLORS: Record<string, string> = {
  open: "#ef4444", // red-500
  "in progress": "#f97316", // orange-500
  resolved: "#22c55e", // green-500
  dismissed: "#6b7280", // gray-500
  pending: "#eab308", // yellow-500
  investigating: "#3b82f6", // blue-500
  closed: "#10b981", // emerald-500
}

export function StatusBreakdownChart({ findings }: StatusBreakdownChartProps) {
  const statusData = aggregateByStatus(findings)

  const chartData = Object.entries(statusData)
    .map(([status, count]) => ({
      name: status,
      value: count,
      percentage: Math.round((count / findings.length) * 100),
      fill: STATUS_COLORS[status.toLowerCase()] || "#6b7280",
    }))
    .sort((a, b) => b.value - a.value)

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Status Breakdown</CardTitle>
          <CardDescription>Distribution of findings by status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-gray-500">No findings data available</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Breakdown</CardTitle>
        <CardDescription>{findings.length} findings across {chartData.length} statuses</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={120} />
            <Tooltip
              formatter={(value: number, name: string, props: any) => [
                `${value} findings (${props.payload.percentage}%)`,
                "Count",
              ]}
            />
            <Legend />
            <Bar dataKey="value" name="Findings" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
