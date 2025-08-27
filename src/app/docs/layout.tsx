import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "API Documentation",
  description: "Public API documentation"
}

export default function DocsLayout({
  children
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}