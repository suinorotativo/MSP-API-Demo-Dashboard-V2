"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  User,
  Calendar,
  Tag,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface JiraTicketSummary {
  id: string
  ticketKey: string
  summary: string
  status: string
  priority: string
  assignee: string
  reporter: string
  projectKey: string
  projectName: string
  issueType: string
  labels: string
  jiraCreated: string
  jiraUpdated: string
  resolved: string
  syncedAt: string
}

interface JiraTicketDetail extends JiraTicketSummary {
  description: string
  components: string[]
  rawData: Record<string, unknown>
}

interface JiraTicketCardProps {
  ticket: JiraTicketSummary
}

function getPriorityVariant(priority: string) {
  switch (priority.toLowerCase()) {
    case "highest":
    case "critical":
      return "destructive"
    case "high":
      return "default"
    case "medium":
      return "secondary"
    case "low":
    case "lowest":
      return "outline"
    default:
      return "secondary"
  }
}

function getStatusColor(status: string) {
  const s = status.toLowerCase()
  if (s === "done" || s === "closed" || s === "resolved")
    return "bg-green-100 text-green-800"
  if (s === "in progress" || s === "in review")
    return "bg-blue-100 text-blue-800"
  return "bg-gray-100 text-gray-800"
}

function extractTextFromADF(node: unknown): string {
  if (!node || typeof node !== "object") return ""
  const n = node as Record<string, unknown>

  if (n.type === "text" && typeof n.text === "string") return n.text
  if (Array.isArray(n.content)) {
    return n.content.map(extractTextFromADF).join("")
  }
  // Handle paragraph breaks
  if (n.type === "paragraph") {
    const inner = Array.isArray(n.content)
      ? n.content.map(extractTextFromADF).join("")
      : ""
    return inner + "\n"
  }
  if (n.type === "bulletList" || n.type === "orderedList") {
    if (Array.isArray(n.content)) {
      return n.content
        .map((item, i) => {
          const text = extractTextFromADF(item)
          const prefix = n.type === "orderedList" ? `${i + 1}. ` : "- "
          return prefix + text
        })
        .join("\n")
    }
  }
  if (n.type === "listItem" && Array.isArray(n.content)) {
    return n.content.map(extractTextFromADF).join("")
  }
  if (n.type === "codeBlock") {
    const inner = Array.isArray(n.content)
      ? n.content.map(extractTextFromADF).join("")
      : ""
    return "```\n" + inner + "\n```\n"
  }
  if (n.type === "heading") {
    const inner = Array.isArray(n.content)
      ? n.content.map(extractTextFromADF).join("")
      : ""
    return "\n" + inner + "\n"
  }
  return ""
}

function parseDescription(description: string): string {
  if (!description) return ""
  try {
    const parsed = JSON.parse(description)
    if (parsed && typeof parsed === "object" && parsed.type === "doc") {
      return extractTextFromADF(parsed).trim()
    }
    return description
  } catch {
    return description
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return ""
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
  } catch {
    return dateStr
  }
}

export function JiraTicketCard({ ticket }: JiraTicketCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [detail, setDetail] = useState<JiraTicketDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const labels: string[] = (() => {
    try {
      return JSON.parse(ticket.labels)
    } catch {
      return []
    }
  })()

  const handleToggle = async () => {
    if (detail) {
      setExpanded(!expanded)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/jira/tickets/${ticket.id}`)
      if (!res.ok) throw new Error("Failed to fetch details")
      const data = await res.json()
      setDetail(data.ticket)
      setExpanded(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load details")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Badge variant={getPriorityVariant(ticket.priority)}>
                {ticket.priority}
              </Badge>
              <Badge className={getStatusColor(ticket.status)}>
                {ticket.status}
              </Badge>
              {ticket.issueType && (
                <Badge variant="outline">{ticket.issueType}</Badge>
              )}
              <span className="text-xs text-slate-500">
                {ticket.projectKey}
              </span>
            </div>
            <h3 className="font-semibold text-sm">
              <span className="text-slate-500 mr-1">{ticket.ticketKey}</span>
              {ticket.summary}
            </h3>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
              {ticket.assignee && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {ticket.assignee}
                </span>
              )}
              {ticket.jiraUpdated && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(ticket.jiraUpdated)}
                </span>
              )}
              {labels.length > 0 && (
                <span className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  {labels.slice(0, 3).join(", ")}
                  {labels.length > 3 && ` +${labels.length - 3}`}
                </span>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggle}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {expanded && detail && (
        <CardContent className="pt-0 border-t">
          <div className="space-y-4 pt-4">
            {/* Description */}
            {detail.description && (
              <div>
                <h4 className="text-sm font-medium mb-1">Description</h4>
                <div className="text-sm text-slate-600 whitespace-pre-wrap bg-slate-50 rounded-md p-3 max-h-64 overflow-y-auto">
                  {parseDescription(detail.description)}
                </div>
              </div>
            )}

            {/* Metadata grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-500">Reporter:</span>{" "}
                <span className="font-medium">
                  {detail.reporter || "Unassigned"}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Assignee:</span>{" "}
                <span className="font-medium">
                  {detail.assignee || "Unassigned"}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Project:</span>{" "}
                <span className="font-medium">{detail.projectName}</span>
              </div>
              <div>
                <span className="text-slate-500">Type:</span>{" "}
                <span className="font-medium">{detail.issueType}</span>
              </div>
              {detail.jiraCreated && (
                <div>
                  <span className="text-slate-500">Created:</span>{" "}
                  <span className="font-medium">
                    {formatDate(detail.jiraCreated)}
                  </span>
                </div>
              )}
              {detail.resolved && (
                <div>
                  <span className="text-slate-500">Resolved:</span>{" "}
                  <span className="font-medium">
                    {formatDate(detail.resolved)}
                  </span>
                </div>
              )}
            </div>

            {/* Labels */}
            {Array.isArray(detail.labels) && detail.labels.length > 0 && (
              <div>
                <span className="text-sm text-slate-500">Labels:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(detail.labels as string[]).map((label) => (
                    <Badge key={label} variant="outline" className="text-xs">
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Components */}
            {Array.isArray(detail.components) &&
              detail.components.length > 0 && (
                <div>
                  <span className="text-sm text-slate-500">Components:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(detail.components as string[]).map((comp) => (
                      <Badge
                        key={comp}
                        variant="secondary"
                        className="text-xs"
                      >
                        {comp}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </CardContent>
      )}

      {error && (
        <CardContent className="pt-0">
          <p className="text-sm text-red-500">{error}</p>
        </CardContent>
      )}
    </Card>
  )
}
