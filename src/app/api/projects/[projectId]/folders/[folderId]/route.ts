import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { auth } from "@/shared/lib/auth"
import { prisma } from "@/shared/lib/prisma"

const updateFolderSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  parentId: z.string().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; folderId: string }> }
) {
  try {
    const { projectId, folderId } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const folder = await prisma.folder.findFirst({
      where: {
        id: folderId,
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
      },
      include: {
        children: true,
        endpoints: true,
        parent: true
      }
    })

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 })
    }

    return NextResponse.json(folder)
  } catch (error) {
    console.error("Error fetching folder:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; folderId: string }> }
) {
  try {
    const { projectId, folderId } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const existingFolder = await prisma.folder.findFirst({
      where: {
        id: folderId,
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

    if (!existingFolder) {
      return NextResponse.json({ error: "Folder not found or insufficient permissions" }, { status: 404 })
    }

    const body = await request.json()
    const data = updateFolderSchema.parse(body)

    const folder = await prisma.folder.update({
      where: { id: folderId },
      data,
      include: {
        children: true,
        endpoints: true,
        parent: true
      }
    })

    return NextResponse.json(folder)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error updating folder:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; folderId: string }> }
) {
  try {
    const { projectId, folderId } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const existingFolder = await prisma.folder.findFirst({
      where: {
        id: folderId,
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

    if (!existingFolder) {
      return NextResponse.json({ error: "Folder not found or insufficient permissions" }, { status: 404 })
    }

    
    await prisma.folder.delete({
      where: { id: folderId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting folder:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}