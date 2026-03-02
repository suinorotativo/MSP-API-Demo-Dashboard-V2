import { Suspense } from "react"
import { AdminConsole } from "@/components/admin-console"
import { UserHeader } from "@/components/user-header"
import Link from "next/link"

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link
                href="/"
                className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                &larr; Dashboard
              </Link>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              Admin Console
            </h1>
            <p className="text-slate-600 text-lg">
              Manage users, roles, and organizations
            </p>
          </div>
          <UserHeader />
        </div>
        <Suspense
          fallback={
            <div className="space-y-4">
              <div className="h-10 w-64 bg-slate-200 rounded animate-pulse" />
              <div className="h-64 w-full bg-slate-200 rounded animate-pulse" />
            </div>
          }
        >
          <AdminConsole />
        </Suspense>
      </div>
    </div>
  )
}
