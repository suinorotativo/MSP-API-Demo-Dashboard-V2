import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"

// GET /api/nessus/reports/[id] - Download a specific report
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

    const report = await prisma.nessusReport.findFirst({
      where: session.role === "msp" ? { id } : { id, orgId: session.orgId },
    })

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    // Return the file as a download
    return new NextResponse(report.fileData, {
      headers: {
        "Content-Type": report.mimeType,
        "Content-Disposition": `attachment; filename="${report.filename}"`,
        "Content-Length": report.fileSize.toString(),
      },
    })
  } catch (error) {
    console.error("Error downloading Nessus report:", error)
    return NextResponse.json(
      { error: "Failed to download report" },
      { status: 500 }
    )
  }
}
