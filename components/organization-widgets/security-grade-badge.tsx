"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Shield, TrendingUp, TrendingDown, Minus } from "lucide-react"
import type { Finding, AgentDevice, SecurityGrade } from "../organization-tabs/types"
import { calculateSecurityScore, calculateSecurityGrade, getSecurityGradeColor } from "../organization-utils/calculations"

interface SecurityGradeBadgeProps {
  findings: Finding[]
  devices: AgentDevice[]
  showDetails?: boolean
}

export function SecurityGradeBadge({ findings, devices, showDetails = true }: SecurityGradeBadgeProps) {
  const score = calculateSecurityScore(findings, devices)
  const grade = calculateSecurityGrade(score)
  const gradeColor = getSecurityGradeColor(grade)

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
    // Mock trend - in production would compare with historical data
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
          <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Critical</div>
              <div className="text-xl font-bold text-red-600">
                {findings.filter((f) => f.priority === 1).length}
              </div>
            </div>
            <div>
              <div className="text-gray-600">High</div>
              <div className="text-xl font-bold text-orange-600">
                {findings.filter((f) => f.priority === 2).length}
              </div>
            </div>
            <div>
              <div className="text-gray-600">Online</div>
              <div className="text-xl font-bold text-green-600">
                {devices.filter((d) => !d.is_sleeping && !d.is_excluded && !d.is_isolated).length}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
