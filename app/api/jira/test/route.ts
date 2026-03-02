import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const config = await prisma.jiraConfig.findUnique({
      where: { orgId: session.orgId },
    })

    if (!config) {
      return NextResponse.json({
        connected: false,
        error: "No Jira configuration found",
      })
    }

    const authString = Buffer.from(
      `${config.email}:${config.apiToken}`
    ).toString("base64")

    const response = await fetch(
      `${config.instanceUrl}/rest/api/3/myself`,
      {
        headers: {
          Authorization: `Basic ${authString}`,
          Accept: "application/json",
        },
      }
    )

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json({
        connected: true,
        user: {
          displayName: data.displayName,
          emailAddress: data.emailAddress,
        },
      })
    }

    return NextResponse.json({
      connected: false,
      error: `Jira returned ${response.status}`,
    })
  } catch (error) {
    console.error("Jira connection test error:", error)
    return NextResponse.json({
      connected: false,
      error: "Failed to connect to Jira",
    })
  }
}
