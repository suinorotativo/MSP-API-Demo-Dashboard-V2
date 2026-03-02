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
      select: {
        id: true,
        instanceUrl: true,
        email: true,
        projectKeys: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      configured: !!config,
      config: config
        ? {
            instanceUrl: config.instanceUrl,
            email: config.email,
            projectKeys: config.projectKeys,
            createdAt: config.createdAt,
            updatedAt: config.updatedAt,
          }
        : null,
    })
  } catch (error) {
    console.error("Jira credentials check error:", error)
    return NextResponse.json(
      { error: "Failed to check Jira configuration" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (session.role !== "admin" && session.role !== "msp") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { instanceUrl, email, apiToken, projectKeys } = await request.json()

    if (!instanceUrl || !email || !apiToken) {
      return NextResponse.json(
        { error: "Instance URL, email, and API token are required" },
        { status: 400 }
      )
    }

    // Normalize instance URL (remove trailing slash)
    const normalizedUrl = instanceUrl.replace(/\/+$/, "")

    // Validate connection by calling Jira API
    const authString = Buffer.from(`${email}:${apiToken}`).toString("base64")
    const testRes = await fetch(`${normalizedUrl}/rest/api/3/myself`, {
      headers: {
        Authorization: `Basic ${authString}`,
        Accept: "application/json",
      },
    })

    if (!testRes.ok) {
      const errText = await testRes.text()
      console.error("Jira auth test failed:", testRes.status, errText)
      return NextResponse.json(
        {
          error: `Jira authentication failed (${testRes.status}). Check your credentials.`,
        },
        { status: 401 }
      )
    }

    // Upsert the config
    await prisma.jiraConfig.upsert({
      where: { orgId: session.orgId },
      create: {
        instanceUrl: normalizedUrl,
        email,
        apiToken,
        projectKeys: projectKeys || "",
        orgId: session.orgId,
        orgName: session.orgName,
        createdBy: session.userId,
      },
      update: {
        instanceUrl: normalizedUrl,
        email,
        apiToken,
        projectKeys: projectKeys || "",
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Jira credentials save error:", error)
    return NextResponse.json(
      { error: "Failed to save Jira configuration" },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (session.role !== "admin" && session.role !== "msp") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete config and all synced tickets for this org
    await prisma.jiraTicket.deleteMany({ where: { orgId: session.orgId } })
    await prisma.jiraConfig.deleteMany({ where: { orgId: session.orgId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Jira credentials delete error:", error)
    return NextResponse.json(
      { error: "Failed to remove Jira configuration" },
      { status: 500 }
    )
  }
}
