"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  AlertTriangle,
  HardDrive,
  Download,
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
  onSwitchTab?: (tab: string) => void
}

export function QuickActionsPanel({
  organizationId,
  organizationName,
  accountId,
  criticalFindings,
  totalFindings,
  totalDevices,
  onRefresh,
  onSwitchTab,
}: QuickActionsPanelProps) {
  const handleExport = async () => {
    try {
      const response = await fetch("/api/blumira/organizations/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationIds: [accountId],
          format: "csv",
          dataType: "summary",
        }),
      })
      if (!response.ok) throw new Error("Export failed")
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${organizationName.replace(/[^a-zA-Z0-9]/g, "_")}_export.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Export error:", error)
    }
  }

  const switchTab = (tab: string) => {
    if (onSwitchTab) {
      onSwitchTab(tab)
    }
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
              onClick={() => switchTab("findings")}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              View {criticalFindings} Critical Finding{criticalFindings !== 1 ? "s" : ""}
            </Button>
          )}

          {/* View All Findings */}
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => switchTab("findings")}
          >
            <Shield className="h-4 w-4 mr-2" />
            View All Findings ({totalFindings})
          </Button>

          {/* View Devices */}
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => switchTab("devices")}
          >
            <HardDrive className="h-4 w-4 mr-2" />
            Manage Devices ({totalDevices})
          </Button>

          {/* View Agent Health */}
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => switchTab("health")}
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
