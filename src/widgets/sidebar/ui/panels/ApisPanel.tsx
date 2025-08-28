"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown, Plus, Folder as FolderIcon, HttpIcon, GraphQLIcon, WebSocketIcon, SocketIOIcon, GRPCIcon } from "@/shared/ui/icons"
import { useUIStore } from "@/shared/stores/ui"
import { useTabStore } from "@/shared/stores"
import { EndpointApi } from "@/entities/folder"
import { OverviewPanel } from "./OverviewPanel"
import { EndpointsPanel } from "./EndpointsPanel"
import { SchemasPanel } from "./SchemasPanel"
import { ServerSelector } from "../ServerSelector"
import { useProjectStore } from "@/shared/stores"

interface ApisPanelProps {
  project: any
  onOpenOverview?: () => void
  isReadOnly?: boolean
}

export function ApisPanel({ project, onOpenOverview, isReadOnly = false }: ApisPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["endpoints", "schemas"])
  )
  const [showEndpointMenu, setShowEndpointMenu] = useState(false)
  const { openModal } = useUIStore()
  const { selectedServerId, setSelectedServerId } = useProjectStore()

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const createEndpoint = async (type: string) => {
    try {
      const typeNames: Record<string, string> = {
        HTTP: "New Request",
        GRAPHQL: "GraphQL Query",
        WEBSOCKET: "WebSocket Connection",
        SOCKETIO: "Socket.IO Client",
        GRPC: "gRPC Service",
        STOMP: "STOMP Client",
        MQTT: "MQTT Client",
        SSE: "SSE Listener",
      }

      const defaultValues: any = {
        name: typeNames[type] || "New Endpoint",
        path: "",
        description: "",
        type,
      }

      if (type === "HTTP") {
        defaultValues.method = "GET"
      } else if (type === "GRAPHQL") {
        defaultValues.query = "query {\n  \n}"
      } else if (type === "WEBSOCKET") {
        defaultValues.wsUrl = "ws://localhost:3000"
      } else if (type === "GRPC") {
        defaultValues.protoFile = ""
        defaultValues.serviceName = ""
        defaultValues.methodName = ""
      } else if (type === "STOMP") {
        defaultValues.wsUrl = "ws://localhost:61614/stomp"
      } else if (type === "MQTT") {
        defaultValues.wsUrl = "mqtt://localhost:1883"
      } else if (type === "SSE") {
        defaultValues.path = "/events"
      }

      const response = await fetch(`/api/projects/${project.id}/endpoints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(defaultValues),
      })

      if (response.ok) {
        const newEndpoint = await response.json()
        const { openEndpoint } = useTabStore.getState()
        openEndpoint(newEndpoint)
        window.dispatchEvent(new CustomEvent('endpointCreated'))
      }
    } catch (error) {
      console.error('Failed to create endpoint:', error)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <ServerSelector
        project={project}
        selectedServerId={selectedServerId || 0}
        onServerSelect={setSelectedServerId}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="px-3 pt-2">
          <button
            onClick={onOpenOverview}
            className="w-full flex items-center gap-2 px-2 py-2 hover:bg-gray-50 rounded-md transition-colors cursor-pointer"
          >
            <div className="w-3" />
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-gray-600"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <path d="M9 3v18" />
              <path d="M15 3v18" />
              <path d="M3 9h18" />
              <path d="M3 15h18" />
            </svg>
            <span className="text-[13px] font-medium text-gray-900">Overview</span>
          </button>
        </div>

        <div className="mt-1.5 px-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => toggleSection("endpoints")}
              className="flex-1 flex items-center gap-2 hover:bg-gray-50 px-2 py-2 rounded-md transition-colors cursor-pointer"
            >
              {expandedSections.has("endpoints") ? (
                <ChevronDown size={12} className="text-gray-400" />
              ) : (
                <ChevronRight size={12} className="text-gray-400" />
              )}
              <FolderIcon size={14} className="text-orange-500" />
              <span className="text-[13px] font-medium text-gray-900">Endpoints</span>
            </button>
            <div className="relative">
              <button
                onClick={() => setShowEndpointMenu(!showEndpointMenu)}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="New"
              >
                <Plus size={12} className="text-gray-400" />
              </button>
              
              {showEndpointMenu && (
                <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-48">
                    <button
                      onClick={async () => {
                        setShowEndpointMenu(false)
                        await createEndpoint("HTTP")
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                    >
                      <HttpIcon size={12} className="text-[#0064FF]" />
                      <span className="text-[12px] text-gray-700">HTTP Request</span>
                    </button>
                    <button
                      onClick={async () => {
                        setShowEndpointMenu(false)
                        await createEndpoint("GRAPHQL")
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                    >
                      <GraphQLIcon size={12} className="text-pink-600" />
                      <span className="text-[12px] text-gray-700">GraphQL</span>
                    </button>
                    <button
                      onClick={async () => {
                        setShowEndpointMenu(false)
                        await createEndpoint("WEBSOCKET")
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                    >
                      <WebSocketIcon size={12} className="text-green-600" />
                      <span className="text-[12px] text-gray-700">WebSocket</span>
                    </button>
                    <button
                      onClick={async () => {
                        setShowEndpointMenu(false)
                        await createEndpoint("SOCKETIO")
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                    >
                      <SocketIOIcon size={12} className="text-purple-600" />
                      <span className="text-[12px] text-gray-700">Socket.IO</span>
                    </button>
                    <button
                      onClick={async () => {
                        setShowEndpointMenu(false)
                        await createEndpoint("GRPC")
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                    >
                      <GRPCIcon size={12} className="text-blue-600" />
                      <span className="text-[12px] text-gray-700">gRPC</span>
                    </button>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={async () => {
                        setShowEndpointMenu(false)
                        await createEndpoint("STOMP")
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600">
                        <path d="M2 12h6l2-9 4 18 2-9h6" />
                      </svg>
                      <span className="text-[12px] text-gray-700">STOMP</span>
                    </button>
                    <button
                      onClick={async () => {
                        setShowEndpointMenu(false)
                        await createEndpoint("MQTT")
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal-600">
                        <path d="M12 2v20M2 12h20" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      <span className="text-[12px] text-gray-700">MQTT</span>
                    </button>
                    <button
                      onClick={async () => {
                        setShowEndpointMenu(false)
                        await createEndpoint("SSE")
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-600">
                        <path d="M5 12h14m-7-7v14" />
                        <path d="M12 5l7 7-7 7" />
                      </svg>
                      <span className="text-[12px] text-gray-700">Server-Sent Events</span>
                    </button>
                    <div className="border-t border-gray-200 my-1" />
                    <button
                      onClick={() => {
                        setShowEndpointMenu(false)
                        window.dispatchEvent(new CustomEvent('createInlineFolder'))
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                    >
                      <FolderIcon size={12} className="text-orange-500" />
                      <span className="text-[12px] text-gray-700">New Folder</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          {expandedSections.has("endpoints") && (
            <div className="mt-1">
              <EndpointsPanel projectId={project.id} />
            </div>
          )}
        </div>

        <div className="mt-1.5 px-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => toggleSection("schemas")}
              className="flex-1 flex items-center gap-2 hover:bg-gray-50 px-2 py-2 rounded-md transition-colors cursor-pointer"
            >
              {expandedSections.has("schemas") ? (
                <ChevronDown size={12} className="text-gray-400" />
              ) : (
                <ChevronRight size={12} className="text-gray-400" />
              )}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-purple-600"
              >
                <path d="M4 7h16M4 7v10a2 2 0 002 2h12a2 2 0 002-2V7M4 7l2-4h12l2 4" />
                <path d="M10 11v5M14 11v5" />
              </svg>
              <span className="text-[13px] font-medium text-gray-900">Schemas</span>
            </button>
            <button
              onClick={() => openModal("newSchema")}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="New Schema"
            >
              <Plus size={12} className="text-gray-400" />
            </button>
          </div>
          {expandedSections.has("schemas") && (
            <div className="mt-1">
              <SchemasPanel projectId={project.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}