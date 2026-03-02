"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import type { Finding } from "../organization-tabs/types"
import { calculateVelocityComparison } from "../organization-utils/calculations"

interface FindingsVelocityChartProps {
  findings: Finding[]
}

export function FindingsVelocityChart({ findings }: FindingsVelocityChartProps) {
  const velocityData = calculateVelocityComparison(findings)

  // Generate daily data points for the last 30 days
  const dailyData: Array<{ date: string; findings: number; day: string }> = []
  const now = new Date()

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)

    const endDate = new Date(date)
    endDate.setDate(endDate.getDate() + 1)

    const count = findings.filter((f) => {
      const created = new Date(f.created)
      return created >= date && created < endDate
    }).length

    dailyData.push({
      date: date.toISOString().split("T")[0],
      findings: count,
      day: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    })
  }

  const getTrendIcon = () => {
    if (velocityData.percentageChange > 10) return <TrendingUp className="h-4 w-4 text-red-500" />
    if (velocityData.percentageChange < -10) return <TrendingDown className="h-4 w-4 text-green-500" />
    return <Minus className="h-4 w-4 text-gray-500" />
  }

  const getTrendColor = () => {
    if (velocityData.percentageChange > 10) return "text-red-600"
    if (velocityData.percentageChange < -10) return "text-green-600"
    return "text-gray-600"
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Findings Velocity</CardTitle>
            <CardDescription>New findings per day over the last 30 days</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{velocityData.current.toFixed(1)}/day</div>
            <div className={`text-sm flex items-center gap-1 justify-end ${getTrendColor()}`}>
              {getTrendIcon()}
              {Math.abs(velocityData.percentageChange).toFixed(0)}% vs previous period
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 12 }}
              interval={6}
            />
            <YAxis />
            <Tooltip
              formatter={(value: number) => [`${value} findings`, "Count"]}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="findings"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              name="New Findings"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
