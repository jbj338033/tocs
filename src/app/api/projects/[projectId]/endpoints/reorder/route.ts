import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { auth } from "@/shared/lib/auth"
import { prisma } from "@/shared/lib/prisma"

const reorderEndpointsSchema = z.object({
  endpoints: z.array(z.object({
    id: z.string(),
    order: z.number()
  }))
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        members: {
          some: {
            userId: session.user.id,
            role: { in: ["OWNER", "EDITOR"] }
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found or insufficient permissions" }, { status: 404 })
    }

    const body = await request.json()
    const data = reorderEndpointsSchema.parse(body)

    await Promise.all(
      data.endpoints.map(endpoint =>
        prisma.endpoint.update({
          where: { id: endpoint.id },
          data: { order: endpoint.order }
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error reordering endpoints:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}