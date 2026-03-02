"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { Finding } from "../organization-tabs/types"
import { generateFindingsTimeline } from "../organization-utils/calculations"

interface FindingsTimelineChartProps {
  findings: Finding[]
}

export function FindingsTimelineChart({ findings }: FindingsTimelineChartProps) {
  const [days, setDays] = useState(30)

  const timelineData = generateFindingsTimeline(findings, days)

  if (timelineData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Findings Timeline</CardTitle>
          <CardDescription>No timeline data available</CardDescription>
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Findings Timeline</CardTitle>
            <CardDescription>New findings over the last {days} days</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant={days === 7 ? "default" : "outline"} size="sm" onClick={() => setDays(7)}>
              7 days
            </Button>
            <Button variant={days === 30 ? "default" : "outline"} size="sm" onClick={() => setDays(30)}>
              30 days
            </Button>
            <Button variant={days === 90 ? "default" : "outline"} size="sm" onClick={() => setDays(90)}>
              90 days
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timelineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
            />
            <Legend />
            <Line type="monotone" dataKey="P1" stroke="#ef4444" strokeWidth={2} name="Critical (P1)" />
            <Line type="monotone" dataKey="P2" stroke="#f97316" strokeWidth={2} name="High (P2)" />
            <Line type="monotone" dataKey="P3" stroke="#eab308" strokeWidth={2} name="Medium (P3)" />
            <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} name="Total" />
          </LineChart>
        </ResponsiveContainer>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div className="flex flex-col">
            <span className="text-gray-600">Total Findings</span>
            <span className="text-2xl font-bold text-blue-600">
              {timelineData.reduce((sum, day) => sum + day.total, 0)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-600">Critical (P1)</span>
            <span className="text-2xl font-bold text-red-600">
              {timelineData.reduce((sum, day) => sum + day.P1, 0)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-600">High (P2)</span>
            <span className="text-2xl font-bold text-orange-600">
              {timelineData.reduce((sum, day) => sum + day.P2, 0)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-600">Medium (P3)</span>
            <span className="text-2xl font-bold text-yellow-600">
              {timelineData.reduce((sum, day) => sum + day.P3, 0)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-600">Avg/Day</span>
            <span className="text-2xl font-bold text-gray-900">
              {(timelineData.reduce((sum, day) => sum + day.total, 0) / days).toFixed(1)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
