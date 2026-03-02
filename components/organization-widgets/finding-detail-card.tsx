"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronDown, ChevronUp, AlertCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { Finding, FindingDetails } from "../organization-tabs/types"
import { FindingCommentsSection } from "./finding-comments-section"

interface FindingDetailCardProps {
  finding: Finding
  organizationId: string
  getPriorityColor: (priority: number) => string
  getPriorityLabel: (priority: number) => string
}

export function FindingDetailCard({
  finding,
  organizationId,
  getPriorityColor,
  getPriorityLabel,
}: FindingDetailCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [details, setDetails] = useState<FindingDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDetails = async () => {
    if (details) {
      setIsExpanded(!isExpanded)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/blumira/organizations/${organizationId}/findings/${finding.finding_id}/details`,
      )

      if (!response.ok) {
        throw new Error("Failed to fetch finding details")
      }

      const data = await response.json()
      setDetails(data)
      setIsExpanded(true)
    } catch (err) {
      console.error("Error fetching finding details:", err)
      setError(err instanceof Error ? err.message : "Failed to load details")
      setIsExpanded(false)
    } finally {
      setLoading(false)
    }
  }

  const priorityVariant = (priority: number) => {
    if (priority === 1) return "destructive"
    if (priority === 2) return "default"
    return "secondary"
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={priorityVariant(finding.priority)}>{getPriorityLabel(finding.priority)}</Badge>
              <Badge variant="outline">{finding.status_name}</Badge>
              {finding.type_name && (
                <Badge variant="secondary" className="truncate max-w-xs">
                  {finding.type_name}
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-lg leading-tight mb-1">{finding.name}</h3>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
              <span>Created {formatDistanceToNow(new Date(finding.created), { addSuffix: true })}</span>
              {finding.modified !== finding.created && (
                <span>Updated {formatDistanceToNow(new Date(finding.modified), { addSuffix: true })}</span>
              )}
              {finding.category_name && <span className="font-medium">{finding.category_name}</span>}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Button variant="ghost" size="sm" onClick={fetchDetails} disabled={loading}>
              {loading ? (
                <span className="animate-spin">⏳</span>
              ) : isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              <span className="ml-1">{isExpanded ? "Collapse" : "Details"}</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 space-y-4">
          {loading && (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {details && (
            <>
              {/* Analysis Section */}
              {finding.analysis && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700">Analysis</h4>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{finding.analysis}</p>
                </div>
              )}

              {/* Additional Details */}
              {details.details && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700">Additional Details</h4>
                  <div className="text-sm text-gray-600 leading-relaxed">
                    <pre className="whitespace-pre-wrap font-sans">{JSON.stringify(details.details, null, 2)}</pre>
                  </div>
                </div>
              )}

              {/* Resolution Information */}
              {finding.resolution_name && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700">Resolution</h4>
                  <Badge variant="outline">{finding.resolution_name}</Badge>
                </div>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 pt-3 border-t text-sm">
                <div>
                  <span className="text-gray-600">Finding ID:</span>
                  <span className="ml-2 font-mono text-xs">{finding.finding_id}</span>
                </div>
                <div>
                  <span className="text-gray-600">Organization ID:</span>
                  <span className="ml-2 font-mono text-xs">{finding.org_id}</span>
                </div>
              </div>

              {/* Comments Section */}
              <div className="border-t pt-4">
                <FindingCommentsSection findingId={finding.finding_id} organizationId={organizationId} />
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  )
}
