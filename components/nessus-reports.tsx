"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Upload,
  Download,
  Trash2,
  FileText,
  Calendar,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Shield,
  Monitor,
  X,
} from "lucide-react"

interface ReportSummary {
  totalVulnerabilities: number
  critical: number
  high: number
  medium: number
  low: number
  info: number
  topHosts: string[]
  pdfSummary?: string
}

interface NessusReport {
  id: string
  filename: string
  displayName: string
  fileSize: number
  mimeType: string
  uploadedBy: string
  uploadedByName: string
  orgId: string
  orgName: string
  summary: string | null
  scanDate: string
  createdAt: string
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  return (bytes / (1024 * 1024)).toFixed(1) + " MB"
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function SummaryTile({ report, summary, onClose }: {
  report: NessusReport
  summary: ReportSummary
  onClose: () => void
}) {
  const hasSeverityCounts = summary.totalVulnerabilities > 0

  return (
    <Card className="border-2 border-blue-200 bg-blue-50/30 dark:bg-blue-950/20 dark:border-blue-800 animate-in fade-in slide-in-from-top-2 duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-base">{report.displayName}</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Scanned {formatDate(report.scanDate)} &middot; {formatFileSize(report.fileSize)} &middot; {report.filename}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasSeverityCounts && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Vulnerability Breakdown</p>
            <div className="grid grid-cols-5 gap-2">
              <SeverityCount label="Critical" count={summary.critical} color="bg-red-500" />
              <SeverityCount label="High" count={summary.high} color="bg-orange-500" />
              <SeverityCount label="Medium" count={summary.medium} color="bg-yellow-500" />
              <SeverityCount label="Low" count={summary.low} color="bg-blue-500" />
              <SeverityCount label="Info" count={summary.info} color="bg-gray-400" />
            </div>
            {summary.totalVulnerabilities > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {summary.totalVulnerabilities} total vulnerabilities found
              </p>
            )}
          </div>
        )}

        {summary.topHosts.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Monitor className="h-3 w-3" />
              Hosts Identified
            </p>
            <div className="flex flex-wrap gap-1.5">
              {summary.topHosts.map((host) => (
                <Badge key={host} variant="outline" className="font-mono text-xs">
                  {host}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {summary.pdfSummary && (
          <>
            <Separator />
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Report Preview</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {summary.pdfSummary}
              </p>
            </div>
          </>
        )}

        {!hasSeverityCounts && !summary.pdfSummary && summary.topHosts.length === 0 && (
          <p className="text-sm text-muted-foreground">No structured data could be extracted from this report.</p>
        )}
      </CardContent>
    </Card>
  )
}

function SeverityCount({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="text-center p-2 rounded-lg bg-background border">
      <div className={`inline-block w-2.5 h-2.5 rounded-full ${color} mb-1`} />
      <p className="text-lg font-bold">{count}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
    </div>
  )
}

export function NessusReports() {
  const [reports, setReports] = useState<NessusReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadForm, setUploadForm] = useState({
    displayName: "",
    scanDate: new Date().toISOString().split("T")[0],
  })

  const fetchReports = async () => {
    try {
      setError(null)
      const response = await fetch("/api/nessus/reports")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch reports")
      }

      setReports(data.reports || [])
    } catch (err) {
      console.error("Error fetching reports:", err)
      setError(err instanceof Error ? err.message : "Failed to load reports")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    const file = fileInputRef.current?.files?.[0]

    if (!file) {
      setError("Please select a file")
      return
    }

    if (!uploadForm.displayName.trim()) {
      setError("Please enter a display name")
      return
    }

    setUploading(true)
    setError(null)
    setUploadSuccess(false)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("displayName", uploadForm.displayName)
      formData.append("scanDate", uploadForm.scanDate)

      const response = await fetch("/api/nessus/reports", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload report")
      }

      setUploadSuccess(true)
      setUploadDialogOpen(false)
      setUploadForm({
        displayName: "",
        scanDate: new Date().toISOString().split("T")[0],
      })
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      await fetchReports()
    } catch (err) {
      console.error("Error uploading report:", err)
      setError(err instanceof Error ? err.message : "Failed to upload report")
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (report: NessusReport) => {
    try {
      const response = await fetch(`/api/nessus/reports/${report.id}`)

      if (!response.ok) {
        throw new Error("Failed to download report")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = report.filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error("Error downloading report:", err)
      setError(err instanceof Error ? err.message : "Failed to download report")
    }
  }

  const handleDelete = async (reportId: string) => {
    try {
      const response = await fetch(`/api/nessus/reports?id=${reportId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete report")
      }

      setDeleteConfirmId(null)
      if (selectedReportId === reportId) setSelectedReportId(null)
      await fetchReports()
    } catch (err) {
      console.error("Error deleting report:", err)
      setError(err instanceof Error ? err.message : "Failed to delete report")
    }
  }

  const selectedReport = reports.find((r) => r.id === selectedReportId)
  const selectedSummary: ReportSummary | null =
    selectedReport?.summary ? JSON.parse(selectedReport.summary) : null

  return (
    <div className="space-y-4">
      {/* Summary Tile — appears dynamically when a report is selected */}
      {selectedReport && selectedSummary && (
        <SummaryTile
          report={selectedReport}
          summary={selectedSummary}
          onClose={() => setSelectedReportId(null)}
        />
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Nessus External Scan Reports
              </CardTitle>
              <CardDescription>
                Monthly vulnerability scan reports for your organization
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchReports} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Report
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Nessus Report</DialogTitle>
                    <DialogDescription>
                      Upload a monthly external vulnerability scan report. Supported formats: PDF, CSV, XML, HTML, .nessus
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleUpload} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Report Name</Label>
                      <Input
                        id="displayName"
                        placeholder="e.g., February 2024 External Scan"
                        value={uploadForm.displayName}
                        onChange={(e) =>
                          setUploadForm({ ...uploadForm, displayName: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="scanDate">Scan Date</Label>
                      <Input
                        id="scanDate"
                        type="date"
                        value={uploadForm.scanDate}
                        onChange={(e) =>
                          setUploadForm({ ...uploadForm, scanDate: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="file">Report File</Label>
                      <Input
                        id="file"
                        type="file"
                        ref={fileInputRef}
                        accept=".pdf,.csv,.xml,.json,.html,.nessus"
                        required
                      />
                    </div>
                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setUploadDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={uploading}>
                        {uploading ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {uploadSuccess && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Report uploaded successfully!
              </AlertDescription>
            </Alert>
          )}

          {error && !uploadDialogOpen && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No reports uploaded yet</p>
              <p className="text-sm mt-1">
                Upload your first Nessus external scan report to get started
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report Name</TableHead>
                    <TableHead>Scan Date</TableHead>
                    <TableHead>Uploaded By</TableHead>
                    <TableHead>File Size</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => {
                    const summary: ReportSummary | null = report.summary
                      ? JSON.parse(report.summary)
                      : null
                    const isSelected = selectedReportId === report.id

                    return (
                      <TableRow
                        key={report.id}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-blue-50 dark:bg-blue-950/30"
                            : summary
                              ? "hover:bg-muted/50"
                              : ""
                        }`}
                        onClick={() => {
                          if (summary) {
                            setSelectedReportId(isSelected ? null : report.id)
                          }
                        }}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-400" />
                            {report.displayName}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">{report.filename}</div>
                          {summary && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <Shield className="h-3 w-3 text-blue-500" />
                              <span className="text-xs text-blue-600">
                                {summary.totalVulnerabilities > 0
                                  ? `${summary.totalVulnerabilities} vulnerabilities`
                                  : "Summary available"}
                              </span>
                              {summary.critical > 0 && (
                                <Badge variant="destructive" className="text-[10px] px-1 py-0 h-4">
                                  {summary.critical} crit
                                </Badge>
                              )}
                              {summary.high > 0 && (
                                <Badge className="text-[10px] px-1 py-0 h-4 bg-orange-500">
                                  {summary.high} high
                                </Badge>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            {formatDate(report.scanDate)}
                          </div>
                        </TableCell>
                        <TableCell>{report.uploadedByName}</TableCell>
                        <TableCell>{formatFileSize(report.fileSize)}</TableCell>
                        <TableCell>{formatDate(report.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(report)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            {deleteConfirmId === report.id ? (
                              <div className="flex gap-1">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(report.id)}
                                >
                                  Confirm
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setDeleteConfirmId(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDeleteConfirmId(report.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
