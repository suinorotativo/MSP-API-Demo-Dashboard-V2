// Script to list all organizations from Blumira API
// Run with: DATABASE_URL='file:./dev.db' npx tsx scripts/list-orgs.ts

const AUTH_URL = "https://auth.blumira.com/oauth/token"
const API_BASE_URL = "https://api.blumira.com/public-api/v1"

async function getAccessToken() {
  const clientId = process.env.BLUMIRA_CLIENT_ID
  const clientSecret = process.env.BLUMIRA_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error("BLUMIRA_CLIENT_ID and BLUMIRA_CLIENT_SECRET environment variables are required")
  }

  const payload = {
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    audience: "public-api",
  }

  const response = await fetch(AUTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const responseText = await response.text()
    throw new Error(`Authentication failed (${response.status}): ${responseText}`)
  }

  const data = await response.json()
  return data.access_token
}

async function listOrganizations() {
  console.log("Fetching organizations from Blumira API...\n")

  const token = await getAccessToken()

  const response = await fetch(`${API_BASE_URL}/msp/accounts`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch organizations: ${response.status}`)
  }

  const data = await response.json()
  const accounts = data.data || []

  console.log(`Found ${accounts.length} organizations:\n`)
  console.log("=" .repeat(80))

  accounts.forEach((account: any, index: number) => {
    console.log(`${index + 1}. ${account.name}`)
    console.log(`   ID: ${account.account_id}`)
    console.log(`   Open Findings: ${account.open_findings || 0}`)
    console.log("")
  })

  console.log("=" .repeat(80))
  console.log("\nTo create a user for an organization, update scripts/seed-users.ts")
  console.log("with the appropriate account_id (ID) and name from the list above.")
}

// Load env vars from .env.local
import { readFileSync } from "fs"
import { join } from "path"

try {
  const envPath = join(process.cwd(), ".env.local")
  const envFile = readFileSync(envPath, "utf-8")
  envFile.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split("=")
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join("=").trim()
    }
  })
} catch (e) {
  console.warn("Could not load .env.local file")
}

listOrganizations().catch(console.error)
