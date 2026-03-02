"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react"
import type { Organization } from "./types"
import { PriorityDistributionChart } from "../organization-charts/priority-distribution-chart"
import { FindingsVelocityChart } from "../organization-charts/findings-velocity-chart"
import { StatusBreakdownChart } from "../organization-charts/status-breakdown-chart"
import { RiskHeatmap } from "../organization-charts/risk-heatmap"
import { MTTRMetrics } from "../organization-widgets/mttr-metrics"
import {
  calculateSecurityScore,
  calculateSecurityGrade,
  getSecurityGradeColor,
} from "../organization-utils/calculations"

interface SecurityPostureTabProps {
  organization: Organization
}

export function SecurityPostureTab({ organization }: SecurityPostureTabProps) {
  const findings = organization.findings || []
  const devices = organization.agentDevices || []

  // Calculate security metrics
  const securityScore = calculateSecurityScore(findings, devices)
  const securityGrade = calculateSecurityGrade(securityScore)
  const gradeColor = getSecurityGradeColor(securityGrade)

  // Count findings by priority
  const p1Count = findings.filter((f) => f.priority === 1).length
  const p2Count = findings.filter((f) => f.priority === 2).length
  const p3Count = findings.filter((f) => f.priority === 3).length

  // Count by status
  const openFindings = findings.filter((f) => f.status_name?.toLowerCase().includes("open")).length
  const resolvedFindings = findings.filter((f) => f.status_name?.toLowerCase().includes("resolved")).length
  const inProgressFindings = findings.filter((f) => f.status_name?.toLowerCase().includes("progress")).length

  // Calculate trends (mock for now - would need historical data)
  const findingsTrend = p1Count > 5 ? "increasing" : p1Count > 0 ? "stable" : "decreasing"

  const getTrendIcon = (trend: string) => {
    if (trend === "increasing") return <TrendingUp className="h-4 w-4 text-red-500" />
    if (trend === "decreasing") return <TrendingDown className="h-4 w-4 text-green-500" />
    return <Minus className="h-4 w-4 text-gray-500" />
  }

  return (
    <div className="space-y-6">
      {/* Security Score Card */}
      <Card className={`border-2 ${gradeColor.replace("text-", "border-")}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Shield className="h-6 w-6" />
                Security Posture Overview
              </CardTitle>
              <CardDescription className="mt-2">
                Comprehensive security analysis for {organization.name}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className={`text-5xl font-bold ${gradeColor}`}>{securityGrade}</div>
              <div className="text-sm text-gray-600 mt-1">Security Grade</div>
              <div className="text-xs text-gray-500">Score: {securityScore}/100</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600">Critical Findings</div>
                  <div className="text-2xl font-bold text-red-600">{p1Count}</div>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </div>

            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600">High Priority</div>
                  <div className="text-2xl font-bold text-orange-600">{p2Count}</div>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-500" />
              </div>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600">Medium Priority</div>
                  <div className="text-2xl font-bold text-yellow-600">{p3Count}</div>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600">Total Findings</div>
                  <div className="text-2xl font-bold text-blue-600">{findings.length}</div>
                </div>
                {getTrendIcon(findingsTrend)}
              </div>
            </div>
          </div>

          {/* Status Summary */}
          <div className="mt-4 grid gap-2 md:grid-cols-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 border rounded">
              <span className="text-sm text-gray-600">Open</span>
              <Badge variant="destructive">{openFindings}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 border rounded">
              <span className="text-sm text-gray-600">In Progress</span>
              <Badge variant="default">{inProgressFindings}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 border rounded">
              <span className="text-sm text-gray-600">Resolved</span>
              <Badge variant="secondary">{resolvedFindings}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <PriorityDistributionChart findings={findings} />
        <StatusBreakdownChart findings={findings} />
      </div>

      <FindingsVelocityChart findings={findings} />

      <div className="grid gap-6 md:grid-cols-2">
        <MTTRMetrics findings={findings} />
        <RiskHeatmap findings={findings} />
      </div>

      {/* Security Recommendations */}
      {(p1Count > 0 || p2Count > 5 || securityScore < 70) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-900">
              <AlertTriangle className="h-5 w-5" />
              Security Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-yellow-900">
              {p1Count > 0 && (
                <li className="flex items-start gap-2">
                  <span className="font-semibold">•</span>
                  <span>
                    <strong>Immediate Action Required:</strong> {p1Count} critical finding{p1Count !== 1 ? "s" : ""}{" "}
                    need urgent attention. Review and resolve P1 findings within 24 hours.
                  </span>
                </li>
              )}
              {p2Count > 5 && (
                <li className="flex items-start gap-2">
                  <span className="font-semibold">•</span>
                  <span>
                    <strong>High Priority Backlog:</strong> {p2Count} high-priority findings detected. Consider
                    allocating additional resources to address these within 3 days.
                  </span>
                </li>
              )}
              {securityScore < 70 && (
                <li className="flex items-start gap-2">
                  <span className="font-semibold">•</span>
                  <span>
                    <strong>Security Score Below Target:</strong> Current score is {securityScore}/100. Focus on
                    resolving critical and high-priority findings to improve overall security posture.
                  </span>
                </li>
              )}
              {openFindings > findings.length * 0.7 && (
                <li className="flex items-start gap-2">
                  <span className="font-semibold">•</span>
                  <span>
                    <strong>High Open Finding Rate:</strong> {Math.round((openFindings / findings.length) * 100)}% of
                    findings are still open. Implement a structured remediation workflow.
                  </span>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
