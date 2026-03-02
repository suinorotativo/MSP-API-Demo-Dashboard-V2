"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MessageSquare, Send, AlertCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { FindingComment } from "../organization-tabs/types"

interface FindingCommentsSectionProps {
  findingId: string
  organizationId: string
}

export function FindingCommentsSection({ findingId, organizationId }: FindingCommentsSectionProps) {
  const [comments, setComments] = useState<FindingComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newComment, setNewComment] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchComments()
  }, [findingId])

  const fetchComments = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/blumira/organizations/${organizationId}/findings/${findingId}/comments`)

      if (!response.ok) {
        // If endpoint not available, show graceful message
        if (response.status === 404 || response.status === 500) {
          setComments([])
          setError("Comments feature not available for this finding")
          setLoading(false)
          return
        }
        throw new Error("Failed to fetch comments")
      }

      const data = await response.json()

      // Handle different response structures
      const commentsData = data.data || data.comments || []
      setComments(commentsData)
    } catch (err) {
      console.error("Error fetching comments:", err)
      setError(err instanceof Error ? err.message : "Failed to load comments")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newComment.trim()) return

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/blumira/organizations/${organizationId}/findings/${findingId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: newComment.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to add comment")
      }

      setNewComment("")
      await fetchComments()
    } catch (err) {
      console.error("Error adding comment:", err)
      setError(err instanceof Error ? err.message : "Failed to add comment")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-gray-600" />
        <h4 className="font-semibold text-sm text-gray-700">Comments</h4>
        {comments.length > 0 && <Badge variant="secondary">{comments.length}</Badge>}
      </div>

      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {error && !loading && (
        <Alert variant={error.includes("not available") ? "default" : "destructive"}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!loading && !error && comments.length === 0 && (
        <div className="text-center py-4 text-sm text-gray-500">No comments yet. Be the first to comment!</div>
      )}

      {!loading && comments.length > 0 && (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {comments.map((comment, index) => (
            <div key={comment.id || index} className="p-3 bg-gray-50 rounded-md border border-gray-200">
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="font-medium text-sm">{comment.author || "Unknown User"}</span>
                <span className="text-xs text-gray-500">
                  {comment.timestamp ? formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true }) : ""}
                </span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add Comment Form */}
      {!error?.includes("not available") && (
        <form onSubmit={handleSubmitComment} className="space-y-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="min-h-20"
            disabled={submitting}
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={submitting || !newComment.trim()}>
              {submitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Posting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Post Comment
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
