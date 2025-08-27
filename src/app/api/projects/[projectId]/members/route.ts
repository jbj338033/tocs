import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { auth } from "@/shared/lib/auth"
import { prisma } from "@/shared/lib/prisma"

const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["OWNER", "EDITOR", "VIEWER"]).default("VIEWER")
})

export async function POST(
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
    const data = inviteMemberSchema.parse(body)

    let user = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: data.email,
          name: data.email.split("@")[0]
        }
      })
    }

    const existingMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: user.id,
          projectId: projectId
        }
      }
    })

    if (existingMember) {
      return NextResponse.json({ error: "User is already a member of this project" }, { status: 400 })
    }

    const member = await prisma.projectMember.create({
      data: {
        userId: user.id,
        projectId: projectId,
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

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error inviting member:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}