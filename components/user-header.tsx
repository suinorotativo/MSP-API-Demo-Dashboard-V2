"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LogOut, Building2, User, Shield } from "lucide-react"
import Link from "next/link"

interface UserInfo {
  id: string
  email: string
  name: string
  role: string
  orgId: string
  orgName: string
}

export function UserHeader() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
        }
      } catch (error) {
        console.error("Failed to fetch user:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [])

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/login")
      router.refresh()
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-4">
        <div className="h-8 w-32 bg-slate-200 rounded animate-pulse" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Building2 className="h-4 w-4" />
        <Badge variant="secondary" className="font-medium">
          {user.orgName}
        </Badge>
      </div>
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <User className="h-4 w-4" />
        <span>{user.name}</span>
      </div>
      {(user.role === "admin" || user.role === "msp") && (
        <Link href="/admin">
          <Button variant="outline" size="sm">
            <Shield className="h-4 w-4 mr-2" />
            Admin
          </Button>
        </Link>
      )}
      <Button variant="outline" size="sm" onClick={handleLogout}>
        <LogOut className="h-4 w-4 mr-2" />
        Logout
      </Button>
    </div>
  )
}
