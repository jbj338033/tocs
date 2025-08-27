import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { auth } from "@/shared/lib/auth"
import { prisma } from "@/shared/lib/prisma"

const updateVariableSchema = z.object({
  key: z.string().min(1).max(100).optional(),
  value: z.string().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; variableId: string }> }
) {
  try {
    const { projectId, variableId } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const variable = await prisma.variable.findFirst({
      where: {
        id: variableId,
        project: {
          id: projectId,
          OR: [
            { isPublic: true },
            {
              members: {
                some: {
                  userId: session.user.id
                }
              }
            }
          ]
        }
      }
    })

    if (!variable) {
      return NextResponse.json({ error: "Variable not found" }, { status: 404 })
    }

    return NextResponse.json(variable)
  } catch (error) {
    console.error("Error fetching variable:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; variableId: string }> }
) {
  try {
    const { projectId, variableId } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const existingVariable = await prisma.variable.findFirst({
      where: {
        id: variableId,
        project: {
          id: projectId,
          members: {
            some: {
              userId: session.user.id,
              role: { in: ["OWNER", "EDITOR"] }
            }
          }
        }
      }
    })

    if (!existingVariable) {
      return NextResponse.json({ error: "Variable not found or insufficient permissions" }, { status: 404 })
    }

    const body = await request.json()
    const data = updateVariableSchema.parse(body)

    const variable = await prisma.variable.update({
      where: { id: variableId },
      data
    })

    return NextResponse.json(variable)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error updating variable:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; variableId: string }> }
) {
  try {
    const { projectId, variableId } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const existingVariable = await prisma.variable.findFirst({
      where: {
        id: variableId,
        project: {
          id: projectId,
          members: {
            some: {
              userId: session.user.id,
              role: { in: ["OWNER", "EDITOR"] }
            }
          }
        }
      }
    })

    if (!existingVariable) {
      return NextResponse.json({ error: "Variable not found or insufficient permissions" }, { status: 404 })
    }

    await prisma.variable.delete({
      where: { id: variableId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting variable:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}