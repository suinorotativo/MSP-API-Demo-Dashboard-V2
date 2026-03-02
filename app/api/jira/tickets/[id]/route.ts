import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const ticket = await prisma.jiraTicket.findFirst({
      where: session.role === "msp" ? { id } : { id, orgId: session.orgId },
    })

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      )
    }

    const safeParse = (str: string, fallback: any = []) => {
      try { return JSON.parse(str) } catch { return fallback }
    }

    return NextResponse.json({
      ticket: {
        ...ticket,
        labels: safeParse(ticket.labels, []),
        components: safeParse(ticket.components, []),
        rawData: safeParse(ticket.rawData, {}),
      },
    })
  } catch (error) {
    console.error("Jira ticket detail error:", error)
    return NextResponse.json(
      { error: "Failed to fetch ticket" },
      { status: 500 }
    )
  }
}
