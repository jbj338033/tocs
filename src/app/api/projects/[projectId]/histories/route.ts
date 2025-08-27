import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/shared/lib/auth'
import { prisma } from '@/shared/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId } = await params

    // Check if user has access to this project
    const member = await prisma.projectMember.findFirst({
      where: {
        projectId: projectId,
        userId: session.user.id
      }
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get test history for all endpoints in this project
    const history = await prisma.history.findMany({
      where: {
        endpoint: {
          projectId: projectId
        }
      },
      include: {
        endpoint: {
          select: {
            id: true,
            name: true,
            method: true,
            path: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limit to last 50 entries
    })

    // Transform the data to match frontend expectations
    const transformedHistory = history.map(item => ({
      id: item.id,
      endpointId: item.endpointId,
      endpoint: item.endpoint,
      method: item.method,
      url: item.url,
      status: item.status,
      statusText: item.statusText,
      responseTime: item.responseTime,
      createdAt: item.createdAt
    }))

    return NextResponse.json(transformedHistory)
  } catch (error) {
    console.error('Failed to get history:', error)
    return NextResponse.json(
      { error: 'Failed to get history' },
      { status: 500 }
    )
  }
}