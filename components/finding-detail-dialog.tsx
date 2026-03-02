"use client"

import { useState, type ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AlertCircle, Eye } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { FindingCommentsSection } from "@/components/organization-widgets/finding-comments-section"

interface Finding {
  finding_id: string
  name: string
  priority: number
  status_name: string
  type_name: string
  created: string
  modified: string
  org_name: string
  org_id: string
  analysis?: string
  resolution_name?: string
  category_name?: string
  description?: string
  source_info?: string
  ip_address?: string
  hostname?: string
  url?: string
  [key: string]: unknown
}

interface FindingDetails {
  details?: any
  data?: any
  status?: string
  [key: string]: unknown
}

interface FindingDetailDialogProps {
  finding: Finding
  getPriorityColor: (priority: number) => string
  getPriorityLabel: (priority: number) => string
  trigger?: ReactNode
}

// Fields to skip in metadata display (internal/already displayed)
const SKIP_FIELDS = new Set([
  "finding_id", "name", "priority", "status_name", "type_name",
  "created", "modified", "org_name", "org_id", "analysis",
  "resolution_name", "category_name", "description", "source_info",
  "ip_address", "hostname", "url",
])

// Human-readable labels for known fields
const FIELD_LABELS: Record<string, string> = {
  severity: "Severity",
  confidence: "Confidence",
  source_type: "Source Type",
  rule_name: "Rule Name",
  rule_id: "Rule ID",
  sensor_name: "Sensor",
  user_name: "User",
  account_name: "Account",
  domain: "Domain",
  port: "Port",
  protocol: "Protocol",
  direction: "Direction",
  event_count: "Event Count",
  first_seen: "First Seen",
  last_seen: "Last Seen",
  mitre_tactic: "MITRE Tactic",
  mitre_technique: "MITRE Technique",
}

function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined) return ""
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (typeof value === "number") return value.toLocaleString()
  if (typeof value === "string") {
    // Try to format dates
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
      try {
        return new Date(value).toLocaleString()
      } catch {
        return value
      }
    }
    return value
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return ""
    if (value.every((v) => typeof v === "string")) return value.join(", ")
    return ""
  }
  return ""
}

function formatLabel(key: string): string {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key]
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

