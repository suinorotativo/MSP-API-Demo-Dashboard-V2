"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Bell, CheckCircle2, Settings } from "lucide-react"

interface ThresholdConfig {
  criticalFindingsLimit: number
  highFindingsLimit: number
  offlineDevicesPercent: number
  agentCoverageLimit: number
  staleDevicesDays: number
}

interface AlertThresholdSettingsProps {
  onSave?: (config: ThresholdConfig) => void
}

export function AlertThresholdSettings({ onSave }: AlertThresholdSettingsProps) {
  const [config, setConfig] = useState<ThresholdConfig>({
    criticalFindingsLimit: 1,
    highFindingsLimit: 5,
    offlineDevicesPercent: 20,
    agentCoverageLimit: 90,
    staleDevicesDays: 7,
  })

  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setIsSaving(true)

    // Simulate save
    setTimeout(() => {
      onSave?.(config)
      setSaved(true)
      setIsSaving(false)

      // Reset saved indicator after 3 seconds
      setTimeout(() => setSaved(false), 3000)
    }, 500)
  }

  const handleReset = () => {
    setConfig({
      criticalFindingsLimit: 1,
      highFindingsLimit: 5,
      offlineDevicesPercent: 20,
      agentCoverageLimit: 90,
      staleDevicesDays: 7,
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Alert Thresholds
            </CardTitle>
            <CardDescription>Configure when to display alerts and warnings</CardDescription>
          </div>
          {saved && (
            <Badge variant="default" className="bg-green-600">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Saved
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Findings Thresholds */}
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Findings Alerts
            </h4>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="criticalLimit">Critical Findings Alert</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="criticalLimit"
                    type="number"
                    min="0"
                    value={config.criticalFindingsLimit}
                    onChange={(e) =>
                      setConfig({ ...config, criticalFindingsLimit: parseInt(e.target.value) || 0 })
                    }
                    className="w-24"
                  />
                  <span className="text-sm text-gray-600">or more P1 findings</span>
                </div>
                <p className="text-xs text-gray-500">
                  Alert when organization has this many critical findings
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="highLimit">High Priority Alert</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="highLimit"
                    type="number"
                    min="0"
                    value={config.highFindingsLimit}
                    onChange={(e) =>
                      setConfig({ ...config, highFindingsLimit: parseInt(e.target.value) || 0 })
                    }
                    className="w-24"
                  />
                  <span className="text-sm text-gray-600">or more P2 findings</span>
                </div>
                <p className="text-xs text-gray-500">
                  Alert when organization has this many high-priority findings
                </p>
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-200" />

          {/* Device Thresholds */}
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Device Alerts
            </h4>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="offlinePercent">Offline Devices Alert</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="offlinePercent"
                    type="number"
                    min="0"
                    max="100"
                    value={config.offlineDevicesPercent}
                    onChange={(e) =>
                      setConfig({ ...config, offlineDevicesPercent: parseInt(e.target.value) || 0 })
                    }
                    className="w-24"
                  />
                  <span className="text-sm text-gray-600">% or more offline</span>
                </div>
                <p className="text-xs text-gray-500">
                  Alert when this percentage of devices are offline/sleeping
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="staleDays">Stale Devices Alert</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="staleDays"
                    type="number"
                    min="1"
                    value={config.staleDevicesDays}
                    onChange={(e) =>
                      setConfig({ ...config, staleDevicesDays: parseInt(e.target.value) || 1 })
                    }
                    className="w-24"
                  />
                  <span className="text-sm text-gray-600">days without check-in</span>
                </div>
                <p className="text-xs text-gray-500">
                  Alert when devices haven&apos;t checked in for this many days
                </p>
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-200" />

          {/* Agent Coverage */}
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Settings className="h-4 w-4" />
              License Alerts
            </h4>

            <div className="space-y-2">
              <Label htmlFor="coverageLimit">Agent License Alert</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="coverageLimit"
                  type="number"
                  min="0"
                  max="100"
                  value={config.agentCoverageLimit}
                  onChange={(e) =>
                    setConfig({ ...config, agentCoverageLimit: parseInt(e.target.value) || 0 })
                  }
                  className="w-24"
                />
                <span className="text-sm text-gray-600">% license usage</span>
              </div>
              <p className="text-xs text-gray-500">
                Alert when agent license usage reaches this percentage
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-4 border-t">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Settings"}
            </Button>
            <Button onClick={handleReset} variant="outline">
              Reset to Defaults
            </Button>
          </div>

          {/* Current Settings Preview */}
          <div className="p-4 bg-gray-50 border rounded-lg">
            <div className="text-sm font-semibold mb-2">Active Alert Rules:</div>
            <div className="grid gap-2 text-xs text-gray-700">
              <div>• Alert on ≥{config.criticalFindingsLimit} critical finding(s)</div>
              <div>• Alert on ≥{config.highFindingsLimit} high-priority finding(s)</div>
              <div>• Alert on ≥{config.offlineDevicesPercent}% offline devices</div>
              <div>• Alert on devices stale for ≥{config.staleDevicesDays} day(s)</div>
              <div>• Alert on ≥{config.agentCoverageLimit}% license usage</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
