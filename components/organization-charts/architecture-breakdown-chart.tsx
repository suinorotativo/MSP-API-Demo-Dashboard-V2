"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Cpu } from "lucide-react"
import type { AgentDevice } from "../organization-tabs/types"
import { aggregateByArchitecture } from "../organization-utils/calculations"

interface ArchitectureBreakdownChartProps {
  devices: AgentDevice[]
}

const ARCH_COLORS: Record<string, string> = {
  x86_64: "#3b82f6", // blue
  x64: "#3b82f6",
  amd64: "#3b82f6",
  arm64: "#10b981", // green
  aarch64: "#10b981",
  arm: "#10b981",
  i386: "#f59e0b", // amber
  i686: "#f59e0b",
  other: "#6b7280", // gray
}

const getArchColor = (arch: string): string => {
  const archLower = arch.toLowerCase()
  for (const [key, color] of Object.entries(ARCH_COLORS)) {
    if (archLower.includes(key)) {
      return color
    }
  }
  return ARCH_COLORS.other
}

const normalizeArchName = (arch: string): string => {
  const archLower = arch.toLowerCase()
  if (archLower.includes("x86_64") || archLower.includes("x64") || archLower.includes("amd64")) {
    return "x86_64 (64-bit)"
  }
  if (archLower.includes("arm64") || archLower.includes("aarch64")) {
    return "ARM64"
  }
  if (archLower.includes("arm")) {
    return "ARM (32-bit)"
  }
  if (archLower.includes("i386") || archLower.includes("i686")) {
    return "x86 (32-bit)"
  }
  return arch
}

export function ArchitectureBreakdownChart({ devices }: ArchitectureBreakdownChartProps) {
  const archData = aggregateByArchitecture(devices)

  // Normalize architecture names and aggregate
  const normalizedData: Record<string, number> = {}
  Object.entries(archData).forEach(([arch, count]) => {
    const normalized = normalizeArchName(arch)
    normalizedData[normalized] = (normalizedData[normalized] || 0) + count
  })

  const chartData = Object.entries(normalizedData)
    .map(([arch, count]) => ({
      name: arch,
      value: count,
      percentage: Math.round((count / devices.length) * 100),
      color: getArchColor(arch),
    }))
    .sort((a, b) => b.value - a.value)

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Architecture Breakdown
          </CardTitle>
          <CardDescription>CPU architecture distribution</CardDescription>
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
          <Cpu className="h-5 w-5" />
          Architecture Breakdown
        </CardTitle>
        <CardDescription>{devices.length} devices across {chartData.length} architectures</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip
              formatter={(value: number, name: string, props: any) => [
                `${value} devices (${props.payload.percentage}%)`,
                "Count",
              ]}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Architecture Summary */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {chartData.map((arch) => (
            <div key={arch.name} className="flex items-center justify-between p-2 bg-gray-50 rounded border text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: arch.color }} />
                <span className="font-medium">{arch.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">{arch.value}</span>
                <span className="text-gray-500 text-xs">({arch.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
