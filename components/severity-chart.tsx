"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

interface Finding {
  finding_id: string
  name: string
  priority: number
  status_name: string
  type_name: string
  created: string
  modified: string
  org_name: string
  org_id: string
  resolution_name?: string
}

interface SeverityChartProps {
  findings: Finding[]
}

const SEVERITY_COLORS = {
  Critical: "#dc2626",
  High: "#ea580c",
  Medium: "#7c3aed",
  Low: "#16a34a",
  Info: "#6b7280",
}

const SEVERITY_LABELS: Record<number, string> = {
  1: "Critical",
  2: "High",
  3: "Medium",
  4: "Low",
  5: "Info",
}

export function SeverityChart({ findings }: SeverityChartProps) {
  const severityData = [1, 2, 3, 4, 5].map((priority) => {
    const count = findings.filter((f) => f.priority === priority).length
    const label = SEVERITY_LABELS[priority]
    return {
      name: label,
      count,
      color: SEVERITY_COLORS[label as keyof typeof SEVERITY_COLORS],
    }
  })

  const totalFindings = findings.length
  const criticalAndHigh = findings.filter((f) => f.priority <= 2).length

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 3v18h18" />
            <path d="M18 17V9" />
            <path d="M13 17V5" />
            <path d="M8 17v-3" />
          </svg>
          Findings by Severity
        </CardTitle>
        <CardDescription>
          {totalFindings} total findings | {criticalAndHigh} critical/high priority
        </CardDescription>
      </CardHeader>
      <CardContent>
        {findings.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-gray-500">
            No findings data available
          </div>
        ) : (
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={70} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                  formatter={(value: number) => [`${value} findings`, "Count"]}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid grid-cols-5 gap-2 mt-4 pt-4 border-t">
          {severityData.map((item) => (
            <div key={item.name} className="text-center">
              <div
                className="text-lg font-bold"
                style={{ color: item.color }}
              >
                {item.count}
              </div>
              <div className="text-xs text-gray-500">{item.name}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
