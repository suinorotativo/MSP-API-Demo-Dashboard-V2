import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { parseNessusReport } from "@/lib/nessus-parser"

// GET /api/nessus/reports - List all reports for the user's organization
export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const reports = await prisma.nessusReport.findMany({
      where: session.role === "msp" ? {} : {
        orgId: session.orgId,
      },
      select: {
        id: true,
        filename: true,
        displayName: true,
        fileSize: true,
        mimeType: true,
        uploadedBy: true,
        uploadedByName: true,
        orgId: true,
        orgName: true,
        summary: true,
        scanDate: true,
        createdAt: true,
      },
      orderBy: {
        scanDate: "desc",
      },
    })

    return NextResponse.json({ reports })
  } catch (error) {
    console.error("Error fetching Nessus reports:", error)
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    )
  }
}

// POST /api/nessus/reports - Upload a new report
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const displayName = formData.get("displayName") as string | null
    const scanDateStr = formData.get("scanDate") as string | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!displayName) {
      return NextResponse.json({ error: "Display name is required" }, { status: 400 })
    }

    if (!scanDateStr) {
      return NextResponse.json({ error: "Scan date is required" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "text/csv",
      "application/xml",
      "text/xml",
      "application/json",
      "text/html",
    ]

    if (!allowedTypes.includes(file.type) && !file.name.endsWith(".nessus")) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: PDF, CSV, XML, JSON, HTML, .nessus" },
        { status: 400 }
      )
    }

    // Read file content
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Parse report for summary
    const mimeType = file.type || "application/octet-stream"
    const parsed = await parseNessusReport(buffer, mimeType, file.name)
    const summary = parsed ? JSON.stringify(parsed) : null

    // Create the report record
    const report = await prisma.nessusReport.create({
      data: {
        filename: file.name,
        displayName,
        fileData: buffer,
        fileSize: buffer.length,
        mimeType,
        uploadedBy: session.userId,
        uploadedByName: session.name,
        orgId: session.orgId,
        orgName: session.orgName,
        scanDate: new Date(scanDateStr),
        summary,
      },
    })

    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        filename: report.filename,
        displayName: report.displayName,
        fileSize: report.fileSize,
        scanDate: report.scanDate,
        createdAt: report.createdAt,
      },
    })
  } catch (error) {
    console.error("Error uploading Nessus report:", error)
    return NextResponse.json(
      { error: "Failed to upload report" },
      { status: 500 }
    )
  }
}

// DELETE /api/nessus/reports - Delete a report
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const reportId = searchParams.get("id")

    if (!reportId) {
      return NextResponse.json({ error: "Report ID is required" }, { status: 400 })
    }

    // Check if report exists and belongs to user's org (MSP can delete any)
    const report = await prisma.nessusReport.findFirst({
      where: session.role === "msp"
        ? { id: reportId }
        : { id: reportId, orgId: session.orgId },
    })

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    await prisma.nessusReport.delete({
      where: { id: reportId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting Nessus report:", error)
    return NextResponse.json(
      { error: "Failed to delete report" },
      { status: 500 }
    )
  }
}
