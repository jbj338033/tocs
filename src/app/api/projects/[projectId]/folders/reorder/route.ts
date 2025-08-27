import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/shared/lib/auth'
import { prisma } from '@/shared/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId } = await params
    const { folders } = await request.json()

    // Check if user has access to this project
    const member = await prisma.projectMember.findFirst({
      where: {
        projectId: projectId,
        userId: session.user.id
      }
    })

    if (!member || member.role === 'VIEWER') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Update folder orders
    const updatePromises = folders.map(({ id, order }: { id: string; order: number }) =>
      prisma.folder.update({
        where: { id },
        data: { order }
      })
    )

    await Promise.all(updatePromises)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to reorder folders:', error)
    return NextResponse.json(
      { error: 'Failed to reorder folders' },
      { status: 500 }
    )
  }
}