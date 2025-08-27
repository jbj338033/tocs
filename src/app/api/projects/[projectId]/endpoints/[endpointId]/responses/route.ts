import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/shared/lib/auth"
import { prisma } from "@/shared/lib/prisma"
import { z } from "zod"

const responseSchema = z.object({
  id: z.string().optional(),
  statusCode: z.number().int().min(100).max(599),
  description: z.string().optional(),
  contentType: z.string().optional(),
  schema: z.string().optional(),
  example: z.string().optional()
})

const updateResponsesSchema = z.object({
  responses: z.array(responseSchema)
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
    const { responses } = updateResponsesSchema.parse(body)

    const endpoint = await prisma.endpoint.findUnique({
      where: { id: endpointId },
      include: {
        project: {
          include: {
            members: {
              where: { userId: session.user.id }
            }
          }
        },
        responses: true
      }
    })

    if (!endpoint || endpoint.project.members.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const member = endpoint.project.members[0]
    if (member.role === "VIEWER") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Delete existing responses and create new ones
    await prisma.endpointResponse.deleteMany({
      where: { endpointId }
    })

    if (responses.length > 0) {
      await prisma.endpointResponse.createMany({
        data: responses.map(response => ({
          endpointId,
          statusCode: response.statusCode,
          description: response.description,
          contentType: response.contentType,
          schema: response.schema,
          example: response.example
        }))
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Failed to update responses:", error)
    return NextResponse.json(
      { error: "Failed to update responses" },
      { status: 500 }
    )
  }
}