export interface NessusSummary {
  totalVulnerabilities: number
  critical: number
  high: number
  medium: number
  low: number
  topHosts: string[]
  pdfSummary?: string
}

/**
 * Parse a Nessus report buffer and extract a vulnerability summary.
 * Supports CSV, XML/.nessus, and PDF formats. Returns null for unsupported formats.
 */
export async function parseNessusReport(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<NessusSummary | null> {
  const isNessusXml =
    filename.endsWith(".nessus") ||
    mimeType === "application/xml" ||
    mimeType === "text/xml"
  const isCsv = mimeType === "text/csv" || filename.endsWith(".csv")
  const isPdf = mimeType === "application/pdf" || filename.endsWith(".pdf")

  if (isNessusXml) {
    return parseNessusXml(buffer.toString("utf-8"))
  }
  if (isCsv) {
    return parseNessusCsv(buffer.toString("utf-8"))
  }
  if (isPdf) {
    return parsePdf(buffer)
  }

  return null
}

async function parsePdf(buffer: Buffer): Promise<NessusSummary | null> {
  try {
    const pdfParse = (await import("pdf-parse")).default
    const data = await pdfParse(buffer)
    const text = data.text

    // Try to extract severity counts from common Nessus PDF patterns
    const counts = { critical: 0, high: 0, medium: 0, low: 0 }
    const hosts = new Set<string>()

    // Match IP addresses as hosts
    const ipMatches = text.matchAll(/\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/g)
    for (const m of ipMatches) {
      const ip = m[1]
      // Filter out common non-host IPs like version numbers
      if (!ip.startsWith("0.") && !ip.startsWith("127.")) {
        hosts.add(ip)
      }
    }

    // Count vulnerability severity labels that appear as standalone lines
    // In Nessus PDFs each vulnerability entry starts with its severity on its own line:
    //   HIGH
    //   7.3--108714
    //   PCI DSS Compliance : Scan Interference
    const lines = text.split(/\n/)
    for (const line of lines) {
      const trimmed = line.trim()
      switch (trimmed) {
        case "CRITICAL": counts.critical++; break
        case "HIGH": counts.high++; break
        case "MEDIUM": counts.medium++; break
        case "LOW": counts.low++; break
      }
    }

    const total = counts.critical + counts.high + counts.medium + counts.low

    // Build a short text summary from the first meaningful chunk of the PDF
    const pdfSummary = buildPdfSummary(text, data.numpages)

    return {
      totalVulnerabilities: total,
      ...counts,
      topHosts: Array.from(hosts).slice(0, 5),
      pdfSummary,
    }
  } catch (err) {
    console.error("Error parsing PDF:", err)
    return null
  }
}

function buildPdfSummary(text: string, pageCount: number): string {
  // Clean up whitespace
  const cleaned = text.replace(/\s+/g, " ").trim()

  // Take the first ~500 chars as a preview, trimmed to last complete sentence
  let preview = cleaned.slice(0, 500)
  const lastPeriod = preview.lastIndexOf(".")
  if (lastPeriod > 100) {
    preview = preview.slice(0, lastPeriod + 1)
  }

  return `${pageCount} page${pageCount !== 1 ? "s" : ""}. ${preview}`
}

function parseNessusXml(content: string): NessusSummary {
  const counts = { critical: 0, high: 0, medium: 0, low: 0 }
  const hosts = new Set<string>()

  // Extract host names from <ReportHost name="...">
  const hostMatches = content.matchAll(/<ReportHost\s+name="([^"]+)"/g)
  for (const match of hostMatches) {
    hosts.add(match[1])
  }

  // Extract severity from <ReportItem ... severity="N">
  const itemMatches = content.matchAll(/<ReportItem[^>]+severity="(\d)"/g)
  for (const match of itemMatches) {
    const severity = parseInt(match[1], 10)
    switch (severity) {
      case 4:
        counts.critical++
        break
      case 3:
        counts.high++
        break
      case 2:
        counts.medium++
        break
      case 1:
        counts.low++
        break
      // severity 0 (info) intentionally excluded
    }
  }

  const total = counts.critical + counts.high + counts.medium + counts.low

  return {
    totalVulnerabilities: total,
    ...counts,
    topHosts: Array.from(hosts).slice(0, 5),
  }
}

function parseNessusCsv(content: string): NessusSummary {
  const lines = content.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) {
    return { totalVulnerabilities: 0, critical: 0, high: 0, medium: 0, low: 0, info: 0, topHosts: [] }
  }

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim())

  // Find the severity/risk column
  const severityIdx = headers.findIndex(
    (h) => h === "risk" || h === "severity" || h === "risk_factor"
  )
  // Find the host column
  const hostIdx = headers.findIndex(
    (h) => h === "host" || h === "ip" || h === "ip address" || h === "hostname"
  )

  const counts = { critical: 0, high: 0, medium: 0, low: 0 }
  const hostCounts = new Map<string, number>()

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i])
    if (cols.length <= Math.max(severityIdx, hostIdx)) continue

    if (severityIdx >= 0) {
      const sev = cols[severityIdx].toLowerCase().trim()
      if (sev === "critical") counts.critical++
      else if (sev === "high") counts.high++
      else if (sev === "medium") counts.medium++
      else if (sev === "low") counts.low++
      // info/none intentionally excluded
    }

    if (hostIdx >= 0) {
      const host = cols[hostIdx].trim()
      if (host) {
        hostCounts.set(host, (hostCounts.get(host) || 0) + 1)
      }
    }
  }

  // Sort hosts by vulnerability count descending
  const topHosts = Array.from(hostCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([host]) => host)

  const total = counts.critical + counts.high + counts.medium + counts.low

  return {
    totalVulnerabilities: total,
    ...counts,
    topHosts,
  }
}

/** Simple CSV line parser that handles quoted fields with commas */
function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ",") {
        result.push(current)
        current = ""
      } else {
        current += ch
      }
    }
  }
  result.push(current)
  return result
}
