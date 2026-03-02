"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Gauge, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react"
import { calculateCoveragePercentage } from "../organization-utils/calculations"

interface AgentCoverageIndicatorProps {
  used: number
  available: number
  organizationName?: string
}

export function AgentCoverageIndicator({ used, available, organizationName }: AgentCoverageIndicatorProps) {
  const coverage = calculateCoveragePercentage(used, available)

  const getCoverageStatus = () => {
    if (coverage >= 90) {
      return {
        label: "Near Capacity",
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        icon: AlertTriangle,
        message: "Consider upgrading your license tier",
      }
    }
    if (coverage >= 75) {
      return {
        label: "High Usage",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
        icon: TrendingUp,
        message: "Approaching capacity limit",
      }
    }
    return {
      label: "Healthy Coverage",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      icon: CheckCircle2,
      message: "Good license utilization",
    }
  }

  const status = getCoverageStatus()
  const StatusIcon = status.icon
  const remaining = available - used

  return (
    <Card className={`border-2 ${status.borderColor}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              Agent License Coverage
            </CardTitle>
            {organizationName && <CardDescription className="mt-1">{organizationName}</CardDescription>}
          </div>
          <Badge variant="outline" className={status.bgColor}>
            <StatusIcon className={`h-4 w-4 mr-1 ${status.color}`} />
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Visual Gauge */}
        <div className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <div className={`text-5xl font-bold ${status.color}`}>{coverage}%</div>
              <div className="text-sm text-gray-600 mt-1">{status.message}</div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">{used}</div>
              <div className="text-sm text-gray-600">of {available}</div>
              <div className="text-xs text-gray-500">licenses used</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative">
            <div className="w-full h-8 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 flex items-center justify-end pr-3 text-white text-sm font-semibold ${
                  coverage >= 90
                    ? "bg-red-500"
                    : coverage >= 75
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}
                style={{ width: `${Math.min(coverage, 100)}%` }}
              >
                {coverage > 10 && `${coverage}%`}
              </div>
            </div>
            {/* Threshold markers */}
            <div className="absolute top-0 left-3/4 w-px h-8 bg-gray-400 opacity-50">
              <div className="absolute -top-1 -left-2 text-xs text-gray-500">75%</div>
            </div>
            <div className="absolute top-0 left-[90%] w-px h-8 bg-gray-400 opacity-50">
              <div className="absolute -top-1 -left-2 text-xs text-gray-500">90%</div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 pt-3">
            <div className="text-center p-3 bg-gray-50 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{used}</div>
              <div className="text-xs text-gray-600 mt-1">In Use</div>
            </div>
            <div className="text-center p-3 bg-gray-50 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{remaining}</div>
              <div className="text-xs text-gray-600 mt-1">Available</div>
            </div>
            <div className="text-center p-3 bg-gray-50 border rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{available}</div>
              <div className="text-xs text-gray-600 mt-1">Total</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
