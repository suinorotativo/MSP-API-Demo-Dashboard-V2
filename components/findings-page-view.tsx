"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  Search,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Shield,
  Clock,
  Activity,
} from "lucide-react"
import { FindingDetailDialog } from "@/components/finding-detail-dialog"
import { UserHeader } from "@/components/user-header"
import { getDashboardData, invalidateDashboardCache } from "@/lib/dashboard-cache"
import { formatDistanceToNow } from "date-fns"

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
  resolution_name?: string
  [key: string]: unknown
}

const CATEGORY_CONFIG: Record<string, {
  title: string
  description: string
  icon: typeof Shield
  color: string
  bgColor: string
  filter: (findings: Finding[]) => Finding[]
}> = {
  all: {
    title: "All Findings",
    description: "Complete list of all security findings",
    icon: Shield,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    filter: (f) => f,
  },
  critical: {
    title: "Critical Findings",
    description: "High priority findings requiring immediate attention",
    icon: AlertTriangle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    filter: (f) => f.filter((x) => x.priority === 1),
  },
  open: {
    title: "Open Findings",
    description: "Currently unresolved findings",
    icon: Activity,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    filter: (f) => f.filter((x) => x.status_name === "Open"),
  },
  recent: {
    title: "Recent Findings",
    description: "Findings from the last 7 days",
    icon: Clock,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    filter: (f) => {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return f
        .filter((x) => new Date(x.created) >= weekAgo)
        .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
    },
  },
}

const getPriorityColor = (priority: number) => {
  switch (priority) {
    case 1: return "destructive"
    case 2: return "orange"
    case 3: return "yellow"
    case 4: return "green"
    case 5: return "secondary"
    default: return "secondary"
  }
}

const getPriorityLabel = (priority: number) => {
  switch (priority) {
    case 1: return "Critical"
    case 2: return "High"
    case 3: return "Medium"
    case 4: return "Low"
    case 5: return "Info"
    default: return `Priority ${priority}`
  }
}

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case "open":
      return <AlertCircle className="h-4 w-4 text-red-500" />
    case "closed":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />
    case "dismissed":
      return <XCircle className="h-4 w-4 text-gray-500" />
    default:
      return <AlertCircle className="h-4 w-4 text-gray-500" />
  }
}

export function FindingsPageView({ category }: { category: string }) {
  const router = useRouter()
  const [findings, setFindings] = useState<Finding[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPriority, setSelectedPriority] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedOrg, setSelectedOrg] = useState("all")

  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.all
  const Icon = config.icon

  const fetchData = async (forceRefresh = false) => {
    try {
      setError(null)
      if (forceRefresh) invalidateDashboardCache()
      const result = await getDashboardData(forceRefresh)
      setFindings(result.findings || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData(true)
  }

  // Apply category filter, then user filters
  const filteredFindings = useMemo(() => {
    const categoryFiltered = config.filter(findings)

    return categoryFiltered.filter((finding) => {
      const matchesSearch =
        !searchTerm ||
        finding.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        finding.org_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        finding.type_name.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesPriority = selectedPriority === "all" || finding.priority.toString() === selectedPriority
      const matchesStatus = selectedStatus === "all" || finding.status_name === selectedStatus
      const matchesOrg = selectedOrg === "all" || finding.org_name === selectedOrg

      return matchesSearch && matchesPriority && matchesStatus && matchesOrg
    })
  }, [findings, config, searchTerm, selectedPriority, selectedStatus, selectedOrg])

  const organizations = useMemo(
    () => [...new Set(findings.map((f) => f.org_name))].sort(),
    [findings]
  )
  const statuses = useMemo(
    () => [...new Set(findings.map((f) => f.status_name))].sort(),
    [findings]
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-64 mb-4" />
          <Skeleton className="h-6 w-96 mb-8" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/")}
              className="mb-4 -ml-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2.5 rounded-lg ${config.bgColor}`}>
                <Icon className={`h-6 w-6 ${config.color}`} />
              </div>
              <h1 className="text-3xl font-bold text-slate-900">{config.title}</h1>
              <Badge variant="secondary" className="text-base px-3 py-1">
                {filteredFindings.length}
              </Badge>
            </div>
            <p className="text-slate-600">{config.description}</p>
          </div>
          <UserHeader />
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search findings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedOrg} onValueChange={setSelectedOrg}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Organization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Organizations</SelectItem>
                {organizations.map((org) => (
                  <SelectItem key={org} value={org}>{org}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Only show priority filter if not already filtered by category */}
            {category !== "critical" && (
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  {[1, 2, 3, 4, 5].map((p) => (
                    <SelectItem key={p} value={p.toString()}>{getPriorityLabel(p)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Only show status filter if not already filtered by category */}
            {category !== "open" && (
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {statuses.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Findings List */}
        {filteredFindings.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${config.bgColor}`}>
                  <Icon className={`h-8 w-8 ${config.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Findings</h3>
                <p className="text-gray-500">
                  {searchTerm || selectedPriority !== "all" || selectedStatus !== "all" || selectedOrg !== "all"
                    ? "No findings match the current filters."
                    : `No ${category === "all" ? "" : category + " "}findings found.`}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredFindings.map((finding) => (
              <Card key={finding.finding_id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(finding.status_name)}
                        <h4 className="font-semibold text-gray-900 truncate">{finding.name}</h4>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mb-3">
                        <span className="font-medium">{finding.org_name}</span>
                        <span className="text-gray-300">|</span>
                        <span>{finding.type_name}</span>
                        <span className="text-gray-300">|</span>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDistanceToNow(new Date(finding.created), { addSuffix: true })}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant={getPriorityColor(finding.priority) as any}>
                          {getPriorityLabel(finding.priority)}
                        </Badge>
                        <Badge variant="outline">{finding.status_name}</Badge>
                        {finding.resolution_name && (
                          <Badge variant="secondary">{finding.resolution_name}</Badge>
                        )}
                      </div>
                    </div>

                    <FindingDetailDialog
                      finding={finding}
                      getPriorityColor={getPriorityColor}
                      getPriorityLabel={getPriorityLabel}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
