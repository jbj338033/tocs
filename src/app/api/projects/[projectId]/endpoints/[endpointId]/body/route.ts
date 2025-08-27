import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/shared/lib/auth"
import { prisma } from "@/shared/lib/prisma"
import { z } from "zod"

const bodySchema = z.object({
  contentType: z.string().min(1),
  schema: z.string().optional(),
  example: z.string().optional(),
  description: z.string().optional()
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; endpointId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId, endpointId } = await params
    const body = await request.json()
    const bodyData = bodySchema.parse(body)

    const endpoint = await prisma.endpoint.findUnique({
      where: { id: endpointId },
      include: {
        project: {
          include: {
            members: {
              where: { userId: session.user.id }
            }
          }
        }
      }
    })

    if (!endpoint || endpoint.project.members.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const member = endpoint.project.members[0]
    if (member.role === "VIEWER") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Upsert endpoint body
    await prisma.endpointBody.upsert({
      where: { endpointId },
      create: {
        endpointId,
        contentType: bodyData.contentType,
        schema: bodyData.schema,
        example: bodyData.example,
        description: bodyData.description
      },
      update: {
        contentType: bodyData.contentType,
        schema: bodyData.schema,
        example: bodyData.example,
        description: bodyData.description
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Failed to update body:", error)
    return NextResponse.json(
      { error: "Failed to update body" },
      { status: 500 }
    )
  }
}