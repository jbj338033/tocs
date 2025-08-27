import { notFound } from "next/navigation"
import { prisma } from "@/shared/lib/prisma"
import { PublicDocumentationView } from "./components/PublicDocumentationView"

export default async function PublicDocsPage({
  params
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      folders: {
        orderBy: { order: "asc" },
        include: {
          endpoints: {
            orderBy: { order: "asc" },
            include: {
              headers: true,
              parameters: true,
              body: true,
              responses: true
            }
          }
        }
      }
    }
  })

  if (!project || !project.isPublic) {
    notFound()
  }

  return <PublicDocumentationView project={project} />
}