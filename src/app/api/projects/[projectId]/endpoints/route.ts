import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { auth } from "@/shared/lib/auth"
import { prisma } from "@/shared/lib/prisma"

const createEndpointSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  type: z.enum(["HTTP", "GRAPHQL", "WEBSOCKET", "SOCKETIO", "GRPC", "STOMP", "MQTT", "SSE", "OVERVIEW"]).optional().default("HTTP"),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"]).optional(),
  path: z.string(),
  folderId: z.string().optional(),
  query: z.string().optional(),
  variables: z.any().optional(),
  wsUrl: z.string().optional(),
  wsProtocol: z.string().optional(),
  protoFile: z.string().optional(),
  serviceName: z.string().optional(),
  methodName: z.string().optional()
})

export async function GET(
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
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const endpoints = await prisma.endpoint.findMany({
      where: {
        projectId: projectId
      },
      include: {
        headers: true,
        parameters: true,
        body: true,
        responses: true,
        folder: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        {
          folder: {
            order: "asc"
          }
        },
        {
          order: "asc"
        }
      ]
    })

    return NextResponse.json(endpoints)
  } catch (error) {
    console.error("Error fetching endpoints:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

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
    const data = createEndpointSchema.parse(body)

    const maxOrder = await prisma.endpoint.findFirst({
      where: data.folderId ? {
        folderId: data.folderId
      } : {
        projectId: projectId,
        folderId: null
      },
      orderBy: {
        order: "desc"
      }
    })

    const endpoint = await prisma.endpoint.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        method: data.type === "HTTP" ? data.method : null,
        path: data.path,
        query: data.query,
        variables: data.variables,
        wsUrl: data.wsUrl,
        wsProtocol: data.wsProtocol,
        protoFile: data.protoFile,
        serviceName: data.serviceName,
        methodName: data.methodName,
        projectId: projectId,
        folderId: data.folderId || null,
        order: (maxOrder?.order ?? -1) + 1
      },
      include: {
        headers: true,
        parameters: true,
        body: true,
        responses: true
      }
    })

    return NextResponse.json(endpoint, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error creating endpoint:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}