import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { auth } from "@/shared/lib/auth"
import { prisma } from "@/shared/lib/prisma"

const updateMemberSchema = z.object({
  role: z.enum(["OWNER", "EDITOR", "VIEWER"])
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; memberId: string }> }
) {
  try {
    const { projectId, memberId } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const currentUserMember = await prisma.projectMember.findFirst({
      where: {
        projectId: projectId,
        userId: session.user.id,
        role: "OWNER"
      }
    })

    if (!currentUserMember) {
      return NextResponse.json({ error: "Only project owners can change member roles" }, { status: 403 })
    }

    const body = await request.json()
    const data = updateMemberSchema.parse(body)

    const member = await prisma.projectMember.update({
      where: {
        id: memberId
      },
      data: {
        role: data.role
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    })

    return NextResponse.json(member)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error updating member:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; memberId: string }> }
) {
  try {
    const { projectId, memberId } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const currentUserMember = await prisma.projectMember.findFirst({
      where: {
        projectId: projectId,
        userId: session.user.id,
        role: { in: ["OWNER", "EDITOR"] }
      }
    })

    if (!currentUserMember) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const memberToRemove = await prisma.projectMember.findUnique({
      where: {
        id: memberId
      }
    })

    if (!memberToRemove) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    if (memberToRemove.role === "OWNER") {
      return NextResponse.json({ error: "Cannot remove project owner" }, { status: 400 })
    }

    await prisma.projectMember.delete({
      where: {
        id: memberId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing member:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}