import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { auth } from "@/shared/lib/auth"
import { prisma } from "@/shared/lib/prisma"

const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  isPublic: z.boolean().optional().default(false),
  servers: z.array(z.object({
    name: z.string(),
    url: z.string()
  })).optional()
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const projects = await prisma.project.findMany({
      where: {
        members: {
          some: {
            userId: session.user.id
          }
        }
      },
      include: {
        members: {
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
        }
      },
      orderBy: {
        updatedAt: "desc"
      }
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const data = createProjectSchema.parse(body)

    
    const baseSlug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
    
    const slug = `${baseSlug}-${Date.now()}`

    
    const existingUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    })
    
    if (!existingUser) {
      return NextResponse.json({ error: "User not found. Please sign in again." }, { status: 404 })
    }

    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        slug,
        isPublic: data.isPublic,
        servers: data.servers || [{
          name: 'Default',
          url: 'https://api.example.com'
        }],
        members: {
          create: {
            userId: session.user.id,
            role: "OWNER"
          }
        }
      },
      include: {
        members: {
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
        }
      }
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      )
    }
    
    console.error("Error creating project:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}