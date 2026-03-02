"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"
import type { Finding } from "../organization-tabs/types"

interface RiskHeatmapProps {
  findings: Finding[]
}

interface CategoryRisk {
  category: string
  p1: number
  p2: number
  p3: number
  total: number
  riskScore: number
}

export function RiskHeatmap({ findings }: RiskHeatmapProps) {
  // Aggregate findings by category and priority
  const categoryMap = new Map<string, CategoryRisk>()

  findings.forEach((finding) => {
    const category = finding.category_name || "Uncategorized"
    if (!categoryMap.has(category)) {
      categoryMap.set(category, { category, p1: 0, p2: 0, p3: 0, total: 0, riskScore: 0 })
    }

    const cat = categoryMap.get(category)!
    cat.total++

    if (finding.priority === 1) cat.p1++
    else if (finding.priority === 2) cat.p2++
    else if (finding.priority === 3) cat.p3++

    // Calculate risk score: P1=10, P2=5, P3=2
    cat.riskScore = cat.p1 * 10 + cat.p2 * 5 + cat.p3 * 2
  })

  // Convert to array and sort by risk score
  const categoryRisks = Array.from(categoryMap.values()).sort((a, b) => b.riskScore - a.riskScore)

  const getRiskColor = (score: number): string => {
    if (score >= 50) return "bg-red-500"
    if (score >= 30) return "bg-orange-500"
    if (score >= 15) return "bg-yellow-500"
    if (score >= 5) return "bg-blue-500"
    return "bg-gray-300"
  }

  const getRiskLabel = (score: number): string => {
    if (score >= 50) return "Critical Risk"
    if (score >= 30) return "High Risk"
    if (score >= 15) return "Medium Risk"
    if (score >= 5) return "Low Risk"
    return "Minimal Risk"
  }

  if (categoryRisks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Category Risk Heatmap
          </CardTitle>
          <CardDescription>Risk assessment by finding category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-gray-500">No findings data available</div>
        </CardContent>
      </Card>
    )
  }

  // Get max risk score for relative sizing
  const maxRiskScore = Math.max(...categoryRisks.map((c) => c.riskScore))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Category Risk Heatmap
        </CardTitle>
        <CardDescription>Risk assessment by finding category (weighted by priority)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {categoryRisks.slice(0, 10).map((cat) => {
            const widthPercentage = maxRiskScore > 0 ? (cat.riskScore / maxRiskScore) * 100 : 0
            return (
              <div key={cat.category} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium truncate max-w-[200px]" title={cat.category}>
                    {cat.category}
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-600">
                      {cat.total} findings ({cat.p1} P1, {cat.p2} P2, {cat.p3} P3)
                    </span>
                    <span className="font-semibold">{getRiskLabel(cat.riskScore)}</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                  <div
                    className={`h-full flex items-center justify-end pr-2 text-white text-xs font-semibold transition-all duration-300 ${getRiskColor(
                      cat.riskScore,
                    )}`}
                    style={{ width: `${Math.max(widthPercentage, 5)}%` }}
                  >
                    {cat.riskScore}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 p-4 bg-gray-50 border rounded-lg">
          <div className="text-sm font-semibold mb-2">Risk Score Formula:</div>
          <div className="text-xs text-gray-600 space-y-1">
            <div>• Score = (P1 Count × 10) + (P2 Count × 5) + (P3 Count × 2)</div>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Critical (≥50)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-orange-500 rounded"></div>
                <span>High (≥30)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span>Medium (≥15)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>Low (≥5)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gray-300 rounded"></div>
                <span>Minimal (&lt;5)</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
