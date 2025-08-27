import { NextResponse } from "next/server"
import { auth } from "@/shared/lib/auth"
import { prisma } from "@/shared/lib/prisma"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId } = await params
    const { isPublic } = await request.json()

    
    const member = await prisma.projectMember.findFirst({
      where: {
        projectId: projectId,
        user: { email: session.user.email },
        role: { in: ["OWNER", "EDITOR"] }
      }
    })

    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    
    const project = await prisma.project.update({
      where: { id: projectId },
      data: { isPublic }
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error("Failed to update project visibility:", error)
    return NextResponse.json(
      { error: "Failed to update project visibility" },
      { status: 500 }
    )
  }
}