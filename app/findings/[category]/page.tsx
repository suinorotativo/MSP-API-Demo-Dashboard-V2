"use client"

import { use } from "react"
import { FindingsPageView } from "@/components/findings-page-view"

export default function FindingsPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category } = use(params)
  return <FindingsPageView category={category} />
}
