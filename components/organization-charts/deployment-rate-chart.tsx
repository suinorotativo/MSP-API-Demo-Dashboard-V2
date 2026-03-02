"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"
import type { AgentDevice } from "../organization-tabs/types"

interface DeploymentRateChartProps {
  devices: AgentDevice[]
  days?: number
}

export function DeploymentRateChart({ devices, days = 90 }: DeploymentRateChartProps) {
  // Generate cumulative deployment data over time
  const generateDeploymentData = () => {
    const now = new Date()
    const data: Array<{ date: string; total: number; day: string }> = []

    // Sort devices by creation date
    const sortedDevices = [...devices].sort(
      (a, b) => new Date(a.created).getTime() - new Date(b.created).getTime()
    )

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      // Count devices created up to this date
      const count = sortedDevices.filter((d) => new Date(d.created) <= date).length

      data.push({
        date: date.toISOString().split("T")[0],
        total: count,
        day: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      })
    }

    return data
  }

  const deploymentData = generateDeploymentData()

  // Calculate deployment rate (devices added in last 7 days)
  const now = new Date()
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const recentDeployments = devices.filter((d) => new Date(d.created) >= sevenDaysAgo).length
  const deploymentRate = (recentDeployments / 7).toFixed(1)

  if (devices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Agent Deployment Rate</CardTitle>
          <CardDescription>Cumulative agent deployments over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-gray-500">No device data available</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Agent Deployment Rate</CardTitle>
            <CardDescription>Cumulative agent deployments over the last {days} days</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{deploymentRate}/day</div>
            <div className="text-sm text-gray-600 flex items-center gap-1 justify-end">
              <TrendingUp className="h-4 w-4" />
              Last 7 days
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={deploymentData}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} interval={Math.floor(days / 7)} />
            <YAxis />
            <Tooltip
              formatter={(value: number) => [`${value} devices`, "Total Deployed"]}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorTotal)"
              name="Cumulative Deployments"
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Deployment Stats */}
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-gray-600">Total Deployed</div>
            <div className="text-2xl font-bold text-blue-600">{devices.length}</div>
          </div>
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-sm text-gray-600">Last 7 Days</div>
            <div className="text-2xl font-bold text-green-600">{recentDeployments}</div>
          </div>
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="text-sm text-gray-600">Average/Day</div>
            <div className="text-2xl font-bold text-purple-600">{deploymentRate}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
