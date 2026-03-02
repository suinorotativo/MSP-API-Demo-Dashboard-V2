"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Download, FileText, Table } from "lucide-react"
import type { Organization } from "../organization-tabs/types"

interface ExportDialogProps {
  organization: Organization
  trigger?: React.ReactNode
}

export function ExportDialog({ organization, trigger }: ExportDialogProps) {
  const [format, setFormat] = useState<"csv" | "json">("csv")
  const [includeDevices, setIncludeDevices] = useState(true)
  const [includeFindings, setIncludeFindings] = useState(true)
  const [includeKeys, setIncludeKeys] = useState(false)
  const [dateRange, setDateRange] = useState<"all" | "7d" | "30d" | "90d">("all")
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)

    try {
      // Prepare export data
      const exportData: any = {
        organization: {
          id: organization.id,
          name: organization.name,
          account_id: organization.account_id,
          license: organization.license,
          user_count: organization.user_count,
        },
      }

      // Filter by date range if needed
      const filterByDate = (item: any) => {
        if (dateRange === "all") return true
        const created = new Date(item.created)
        const now = new Date()
        const daysAgo = parseInt(dateRange)
        const cutoff = new Date(now.setDate(now.getDate() - daysAgo))
        return created >= cutoff
      }

      if (includeDevices) {
        exportData.devices = organization.agentDevices
      }

      if (includeFindings) {
        exportData.findings = organization.findings.filter(filterByDate)
      }

      if (includeKeys) {
        exportData.keys = organization.agentKeys
      }

      // Generate file based on format
      let content: string
      let mimeType: string
      let extension: string

      if (format === "csv") {
        // Generate CSV
        content = generateCSV(exportData)
        mimeType = "text/csv"
        extension = "csv"
      } else {
        // Generate JSON
        content = JSON.stringify(exportData, null, 2)
        mimeType = "application/json"
        extension = "json"
      }

      // Download file
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${organization.name.replace(/[^a-z0-9]/gi, "_")}_export_${new Date().toISOString().split("T")[0]}.${extension}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Export failed:", error)
      alert("Export failed. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  const generateCSV = (data: any): string => {
    let csv = ""

    // Organization info
    csv += "Organization Information\n"
    csv += `Name,${data.organization.name}\n`
    csv += `Account ID,${data.organization.account_id}\n`
    csv += `License,${data.organization.license}\n`
    csv += `Users,${data.organization.user_count}\n\n`

    // Devices
    if (data.devices) {
      csv += "\nDevices\n"
      csv += "Hostname,Device ID,Platform,Architecture,Status,Last Alive,Created\n"
      data.devices.forEach((device: any) => {
        const status = device.is_isolated
          ? "Isolated"
          : device.is_excluded
          ? "Excluded"
          : device.is_sleeping
          ? "Sleeping"
          : "Online"
        csv += `"${device.hostname}",${device.device_id},${device.plat},${device.arch},${status},${device.alive},${device.created}\n`
      })
    }

    // Findings
    if (data.findings) {
      csv += "\nFindings\n"
      csv += "Name,Priority,Status,Type,Category,Created,Modified,Finding ID\n"
      data.findings.forEach((finding: any) => {
        csv += `"${finding.name}",P${finding.priority},${finding.status_name},${finding.type_name},"${finding.category_name || ""}",${finding.created},${finding.modified},${finding.finding_id}\n`
      })
    }

    // Keys
    if (data.keys) {
      csv += "\nAgent Keys\n"
      csv += "Key Name,Key ID,Status\n"
      data.keys.forEach((key: any) => {
        csv += `"${key.key_name || key.name}",${key.key_id},${key.status || "Unknown"}\n`
      })
    }

    return csv
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Organization Data</DialogTitle>
          <DialogDescription>
            Export data for {organization.name} in your preferred format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select value={format} onValueChange={(value: any) => setFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <Table className="h-4 w-4" />
                    <span>CSV (Spreadsheet)</span>
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>JSON (Raw Data)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Data Selection */}
          <div className="space-y-3">
            <Label>Include Data</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="devices" checked={includeDevices} onCheckedChange={(checked) => setIncludeDevices(!!checked)} />
                <label htmlFor="devices" className="text-sm cursor-pointer">
                  Devices ({organization.agentDeviceCount})
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="findings" checked={includeFindings} onCheckedChange={(checked) => setIncludeFindings(!!checked)} />
                <label htmlFor="findings" className="text-sm cursor-pointer">
                  Findings ({organization.findingsCount})
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="keys" checked={includeKeys} onCheckedChange={(checked) => setIncludeKeys(!!checked)} />
                <label htmlFor="keys" className="text-sm cursor-pointer">
                  Agent Keys ({organization.agentKeyCount})
                </label>
              </div>
            </div>
          </div>

          {/* Date Range */}
          {includeFindings && (
            <div className="space-y-2">
              <Label>Findings Date Range</Label>
              <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Export Button */}
          <Button onClick={handleExport} disabled={isExporting || (!includeDevices && !includeFindings && !includeKeys)} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Exporting..." : `Export as ${format.toUpperCase()}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
