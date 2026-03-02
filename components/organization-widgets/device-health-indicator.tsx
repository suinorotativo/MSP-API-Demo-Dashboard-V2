"use client"

import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react"
import type { AgentDevice, DeviceHealth } from "../organization-tabs/types"
import { calculateDeviceHealth, getDeviceHealthColor, formatDuration } from "../organization-utils/calculations"

interface DeviceHealthIndicatorProps {
  device: AgentDevice
  showLabel?: boolean
  size?: "sm" | "md" | "lg"
}

export function DeviceHealthIndicator({ device, showLabel = true, size = "md" }: DeviceHealthIndicatorProps) {
  const health = calculateDeviceHealth(device)
  const hoursSinceCheckIn = (Date.now() - new Date(device.alive).getTime()) / 3600000

  const getHealthIcon = () => {
    const iconSize = size === "sm" ? "h-3 w-3" : size === "md" ? "h-4 w-4" : "h-5 w-5"

    if (health === "healthy") {
      return <CheckCircle className={`${iconSize} text-green-600`} />
    } else if (health === "warning") {
      return <AlertTriangle className={`${iconSize} text-yellow-600`} />
    } else {
      return <XCircle className={`${iconSize} text-red-600`} />
    }
  }

  const getHealthLabel = () => {
    if (device.is_isolated) return "Isolated"
    if (device.is_excluded) return "Excluded"
    if (health === "critical") return "Offline"
    if (health === "warning") return device.is_sleeping ? "Sleeping" : "Warning"
    return "Healthy"
  }

  const getHealthDescription = () => {
    if (device.is_isolated) {
      return "Device is currently isolated from the network"
    }
    if (device.is_excluded) {
      return "Device is excluded from monitoring"
    }
    if (hoursSinceCheckIn > 168) {
      return `Last seen ${formatDuration(hoursSinceCheckIn)} ago - device may be offline`
    }
    if (hoursSinceCheckIn > 72) {
      return `Last seen ${formatDuration(hoursSinceCheckIn)} ago - check connectivity`
    }
    if (device.is_sleeping) {
      return `Device is in sleep mode - last seen ${formatDuration(hoursSinceCheckIn)} ago`
    }
    return `Device is online - last check-in ${formatDuration(hoursSinceCheckIn)} ago`
  }

  const getBadgeVariant = () => {
    if (health === "healthy") return "default"
    if (health === "warning") return "secondary"
    return "destructive"
  }

  if (!showLabel) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-flex items-center cursor-help">{getHealthIcon()}</div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">{getHealthLabel()}</p>
            <p className="text-xs text-gray-500">{getHealthDescription()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={getBadgeVariant()} className="cursor-help">
            {getHealthIcon()}
            <span className="ml-1">{getHealthLabel()}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{getHealthDescription()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface DeviceHealthSummaryProps {
  devices: AgentDevice[]
}

export function DeviceHealthSummary({ devices }: DeviceHealthSummaryProps) {
  const healthCounts = devices.reduce(
    (acc, device) => {
      const health = calculateDeviceHealth(device)
      acc[health]++
      return acc
    },
    { healthy: 0, warning: 0, critical: 0 } as Record<DeviceHealth, number>,
  )

  const total = devices.length

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="flex flex-col items-center p-3 bg-green-50 border border-green-200 rounded-lg">
        <CheckCircle className="h-6 w-6 text-green-600 mb-1" />
        <span className="text-2xl font-bold text-green-700">{healthCounts.healthy}</span>
        <span className="text-xs text-green-600">
          Healthy ({total > 0 ? Math.round((healthCounts.healthy / total) * 100) : 0}%)
        </span>
      </div>

      <div className="flex flex-col items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <AlertTriangle className="h-6 w-6 text-yellow-600 mb-1" />
        <span className="text-2xl font-bold text-yellow-700">{healthCounts.warning}</span>
        <span className="text-xs text-yellow-600">
          Warning ({total > 0 ? Math.round((healthCounts.warning / total) * 100) : 0}%)
        </span>
      </div>

      <div className="flex flex-col items-center p-3 bg-red-50 border border-red-200 rounded-lg">
        <XCircle className="h-6 w-6 text-red-600 mb-1" />
        <span className="text-2xl font-bold text-red-700">{healthCounts.critical}</span>
        <span className="text-xs text-red-600">
          Critical ({total > 0 ? Math.round((healthCounts.critical / total) * 100) : 0}%)
        </span>
      </div>
    </div>
  )
}
