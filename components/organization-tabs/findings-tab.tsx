"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Download, X } from "lucide-react"
import type { Organization } from "./types"
import { CategoryBreakdownChart } from "../organization-charts/category-breakdown-chart"
import { TypeDistributionChart } from "../organization-charts/type-distribution-chart"
import { FindingsTimelineChart } from "../organization-charts/findings-timeline-chart"
import { FindingDetailCard } from "../organization-widgets/finding-detail-card"
import { filterFindings, sortFindings, getUniquePriorities, getUniqueStatuses } from "../organization-utils/filters"
import { downloadFindingsCSV } from "../organization-utils/export"

interface FindingsTabProps {
  organization: Organization
}

export function FindingsTab({ organization }: FindingsTabProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"priority" | "created" | "modified">("priority")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [showFilters, setShowFilters] = useState(false)

  const findings = organization.findings || []

  // Get unique priorities and statuses for filter dropdowns
  const uniquePriorities = getUniquePriorities(findings)
  const uniqueStatuses = getUniqueStatuses(findings)

  // Apply filters and sorting
  const filteredAndSortedFindings = useMemo(() => {
    let result = filterFindings(findings, {
      searchTerm,
      priority: priorityFilter,
      status: statusFilter,
    })

    result = sortFindings(result, sortBy, sortOrder)

    return result
  }, [findings, searchTerm, priorityFilter, statusFilter, sortBy, sortOrder])

  const clearFilters = () => {
    setSearchTerm("")
    setPriorityFilter("all")
    setStatusFilter("all")
  }

  const hasActiveFilters = searchTerm || priorityFilter !== "all" || statusFilter !== "all"

  const handleExport = () => {
    const filename = `${organization.name.replace(/[^a-z0-9]/gi, "_")}_findings_${new Date().toISOString().split("T")[0]}.csv`
    downloadFindingsCSV(filteredAndSortedFindings, filename)
  }

  const getPriorityColor = (priority: number): string => {
    switch (priority) {
      case 1:
        return "destructive"
      case 2:
        return "default"
      case 3:
        return "secondary"
      case 4:
        return "outline"
      case 5:
        return "outline"
      default:
        return "outline"
    }
  }

  const getPriorityLabel = (priority: number): string => {
    switch (priority) {
      case 1:
        return "P1 - Critical"
      case 2:
        return "P2 - High"
      case 3:
        return "P3 - Medium"
      case 4:
        return "P4 - Low"
      case 5:
        return "P5 - Info"
      default:
        return `P${priority}`
    }
  }

  return (
    <div className="space-y-6">
      {/* Visualization Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <CategoryBreakdownChart findings={findings} />
        <TypeDistributionChart findings={findings} maxItems={8} />
      </div>

      <FindingsTimelineChart findings={findings} />

      {/* Findings List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Findings List {hasActiveFilters && `(${filteredAndSortedFindings.length} of ${findings.length})`}
          </h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters && <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                !
              </Badge>}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={filteredAndSortedFindings.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="p-4 bg-gray-50 border rounded-lg space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search findings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Priority Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    {uniquePriorities.map((priority) => (
                      <SelectItem key={priority} value={priority.toString()}>
                        {getPriorityLabel(priority)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {uniqueStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Sort By</label>
                <div className="flex gap-2">
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="priority">Priority</SelectItem>
                      <SelectItem value="created">Created Date</SelectItem>
                      <SelectItem value="modified">Modified Date</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  >
                    {sortOrder === "asc" ? "↑" : "↓"}
                  </Button>
                </div>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-gray-600">
                  Showing {filteredAndSortedFindings.length} of {findings.length} findings
                </span>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Findings List */}
        <div className="space-y-3">
          {filteredAndSortedFindings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {hasActiveFilters ? "No findings match your filters" : "No findings found"}
            </div>
          ) : (
            filteredAndSortedFindings.map((finding) => (
              <FindingDetailCard
                key={finding.finding_id}
                finding={finding}
                organizationId={organization.account_id}
                getPriorityColor={getPriorityColor}
                getPriorityLabel={getPriorityLabel}
              />
            ))
          )}
        </div>

        {/* Pagination hint */}
        {filteredAndSortedFindings.length > 20 && (
          <div className="text-center text-sm text-gray-500 py-4">
            Showing all {filteredAndSortedFindings.length} findings. Consider using filters to narrow down results.
          </div>
        )}
      </div>
    </div>
  )
}
