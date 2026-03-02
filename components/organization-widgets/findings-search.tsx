"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Search, X } from "lucide-react"
import type { Finding } from "../organization-tabs/types"

interface FindingsSearchProps {
  findings: Finding[]
  onResultsChange?: (results: Finding[]) => void
}

export function FindingsSearch({ findings, onResultsChange }: FindingsSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  // Perform search across multiple fields
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      onResultsChange?.(findings)
      return findings
    }

    setIsSearching(true)
    const query = searchQuery.toLowerCase()

    const results = findings.filter((finding) => {
      // Search in multiple fields
      const matchName = finding.name?.toLowerCase().includes(query)
      const matchType = finding.type_name?.toLowerCase().includes(query)
      const matchCategory = finding.category_name?.toLowerCase().includes(query)
      const matchStatus = finding.status_name?.toLowerCase().includes(query)
      const matchId = finding.finding_id?.toLowerCase().includes(query)

      return matchName || matchType || matchCategory || matchStatus || matchId
    })

    setIsSearching(false)
    onResultsChange?.(results)
    return results
  }, [searchQuery, findings, onResultsChange])

  const handleClear = () => {
    setSearchQuery("")
    onResultsChange?.(findings)
  }

  const highlightMatch = (text: string, query: string): React.ReactNode => {
    if (!query.trim()) return text

    const parts = text.split(new RegExp(`(${query})`, "gi"))
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 font-semibold">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search findings by name, type, category, status, or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Search Results Summary */}
      {searchQuery && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
            </Badge>
            <span className="text-gray-600">
              for <span className="font-semibold">&quot;{searchQuery}&quot;</span>
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClear}>
            Clear Search
          </Button>
        </div>
      )}

      {/* Search Results Preview (optional compact view) */}
      {searchQuery && searchResults.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="text-sm font-semibold text-blue-900 mb-2">
              Top Matches:
            </div>
            <div className="space-y-2">
              {searchResults.slice(0, 3).map((finding) => (
                <div key={finding.finding_id} className="p-2 bg-white border rounded text-sm">
                  <div className="font-medium">
                    {highlightMatch(finding.name, searchQuery)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {finding.type_name && (
                      <span className="mr-2">
                        Type: {highlightMatch(finding.type_name, searchQuery)}
                      </span>
                    )}
                    {finding.category_name && (
                      <span>
                        Category: {highlightMatch(finding.category_name, searchQuery)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {searchResults.length > 3 && (
                <div className="text-xs text-gray-600 text-center pt-2">
                  ... and {searchResults.length - 3} more matches
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {searchQuery && searchResults.length === 0 && (
        <Card className="border-gray-200">
          <CardContent className="p-8 text-center text-gray-500">
            <Search className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p>No findings match &quot;{searchQuery}&quot;</p>
            <p className="text-sm mt-1">Try different keywords or check your spelling</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
