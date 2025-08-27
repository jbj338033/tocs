import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { auth } from "@/shared/lib/auth"
import { prisma } from "@/shared/lib/prisma"

const updateEndpointSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  type: z.enum(["HTTP", "GRAPHQL", "WEBSOCKET", "SOCKETIO", "GRPC", "OVERVIEW"]).optional(),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"]).optional(),
  path: z.string().min(1).optional(),
  query: z.string().optional(),
  variables: z.any().optional(),
  wsUrl: z.string().optional(),
  wsProtocol: z.string().optional(),
  protoFile: z.string().optional(),
  serviceName: z.string().optional(),
  methodName: z.string().optional(),
  folderId: z.string().optional()
})

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
    const endpoint = await prisma.endpoint.findFirst({
      where: {
        id: endpointId,
        projectId,
        OR: [
          {
            folder: {
              project: {
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
          },
          {
            folderId: null,
            project: {
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
        ]
      },
      include: {
        headers: true,
        parameters: true,
        body: true,
        responses: true
      }
    })

    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint not found" }, { status: 404 })
    }

    return NextResponse.json(endpoint)
  } catch (error) {
    console.error("Error fetching endpoint:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

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
    const existingEndpoint = await prisma.endpoint.findFirst({
      where: { 
        id: endpointId,
        projectId 
      },
      include: {
        project: {
          include: {
            members: true
          }
        },
        folder: {
          include: {
            project: {
              include: {
                members: true
              }
            }
          }
        }
      }
    })

    if (!existingEndpoint) {
      return NextResponse.json({ error: "Endpoint not found" }, { status: 404 })
    }

    const project = existingEndpoint.project || existingEndpoint.folder?.project
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const hasPermission = project.members.some(member => 
      member.userId === session.user?.id && 
      (member.role === "OWNER" || member.role === "EDITOR")
    )

    if (!hasPermission) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const data = updateEndpointSchema.parse(body)

    const endpoint = await prisma.endpoint.update({
      where: { id: endpointId },
      data,
      include: {
        headers: true,
        parameters: true,
        body: true,
        responses: true
      }
    })

    return NextResponse.json(endpoint)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error updating endpoint:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; endpointId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId, endpointId } = await params
    const existingEndpoint = await prisma.endpoint.findFirst({
      where: { 
        id: endpointId,
        projectId 
      },
      include: {
        project: {
          include: {
            members: true
          }
        },
        folder: {
          include: {
            project: {
              include: {
                members: true
              }
            }
          }
        }
      }
    })

    if (!existingEndpoint) {
      return NextResponse.json({ error: "Endpoint not found" }, { status: 404 })
    }

    const project = existingEndpoint.project || existingEndpoint.folder?.project
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const hasPermission = project.members.some(member => 
      member.userId === session.user?.id && 
      (member.role === "OWNER" || member.role === "EDITOR")
    )

    if (!hasPermission) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    await prisma.endpoint.delete({
      where: { id: endpointId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting endpoint:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}