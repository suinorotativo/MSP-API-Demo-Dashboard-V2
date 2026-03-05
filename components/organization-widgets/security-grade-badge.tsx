"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Shield, TrendingUp, TrendingDown, Minus, Info } from "lucide-react"
import type { Finding, AgentDevice, SecurityGrade, GlobalBenchmark } from "../organization-tabs/types"
import { calculateSecurityScore, calculateSecurityGrade, getSecurityGradeColor } from "../organization-utils/calculations"

interface SecurityGradeBadgeProps {
  findings: Finding[]
  devices: AgentDevice[]
  globalBenchmark?: GlobalBenchmark
  showDetails?: boolean
  onSwitchTab?: (tab: string) => void
}

export function SecurityGradeBadge({ findings, devices, globalBenchmark, showDetails = true, onSwitchTab }: SecurityGradeBadgeProps) {
  const score = calculateSecurityScore(findings, devices, globalBenchmark)
  const grade = calculateSecurityGrade(score)
  const gradeColor = getSecurityGradeColor(grade)

  // Compute the individual components for the breakdown
  const criticalCount = findings.filter((f) => f.priority === 1).length
  const highCount = findings.filter((f) => f.priority === 2).length
  const mediumCount = findings.filter((f) => f.priority === 3).length
  const onlineDevices = devices.filter((d) => !d.is_sleeping && !d.is_excluded && !d.is_isolated).length
  const totalDevices = devices.length
  const offlineDevices = totalDevices - onlineDevices

  const totalFindings = Math.max(findings.length, 1)
  const siteCriticalRate = criticalCount / totalFindings
  const siteHighRate = highCount / totalFindings

  const globalCriticalRate = globalBenchmark?.globalCriticalRate ?? siteCriticalRate
  const globalHighRate = globalBenchmark?.globalHighRate ?? siteHighRate

  const criticalDeviation = siteCriticalRate - globalCriticalRate
  const highDeviation = siteHighRate - globalHighRate

  const criticalPenalty = Math.round(criticalDeviation * 200)
  const highPenalty = Math.round(highDeviation * 100)
  const deviceHealthBonus = totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 20) : 0
  const offlinePenalty = totalDevices > 0 ? Math.round(((totalDevices - onlineDevices) / totalDevices) * 100 * 0.2) : 0

  const getGradeDescription = (grade: SecurityGrade): string => {
    switch (grade) {
      case "A":
        return "Excellent security posture"
      case "B":
        return "Good security posture"
      case "C":
        return "Fair security posture"
      case "D":
        return "Poor security posture"
      case "F":
        return "Critical security issues"
    }
  }

  const getTrendIcon = () => {
    if (score >= 80) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (score >= 60) return <Minus className="h-4 w-4 text-gray-600" />
    return <TrendingDown className="h-4 w-4 text-red-600" />
  }

  return (
    <Card className={`border-2 ${gradeColor.replace("text-", "border-")}`}>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-full ${gradeColor.replace("text-", "bg-").replace("600", "100")}`}>
            <Shield className={`h-12 w-12 ${gradeColor}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className={`text-6xl font-bold ${gradeColor}`}>{grade}</span>
              {getTrendIcon()}
            </div>
            <div className="mt-2 text-sm font-medium text-gray-600">Security Grade</div>
            <div className="text-xs text-gray-500">{getGradeDescription(grade)}</div>
          </div>
          {showDetails && (
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">{score}</div>
              <div className="text-sm text-gray-600">Score</div>
              <div className="text-xs text-gray-500">out of 100</div>
            </div>
          )}
        </div>

        {showDetails && (
          <>
            {/* Clickable stat summary */}
            <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-sm">
              <div
                className={`${onSwitchTab ? "cursor-pointer hover:bg-red-50 rounded-lg p-2 -m-2 transition-colors" : ""}`}
                onClick={() => onSwitchTab?.("findings")}
              >
                <div className="text-gray-600">Critical</div>
                <div className="text-xl font-bold text-red-600">{criticalCount}</div>
              </div>
              <div
                className={`${onSwitchTab ? "cursor-pointer hover:bg-orange-50 rounded-lg p-2 -m-2 transition-colors" : ""}`}
                onClick={() => onSwitchTab?.("findings")}
              >
                <div className="text-gray-600">High</div>
                <div className="text-xl font-bold text-orange-600">{highCount}</div>
              </div>
              <div
                className={`${onSwitchTab ? "cursor-pointer hover:bg-green-50 rounded-lg p-2 -m-2 transition-colors" : ""}`}
                onClick={() => onSwitchTab?.("devices")}
              >
                <div className="text-gray-600">Online</div>
                <div className="text-xl font-bold text-green-600">{onlineDevices}</div>
              </div>
            </div>

            {/* Score computation breakdown */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-1.5 mb-2">
                <Info className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-xs font-medium text-gray-500">Score Breakdown (vs Fleet Average)</span>
              </div>
              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Base score</span>
                  <span className="font-mono">100</span>
                </div>
                {globalBenchmark && (
                  <div className="flex justify-between text-gray-500">
                    <span>Fleet avg critical rate</span>
                    <span className="font-mono">{(globalCriticalRate * 100).toFixed(1)}%</span>
                  </div>
                )}
                {criticalPenalty !== 0 && (
                  <div className={`flex justify-between ${criticalPenalty > 0 ? "text-red-600" : "text-green-600"}`}>
                    <span>Critical: {(siteCriticalRate * 100).toFixed(1)}% vs {(globalCriticalRate * 100).toFixed(1)}% avg</span>
                    <span className="font-mono">{criticalPenalty > 0 ? "-" : "+"}{Math.abs(criticalPenalty)}</span>
                  </div>
                )}
                {highPenalty !== 0 && (
                  <div className={`flex justify-between ${highPenalty > 0 ? "text-orange-600" : "text-green-600"}`}>
                    <span>High: {(siteHighRate * 100).toFixed(1)}% vs {(globalHighRate * 100).toFixed(1)}% avg</span>
                    <span className="font-mono">{highPenalty > 0 ? "-" : "+"}{Math.abs(highPenalty)}</span>
                  </div>
                )}
                {deviceHealthBonus > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Device health bonus ({onlineDevices}/{totalDevices} online)</span>
                    <span className="font-mono">+{deviceHealthBonus}</span>
                  </div>
                )}
                {offlinePenalty > 0 && (
                  <div className="flex justify-between text-gray-500">
                    <span>Offline penalty ({offlineDevices} offline)</span>
                    <span className="font-mono">-{offlinePenalty}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t border-dashed">
                  <span>Final score</span>
                  <span className="font-mono">{score}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
