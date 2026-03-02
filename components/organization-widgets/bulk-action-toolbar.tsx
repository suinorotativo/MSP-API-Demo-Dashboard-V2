"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Download, Trash2, CheckCircle2, X } from "lucide-react"
import type { Finding } from "../organization-tabs/types"

interface BulkActionToolbarProps {
  selectedItems: string[]
  allItems: Finding[]
  onClearSelection: () => void
  onAction?: (action: string, items: string[]) => void
}

export function BulkActionToolbar({
  selectedItems,
  allItems,
  onClearSelection,
  onAction,
}: BulkActionToolbarProps) {
  const [selectedAction, setSelectedAction] = useState<string>("")
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  if (selectedItems.length === 0) return null

  const selectedFindings = allItems.filter((item) => selectedItems.includes(item.finding_id))

  const handleActionClick = () => {
    if (!selectedAction) return

    // Show confirmation for destructive actions
    if (selectedAction === "delete" || selectedAction === "dismiss") {
      setShowConfirmDialog(true)
    } else {
      executeAction()
    }
  }

  const executeAction = async () => {
    setIsProcessing(true)
    setShowConfirmDialog(false)

    try {
      // Handle different actions
      switch (selectedAction) {
        case "export":
          exportSelected()
          break
        case "mark-reviewed":
          markAsReviewed()
          break
        case "delete":
        case "dismiss":
          // This would call your API
          onAction?.(selectedAction, selectedItems)
          break
        default:
          break
      }

      // Clear selection after action
      setTimeout(() => {
        onClearSelection()
        setSelectedAction("")
        setIsProcessing(false)
      }, 1000)
    } catch (error) {
      console.error("Bulk action failed:", error)
      setIsProcessing(false)
    }
  }

  const exportSelected = () => {
    // Generate CSV of selected findings
    let csv = "Finding Name,Priority,Status,Type,Category,Created,Modified,ID\n"

    selectedFindings.forEach((finding) => {
      csv += `"${finding.name}",P${finding.priority},"${finding.status_name}","${finding.type_name}","${finding.category_name || ""}",${finding.created},${finding.modified},${finding.finding_id}\n`
    })

    // Download file
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `selected_findings_${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const markAsReviewed = () => {
    // This would update the findings in your system
    console.log("Marking as reviewed:", selectedItems)
    onAction?.("mark-reviewed", selectedItems)
  }

  const getActionLabel = (action: string): string => {
    switch (action) {
      case "export":
        return "Export Selected"
      case "mark-reviewed":
        return "Mark as Reviewed"
      case "dismiss":
        return "Dismiss Selected"
      case "delete":
        return "Delete Selected"
      default:
        return "Choose Action"
    }
  }

  const getActionDescription = (): string => {
    switch (selectedAction) {
      case "export":
        return `Export ${selectedItems.length} selected finding${selectedItems.length !== 1 ? "s" : ""} to CSV`
      case "mark-reviewed":
        return `Mark ${selectedItems.length} finding${selectedItems.length !== 1 ? "s" : ""} as reviewed`
      case "dismiss":
        return `Dismiss ${selectedItems.length} finding${selectedItems.length !== 1 ? "s" : ""}? This action cannot be undone.`
      case "delete":
        return `Delete ${selectedItems.length} finding${selectedItems.length !== 1 ? "s" : ""}? This action cannot be undone.`
      default:
        return ""
    }
  }

  return (
    <>
      <div className="sticky top-0 z-10 bg-blue-50 border-2 border-blue-200 rounded-lg p-4 shadow-md">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Badge variant="default" className="text-base px-3 py-1">
              {selectedItems.length} selected
            </Badge>
            <span className="text-sm text-gray-700">
              Bulk actions available
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Action Selector */}
            <Select value={selectedAction} onValueChange={setSelectedAction}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Choose action..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="export">
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export to CSV
                  </div>
                </SelectItem>
                <SelectItem value="mark-reviewed">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Mark as Reviewed
                  </div>
                </SelectItem>
                <SelectItem value="dismiss">
                  <div className="flex items-center gap-2">
                    <X className="h-4 w-4" />
                    Dismiss Findings
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Apply Button */}
            <Button
              onClick={handleActionClick}
              disabled={!selectedAction || isProcessing}
              variant="default"
            >
              {isProcessing ? "Processing..." : "Apply"}
            </Button>

            {/* Clear Selection */}
            <Button onClick={onClearSelection} variant="outline">
              Clear Selection
            </Button>
          </div>
        </div>

        {/* Action Preview */}
        {selectedAction && (
          <div className="mt-3 text-sm text-blue-800 bg-blue-100 p-2 rounded">
            {getActionDescription()}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Action</AlertDialogTitle>
            <AlertDialogDescription>{getActionDescription()}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeAction}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
