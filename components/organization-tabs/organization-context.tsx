"use client"

import React, { createContext, useContext, useState, useCallback } from "react"
import type { Organization, FilterState } from "./types"
import { downloadFindingsCSV, downloadDevicesCSV } from "../organization-utils/export"

interface OrganizationContextType {
  organization: Organization
  filters: FilterState
  setFilters: (filters: FilterState) => void
  updateFilter: (key: keyof FilterState, value: string) => void
  clearFilters: () => void
  exportFindings: (format: "csv") => void
  exportDevices: (format: "csv") => void
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (!context) {
    throw new Error("useOrganization must be used within OrganizationProvider")
  }
  return context
}

interface OrganizationProviderProps {
  organization: Organization
  children: React.ReactNode
}

export function OrganizationProvider({ organization, children }: OrganizationProviderProps) {
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: "",
    platform: undefined,
    status: undefined,
    priority: undefined,
    key: undefined,
  })

  const updateFilter = useCallback((key: keyof FilterState, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({
      searchTerm: "",
      platform: undefined,
      status: undefined,
      priority: undefined,
      key: undefined,
    })
  }, [])

  const exportFindings = useCallback(
    (format: "csv") => {
      if (format === "csv") {
        const filename = `${organization.name.replace(/[^a-z0-9]/gi, "_")}_findings_${new Date().toISOString().split("T")[0]}.csv`
        downloadFindingsCSV(organization.findings, filename)
      }
    },
    [organization],
  )

  const exportDevices = useCallback(
    (format: "csv") => {
      if (format === "csv") {
        const filename = `${organization.name.replace(/[^a-z0-9]/gi, "_")}_devices_${new Date().toISOString().split("T")[0]}.csv`
        downloadDevicesCSV(organization.agentDevices, filename)
      }
    },
    [organization],
  )

  const value = {
    organization,
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    exportFindings,
    exportDevices,
  }

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>
}
