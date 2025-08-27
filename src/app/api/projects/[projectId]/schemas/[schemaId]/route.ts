import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/shared/lib/auth"
import { prisma } from "@/shared/lib/prisma"
import { z } from "zod"

const updateSchemaSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  type: z.enum(['object', 'array', 'string', 'number', 'boolean', 'enum']).optional(),
  properties: z.record(z.string(), z.any()).optional(),
  required: z.array(z.string()).optional(),
  items: z.any().optional(),
  enum: z.array(z.any()).optional(),
})

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ projectId: string; schemaId: string }> }
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

    const schema = await prisma.schema.findFirst({
      where: {
        id: params.schemaId,
        projectId: params.projectId,
      },
    })

    if (!schema) {
      return NextResponse.json({ error: "Schema not found" }, { status: 404 })
    }

    return NextResponse.json(schema)
  } catch (error) {
    console.error("Failed to fetch schema:", error)
    return NextResponse.json(
      { error: "Failed to fetch schema" },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ projectId: string; schemaId: string }> }
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
    const validatedData = updateSchemaSchema.parse(body)

    const updateData: any = {}
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    
    // If schema structure fields are provided, update the schema JSON
    if (validatedData.properties !== undefined || 
        validatedData.required !== undefined || 
        validatedData.items !== undefined || 
        validatedData.enum !== undefined ||
        validatedData.type !== undefined) {
      const currentSchema = await prisma.schema.findUnique({
        where: { id: params.schemaId },
        select: { schema: true }
      })
      
      updateData.schema = {
        ...(currentSchema?.schema as any || {}),
        ...(validatedData.properties !== undefined && { properties: validatedData.properties }),
        ...(validatedData.required !== undefined && { required: validatedData.required }),
        ...(validatedData.items !== undefined && { items: validatedData.items }),
        ...(validatedData.enum !== undefined && { enum: validatedData.enum }),
        ...(validatedData.type !== undefined && { type: validatedData.type }),
      }
    }

    const schema = await prisma.schema.update({
      where: {
        id: params.schemaId,
        projectId: params.projectId,
      },
      data: updateData,
    })

    return NextResponse.json(schema)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Failed to update schema:", error)
    return NextResponse.json(
      { error: "Failed to update schema" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ projectId: string; schemaId: string }> }
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
        role: 'OWNER',
      },
    })

    if (!member) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }

    await prisma.schema.delete({
      where: {
        id: params.schemaId,
        projectId: params.projectId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete schema:", error)
    return NextResponse.json(
      { error: "Failed to delete schema" },
      { status: 500 }
    )
  }
}