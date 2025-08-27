import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/shared/lib/auth"
import { prisma } from "@/shared/lib/prisma"
import { z } from "zod"

const createSchemaSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  type: z.enum(['object', 'array', 'string', 'number', 'boolean', 'enum']),
  properties: z.record(z.string(), z.any()).optional(),
  required: z.array(z.string()).optional(),
  items: z.any().optional(),
  enum: z.array(z.any()).optional(),
})

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  const params = await context.params;
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const member = await prisma.projectMember.findFirst({
      where: {
        projectId: params.projectId,
        userId: session.user.id,
      },
    })

    if (!member) {
      return NextResponse.json({ error: "Not a project member" }, { status: 403 })
    }

    const schemas = await prisma.schema.findMany({
      where: {
        projectId: params.projectId,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(schemas)
  } catch (error) {
    console.error("Failed to fetch schemas:", error)
    return NextResponse.json(
      { error: "Failed to fetch schemas" },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  const params = await context.params;
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const member = await prisma.projectMember.findFirst({
      where: {
        projectId: params.projectId,
        userId: session.user.id,
        role: { in: ['OWNER', 'EDITOR'] },
      },
    })

    if (!member) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }

    const body = await req.json()
    const validatedData = createSchemaSchema.parse(body)

    const schemaData = {
      properties: validatedData.properties,
      required: validatedData.required,
      items: validatedData.items,
      enum: validatedData.enum,
      type: validatedData.type,
    }

    const schema = await prisma.schema.create({
      data: {
        projectId: params.projectId,
        name: validatedData.name,
        description: validatedData.description,
        type: 'shared', // Using 'shared' as default for now
        schema: schemaData,
      },
    })

    return NextResponse.json(schema)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Failed to create schema:", error)
    return NextResponse.json(
      { error: "Failed to create schema" },
      { status: 500 }
    )
  }
}