// Render structured detail data (from API response)
function renderDetailContent(data: unknown): ReactNode {
  if (!data) return null

  if (typeof data === "string") {
    return <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{data}</p>
  }

  if (Array.isArray(data)) {
    if (data.length === 0) return null
    return (
      <div className="space-y-2">
        {data.map((item, i) => (
          <div key={i} className="text-sm text-gray-600">
            {typeof item === "string" ? (
              <p>{item}</p>
            ) : typeof item === "object" && item !== null ? (
              <div className="bg-slate-50 rounded-md p-3 space-y-1">
                {Object.entries(item).map(([k, v]) => {
                  const val = formatFieldValue(v)
                  if (!val) return null
                  return (
                    <div key={k} className="flex gap-2">
                      <span className="text-gray-500 font-medium min-w-[120px]">{formatLabel(k)}:</span>
                      <span>{val}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p>{String(item)}</p>
            )}
          </div>
        ))}
      </div>
    )
  }

  if (typeof data === "object" && data !== null) {
    const entries = Object.entries(data as Record<string, unknown>).filter(
      ([, v]) => v != null && v !== "" && !(Array.isArray(v) && v.length === 0)
    )
    if (entries.length === 0) return null

    return (
      <div className="space-y-1">
        {entries.map(([key, value]) => {
          if (typeof value === "object" && value !== null) {
            return (
              <div key={key} className="space-y-1">
                <span className="text-gray-500 font-medium text-xs uppercase tracking-wide">{formatLabel(key)}</span>
                <div className="pl-3 border-l-2 border-slate-200">
                  {renderDetailContent(value)}
                </div>
              </div>
            )
          }
          const val = formatFieldValue(value)
          if (!val) return null
          return (
            <div key={key} className="flex gap-2 text-sm">
              <span className="text-gray-500 font-medium min-w-[120px]">{formatLabel(key)}:</span>
              <span className="text-gray-700">{val}</span>
            </div>
          )
        })}
      </div>
    )
  }

  return <p className="text-sm text-gray-600">{String(data)}</p>
}

export function FindingDetailDialog({
  finding,
  getPriorityColor,
  getPriorityLabel,
  trigger,
}: FindingDetailDialogProps) {
  const [open, setOpen] = useState(false)
  const [details, setDetails] = useState<FindingDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOpen = async (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen && !details) {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(
          `/api/blumira/organizations/${finding.org_id}/findings/${finding.finding_id}/details`
        )
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error || "Failed to fetch details")
        }
        const data = await res.json()
        setDetails(data)
      } catch (err) {
        console.error("Error fetching finding details:", err)
        setDetails({})
        setError(
          err instanceof Error ? err.message : "Failed to load additional details"
        )
      } finally {
        setLoading(false)
      }
    }
  }

  const priorityVariant = (priority: number) => {
    if (priority === 1) return "destructive"
    if (priority === 2) return "default"
    return "secondary"
  }

  // Collect displayable metadata from the finding (skip already-shown and internal fields)
  const metadata = Object.entries(finding)
    .filter(([key, value]) => {
      if (SKIP_FIELDS.has(key)) return false
      if (value == null || value === "") return false
      // Skip arrays and objects (too complex for simple metadata)
      if (typeof value === "object") return false
      return true
    })
    .map(([key, value]) => ({ key, label: formatLabel(key), value: formatFieldValue(value) }))
    .filter((m) => m.value !== "")

  // Extract API detail content
  const detailData = details?.data && typeof details.data === "object" && !details.data?.message
    ? details.data
    : null
  const detailContent = details?.details || null

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Details
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant={priorityVariant(finding.priority)}>
              {getPriorityLabel(finding.priority)}
            </Badge>
            <Badge variant="outline">{finding.status_name}</Badge>
            {finding.type_name && (
              <Badge variant="secondary">{finding.type_name}</Badge>
            )}
          </div>
          <DialogTitle className="text-lg leading-tight">
            {finding.name}
          </DialogTitle>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
            <span>{finding.org_name}</span>
            <span>
              Created{" "}
              {formatDistanceToNow(new Date(finding.created), {
                addSuffix: true,
              })}
            </span>
            {finding.modified !== finding.created && (
              <span>
                Updated{" "}
                {formatDistanceToNow(new Date(finding.modified), {
                  addSuffix: true,
                })}
              </span>
            )}
            {finding.category_name && (
              <span className="font-medium">{finding.category_name}</span>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {loading && (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-20 w-full" />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {!loading && (
            <>
              {/* Description */}
              {finding.description && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700">Description</h4>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {finding.description}
                  </p>
                </div>
              )}

              {/* Analysis */}
              {finding.analysis && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700">Analysis</h4>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {finding.analysis}
                  </p>
                </div>
              )}

              {/* Source / Network Info */}
              {(finding.source_info || finding.ip_address || finding.hostname || finding.url) && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700">Source Information</h4>
                  <div className="bg-slate-50 rounded-md p-3 space-y-1 text-sm">
                    {finding.source_info && (
                      <div className="flex gap-2">
                        <span className="text-gray-500 font-medium min-w-[80px]">Source:</span>
                        <span className="text-gray-700">{finding.source_info}</span>
                      </div>
                    )}
                    {finding.ip_address && (
                      <div className="flex gap-2">
                        <span className="text-gray-500 font-medium min-w-[80px]">IP:</span>
                        <span className="text-gray-700 font-mono">{finding.ip_address}</span>
                      </div>
                    )}
                    {finding.hostname && (
                      <div className="flex gap-2">
                        <span className="text-gray-500 font-medium min-w-[80px]">Host:</span>
                        <span className="text-gray-700 font-mono">{finding.hostname}</span>
                      </div>
                    )}
                    {finding.url && (
                      <div className="flex gap-2">
                        <span className="text-gray-500 font-medium min-w-[80px]">URL:</span>
                        <span className="text-gray-700 font-mono break-all">{String(finding.url)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Details from API */}
              {detailContent && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700">Details</h4>
                  <div className="bg-slate-50 rounded-md p-3">
                    {renderDetailContent(detailContent)}
                  </div>
                </div>
              )}

              {/* Structured data from API */}
              {detailData && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700">Finding Data</h4>
                  <div className="bg-slate-50 rounded-md p-3">
                    {renderDetailContent(detailData)}
                  </div>
                </div>
              )}

              {/* Resolution */}
              {finding.resolution_name && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700">Resolution</h4>
                  <Badge variant="outline">{finding.resolution_name}</Badge>
                </div>
              )}

              {/* Clean metadata table */}
              {metadata.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700">Properties</h4>
                  <div className="bg-slate-50 rounded-md p-3 space-y-1 text-sm">
                    {metadata.map(({ key, label, value }) => (
                      <div key={key} className="flex gap-2">
                        <span className="text-gray-500 font-medium min-w-[120px]">{label}:</span>
                        <span className="text-gray-700">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Core identifiers */}
              <div className="grid grid-cols-2 gap-4 pt-3 border-t text-sm">
                <div>
                  <span className="text-gray-500">Finding ID:</span>
                  <span className="ml-2 font-mono text-xs">{finding.finding_id}</span>
                </div>
                <div>
                  <span className="text-gray-500">Organization:</span>
                  <span className="ml-2 text-xs">{finding.org_name}</span>
                </div>
              </div>

              {/* Comments */}
              <div className="border-t pt-4">
                <FindingCommentsSection
                  findingId={finding.finding_id}
                  organizationId={finding.org_id}
                />
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
