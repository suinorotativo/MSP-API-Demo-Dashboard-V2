"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, X, Filter } from "lucide-react"
import type { AgentDevice } from "../organization-tabs/types"
import { getUniquePlatforms, getUniqueKeys } from "../organization-utils/filters"

interface DeviceFiltersProps {
  devices: AgentDevice[]
  searchTerm: string
  platformFilter: string
  statusFilter: string
  keyFilter: string
  onSearchChange: (value: string) => void
  onPlatformChange: (value: string) => void
  onStatusChange: (value: string) => void
  onKeyChange: (value: string) => void
  onClearFilters: () => void
  filteredCount: number
  totalCount: number
}

export function DeviceFilters({
  devices,
  searchTerm,
  platformFilter,
  statusFilter,
  keyFilter,
  onSearchChange,
  onPlatformChange,
  onStatusChange,
  onKeyChange,
  onClearFilters,
  filteredCount,
  totalCount,
}: DeviceFiltersProps) {
  const uniquePlatforms = getUniquePlatforms(devices)
  const uniqueKeys = getUniqueKeys(devices)

  const hasActiveFilters = searchTerm || platformFilter !== "all" || statusFilter !== "all" || keyFilter !== "all"

  return (
    <div className="p-4 bg-gray-50 border rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-600" />
          <h4 className="font-medium text-sm">Filter Devices</h4>
          {hasActiveFilters && <Badge variant="secondary">{filteredCount} of {totalCount}</Badge>}
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Search */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Hostname or ID..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Platform Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Platform</label>
          <Select value={platformFilter} onValueChange={onPlatformChange}>
            <SelectTrigger>
              <SelectValue placeholder="All platforms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              {uniquePlatforms.map((platform) => (
                <SelectItem key={platform} value={platform}>
                  {platform}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Status</label>
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="sleeping">Sleeping</SelectItem>
              <SelectItem value="isolated">Isolated</SelectItem>
              <SelectItem value="excluded">Excluded</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Key Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Agent Key</label>
          <Select value={keyFilter} onValueChange={onKeyChange}>
            <SelectTrigger>
              <SelectValue placeholder="All keys" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Keys</SelectItem>
              {uniqueKeys.map((key) => (
                <SelectItem key={key.id} value={key.id}>
                  {key.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Filter Summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {searchTerm && (
            <Badge variant="secondary" className="gap-1">
              Search: "{searchTerm}"
              <button onClick={() => onSearchChange("")} className="ml-1 hover:text-red-600">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {platformFilter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Platform: {platformFilter}
              <button onClick={() => onPlatformChange("all")} className="ml-1 hover:text-red-600">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {statusFilter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Status: {statusFilter}
              <button onClick={() => onStatusChange("all")} className="ml-1 hover:text-red-600">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {keyFilter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Key: {uniqueKeys.find((k) => k.id === keyFilter)?.name || keyFilter}
              <button onClick={() => onKeyChange("all")} className="ml-1 hover:text-red-600">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
