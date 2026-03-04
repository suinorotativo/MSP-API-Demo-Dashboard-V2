export interface NessusSummary {
  totalVulnerabilities: number
  critical: number
  high: number
  medium: number
  low: number
  info: number
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
    const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 }
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

    // Try to count severity mentions in structured report lines
    // Nessus PDFs often list vulnerabilities with severity labels
    const lines = text.split(/\n/)
    for (const line of lines) {
      const lower = line.toLowerCase()
      // Look for lines that indicate a vulnerability entry with a severity
      if (lower.includes("critical")) counts.critical++
      if (lower.includes("high") && !lower.includes("higher")) counts.high++
      if (lower.includes("medium")) counts.medium++
      if (lower.includes("low") && !lower.includes("lower") && !lower.includes("below") && !lower.includes("follow")) counts.low++
    }

    // Rough dedup — severity keywords can appear in headers/summaries,
    // so cap overly large counts to something reasonable
    // Better: look for structured summary tables in the PDF
    const summaryPatterns = [
      { re: /critical[:\s]+(\d+)/i, key: "critical" as const },
      { re: /high[:\s]+(\d+)/i, key: "high" as const },
      { re: /medium[:\s]+(\d+)/i, key: "medium" as const },
      { re: /low[:\s]+(\d+)/i, key: "low" as const },
      { re: /info(?:rmational)?[:\s]+(\d+)/i, key: "info" as const },
    ]

    // If the PDF has a summary table with exact counts, prefer those
    let foundStructuredCounts = false
    for (const { re, key } of summaryPatterns) {
      const match = text.match(re)
      if (match) {
        counts[key] = parseInt(match[1], 10)
        foundStructuredCounts = true
      }
    }

    const total = counts.critical + counts.high + counts.medium + counts.low + counts.info

    // Build a short text summary from the first meaningful chunk of the PDF
    const pdfSummary = buildPdfSummary(text, data.numpages)

    return {
      totalVulnerabilities: foundStructuredCounts ? total : 0,
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
  const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 }
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
      case 0:
        counts.info++
        break
    }
  }

  const total = counts.critical + counts.high + counts.medium + counts.low + counts.info

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

  const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 }
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
      else if (sev === "none" || sev === "info" || sev === "informational") counts.info++
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

  const total = counts.critical + counts.high + counts.medium + counts.low + counts.info

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
