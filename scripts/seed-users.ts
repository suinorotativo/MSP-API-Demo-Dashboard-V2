import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"

const prisma = new PrismaClient()

interface UserSeed {
  email: string
  password: string
  name: string
  role: string
  orgId: string
  orgName: string
}

const users: UserSeed[] = [
  {
    email: "admin@sanysidroranch.com",
    password: "demo123", // Will be hashed
    name: "San Ysidro Admin",
    role: "admin",
    orgId: "696b5d98-7f9f-40e3-ba36-fb854078a210",
    orgName: "San Ysidro Ranch",
  },
  {
    email: "msp@blumira.com",
    password: "demo123", // Will be hashed
    name: "MSP Administrator",
    role: "msp",
    orgId: "msp",
    orgName: "Blumira MSP",
  },
]

async function main() {
  console.log("Seeding users...")

  for (const userData of users) {
    const hashedPassword = await bcrypt.hash(userData.password, 10)

    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        password: hashedPassword,
        name: userData.name,
        role: userData.role,
        orgId: userData.orgId,
        orgName: userData.orgName,
      },
      create: {
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        role: userData.role,
        orgId: userData.orgId,
        orgName: userData.orgName,
      },
    })

    console.log(`Created/updated user: ${user.email} (${user.orgName})`)
  }

  console.log("Seeding complete!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
