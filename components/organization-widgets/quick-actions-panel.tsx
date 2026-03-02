"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  AlertTriangle,
  HardDrive,
  Download,
  ExternalLink,
  RefreshCw,
  Shield,
  Activity
} from "lucide-react"

interface QuickActionsPanelProps {
  organizationId: string
  organizationName: string
  accountId: string
  criticalFindings: number
  totalFindings: number
  totalDevices: number
  onRefresh?: () => void
}

export function QuickActionsPanel({
  organizationId,
  organizationName,
  accountId,
  criticalFindings,
  totalFindings,
  totalDevices,
  onRefresh,
}: QuickActionsPanelProps) {
  const handleExport = () => {
    // This would trigger the export functionality
    console.log("Export triggered for", organizationName)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common operations for {organizationName}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* View Critical Findings */}
          {criticalFindings > 0 && (
            <Button
              variant="destructive"
              className="w-full justify-start"
              onClick={() => {
                // This would navigate to the findings tab with P1 filter
                const element = document.querySelector('[value="findings"]') as HTMLElement
                element?.click()
              }}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              View {criticalFindings} Critical Finding{criticalFindings !== 1 ? "s" : ""}
            </Button>
          )}

          {/* View All Findings */}
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              const element = document.querySelector('[value="findings"]') as HTMLElement
              element?.click()
            }}
          >
            <Shield className="h-4 w-4 mr-2" />
            View All Findings ({totalFindings})
          </Button>

          {/* View Devices */}
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              const element = document.querySelector('[value="devices"]') as HTMLElement
              element?.click()
            }}
          >
            <HardDrive className="h-4 w-4 mr-2" />
            Manage Devices ({totalDevices})
          </Button>

          {/* View Agent Health */}
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              const element = document.querySelector('[value="health"]') as HTMLElement
              element?.click()
            }}
          >
            <Activity className="h-4 w-4 mr-2" />
            Check Agent Health
          </Button>

          <div className="h-px bg-gray-200 my-2" />

          {/* Export Data */}
          <Button variant="outline" className="w-full justify-start" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Organization Data
          </Button>

          {/* Refresh Data */}
          {onRefresh && (
            <>
              <div className="h-px bg-gray-200 my-2" />
              <Button variant="outline" className="w-full justify-start" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Organization Data
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
