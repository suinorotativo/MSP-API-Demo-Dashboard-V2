"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react"
import type { Organization } from "./types"
import { DeploymentRateChart } from "../organization-charts/deployment-rate-chart"
import { VersionDistributionChart } from "../organization-charts/version-distribution-chart"
import { CheckinPatternsChart } from "../organization-charts/checkin-patterns-chart"
import { IsolationHistoryTimeline } from "../organization-charts/isolation-history-timeline"
import { KeyUsageStats } from "../organization-widgets/key-usage-stats"
import { calculateCoveragePercentage } from "../organization-utils/calculations"

interface AgentHealthTabProps {
  organization: Organization
}

export function AgentHealthTab({ organization }: AgentHealthTabProps) {
  const devices = organization.agentDevices || []
  const coverage = calculateCoveragePercentage(organization.agent_count_used, organization.agent_count_available)

  // Calculate agent health metrics
  const onlineDevices = devices.filter((d) => !d.is_sleeping && !d.is_excluded && !d.is_isolated).length
  const sleepingDevices = devices.filter((d) => d.is_sleeping).length
  const isolatedDevices = devices.filter((d) => d.is_isolated).length
  const excludedDevices = devices.filter((d) => d.is_excluded).length

  // Calculate check-in health
  const now = Date.now()
  const recentCheckIns = devices.filter((d) => {
    const hoursSince = (now - new Date(d.alive).getTime()) / 3600000
    return hoursSince < 24
  }).length
  const checkInHealth = devices.length > 0 ? Math.round((recentCheckIns / devices.length) * 100) : 0

  // Calculate deployment trend (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const recentDeployments = devices.filter((d) => new Date(d.created) >= sevenDaysAgo).length

  // Determine overall health status
  const getOverallHealthStatus = () => {
    if (checkInHealth >= 90 && isolatedDevices === 0 && coverage >= 80) {
      return { status: "Excellent", color: "text-green-600", bgColor: "bg-green-50", icon: CheckCircle2 }
    }
    if (checkInHealth >= 70 && isolatedDevices <= 2 && coverage >= 60) {
      return { status: "Good", color: "text-blue-600", bgColor: "bg-blue-50", icon: Activity }
    }
    if (checkInHealth >= 50 || isolatedDevices <= 5) {
      return { status: "Fair", color: "text-yellow-600", bgColor: "bg-yellow-50", icon: TrendingUp }
    }
    return { status: "Needs Attention", color: "text-red-600", bgColor: "bg-red-50", icon: AlertCircle }
  }

  const healthStatus = getOverallHealthStatus()
  const HealthIcon = healthStatus.icon

  return (
    <div className="space-y-6">
      {/* Overall Health Card */}
      <Card className={`border-2 ${healthStatus.color.replace("text-", "border-")}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Activity className="h-6 w-6" />
                Agent Health Overview
              </CardTitle>
              <CardDescription className="mt-2">
                Comprehensive agent deployment and health monitoring for {organization.name}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className={`flex items-center gap-2 justify-end ${healthStatus.color}`}>
                <HealthIcon className="h-6 w-6" />
                <span className="text-4xl font-bold">{healthStatus.status}</span>
              </div>
              <div className="text-sm text-gray-600 mt-1">Overall Status</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {/* Total Agents */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600">Total Agents</div>
                  <div className="text-2xl font-bold text-blue-600">{devices.length}</div>
                </div>
                <Activity className="h-8 w-8 text-blue-500" />
              </div>
              <div className="mt-2 text-xs text-gray-600">
                {recentDeployments} added (last 7 days)
              </div>
            </div>

            {/* Online Agents */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600">Online</div>
                  <div className="text-2xl font-bold text-green-600">{onlineDevices}</div>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <div className="mt-2 text-xs text-gray-600">
                {devices.length > 0 ? Math.round((onlineDevices / devices.length) * 100) : 0}% operational
              </div>
            </div>

            {/* Check-in Health */}
            <div className={`p-4 border rounded-lg ${
              checkInHealth >= 80 ? "bg-green-50 border-green-200" :
              checkInHealth >= 60 ? "bg-yellow-50 border-yellow-200" :
              "bg-red-50 border-red-200"
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600">Check-in Health</div>
                  <div className={`text-2xl font-bold ${
                    checkInHealth >= 80 ? "text-green-600" :
                    checkInHealth >= 60 ? "text-yellow-600" :
                    "text-red-600"
                  }`}>
                    {checkInHealth}%
                  </div>
                </div>
                <Activity className={`h-8 w-8 ${
                  checkInHealth >= 80 ? "text-green-500" :
                  checkInHealth >= 60 ? "text-yellow-500" :
                  "text-red-500"
                }`} />
              </div>
              <div className="mt-2 text-xs text-gray-600">
                {recentCheckIns} checked in (24h)
              </div>
            </div>

            {/* Agent Coverage */}
            <div className={`p-4 border rounded-lg ${
              coverage >= 80 ? "bg-green-50 border-green-200" :
              coverage >= 60 ? "bg-yellow-50 border-yellow-200" :
              "bg-red-50 border-red-200"
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600">License Usage</div>
                  <div className={`text-2xl font-bold ${
                    coverage >= 80 ? "text-green-600" :
                    coverage >= 60 ? "text-yellow-600" :
                    "text-red-600"
                  }`}>
                    {coverage}%
                  </div>
                </div>
                <TrendingUp className={`h-8 w-8 ${
                  coverage >= 80 ? "text-green-500" :
                  coverage >= 60 ? "text-yellow-500" :
                  "text-red-500"
                }`} />
              </div>
              <div className="mt-2 text-xs text-gray-600">
                {organization.agent_count_used}/{organization.agent_count_available} licenses
              </div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="mt-4 grid gap-2 md:grid-cols-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 border rounded">
              <span className="text-sm text-gray-600">Sleeping</span>
              <Badge variant="secondary">{sleepingDevices}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 border rounded">
              <span className="text-sm text-gray-600">Isolated</span>
              <Badge variant="destructive">{isolatedDevices}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 border rounded">
              <span className="text-sm text-gray-600">Excluded</span>
              <Badge variant="outline">{excludedDevices}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 border rounded">
              <span className="text-sm text-gray-600">Recent Deploys</span>
              <Badge variant="default">{recentDeployments}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <DeploymentRateChart devices={devices} days={90} />

      <div className="grid gap-6 md:grid-cols-2">
        <VersionDistributionChart devices={devices} />
        <CheckinPatternsChart devices={devices} />
      </div>

      <KeyUsageStats organization={organization} />

      <IsolationHistoryTimeline devices={devices} />

      {/* Health Recommendations */}
      {(checkInHealth < 80 || isolatedDevices > 0 || coverage > 90) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-900">
              <AlertCircle className="h-5 w-5" />
              Agent Health Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-yellow-900">
              {checkInHealth < 80 && (
                <li className="flex items-start gap-2">
                  <span className="font-semibold">•</span>
                  <span>
                    <strong>Low Check-in Rate:</strong> {100 - checkInHealth}% of devices haven't checked in within 24
                    hours. Investigate connectivity issues or stale devices.
                  </span>
                </li>
              )}
              {isolatedDevices > 0 && (
                <li className="flex items-start gap-2">
                  <span className="font-semibold">•</span>
                  <span>
                    <strong>Isolated Devices:</strong> {isolatedDevices} device{isolatedDevices !== 1 ? "s are" : " is"}{" "}
                    currently isolated. Review security findings and remediate threats before restoring connectivity.
                  </span>
                </li>
              )}
              {coverage > 90 && (
                <li className="flex items-start gap-2">
                  <span className="font-semibold">•</span>
                  <span>
                    <strong>License Capacity Warning:</strong> Agent license usage is at {coverage}%. Consider upgrading
                    your license tier to avoid deployment limitations.
                  </span>
                </li>
              )}
              {sleepingDevices > devices.length * 0.2 && (
                <li className="flex items-start gap-2">
                  <span className="font-semibold">•</span>
                  <span>
                    <strong>High Sleeping Device Count:</strong> {sleepingDevices} devices ({Math.round((sleepingDevices / devices.length) * 100)}%) are in sleep mode. Ensure these devices are intentionally idle and not experiencing issues.
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
