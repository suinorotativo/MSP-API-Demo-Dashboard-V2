"use client"

import type { Organization, GlobalBenchmark } from "./types"
import { SecurityGradeBadge } from "../organization-widgets/security-grade-badge"
import { AgentCoverageIndicator } from "../organization-widgets/agent-coverage-indicator"
import { QuickActionsPanel } from "../organization-widgets/quick-actions-panel"
import { RecentActivityTimeline } from "../organization-widgets/recent-activity-timeline"

interface OverviewTabProps {
  organization: Organization
  globalBenchmark?: GlobalBenchmark
  onRefresh?: () => void
  onSwitchTab?: (tab: string) => void
}

export function OverviewTab({ organization, globalBenchmark, onRefresh, onSwitchTab }: OverviewTabProps) {
  const findings = organization.findings || []
  const devices = organization.agentDevices || []
  const criticalFindings = findings.filter((f) => f.priority === 1).length

  return (
    <div className="space-y-6">
      {/* Top Row: Security Grade and Coverage */}
      <div className="grid gap-6 md:grid-cols-2">
        <SecurityGradeBadge findings={findings} devices={devices} globalBenchmark={globalBenchmark} showDetails={true} onSwitchTab={onSwitchTab} />
        <AgentCoverageIndicator
          used={organization.agent_count_used}
          available={organization.agent_count_available}
          organizationName={organization.name}
        />
      </div>

      {/* Middle Row: Quick Actions and Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <QuickActionsPanel
          organizationId={organization.id}
          organizationName={organization.name}
          accountId={organization.account_id}
          criticalFindings={criticalFindings}
          totalFindings={findings.length}
          totalDevices={devices.length}
          onRefresh={onRefresh}
          onSwitchTab={onSwitchTab}
        />
        <RecentActivityTimeline findings={findings} devices={devices} limit={10} />
      </div>
    </div>
  )
}
