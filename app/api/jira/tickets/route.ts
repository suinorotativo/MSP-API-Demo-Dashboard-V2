import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tickets = await prisma.jiraTicket.findMany({
      where: session.role === "msp" ? {} : { orgId: session.orgId },
      orderBy: { jiraUpdated: "desc" },
      select: {
        id: true,
        ticketKey: true,
        summary: true,
        status: true,
        priority: true,
        assignee: true,
        reporter: true,
        projectKey: true,
        projectName: true,
        issueType: true,
        labels: true,
        jiraCreated: true,
        jiraUpdated: true,
        resolved: true,
        syncedAt: true,
      },
    })

    return NextResponse.json({ tickets })
  } catch (error) {
    console.error("Jira tickets list error:", error)
    return NextResponse.json(
      { error: "Failed to fetch tickets" },
      { status: 500 }
    )
  }
}
