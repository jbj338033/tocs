"use client"

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { 
  Edit, 
  Copy, 
  Trash2,
  GraphQLIcon, 
  WebSocketIcon, 
  SocketIOIcon,
  GRPCIcon,
  Overview as OverviewIcon 
} from "@/shared/ui/icons"
import { ContextMenu } from "@/shared/ui/components/ContextMenu"
import { Endpoint } from "@/entities/folder"
import { useToast } from "@/shared/hooks/useToast"

interface SortableEndpointProps {
  endpoint: Endpoint
  depth: number
  isActive: boolean
  onSelect: () => void
  projectId?: string
  onDuplicate?: (endpoint: any) => void
  onDelete?: (endpointId: string) => void
}

export function SortableEndpoint({
  endpoint,
  depth,
  isActive,
  onSelect,
  projectId,
  onDuplicate,
  onDelete
}: SortableEndpointProps) {
  const toast = useToast()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: endpoint.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "text-[#0064FF] bg-[#E6F0FF]"
      case "POST":
        return "text-green-600 bg-green-50"
      case "PUT":
        return "text-orange-600 bg-orange-50"
      case "DELETE":
        return "text-red-600 bg-red-50"
      case "PATCH":
        return "text-purple-600 bg-purple-50"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const getEndpointIcon = () => {
    switch (endpoint.type) {
      case 'GRAPHQL':
        return <GraphQLIcon size={14} className="text-pink-600 flex-shrink-0" />
      case 'WEBSOCKET':
        return <WebSocketIcon size={14} className="text-green-600 flex-shrink-0" />
      case 'SOCKETIO':
        return <SocketIOIcon size={14} className="text-purple-600 flex-shrink-0" />
      case 'GRPC':
        return <GRPCIcon size={14} className="text-blue-600 flex-shrink-0" />
      case 'STOMP':
        return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 flex-shrink-0">STOMP</span>
      case 'MQTT':
        return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-teal-100 text-teal-700 flex-shrink-0">MQTT</span>
      case 'SSE':
        return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 flex-shrink-0">SSE</span>
      case 'OVERVIEW':
        return <OverviewIcon size={14} className="text-gray-600 flex-shrink-0" />
      default:
        return (
          <span 
            className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${getMethodColor(endpoint.method || 'GET')}`}
          >
            {endpoint.method || 'GET'}
          </span>
        )
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="mx-2"
    >
      <ContextMenu
        items={[
          { 
            label: 'Open in new tab', 
            onClick: () => onSelect()
          },
          { 
            label: 'Rename', 
            icon: <Edit size={12} />,
            onClick: () => onSelect()
          },
          { 
            label: 'Duplicate', 
            icon: <Copy size={12} />,
            onClick: async () => {
              try {
                const response = await fetch(`/api/projects/${projectId}/endpoints`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({
                    name: `${endpoint.name} (copy)`,
                    method: endpoint.method,
                    path: '',
                    description: '',
                    folderId: endpoint.folderId
                  })
                })
                if (response.ok) {
                  const newEndpoint = await response.json()
                  onDuplicate?.(newEndpoint)
                  toast.success("Endpoint duplicated successfully")
                } else {
                  toast.error("Failed to duplicate endpoint")
                }
              } catch (error) {
                console.error('Failed to duplicate endpoint:', error)
                toast.error("Failed to duplicate endpoint")
              }
            },
            divider: true
          },
          { 
            label: 'Delete', 
            icon: <Trash2 size={12} />,
            onClick: async () => {
              try {
                const response = await fetch(`/api/projects/${projectId}/endpoints/${endpoint.id}`, {
                  method: 'DELETE',
                  credentials: 'include'
                })
                if (response.ok) {
                  onDelete?.(endpoint.id)
                  toast.success("Endpoint deleted successfully")
                } else {
                  toast.error("Failed to delete endpoint")
                }
              } catch (error) {
                console.error('Failed to delete endpoint:', error)
                toast.error("Failed to delete endpoint")
              }
            },
            className: 'text-red-600 hover:bg-red-50'
          }
        ]}
      >
        <div
          style={{
            paddingLeft: depth === 0 ? '16px' : `${Math.min((depth + 1) * 12 + 16, 52)}px`
          }}
          className={`group/endpoint w-full flex items-center gap-2 px-3 py-2 text-[13px] transition-colors rounded-md ${
            isActive
              ? 'bg-gray-100 text-gray-900'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <div
            className="flex items-center gap-2 flex-1 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              onSelect()
            }}
          >
            {getEndpointIcon()}
            <span className="flex-1 text-left truncate">
              {endpoint.name}
            </span>
          </div>
          <div
            className="cursor-move p-1 opacity-0 group-hover/endpoint:opacity-100 transition-opacity"
            {...attributes}
            {...listeners}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-gray-400">
              <circle cx="12" cy="5" r="1" fill="currentColor"/>
              <circle cx="12" cy="12" r="1" fill="currentColor"/>
              <circle cx="12" cy="19" r="1" fill="currentColor"/>
              <circle cx="5" cy="5" r="1" fill="currentColor"/>
              <circle cx="5" cy="12" r="1" fill="currentColor"/>
              <circle cx="5" cy="19" r="1" fill="currentColor"/>
              <circle cx="19" cy="5" r="1" fill="currentColor"/>
              <circle cx="19" cy="12" r="1" fill="currentColor"/>
              <circle cx="19" cy="19" r="1" fill="currentColor"/>
            </svg>
          </div>
        </div>
      </ContextMenu>
    </div>
  )
}