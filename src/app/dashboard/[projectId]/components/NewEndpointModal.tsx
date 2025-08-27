"use client"

import { useState } from "react"
import { EndpointApi, EndpointType } from "@/entities/folder"
import { Modal } from "@/shared/ui/Modal"
import { useTabStore } from "@/shared/stores"
import { 
  HttpIcon, 
  GraphQLIcon, 
  WebSocketIcon, 
  SocketIOIcon,
  Overview as OverviewIcon
} from "@/shared/ui/icons"

interface NewEndpointModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  folderId?: string
}

const protocolOptions = [
  {
    type: EndpointType.HTTP,
    name: "HTTP Request",
    description: "REST API endpoint",
    icon: HttpIcon,
    color: "text-[#0064FF]"
  },
  {
    type: EndpointType.GRAPHQL,
    name: "GraphQL",
    description: "Query & mutations",
    icon: GraphQLIcon,
    color: "text-pink-600"
  },
  {
    type: EndpointType.WEBSOCKET,
    name: "WebSocket",
    description: "Real-time connection",
    icon: WebSocketIcon,
    color: "text-green-600"
  },
  {
    type: EndpointType.SOCKETIO,
    name: "Socket.IO",
    description: "Event-based messaging",
    icon: SocketIOIcon,
    color: "text-purple-600"
  },
  {
    type: EndpointType.GRPC,
    name: "gRPC",
    description: "Protocol buffers",
    icon: null, // Using inline SVG
    color: "text-blue-600"
  },
  {
    type: EndpointType.STOMP,
    name: "STOMP",
    description: "Message-oriented protocol",
    icon: null,
    color: "text-orange-600"
  },
  {
    type: EndpointType.MQTT,
    name: "MQTT",
    description: "IoT messaging protocol",
    icon: null,
    color: "text-teal-600"
  },
  {
    type: EndpointType.SSE,
    name: "Server-Sent Events",
    description: "One-way streaming",
    icon: null,
    color: "text-indigo-600"
  }
]

export function NewEndpointModal({ isOpen, onClose, projectId, folderId }: NewEndpointModalProps) {
  const [isCreating, setIsCreating] = useState(false)
  const { openEndpoint } = useTabStore()

  const handleCreateEndpoint = async (type: EndpointType) => {
    if (isCreating) return
    
    setIsCreating(true)
    try {
      const typeNames: Record<EndpointType, string> = {
        [EndpointType.HTTP]: "New Request",
        [EndpointType.GRAPHQL]: "GraphQL Query",
        [EndpointType.WEBSOCKET]: "WebSocket Connection",
        [EndpointType.SOCKETIO]: "Socket.IO Client",
        [EndpointType.GRPC]: "gRPC Service",
        [EndpointType.STOMP]: "STOMP Client",
        [EndpointType.MQTT]: "MQTT Client",
        [EndpointType.SSE]: "SSE Listener",
        [EndpointType.OVERVIEW]: "API Overview"
      }

      const defaultValues: any = {
        name: typeNames[type] || "New Endpoint",
        path: type === EndpointType.HTTP ? "/api/" : "",
        description: "",
        type,
        folderId
      }

      if (type === EndpointType.HTTP) {
        defaultValues.method = "GET"
      } else if (type === EndpointType.GRAPHQL) {
        defaultValues.query = "query {\n  \n}"
      } else if (type === EndpointType.WEBSOCKET) {
        defaultValues.wsUrl = "ws://localhost:3000"
      } else if (type === EndpointType.GRPC) {
        defaultValues.protoFile = ""
        defaultValues.serviceName = ""
        defaultValues.methodName = ""
      } else if (type === EndpointType.STOMP) {
        defaultValues.wsUrl = "ws://localhost:61614/stomp"
      } else if (type === EndpointType.MQTT) {
        defaultValues.wsUrl = "mqtt://localhost:1883"
      } else if (type === EndpointType.SSE) {
        defaultValues.path = "/events"
      }

      const created = await EndpointApi.createEndpoint(projectId, defaultValues)
      openEndpoint(created)
      onClose()
      
      // Refresh the sidebar to show the new endpoint
      window.dispatchEvent(new CustomEvent('endpointCreated'))
    } catch (error) {
      console.error('Failed to create endpoint:', error)
      alert('Failed to create endpoint. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleCreateOverviewPage = () => {
    // For now, just open the overview tab
    const { openOverview } = useTabStore.getState()
    openOverview()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Endpoint">
      <div>
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-1">Choose API Type</h3>
          <p className="text-xs text-gray-500">Select the type of endpoint you want to create</p>
        </div>

        <div className="space-y-2">
          {protocolOptions.map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.type}
                onClick={() => handleCreateEndpoint(option.type)}
                disabled={isCreating}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors text-left group border border-gray-100 hover:border-gray-200"
              >
                {Icon ? (
                  <Icon size={16} className={option.color} />
                ) : option.type === EndpointType.GRPC ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={option.color}>
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18M9 21V9" />
                  </svg>
                ) : option.type === EndpointType.STOMP ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={option.color}>
                    <path d="M2 12h6l2-9 4 18 2-9h6" />
                  </svg>
                ) : option.type === EndpointType.MQTT ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={option.color}>
                    <path d="M12 2v20M2 12h20" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : option.type === EndpointType.SSE ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={option.color}>
                    <path d="M5 12h14m-7-7v14" />
                    <path d="M12 5l7 7-7 7" />
                  </svg>
                ) : null}
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">{option.name}</span>
                  <span className="text-xs text-gray-500 block">{option.description}</span>
                </div>
                <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100">→</span>
              </button>
            )
          })}

          <div className="border-t border-gray-100 my-3" />

          <button
            onClick={handleCreateOverviewPage}
            disabled={isCreating}
            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors text-left group border border-gray-100 hover:border-gray-200"
          >
            <OverviewIcon size={16} className="text-gray-600" />
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-900">Overview Page</span>
              <span className="text-xs text-gray-500 block">API documentation</span>
            </div>
            <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100">→</span>
          </button>
        </div>
      </div>
    </Modal>
  )
}