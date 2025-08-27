import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/shared/lib/auth"
import { prisma } from "@/shared/lib/prisma"
import { z } from "zod"

const parameterSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  type: z.enum(["STRING", "INTEGER", "NUMBER", "BOOLEAN", "ARRAY", "OBJECT"]),
  location: z.enum(["QUERY", "PATH", "HEADER", "COOKIE"]),
  required: z.boolean(),
  description: z.string().optional(),
  defaultValue: z.string().optional(),
  example: z.string().optional()
})

const updateParametersSchema = z.object({
  parameters: z.array(parameterSchema)
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
    const { parameters } = updateParametersSchema.parse(body)

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
        parameters: true
      }
    })

    if (!endpoint || endpoint.project.members.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const member = endpoint.project.members[0]
    if (member.role === "VIEWER") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Delete existing parameters and create new ones
    await prisma.endpointParameter.deleteMany({
      where: { endpointId }
    })

    if (parameters.length > 0) {
      await prisma.endpointParameter.createMany({
        data: parameters.map(param => ({
          endpointId,
          name: param.name,
          type: param.type,
          location: param.location,
          required: param.required,
          description: param.description,
          defaultValue: param.defaultValue,
          example: param.example
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
    console.error("Failed to update parameters:", error)
    return NextResponse.json(
      { error: "Failed to update parameters" },
      { status: 500 }
    )
  }
}