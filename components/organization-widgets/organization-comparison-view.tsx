"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { X, GitCompare, TrendingUp, TrendingDown } from "lucide-react"
import type { Organization } from "../organization-tabs/types"
import { calculateSecurityScore, calculateSecurityGrade } from "../organization-utils/calculations"

interface OrganizationComparisonViewProps {
  organizations: Organization[]
}

export function OrganizationComparisonView({ organizations }: OrganizationComparisonViewProps) {
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([])
  const [isComparing, setIsComparing] = useState(false)

  const toggleOrganization = (orgId: string) => {
    setSelectedOrgs((prev) => {
      if (prev.includes(orgId)) {
        return prev.filter((id) => id !== orgId)
      } else {
        if (prev.length >= 5) {
          alert("Maximum 5 organizations can be compared at once")
          return prev
        }
        return [...prev, orgId]
      }
    })
  }

  const selectedOrganizations = organizations.filter((org) => selectedOrgs.includes(org.id))

  const startComparison = () => {
    if (selectedOrgs.length < 2) {
      alert("Please select at least 2 organizations to compare")
      return
    }
    setIsComparing(true)
  }

  const closeComparison = () => {
    setIsComparing(false)
    setSelectedOrgs([])
  }

  if (isComparing) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GitCompare className="h-5 w-5" />
                Organization Comparison
              </CardTitle>
              <CardDescription>Comparing {selectedOrganizations.length} organizations side-by-side</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={closeComparison}>
              <X className="h-4 w-4 mr-2" />
              Close Comparison
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 text-left font-semibold border">Metric</th>
                  {selectedOrganizations.map((org) => (
                    <th key={org.id} className="p-3 text-left font-semibold border min-w-[150px]">
                      <div className="truncate" title={org.name}>
                        {org.name}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Security Score */}
                <tr className="hover:bg-gray-50">
                  <td className="p-3 border font-medium">Security Score</td>
                  {selectedOrganizations.map((org) => {
                    const score = calculateSecurityScore(org.findings || [], org.agentDevices || [])
                    const grade = calculateSecurityGrade(score)
                    return (
                      <td key={org.id} className="p-3 border">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold">{grade}</span>
                          <span className="text-gray-600">({score}/100)</span>
                        </div>
                      </td>
                    )
                  })}
                </tr>

                {/* License */}
                <tr className="hover:bg-gray-50">
                  <td className="p-3 border font-medium">License</td>
                  {selectedOrganizations.map((org) => (
                    <td key={org.id} className="p-3 border">
                      <Badge variant="outline">{org.license}</Badge>
                    </td>
                  ))}
                </tr>

                {/* Total Findings */}
                <tr className="hover:bg-gray-50">
                  <td className="p-3 border font-medium">Total Findings</td>
                  {selectedOrganizations.map((org) => (
                    <td key={org.id} className="p-3 border">
                      <span className="text-lg font-semibold">{org.findingsCount}</span>
                    </td>
                  ))}
                </tr>

                {/* Critical Findings */}
                <tr className="hover:bg-gray-50">
                  <td className="p-3 border font-medium">Critical (P1)</td>
                  {selectedOrganizations.map((org) => (
                    <td key={org.id} className="p-3 border">
                      <span className="text-lg font-semibold text-red-600">{org.criticalFindingsCount}</span>
                    </td>
                  ))}
                </tr>

                {/* Open Findings */}
                <tr className="hover:bg-gray-50">
                  <td className="p-3 border font-medium">Open Findings</td>
                  {selectedOrganizations.map((org) => (
                    <td key={org.id} className="p-3 border">
                      <span className="text-lg font-semibold text-orange-600">{org.openFindingsCount}</span>
                    </td>
                  ))}
                </tr>

                {/* Total Devices */}
                <tr className="hover:bg-gray-50">
                  <td className="p-3 border font-medium">Total Devices</td>
                  {selectedOrganizations.map((org) => (
                    <td key={org.id} className="p-3 border">
                      <span className="text-lg font-semibold">{org.agentDeviceCount}</span>
                    </td>
                  ))}
                </tr>

                {/* Online Devices */}
                <tr className="hover:bg-gray-50">
                  <td className="p-3 border font-medium">Online Devices</td>
                  {selectedOrganizations.map((org) => (
                    <td key={org.id} className="p-3 border">
                      <span className="text-lg font-semibold text-green-600">{org.onlineDevices}</span>
                    </td>
                  ))}
                </tr>

                {/* Agent Coverage */}
                <tr className="hover:bg-gray-50">
                  <td className="p-3 border font-medium">Agent Coverage</td>
                  {selectedOrganizations.map((org) => {
                    const coverage = org.agent_count_available > 0
                      ? Math.round((org.agent_count_used / org.agent_count_available) * 100)
                      : 0
                    return (
                      <td key={org.id} className="p-3 border">
                        <div>
                          <span className="text-lg font-semibold">{coverage}%</span>
                          <div className="text-xs text-gray-600">
                            {org.agent_count_used}/{org.agent_count_available}
                          </div>
                        </div>
                      </td>
                    )
                  })}
                </tr>

                {/* Users */}
                <tr className="hover:bg-gray-50">
                  <td className="p-3 border font-medium">Users</td>
                  {selectedOrganizations.map((org) => (
                    <td key={org.id} className="p-3 border">
                      <span className="text-lg font-semibold">{org.user_count}</span>
                    </td>
                  ))}
                </tr>

                {/* Agent Keys */}
                <tr className="hover:bg-gray-50">
                  <td className="p-3 border font-medium">Agent Keys</td>
                  {selectedOrganizations.map((org) => (
                    <td key={org.id} className="p-3 border">
                      <span className="text-lg font-semibold">{org.agentKeyCount}</span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Comparison Insights */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Comparison Insights</h4>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Best Security:</strong>{" "}
                  {selectedOrganizations.reduce((best, org) => {
                    const score = calculateSecurityScore(org.findings || [], org.agentDevices || [])
                    const bestScore = calculateSecurityScore(best.findings || [], best.agentDevices || [])
                    return score > bestScore ? org : best
                  }).name}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <TrendingDown className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Most Critical Findings:</strong>{" "}
                  {selectedOrganizations.reduce((most, org) =>
                    org.criticalFindingsCount > most.criticalFindingsCount ? org : most
                  ).name}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitCompare className="h-5 w-5" />
          Compare Organizations
        </CardTitle>
        <CardDescription>Select 2-5 organizations to compare side-by-side</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 mb-4">
          {organizations.map((org) => (
            <div
              key={org.id}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedOrgs.includes(org.id) ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
              }`}
              onClick={() => toggleOrganization(org.id)}
            >
              <div className="flex items-center gap-3">
                <Checkbox checked={selectedOrgs.includes(org.id)} onCheckedChange={() => toggleOrganization(org.id)} />
                <div className="flex-1">
                  <div className="font-semibold">{org.name}</div>
                  <div className="text-sm text-gray-600">
                    {org.findingsCount} findings • {org.agentDeviceCount} devices • {org.license}
                  </div>
                </div>
                {selectedOrgs.includes(org.id) && (
                  <Badge variant="default">Selected</Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-600">
            {selectedOrgs.length} of 5 organizations selected
          </div>
          <Button onClick={startComparison} disabled={selectedOrgs.length < 2}>
            <GitCompare className="h-4 w-4 mr-2" />
            Compare Selected ({selectedOrgs.length})
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
