import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function POST() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (session.role !== "admin" && session.role !== "msp") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const config = await prisma.jiraConfig.findUnique({
      where: { orgId: session.orgId },
    })

    if (!config) {
      return NextResponse.json(
        { error: "No Jira configuration found. Configure Jira first." },
        { status: 400 }
      )
    }

    const authString = Buffer.from(
      `${config.email}:${config.apiToken}`
    ).toString("base64")

    const headers = {
      Authorization: `Basic ${authString}`,
      Accept: "application/json",
    }

    // Build JQL query
    let jql = "ORDER BY updated DESC"
    if (config.projectKeys) {
      const keys = config.projectKeys
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean)
      if (keys.length > 0) {
        jql = `project in (${keys.join(",")}) ORDER BY updated DESC`
      }
    }

    let synced = 0
    let startAt = 0
    const maxResults = 100
    let total = 0

    // Paginate through all results
    do {
      const url = `${config.instanceUrl}/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}&startAt=${startAt}&fields=summary,description,status,priority,assignee,reporter,project,issuetype,labels,components,created,updated,resolutiondate`

      const res = await fetch(url, { headers })

      if (!res.ok) {
        const errText = await res.text()
        console.error("Jira search failed:", res.status, errText)
        if (res.status === 401) {
          return NextResponse.json(
            {
              error:
                "Jira authentication failed. Please reconfigure your credentials.",
            },
            { status: 401 }
          )
        }
        return NextResponse.json(
          { error: `Jira API returned ${res.status}` },
          { status: 502 }
        )
      }

      const data = await res.json()
      total = data.total || 0
      const issues = data.issues || []

      for (const issue of issues) {
        const fields = issue.fields || {}
        const ticketData = {
          ticketKey: issue.key,
          summary: fields.summary || "",
          description: fields.description
            ? JSON.stringify(fields.description)
            : "",
          status: fields.status?.name || "Unknown",
          priority: fields.priority?.name || "Medium",
          assignee: fields.assignee?.displayName || "",
          reporter: fields.reporter?.displayName || "",
          projectKey: fields.project?.key || "",
          projectName: fields.project?.name || "",
          issueType: fields.issuetype?.name || "",
          labels: JSON.stringify(fields.labels || []),
          components: JSON.stringify(
            (fields.components || []).map(
              (c: { name: string }) => c.name
            )
          ),
          jiraCreated: fields.created || "",
          jiraUpdated: fields.updated || "",
          resolved: fields.resolutiondate || "",
          orgId: session.orgId,
          orgName: session.orgName,
          syncedAt: new Date(),
          rawData: JSON.stringify(issue),
        }

        await prisma.jiraTicket.upsert({
          where: {
            ticketKey_orgId: {
              ticketKey: issue.key,
              orgId: session.orgId,
            },
          },
          create: ticketData,
          update: ticketData,
        })

        synced++
      }

      startAt += maxResults
    } while (startAt < total)

    return NextResponse.json({ success: true, synced, total })
  } catch (error) {
    console.error("Jira sync error:", error)
    return NextResponse.json(
      { error: "Failed to sync Jira tickets" },
      { status: 500 }
    )
  }
}
