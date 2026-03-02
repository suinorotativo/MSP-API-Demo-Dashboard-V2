"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock } from "lucide-react"
import type { Finding } from "../organization-tabs/types"
import { calculateMTTR, formatDuration } from "../organization-utils/calculations"

interface MTTRMetricsProps {
  findings: Finding[]
}

const PRIORITY_LABELS: Record<number, string> = {
  1: "P1 - Critical",
  2: "P2 - High",
  3: "P3 - Medium",
  4: "P4 - Low",
  5: "P5 - Info",
}

const PRIORITY_COLORS: Record<number, string> = {
  1: "bg-red-50 border-red-200",
  2: "bg-orange-50 border-orange-200",
  3: "bg-yellow-50 border-yellow-200",
  4: "bg-blue-50 border-blue-200",
  5: "bg-gray-50 border-gray-200",
}

export function MTTRMetrics({ findings }: MTTRMetricsProps) {
  const mttrByPriority = calculateMTTR(findings)
  const priorities = Object.keys(mttrByPriority)
    .map(Number)
    .sort((a, b) => a - b)

  // Calculate overall MTTR
  const resolvedFindings = findings.filter((f) => f.status_name?.toLowerCase().includes("resolved"))
  const overallMTTR =
    resolvedFindings.length > 0
      ? resolvedFindings.reduce((sum, f) => {
          const created = new Date(f.created).getTime()
          const modified = new Date(f.modified).getTime()
          return sum + (modified - created) / 3600000 // Convert to hours
        }, 0) / resolvedFindings.length
      : 0

  if (priorities.length === 0 && overallMTTR === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Mean Time To Resolution (MTTR)
          </CardTitle>
          <CardDescription>Average time to resolve findings by priority</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-gray-500">
            No resolved findings data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Mean Time To Resolution (MTTR)
        </CardTitle>
        <CardDescription>Average time to resolve findings by priority level</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Overall MTTR */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600">Overall MTTR</div>
                <div className="text-xs text-gray-500 mt-1">
                  Based on {resolvedFindings.length} resolved findings
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-900">{formatDuration(overallMTTR)}</div>
            </div>
          </div>

          {/* MTTR by Priority */}
          <div className="grid gap-3 md:grid-cols-2">
            {priorities.map((priority) => (
              <div key={priority} className={`p-3 border rounded-lg ${PRIORITY_COLORS[priority]}`}>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{PRIORITY_LABELS[priority]}</div>
                  <div className="text-lg font-bold">{formatDuration(mttrByPriority[priority])}</div>
                </div>
              </div>
            ))}
          </div>

          {/* MTTR Interpretation Guide */}
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600">
            <div className="font-semibold mb-1">MTTR Guidelines:</div>
            <div className="space-y-1">
              <div>• P1 (Critical): Target &lt; 24 hours</div>
              <div>• P2 (High): Target &lt; 3 days</div>
              <div>• P3 (Medium): Target &lt; 1 week</div>
              <div>• P4/P5 (Low/Info): Target &lt; 2 weeks</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
