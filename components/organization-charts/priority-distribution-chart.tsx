"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Finding } from "../organization-tabs/types"
import { aggregateByPriority } from "../organization-utils/calculations"

interface PriorityDistributionChartProps {
  findings: Finding[]
}

const PRIORITY_COLORS: Record<number, string> = {
  1: "#ef4444", // red-500 - Critical
  2: "#f97316", // orange-500 - High
  3: "#eab308", // yellow-500 - Medium
  4: "#3b82f6", // blue-500 - Low
  5: "#6b7280", // gray-500 - Info
}

const PRIORITY_LABELS: Record<number, string> = {
  1: "P1 - Critical",
  2: "P2 - High",
  3: "P3 - Medium",
  4: "P4 - Low",
  5: "P5 - Info",
}

export function PriorityDistributionChart({ findings }: PriorityDistributionChartProps) {
  const priorityData = aggregateByPriority(findings)

  const chartData = Object.entries(priorityData)
    .map(([priority, count]) => ({
      name: PRIORITY_LABELS[parseInt(priority)] || `P${priority}`,
      value: count,
      priority: parseInt(priority),
      percentage: Math.round((count / findings.length) * 100),
    }))
    .sort((a, b) => a.priority - b.priority)

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Priority Distribution</CardTitle>
          <CardDescription>Breakdown of findings by priority level</CardDescription>
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
        <CardTitle>Priority Distribution</CardTitle>
        <CardDescription>
          {findings.length} findings across {chartData.length} priority levels
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percentage }) => `${name}: ${percentage}%`}
            >
              {chartData.map((entry) => (
                <Cell key={`cell-${entry.priority}`} fill={PRIORITY_COLORS[entry.priority]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string, props: any) => [
                `${value} findings (${props.payload.percentage}%)`,
                props.payload.name,
              ]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
