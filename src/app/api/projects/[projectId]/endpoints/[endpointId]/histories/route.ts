import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/shared/lib/auth"
import { prisma } from "@/shared/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; endpointId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId, endpointId } = await params

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

    const testHistories = await prisma.history.findMany({
      where: { endpointId },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        endpoint: true
      },
      orderBy: { createdAt: "desc" },
      take: 100
    })

    return NextResponse.json(testHistories)
  } catch (error) {
    console.error("Failed to fetch test histories:", error)
    return NextResponse.json(
      { error: "Failed to fetch test histories" },
      { status: 500 }
    )
  }
}