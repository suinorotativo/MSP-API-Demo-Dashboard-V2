"use client"

import { useState, useEffect, ReactNode } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Trash2,
  Plug,
  Loader2,
} from "lucide-react"

interface JiraConfigStatus {
  configured: boolean
  config: {
    instanceUrl: string
    email: string
    projectKeys: string
    createdAt: string
    updatedAt: string
  } | null
}

interface JiraCredentialsSetupProps {
  onCredentialsUpdated?: () => void
  showAsDialog?: boolean
  trigger?: ReactNode
}

export function JiraCredentialsSetup({
  onCredentialsUpdated,
  showAsDialog,
  trigger,
}: JiraCredentialsSetupProps) {
  const [status, setStatus] = useState<JiraConfigStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const [instanceUrl, setInstanceUrl] = useState("")
  const [email, setEmail] = useState("")
  const [apiToken, setApiToken] = useState("")
  const [projectKeys, setProjectKeys] = useState("")
  const [showToken, setShowToken] = useState(false)

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/jira/credentials")
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
        if (data.config) {
          setInstanceUrl(data.config.instanceUrl)
          setEmail(data.config.email)
          setProjectKeys(data.config.projectKeys)
        }
      }
    } catch {
      setError("Failed to check Jira configuration")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setError(null)
    setSuccess(null)
    setSaving(true)
    try {
      const res = await fetch("/api/jira/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instanceUrl, email, apiToken, projectKeys }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save")
      setSuccess("Jira configuration saved successfully")
      setApiToken("")
      await fetchStatus()
      onCredentialsUpdated?.()
      if (showAsDialog) {
        setTimeout(() => setDialogOpen(false), 1500)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    setError(null)
    setSuccess(null)
    setTesting(true)
    try {
      const res = await fetch("/api/jira/test")
      const data = await res.json()
      if (data.connected) {
        setSuccess(
          `Connected as ${data.user.displayName} (${data.user.emailAddress})`
        )
      } else {
        setError(data.error || "Connection failed")
      }
    } catch {
      setError("Failed to test connection")
    } finally {
      setTesting(false)
    }
  }

  const handleRemove = async () => {
    setError(null)
    setSuccess(null)
    setRemoving(true)
    try {
      const res = await fetch("/api/jira/credentials", { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to remove")
      setSuccess("Jira configuration removed")
      setInstanceUrl("")
      setEmail("")
      setApiToken("")
      setProjectKeys("")
      await fetchStatus()
      onCredentialsUpdated?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove")
    } finally {
      setRemoving(false)
    }
  }

  const content = (
    <div className="space-y-4">
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

      {/* Current status */}
      {status?.configured && (
        <div className="rounded-lg border p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            Jira Connected
          </div>
          <div className="text-sm text-slate-600 space-y-1">
            <div>
              <span className="font-medium">Instance:</span>{" "}
              {status.config?.instanceUrl}
            </div>
            <div>
              <span className="font-medium">Email:</span>{" "}
              {status.config?.email}
            </div>
            {status.config?.projectKeys && (
              <div>
                <span className="font-medium">Projects:</span>{" "}
                {status.config.projectKeys}
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTest}
              disabled={testing}
            >
              {testing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plug className="h-4 w-4 mr-2" />
              )}
              Test
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              disabled={removing}
            >
              {removing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Remove
            </Button>
          </div>
        </div>
      )}

      {/* Setup form */}
      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="jira-url">Jira Instance URL</Label>
          <Input
            id="jira-url"
            value={instanceUrl}
            onChange={(e) => setInstanceUrl(e.target.value)}
            placeholder="https://your-domain.atlassian.net"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="jira-email">Email</Label>
          <Input
            id="jira-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your-email@company.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="jira-token">API Token</Label>
          <div className="relative">
            <Input
              id="jira-token"
              type={showToken ? "text" : "password"}
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder={
                status?.configured
                  ? "Enter new token to update"
                  : "Your Jira API token"
              }
              className="pr-10"
            />
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => setShowToken(!showToken)}
            >
              {showToken ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="jira-projects">
            Project Keys{" "}
            <span className="text-slate-400 font-normal">(optional)</span>
          </Label>
          <Input
            id="jira-projects"
            value={projectKeys}
            onChange={(e) => setProjectKeys(e.target.value)}
            placeholder="PROJ, SEC, OPS (comma-separated)"
          />
          <p className="text-xs text-slate-500">
            Leave empty to sync all accessible projects.
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving || !instanceUrl || !email || !apiToken}
          className="w-full"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Validating & Saving...
            </>
          ) : status?.configured ? (
            "Update Configuration"
          ) : (
            "Save Configuration"
          )}
        </Button>
      </div>

      <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 space-y-1">
        <p className="font-medium">How to get a Jira API token:</p>
        <ol className="list-decimal list-inside space-y-0.5">
          <li>Go to id.atlassian.com/manage-profile/security/api-tokens</li>
          <li>Click &quot;Create API token&quot;</li>
          <li>Give it a label and copy the token</li>
        </ol>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="h-32 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  if (showAsDialog) {
    return (
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm">
              Jira Settings
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Jira Configuration</DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plug className="h-5 w-5" />
          Jira Configuration
        </CardTitle>
        <CardDescription>
          Connect to Jira to sync and view tickets in the dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  )
}
