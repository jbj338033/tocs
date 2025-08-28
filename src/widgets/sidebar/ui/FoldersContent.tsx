"use client"

import { useState, useEffect } from "react"
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { 
  Plus, 
  ChevronRight, 
  ChevronDown, 
  Edit, 
  Copy, 
  Trash2,
  Folder as FolderIcon, 
  HttpIcon, 
  GraphQLIcon, 
  WebSocketIcon, 
  SocketIOIcon,
  GRPCIcon,
  Overview as OverviewIcon 
} from "@/shared/ui/icons"
import { ContextMenu } from "@/shared/ui/components/ContextMenu"
import { SortableEndpoint } from "./SortableEndpoint"
import { useFolderStore, useUIStore } from "@/shared/stores"
import { LoadingState, ErrorMessage } from "@/shared/ui"
import { useToast } from "@/shared/hooks/useToast"

interface Folder {
  id: string
  name: string
  parentId?: string | null
}

interface Endpoint {
  id: string
  name: string
  method?: string
  type?: string
  folderId?: string | null
}

interface FoldersContentProps {
  projectId: string
  onEndpointSelect?: (endpointId: string) => void
  onCreateEndpoint?: (endpoint: any) => void
  activeEndpointId?: string
  hideActions?: boolean
}

export function FoldersContent({
  projectId,
  onEndpointSelect,
  onCreateEndpoint,
  activeEndpointId,
  hideActions = false,
}: FoldersContentProps) {
  const { 
    folders, 
    endpoints, 
    loading,
    error,
    addFolder, 
    updateFolder, 
    deleteFolder,
    addEndpoint,
    updateEndpoint,
    deleteEndpoint,
    moveEndpoint,
    reorderEndpoints,
    getEndpointsByFolder,
    getChildFolders,
    loadAll
  } = useFolderStore()
  
  const { toggleFolder, expandFolder, isExpanded } = useUIStore()
  const toast = useToast()
  
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [showFolderMenu, setShowFolderMenu] = useState<string | null>(null)
  const [recentlyUsedType, setRecentlyUsedType] = useState<string>("HTTP")
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    if (projectId) {
      loadAll(projectId)
    }
  }, [projectId, loadAll])

  useEffect(() => {
    const handleEndpointCreated = () => {
      if (projectId) {
        loadAll(projectId)
      }
    }

    window.addEventListener('endpointCreated', handleEndpointCreated)
    return () => {
      window.removeEventListener('endpointCreated', handleEndpointCreated)
    }
  }, [projectId, loadAll])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        createEndpoint(recentlyUsedType)
      } else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'n') {
        e.preventDefault()
        createFolder()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [recentlyUsedType])

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over || active.id === over.id) return
    
    const activeEndpoint = endpoints.find(e => e.id === active.id)
    const overFolder = folders.find(f => f.id === over.id)
    const overEndpoint = endpoints.find(e => e.id === over.id)
    
    if (activeEndpoint && overFolder) {
      try {
        const response = await fetch(`/api/projects/${projectId}/endpoints/${activeEndpoint.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ folderId: overFolder.id })
        })
        if (response.ok) {
          moveEndpoint(activeEndpoint.id, overFolder.id)
          toast.success("Endpoint moved successfully")
        } else {
          toast.error("Failed to move endpoint")
        }
      } catch (error) {
        console.error('Failed to move endpoint:', error)
        toast.error("Failed to move endpoint")
      }
    } else if (activeEndpoint && overEndpoint && activeEndpoint.folderId === overEndpoint.folderId) {
      const folderEndpoints = endpoints.filter(e => e.folderId === activeEndpoint.folderId)
      const oldIndex = folderEndpoints.findIndex(e => e.id === active.id)
      const newIndex = folderEndpoints.findIndex(e => e.id === over.id)
      
      if (oldIndex !== newIndex) {
        const reorderedFolderEndpoints = arrayMove(folderEndpoints, oldIndex, newIndex)
        const updatedEndpoints = endpoints.map(e => {
          if (e.folderId !== activeEndpoint.folderId) return e
          const index = reorderedFolderEndpoints.findIndex(re => re.id === e.id)
          return { ...e, order: index }
        })
        
        reorderEndpoints(updatedEndpoints)
        
        // Persist the new order to the backend
        try {
          const response = await fetch(`/api/projects/${projectId}/endpoints/reorder`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              endpoints: reorderedFolderEndpoints.map((e, index) => ({
                id: e.id,
                order: index
              }))
            })
          })
          if (!response.ok) {
            console.error('Failed to save reorder')
            toast.error("Failed to save endpoint order")
          }
        } catch (error) {
          console.error('Failed to reorder endpoints:', error)
          toast.error("Failed to reorder endpoints")
        }
      }
    }
  }

  const createFolder = async (parentId?: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/folders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: "새 폴더", description: "", parentId }),
      })

      if (response.ok) {
        const newFolder = await response.json()
        addFolder(newFolder)
        setEditingId(newFolder.id)
        setEditingName(newFolder.name)
        
        if (parentId) {
          expandFolder(parentId)
        }
        
        toast.success("Folder created successfully")
      } else {
        toast.error("Failed to create folder")
      }
    } catch (error) {
      console.error("Failed to create folder:", error)
      toast.error("Failed to create folder")
    }
  }

  const handleUpdateFolder = async (id: string, name: string) => {
    if (!name.trim()) return

    try {
      const response = await fetch(`/api/projects/${projectId}/folders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name.trim() }),
      })

      if (response.ok) {
        updateFolder(id, { name: name.trim() })
        setEditingId(null)
        setEditingName("")
        toast.success("Folder renamed successfully")
      } else {
        toast.error("Failed to rename folder")
      }
    } catch (error) {
      console.error("Failed to update folder:", error)
      toast.error("Failed to rename folder")
      setEditingId(null)
      setEditingName("")
    }
  }

  const deleteFolderHandler = async (id: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/folders/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (response.ok) {
        deleteFolder(id)
        toast.success("Folder deleted successfully")
      } else {
        toast.error("Failed to delete folder")
      }
    } catch (error) {
      console.error('Failed to delete folder:', error)
      toast.error("Failed to delete folder")
    }
  }

  const createEndpoint = async (type: string = "HTTP", folderId?: string) => {
    if (isCreating) return
    
    setIsCreating(true)
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
        OVERVIEW: "API Overview"
      }

      const existingEndpoints = endpoints.filter(e => e.folderId === folderId)
      const existingPaths = existingEndpoints.map(e => e.path || e.name)
      
      let smartPath = ""
      if (type === "HTTP") {
        const commonPrefixes = ["/api/v1/", "/api/", "/v1/", "/"]
        const matchedPrefix = commonPrefixes.find(prefix => 
          existingPaths.some(path => path.startsWith(prefix))
        ) || "/api/"
        
        const resourceNames = existingPaths
          .map(path => path.replace(/^\/api\/v?\d*\//, '').split('/')[0])
          .filter(Boolean)
        
        smartPath = matchedPrefix
      }

      const defaultValues: any = {
        name: typeNames[type.toUpperCase()] || "New Endpoint",
        path: type === "HTTP" ? smartPath : "",
        description: "",
        type: type.toUpperCase(),
        folderId
      }

      if (type === "HTTP") {
        const lastMethod = existingEndpoints[existingEndpoints.length - 1]?.method || "GET"
        defaultValues.method = lastMethod
      } else if (type === "GRAPHQL") {
        defaultValues.query = "query {\n  \n}"
      } else if (type === "WEBSOCKET" || type === "SOCKETIO") {
        const wsEndpoints = endpoints.filter(e => e.type === "WEBSOCKET" || e.type === "SOCKETIO")
        const lastWsUrl = wsEndpoints[wsEndpoints.length - 1]?.wsUrl
        defaultValues.wsUrl = lastWsUrl || "ws://localhost:3000"
      } else if (type === "STOMP") {
        defaultValues.wsUrl = "ws://localhost:61614/stomp"
      } else if (type === "MQTT") {
        defaultValues.wsUrl = "mqtt://localhost:1883"
      } else if (type === "SSE") {
        defaultValues.path = "/events"
      }

      const response = await fetch(`/api/projects/${projectId}/endpoints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(defaultValues),
      })

      if (response.ok) {
        const newEndpoint = await response.json()
        addEndpoint(newEndpoint)
        setRecentlyUsedType(type)
        
        if (folderId) {
          expandFolder(folderId)
        }
        
        onCreateEndpoint?.(newEndpoint)
        onEndpointSelect?.(newEndpoint.id)
        
        setTimeout(() => {
          const nameInput = document.querySelector('input[value="' + newEndpoint.name + '"]') as HTMLInputElement
          if (nameInput) {
            nameInput.select()
            nameInput.focus()
          }
        }, 100)
        
        toast.success(`${typeNames[type.toUpperCase()]} created`)
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to create endpoint")
      }
    } catch (error) {
      console.error("Failed to create endpoint:", error)
      toast.error("Network error. Please try again.")
    } finally {
      setIsCreating(false)
    }
  }


  const renderFolder = (folder: Folder, depth = 0) => {
    const folderEndpoints = getEndpointsByFolder(folder.id)
    const childFolders = getChildFolders(folder.id)
    const hasChildren = childFolders.length > 0 || folderEndpoints.length > 0

    return (
      <div key={folder.id} className="group" style={{ paddingLeft: `${Math.min(depth * 12, 48)}px` }}>
        <ContextMenu
          items={[
            { 
              label: 'Rename', 
              icon: <Edit size={12} />,
              onClick: () => {
                setEditingId(folder.id)
                setEditingName(folder.name)
              }
            },
            { 
              label: 'Duplicate', 
              icon: <Copy size={12} />,
              onClick: async () => {
                try {
                  const response = await fetch(`/api/projects/${projectId}/folders`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                      name: `${folder.name} (copy)`,
                      description: '',
                      parentId: folder.parentId
                    })
                  })
                  if (response.ok) {
                    const newFolder = await response.json()
                    addFolder(newFolder)
                    toast.success("Folder duplicated successfully")
                  } else {
                    toast.error("Failed to duplicate folder")
                  }
                } catch (error) {
                  console.error('Failed to duplicate folder:', error)
                  toast.error("Failed to duplicate folder")
                }
              },
              divider: true
            },
            { 
              label: 'Delete', 
              icon: <Trash2 size={12} />,
              onClick: () => deleteFolderHandler(folder.id),
              className: 'text-red-600 hover:bg-red-50'
            }
          ]}
        >
          <div 
            className="flex items-center px-2 py-2 hover:bg-gray-50 transition-colors rounded-md mx-2 cursor-pointer"
            onClick={() => toggleFolder(folder.id)}
            onDoubleClick={() => {
              setEditingId(folder.id)
              setEditingName(folder.name)
            }}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex items-center gap-2 w-4">
                {hasChildren ? (
                  isExpanded(folder.id) ? (
                    <ChevronDown size={12} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={12} className="text-gray-400" />
                  )
                ) : (
                  <div className="w-3" />
                )}
              </div>
              <FolderIcon size={14} className="text-orange-500" />
              {editingId === folder.id ? (
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={() => handleUpdateFolder(folder.id, editingName)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleUpdateFolder(folder.id, editingName)
                    } else if (e.key === "Escape") {
                      setEditingId(null)
                      setEditingName("")
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 text-left text-[13px] font-medium text-gray-900 bg-transparent border-0 border-b border-[#0064FF] px-0 py-0 focus:outline-none"
                  autoFocus
                />
              ) : (
                <span className="flex-1 text-left text-[13px] font-medium text-gray-900 select-none">
                  {folder.name}
                </span>
              )}
            </div>
            <div className="relative flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowFolderMenu(showFolderMenu === folder.id ? null : folder.id)
                }}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <Plus size={12} className="text-gray-400" />
              </button>
              
              {showFolderMenu === folder.id && (
                <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-48 max-h-[400px] overflow-y-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      createEndpoint("HTTP", folder.id)
                      setShowFolderMenu(null)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                  >
                    <HttpIcon size={12} className="text-[#0064FF]" />
                    <span className="text-[12px] text-gray-700">HTTP Request</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      createEndpoint("GRAPHQL", folder.id)
                      setShowFolderMenu(null)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                  >
                    <GraphQLIcon size={12} className="text-pink-600" />
                    <span className="text-[12px] text-gray-700">GraphQL</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      createEndpoint("WEBSOCKET", folder.id)
                      setShowFolderMenu(null)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                  >
                    <WebSocketIcon size={12} className="text-green-600" />
                    <span className="text-[12px] text-gray-700">WebSocket</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      createEndpoint("SOCKETIO", folder.id)
                      setShowFolderMenu(null)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                  >
                    <SocketIOIcon size={12} className="text-purple-600" />
                    <span className="text-[12px] text-gray-700">Socket.IO</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      createEndpoint("GRPC", folder.id)
                      setShowFolderMenu(null)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                  >
                    <GRPCIcon size={12} className="text-blue-600" />
                    <span className="text-[12px] text-gray-700">gRPC</span>
                  </button>
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      createEndpoint("STOMP", folder.id)
                      setShowFolderMenu(null)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600">
                      <path d="M2 12h6l2-9 4 18 2-9h6" />
                    </svg>
                    <span className="text-[12px] text-gray-700">STOMP</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      createEndpoint("MQTT", folder.id)
                      setShowFolderMenu(null)
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
                    onClick={(e) => {
                      e.stopPropagation()
                      createEndpoint("SSE", folder.id)
                      setShowFolderMenu(null)
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
                    onClick={(e) => {
                      e.stopPropagation()
                      createFolder(folder.id)
                      setShowFolderMenu(null)
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
        </ContextMenu>

        {isExpanded(folder.id) && (
          <>
            {childFolders.map((childFolder) => 
              renderFolder(childFolder, depth + 1)
            )}
            {folderEndpoints.map((endpoint) => (
              <SortableEndpoint
                key={endpoint.id}
                endpoint={endpoint}
                depth={depth + 1}
                isActive={activeEndpointId === endpoint.id}
                onSelect={() => onEndpointSelect?.(endpoint.id)}
                projectId={projectId}
                onDuplicate={(newEndpoint) => {
                  addEndpoint(newEndpoint)
                  onEndpointSelect?.(newEndpoint.id)
                }}
                onDelete={(deletedId) => {
                  deleteEndpoint(deletedId)
                }}
              />
            ))}
            {!hasChildren && (
              <div 
                className="text-[11px] text-gray-400 italic py-2"
                style={{ paddingLeft: `${Math.min((depth + 1) * 12 + 16, 64)}px` }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-4" />
                  <span>Empty folder</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  if (loading) {
    return <LoadingState message="Loading folders..." />
  }

  if (error) {
    return (
      <ErrorMessage 
        title="Failed to load folders"
        message={error}
        onRetry={() => loadAll(projectId)}
      />
    )
  }

  return (
    <div className="h-full flex flex-col">
      {!hideActions && (
        <div className="px-3 py-2 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-gray-900">
              Folders
            </h3>
            <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowAddMenu(!showAddMenu)}
                className="px-2 py-1 text-xs text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
              >
                New
              </button>

              {showAddMenu && (
                <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-48 max-h-[400px] overflow-y-auto">
                  <div className="px-2 py-1.5">
                    <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider px-1">API Types</div>
                  </div>
                  <button
                    onClick={() => {
                      createEndpoint()
                      setShowAddMenu(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-left group"
                  >
                    <HttpIcon size={14} className="text-[#0064FF]" />
                    <div className="flex-1">
                      <span className="text-[13px] text-gray-700">HTTP Request</span>
                      <span className="text-[11px] text-gray-500 block">REST API endpoint</span>
                    </div>
                    <span className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100">⌘N</span>
                  </button>
                  <button
                    onClick={() => {
                      createEndpoint('GRAPHQL')
                      setShowAddMenu(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                  >
                    <GraphQLIcon size={14} className="text-pink-600" />
                    <div className="flex-1">
                      <span className="text-[13px] text-gray-700">GraphQL</span>
                      <span className="text-[11px] text-gray-500 block">Query & mutations</span>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      createEndpoint('WEBSOCKET')
                      setShowAddMenu(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                  >
                    <WebSocketIcon size={14} className="text-green-600" />
                    <div className="flex-1">
                      <span className="text-[13px] text-gray-700">WebSocket</span>
                      <span className="text-[11px] text-gray-500 block">Real-time connection</span>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      createEndpoint('SOCKETIO')
                      setShowAddMenu(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                  >
                    <SocketIOIcon size={14} className="text-purple-600" />
                    <div className="flex-1">
                      <span className="text-[13px] text-gray-700">Socket.IO</span>
                      <span className="text-[11px] text-gray-500 block">Event-based messaging</span>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      createEndpoint('GRPC')
                      setShowAddMenu(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M3 9h18M9 21V9" />
                    </svg>
                    <div className="flex-1">
                      <span className="text-[13px] text-gray-700">gRPC</span>
                      <span className="text-[11px] text-gray-500 block">Protocol buffers</span>
                    </div>
                  </button>
                  <div className="border-t border-gray-200 my-1" />
                  <div className="px-2 py-1.5">
                    <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider px-1">Documentation</div>
                  </div>
                  <button
                    onClick={() => {
                      createEndpoint('OVERVIEW')
                      setShowAddMenu(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                  >
                    <OverviewIcon size={14} className="text-gray-600" />
                    <div className="flex-1">
                      <span className="text-[13px] text-gray-700">Overview Page</span>
                      <span className="text-[11px] text-gray-500 block">API documentation</span>
                    </div>
                  </button>
                  <div className="border-t border-gray-200 my-1" />
                  <button
                    onClick={() => {
                      createFolder()
                      setShowAddMenu(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                  >
                    <FolderIcon size={14} className="text-orange-500" />
                    <div className="flex-1">
                      <span className="text-[13px] text-gray-700">New Folder</span>
                      <span className="text-[11px] text-gray-500 block">Organize endpoints</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('openImportModal'))
              }}
              className="px-2 py-1 text-xs text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            >
              Import
            </button>
          </div>
        </div>
      </div>
      )}

      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent hover:scrollbar-thumb-gray-300">
        <DndContext 
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={[...folders.map(f => f.id), ...endpoints.map(e => e.id)]} 
            strategy={verticalListSortingStrategy}
          >
            {folders.length === 0 && endpoints.length === 0 ? (
              <div className="px-3 py-4">
                <p className="text-[12px] text-gray-400">No endpoints</p>
              </div>
            ) : (
              <div className="py-1">
                {getChildFolders(null).map((folder) => 
                  renderFolder(folder)
                )}

                {endpoints
                  .filter(e => !e.folderId)
                  .map((endpoint) => (
                    <SortableEndpoint
                      key={endpoint.id}
                      endpoint={endpoint}
                      depth={0}
                      isActive={activeEndpointId === endpoint.id}
                      onSelect={() => onEndpointSelect?.(endpoint.id)}
                      projectId={projectId}
                      onDuplicate={(newEndpoint) => {
                        addEndpoint(newEndpoint)
                        onEndpointSelect?.(newEndpoint.id)
                      }}
                      onDelete={(deletedId) => {
                        deleteEndpoint(deletedId)
                      }}
                    />
                  ))}
              </div>
            )}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  )
}