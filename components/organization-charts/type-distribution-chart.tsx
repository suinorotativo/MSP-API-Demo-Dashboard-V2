"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Finding } from "../organization-tabs/types"
import { aggregateByType, getPriorityColor } from "../organization-utils/calculations"

interface TypeDistributionChartProps {
  findings: Finding[]
  maxItems?: number
}

export function TypeDistributionChart({ findings, maxItems = 10 }: TypeDistributionChartProps) {
  const typeData = aggregateByType(findings)

  const chartData = Object.entries(typeData)
    .map(([type, count]) => ({
      name: type.length > 30 ? type.substring(0, 30) + "..." : type,
      fullName: type,
      value: count,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, maxItems)

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Finding Types</CardTitle>
          <CardDescription>Distribution of findings by type</CardDescription>
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
        <CardTitle>Finding Types</CardTitle>
        <CardDescription>
          Top {chartData.length} finding types out of {Object.keys(typeData).length} total
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={90} />
            <Tooltip
              formatter={(value: number, name: string, props: any) => [value, props.payload.fullName]}
              labelFormatter={(label: string, payload: any) =>
                payload && payload[0] ? payload[0].payload.fullName : label
              }
            />
            <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={`hsl(${(index * 360) / chartData.length}, 70%, 50%)`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
