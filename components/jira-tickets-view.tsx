"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Search,
  RefreshCw,
  Loader2,
  Ticket,
  AlertTriangle,
  CheckCircle2,
  Settings,
  Download,
} from "lucide-react"
import { JiraTicketCard } from "@/components/jira-ticket-card"
import { JiraCredentialsSetup } from "@/components/jira-credentials-setup"

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

export function JiraTicketsView() {
  const [tickets, setTickets] = useState<JiraTicketSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [configured, setConfigured] = useState<boolean | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [userRole, setUserRole] = useState<string>("user")

  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")

  useEffect(() => {
    checkConfigAndFetch()
    fetchUserRole()
  }, [])

  const fetchUserRole = async () => {
    try {
      const res = await fetch("/api/auth/me")
      if (res.ok) {
        const data = await res.json()
        setUserRole(data.user.role)
      }
    } catch {
      // Non-critical
    }
  }

  const checkConfigAndFetch = async () => {
    try {
      setError(null)
      const configRes = await fetch("/api/jira/credentials")
      if (!configRes.ok) throw new Error("Failed to check configuration")
      const configData = await configRes.json()
      setConfigured(configData.configured)

      if (configData.configured) {
        await fetchTickets()
      } else {
        setLoading(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load")
      setLoading(false)
    }
  }

  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/jira/tickets")
      if (!res.ok) throw new Error("Failed to fetch tickets")
      const data = await res.json()
      setTickets(data.tickets)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tickets")
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    setError(null)
    setSuccess(null)
    setSyncing(true)
    try {
      const res = await fetch("/api/jira/sync", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Sync failed")
      setSuccess(`Synced ${data.synced} ticket${data.synced !== 1 ? "s" : ""} from Jira`)
      await fetchTickets()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed")
    } finally {
      setSyncing(false)
    }
  }

  const handleRefresh = async () => {
    setLoading(true)
    setError(null)
    await fetchTickets()
  }

  const handleCredentialsUpdated = () => {
    setLoading(true)
    checkConfigAndFetch()
  }

  // Derived filter values
  const statuses = useMemo(
    () => [...new Set(tickets.map((t) => t.status))].sort(),
    [tickets]
  )
  const priorities = useMemo(
    () => [...new Set(tickets.map((t) => t.priority))].sort(),
    [tickets]
  )

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchesSearch =
        searchTerm === "" ||
        t.ticketKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.assignee.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.projectKey.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus =
        statusFilter === "all" || t.status === statusFilter
      const matchesPriority =
        priorityFilter === "all" || t.priority === priorityFilter
      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [tickets, searchTerm, statusFilter, priorityFilter])

  // Last sync time
  const lastSync = useMemo(() => {
    if (tickets.length === 0) return null
    const dates = tickets.map((t) => new Date(t.syncedAt).getTime())
    return new Date(Math.max(...dates))
  }, [tickets])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    )
  }

  // Not configured - show setup
  if (configured === false) {
    return (
      <div className="space-y-6">
        <Alert>
          <Ticket className="h-4 w-4" />
          <AlertDescription>
            Jira is not configured. {userRole === "admin" || userRole === "msp"
              ? "Set up your Jira connection below to sync tickets."
              : "Ask an admin to configure the Jira integration."}
          </AlertDescription>
        </Alert>
        {(userRole === "admin" || userRole === "msp") && (
          <JiraCredentialsSetup
            onCredentialsUpdated={handleCredentialsUpdated}
          />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Status messages */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Header / Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                Jira Tickets
              </CardTitle>
              <CardDescription>
                {tickets.length} ticket{tickets.length !== 1 ? "s" : ""} synced
                {lastSync && (
                  <>
                    {" "}
                    &middot; Last sync:{" "}
                    {lastSync.toLocaleString()}
                  </>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {(userRole === "admin" || userRole === "msp") && (
                <>
                  <JiraCredentialsSetup
                    onCredentialsUpdated={handleCredentialsUpdated}
                    showAsDialog
                    trigger={
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSync}
                    disabled={syncing}
                  >
                    {syncing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Sync
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                {priorities.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(searchTerm || statusFilter !== "all" || priorityFilter !== "all") && (
            <p className="text-xs text-slate-500 mt-2">
              Showing {filteredTickets.length} of {tickets.length} tickets
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tickets list */}
      {filteredTickets.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          {tickets.length === 0 ? (
            <div className="space-y-2">
              <Ticket className="h-12 w-12 mx-auto text-slate-300" />
              <p>No tickets synced yet.</p>
              {(userRole === "admin" || userRole === "msp") && (
                <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
                  {syncing ? "Syncing..." : "Sync Now"}
                </Button>
              )}
            </div>
          ) : (
            <p>No tickets match your filters.</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => (
            <JiraTicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}
    </div>
  )
}
