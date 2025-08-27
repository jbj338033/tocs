"use client"

import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { OpenAPIImportModal } from '@/features/openapi-import/ui/OpenAPIImportModal'
import { OpenAPIImportService } from '@/features/openapi-import/api/importService'

import { FolderApi, EndpointApi, Folder, Endpoint } from "@/entities/folder"
import { ProjectApi, Project, Server } from "@/entities/project"
import { HistoryApi } from "@/entities/test"
import { VariableApi, Variable } from "@/entities/variable"

import { LoadingState, ErrorMessage, JsonEditor } from "@/shared/ui"
import { VariableUrlInput } from "@/shared/ui/components/VariableUrlInput"
import { ServerSelector } from "@/shared/ui/components/ServerSelector"
import { AutoSaveIndicator } from "@/shared/ui/AutoSaveIndicator"
import { useAutoSave } from "@/shared/hooks/useAutoSave"
import { useKeyboardShortcuts, SHORTCUTS } from "@/shared/hooks/useKeyboardShortcuts"
import { useUIStore, useTabStore, useFolderStore, useSchemaStore, useVariableStore, useProjectStore, Tab } from "@/shared/stores"
import { 
  Plus, Folder as FolderIcon, Code, Save, Trash2, Send, FileCode, Settings
} from "@/shared/ui/icons"
import { GraphQLEndpointDetail } from "@/widgets/endpoint-detail/ui/GraphQLEndpointDetail"
import { WebSocketEndpointDetail } from "@/widgets/endpoint-detail/ui/WebSocketEndpointDetail"
import { SocketIOEndpointDetail } from "@/widgets/endpoint-detail/ui/SocketIOEndpointDetail"
import { GRPCEndpointDetail } from "@/widgets/endpoint-detail/ui/GRPCEndpointDetail"
import { STOMPEndpointDetail } from "@/widgets/endpoint-detail/ui/STOMPEndpointDetail"
import { MQTTEndpointDetail } from "@/widgets/endpoint-detail/ui/MQTTEndpointDetail"
import { SSEEndpointDetail } from "@/widgets/endpoint-detail/ui/SSEEndpointDetail"
import { FolderModal } from "./components/FolderModal"
import { SettingsModal } from "./components/SettingsModal"
import { ShareModal } from "./components/ShareModal"
import { SchemaTabContent } from "./components/SchemaTabContent"
import { SchemaModal } from "./components/SchemaModal"
import { NewEndpointModal } from "./components/NewEndpointModal"
import { DocsSection } from "./components/DocsSection"
import { ResponseViewer } from "./components/ResponseViewer"
import { Sidebar } from "@/widgets/sidebar"
import { ExportModal } from "@/features/export"
import { KeyboardShortcutsModal } from "./components/KeyboardShortcutsModal"

const httpMethods = [
  { value: "GET", label: "GET" },
  { value: "POST", label: "POST" },
  { value: "PUT", label: "PUT" },
  { value: "DELETE", label: "DELETE" },
  { value: "PATCH", label: "PATCH" },
  { value: "HEAD", label: "HEAD" },
  { value: "OPTIONS", label: "OPTIONS" }
]


export default function Dashboard() {
  const params = useParams()
  const projectId = params?.projectId as string
  const { data: session } = useSession()
  const { modal, closeModal, openModal, toggleSidebar } = useUIStore()
  const { setCurrentProject } = useProjectStore()
  const { 
    tabs, 
    activeTabId, 
    addTab, 
    removeTab, 
    setActiveTab, 
    updateTab, 
    openEndpoint,
    openNewRequest,
    openOverview,
    reorderTabs 
  } = useTabStore()
  
  const {
    folders,
    endpoints,
    setFolders,
    setEndpoints,
    addFolder,
    addEndpoint,
    loading: foldersLoading,
    loadAll
  } = useFolderStore()
  
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>()
  
  const { variables, selectedVariableId, setVariables, setSelectedVariable } = useVariableStore()
  const selectedVariable = variables.find(v => v.id === selectedVariableId) || null
  const [projects, setProjects] = useState<Project[]>([])
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      ...SHORTCUTS.NEW_REQUEST,
      callback: () => openNewRequest()
    },
    {
      ...SHORTCUTS.NEW_FOLDER,
      callback: () => openModal('newFolder')
    },
    {
      ...SHORTCUTS.TOGGLE_SIDEBAR,
      callback: () => toggleSidebar()
    },
    {
      ...SHORTCUTS.IMPORT,
      callback: () => openModal('import')
    },
    {
      ...SHORTCUTS.EXPORT,
      callback: () => openModal('export')
    },
    {
      ...SHORTCUTS.SETTINGS,
      callback: () => openModal('settings')
    },
    {
      ...SHORTCUTS.CLOSE_TAB,
      callback: () => {
        if (activeTabId) {
          removeTab(activeTabId)
        }
      }
    },
    {
      ...SHORTCUTS.SEARCH,
      callback: () => {
        // Focus on search input if available
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        }
      }
    },
    {
      key: '?',
      shift: true,
      callback: () => setShowKeyboardShortcuts(true),
      description: 'Show keyboard shortcuts'
    }
  ])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (active.id !== over?.id) {
      const oldIndex = tabs.findIndex(tab => tab.id === active.id)
      const newIndex = tabs.findIndex(tab => tab.id === over!.id)
      const reorderedTabs = arrayMove(tabs, oldIndex, newIndex)
      reorderTabs(reorderedTabs)
    }
  }

  useEffect(() => {
    if (projectId) {
      loadProjectData()
    }
  }, [projectId])


  useEffect(() => {
    loadAllProjects()
  }, [])

  useEffect(() => {
    const handleOpenImportModal = () => {
      openModal('import')
    }
    
    const handleOpenProjectSettings = () => {
      openModal('settings')
    }
    
    const handleOpenShareModal = () => {
      openModal('share')
    }
    
    const handleOpenExportModal = () => {
      openModal('export')
    }
    
    window.addEventListener('openImportModal', handleOpenImportModal)
    window.addEventListener('openProjectSettings', handleOpenProjectSettings)
    window.addEventListener('openShareModal', handleOpenShareModal)
    window.addEventListener('openExportModal', handleOpenExportModal)
    
    return () => {
      window.removeEventListener('openImportModal', handleOpenImportModal)
      window.removeEventListener('openProjectSettings', handleOpenProjectSettings)
      window.removeEventListener('openShareModal', handleOpenShareModal)
      window.removeEventListener('openExportModal', handleOpenExportModal)
    }
  }, [])

  // Handle UIStore modals
  useEffect(() => {
    // We'll handle newEndpoint modal differently now
  }, [modal])

  const loadAllProjects = async () => {
    try {
      const projectsData = await ProjectApi.getProjects()
      setProjects(projectsData)
    } catch (err) {
      console.error('Failed to load projects:', err)
    }
  }

  const loadProjectData = async () => {
    try {
      setIsLoading(true)
      setError(undefined)
      
      const [projectData, variablesData] = await Promise.all([
        ProjectApi.getProject(projectId),
        VariableApi.getVariables(projectId),
        loadAll(projectId) // Load folders and endpoints using the store
      ])
      
      setProject(projectData)
      setCurrentProject(projectData)
      setVariables(variablesData)
      
      if (!selectedVariableId && variablesData.length > 0) {
        setSelectedVariable(variablesData[0])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project data')
    } finally {
      setIsLoading(false)
    }
  }





  const handleOpenAPIImport = async (openApiData: any) => {
    try {
      const { folders, uncategorizedEndpoints } = OpenAPIImportService.parseOpenAPI(openApiData)
      await OpenAPIImportService.importToProject(projectId, folders, uncategorizedEndpoints)
      
      await loadProjectData()
      
      alert(`Successfully imported ${folders.length} folders and ${uncategorizedEndpoints.length} uncategorized endpoints`)
    } catch (error) {
      console.error('Import failed:', error)
      alert('Failed to import OpenAPI specification: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }



  const saveNewRequest = async (tabId: string, data: any) => {
    try {
      const created = await EndpointApi.createEndpoint(projectId, {
        ...data,
        method: data.method as any
      })
      
      addEndpoint(created)
      
      updateTab(tabId, { 
        type: 'endpoint' as const, 
        endpoint: created, 
        title: created.name 
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create endpoint')
    }
  }


  const handleCreateFolder = async (data: { name: string; description: string }) => {
    try {
      const created = await FolderApi.createFolder(projectId, data)
      addFolder(created)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create folder')
    }
  }


  const activeTab = tabs.find(tab => tab.id === activeTabId)

  if (isLoading) {
    return <LoadingState message="Loading project..." />
  }

  if (error && !project) {
    return (
      <div className="h-full flex items-center justify-center">
        <ErrorMessage
          title="Failed to load project"
          message={error}
          onRetry={loadProjectData}
        />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex-1 flex bg-gray-50 overflow-hidden">
        <Sidebar
          projects={projects}
          currentProjectId={projectId}
          onProjectSelect={(id) => {
            window.location.href = '/dashboard/' + id
          }}
          onCreateProject={() => {
            window.location.href = '/dashboard'
          }}
          user={session?.user}
          onOpenOverview={openOverview}
        />

      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        
        {tabs.length > 0 && (
          <div className="bg-gray-50 border-b border-gray-100">
            <div className="flex items-center">
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
                <DndContext 
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={tabs.map(tab => tab.id)} strategy={horizontalListSortingStrategy}>
                    {tabs.map(tab => (
                      <SortableTab
                        key={tab.id}
                        tab={tab}
                        isActive={activeTabId === tab.id}
                        onActivate={() => setActiveTab(tab.id)}
                        onClose={() => removeTab(tab.id)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
                </div>
              </div>
              <button 
                onClick={openNewRequest}
                className="px-2 py-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors border-r border-gray-100 flex-shrink-0"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-hidden">
          {activeTab ? (
            <TabContent 
              tab={activeTab} 
              variable={selectedVariable}
              variables={variables}
              projectId={projectId}
              project={project}
              folders={folders}
              onSave={saveNewRequest}
              onCloseTab={removeTab}
              onUpdateTab={updateTab}
              onUpdateEndpoint={(id, updates) => {
                const endpoint = endpoints.find(e => e.id === id)
                if (endpoint) {
                  useFolderStore.getState().updateEndpoint(id, updates)
                }
              }}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center max-w-sm">
                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Code size={20} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  API 문서 작성을 시작하세요
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  새 엔드포인트를 만들거나 사이드바에서 기존 API를 선택하세요
                </p>
                
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={openNewRequest} 
                    className="px-3 py-1.5 bg-[#0064FF] hover:opacity-90 text-white text-sm font-medium rounded transition-opacity flex items-center justify-center gap-1.5"
                  >
                    <Plus size={14} />
                    새 요청 만들기
                  </button>
                  <button 
                    onClick={() => openModal('newFolder')}
                    className="px-3 py-1.5 border border-gray-200 hover:border-gray-300 text-gray-600 text-sm rounded transition-colors flex items-center justify-center gap-1.5"
                  >
                    <FolderIcon size={14} />
                    폴더 만들기
                  </button>
                  <button 
                    onClick={() => openModal('import')}
                    className="px-3 py-1.5 border border-gray-200 hover:border-gray-300 text-gray-600 text-sm rounded transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Code size={14} />
                    OpenAPI 가져오기
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <FolderModal 
        isOpen={modal.type === 'newFolder'}
        onClose={closeModal}
        onCreate={handleCreateFolder}
      />
      <SettingsModal
        isOpen={modal.type === 'settings'}
        onClose={closeModal}
        project={project}
        onUpdate={async (data) => {
          if (data.delete) {
            await ProjectApi.deleteProject(projectId)
            window.location.href = '/dashboard'
          } else {
            const { name, description, isPublic } = data
            await ProjectApi.updateProject(projectId, { name, description, isPublic })
            await loadProjectData()
          }
        }}
      />

      <OpenAPIImportModal 
        isOpen={modal.type === 'import'}
        onClose={closeModal}
        onImport={handleOpenAPIImport}
        projectId={projectId}
      />
      <ExportModal
        isOpen={modal.type === 'export'}
        onClose={closeModal}
        projectId={projectId}
      />
      
      <ShareModal
        isOpen={modal.type === 'share'}
        onClose={closeModal}
        project={project}
      />
      
      <KeyboardShortcutsModal
        isOpen={showKeyboardShortcuts}
        onClose={() => setShowKeyboardShortcuts(false)}
      />

      <SchemaModal
        isOpen={modal.type === 'newSchema'}
        onClose={closeModal}
        onCreate={async () => {
          closeModal()
          // Schemas will be reloaded in the SchemasPanel
        }}
        projectId={projectId}
      />
      
      <NewEndpointModal
        isOpen={modal.type === 'newEndpoint'}
        onClose={closeModal}
        projectId={projectId}
      />

      </div>
    </div>
  )
}

function SortableTab({ 
  tab, 
  isActive, 
  onActivate, 
  onClose
}: {
  tab: Tab
  isActive: boolean
  onActivate: () => void
  onClose: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: tab.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    minWidth: '120px',
    maxWidth: '200px',
    flexShrink: 0,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-1 px-2 py-1 transition-all border-r border-gray-100 cursor-pointer ${
        isActive
          ? 'bg-white text-gray-900'
          : 'bg-gray-50 text-gray-500 hover:bg-gray-50 hover:text-gray-700'
      }`}
      onClick={onActivate}
    >
      <div
        {...attributes}
        {...listeners}
        className="flex items-center gap-1.5 flex-1 min-w-0"
      >
        {tab.type === 'endpoint' && (
          <span className="text-[10px] font-medium text-gray-500">
            {tab.endpoint?.method || 'GET'}
          </span>
        )}
        {tab.type === 'new' && (
          <Plus size={12} className="text-gray-500" />
        )}
        {tab.type === 'overview' && (
          <FileCode size={12} className="text-gray-500" />
        )}
        {tab.type === 'schema' && (
          <Code size={12} className="text-gray-500" />
        )}
        <span className="text-[11px] truncate">{tab.title}</span>
      </div>
      
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded p-0.5 transition-all flex-shrink-0 ml-0.5"
      >
        ×
      </button>
    </div>
  )
}

function TabContent({ 
  tab,
  variable,
  variables,
  projectId,
  project,
  folders,
  onSave,
  onCloseTab,
  onUpdateTab,
  onUpdateEndpoint
}: { 
  tab: Tab
  variable: Variable | null
  variables: Variable[]
  projectId: string
  project?: Project | null
  folders: Folder[]
  onSave: (tabId: string, data: any) => void
  onCloseTab: (tabId: string) => void
  onUpdateTab: (tabId: string, updates: Partial<Tab>) => void
  onUpdateEndpoint?: (id: string, updates: Partial<Endpoint>) => void
}) {
  if (tab.type === 'new') {
    return (
      <div className="h-full overflow-hidden">
        <NewRequestTabContent 
          tab={tab} 
          onSave={onSave} 
          onUpdateTab={onUpdateTab} 
        />
      </div>
    )
  }

  if (tab.type === 'overview') {
    return (
      <div className="h-full overflow-hidden">
        <OverviewTabContent 
          project={project}
          projectId={projectId}
        />
      </div>
    )
  }

  if (tab.type === 'schema') {
    return (
      <div className="h-full overflow-hidden">
        <SchemaTabContent 
          tab={tab}
          onUpdate={onUpdateTab}
          project={project}
        />
      </div>
    )
  }

  return (
    <div className="h-full overflow-hidden">
      <EndpointTabContent 
        endpoint={tab.endpoint!} 
        variable={variable}
        variables={variables}
        project={project}
        folders={folders}
        requestData={tab.requestData!}
        onCloseTab={() => onCloseTab(tab.id)}
        onUpdateTab={(updates) => onUpdateTab(tab.id, updates)} 
        onUpdateRequestData={(requestData) => onUpdateTab(tab.id, { requestData })}
        onUpdateEndpoint={onUpdateEndpoint}
      />
    </div>
  )
}

function EndpointTabContent({ 
  endpoint,
  variable,
  variables,
  project,
  folders,
  requestData,
  onCloseTab,
  onUpdateTab,
  onUpdateRequestData,
  onUpdateEndpoint
}: { 
  endpoint: Endpoint
  variable: Variable | null
  variables: Variable[]
  project?: Project | null
  folders: Folder[]
  requestData: any
  onCloseTab: () => void
  onUpdateTab: (updates: Partial<Tab>) => void
  onUpdateRequestData: (requestData: any) => void
  onUpdateEndpoint?: (id: string, updates: Partial<Endpoint>) => void
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<any>(null)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editingTitle, setEditingTitle] = useState(endpoint.name)

  const updateRequestData = (updates: any) => {
    const newRequestData = { ...requestData, ...updates }
    onUpdateRequestData(newRequestData)
  }

  const handleTest = async (selectedServer?: Server | null) => {
    setIsLoading(true)
    const startTime = Date.now()
    
    const replaceVariables = (text: string): string => {
      if (!text) return text
      
      if (variables && Array.isArray(variables)) {
        let result = text
        variables.forEach((v: Variable) => {
          const regex = new RegExp('{{\\s*' + v.key + '\\s*}}', 'g')
          result = result.replace(regex, v.value)
        })
        return result
      }
      
      return text
    }
    
    try {
      const headers: Record<string, string> = {}
      requestData.headers.forEach((h: { enabled: boolean; key: string; value: string }) => {
        if (h.enabled && h.key) {
          headers[h.key] = replaceVariables(h.value)
        }
      })
      
      if (requestData.auth.type === 'bearer' && requestData.auth.credentials && 'bearerToken' in requestData.auth.credentials) {
        const token = replaceVariables((requestData.auth.credentials as { bearerToken: string }).bearerToken)
        headers['Authorization'] = `Bearer ${token}`
      } else if (requestData.auth.type === 'basic') {
        const credentials = requestData.auth.credentials as { basicUsername?: string; basicPassword?: string } | undefined
        const { basicUsername = '', basicPassword = '' } = credentials || {}
        if (basicUsername && basicPassword) {
          const processedUsername = replaceVariables(basicUsername)
          const processedPassword = replaceVariables(basicPassword)
          const encoded = btoa(`${processedUsername}:${processedPassword}`)
          headers['Authorization'] = `Basic ${encoded}`
        }
      }
      
      let url = replaceVariables(requestData.url)
      
      if (selectedServer && url && !url.startsWith('http')) {
        url = selectedServer.url + (url.startsWith('/') ? url : '/' + url)
      }
      
      if (requestData.params?.length > 0) {
        const params = new URLSearchParams()
        requestData.params.forEach((p: any) => {
          if (p.enabled && p.key) {
            params.append(p.key, replaceVariables(p.value))
          }
        })
        const queryString = params.toString()
        if (queryString) url += `?${queryString}`
      }
      
      const options: RequestInit = {
        method: requestData.method,
        headers,
      }
      
      if (['POST', 'PUT', 'PATCH'].includes(requestData.method) && requestData.body) {
        options.body = replaceVariables(requestData.body)
      }
      
      const response = await fetch(url, options)
      const responseText = await response.text()
      const endTime = Date.now()
      
      let formattedBody = responseText
      try {
        const jsonData = JSON.parse(responseText)
        formattedBody = JSON.stringify(jsonData, null, 2)
      } catch (e) {
      }
      
      const responseHeaders: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })
      
      const responseData = {
        status: response.status,
        statusText: response.statusText,
        time: `${endTime - startTime}ms`,
        size: `${new Blob([responseText]).size} bytes`,
        headers: responseHeaders,
        body: formattedBody,
        request: {
          url,
          method: requestData.method,
          headers,
          body: options.body as string || undefined
        }
      }
      setResponse(responseData)
      
      try {
        await HistoryApi.createHistory(project!.id, endpoint.id, {
          method: requestData.method,
          url,
          headers,
          params: requestData.params?.reduce((acc: Record<string, string>, p: any) => {
            if (p.enabled && p.key) acc[p.key] = p.value
            return acc
          }, {}),
          body: options.body as string || '',
          variables: variable ? { [variable.key]: variable.value } : undefined,
          status: response.status,
          statusText: response.statusText,
          responseTime: endTime - startTime,
          responseSize: new Blob([responseText]).size,
          responseHeaders,
          responseBody: formattedBody
        })
        
        window.dispatchEvent(new CustomEvent('historyUpdated'))
      } catch (err) {
        console.error('Failed to save test history:', err)
      }
    } catch (error: any) {
      const endTime = Date.now()
      setResponse({
        status: 0,
        statusText: 'Network Error',
        time: `${endTime - startTime}ms`,
        size: '0 bytes',
        body: error.message || 'Failed to fetch'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              {endpoint.folderId && (
                <span className="text-sm text-gray-400">
                  ~/{(() => {
                    const getFolderPath = (folderId: string): string => {
                      const folder = folders.find(f => f.id === folderId);
                      if (!folder) return '';
                      
                      if (folder.parentId) {
                        const parentPath = getFolderPath(folder.parentId);
                        return parentPath ? `${parentPath}/${folder.name}` : folder.name;
                      }
                      
                      return folder.name;
                    };
                    return getFolderPath(endpoint.folderId);
                  })()}/
                </span>
              )}
              {isEditingTitle ? (
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onBlur={async () => {
                    if (editingTitle.trim() && editingTitle !== endpoint.name) {
                      try {
                        await EndpointApi.updateEndpoint(project!.id, endpoint.id, { name: editingTitle.trim() })
                        onUpdateTab({ 
                          title: editingTitle.trim(),
                          endpoint: { ...endpoint, name: editingTitle.trim() }
                        })
                        onUpdateEndpoint?.(endpoint.id, { name: editingTitle.trim() })
                      } catch (error) {
                        setEditingTitle(endpoint.name)
                      }
                    }
                    setIsEditingTitle(false)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur()
                    } else if (e.key === 'Escape') {
                      setEditingTitle(endpoint.name)
                      setIsEditingTitle(false)
                    }
                  }}
                  className="text-sm font-medium text-gray-900 bg-transparent border-0 border-b border-[#0064FF] px-0 py-0 focus:outline-none"
                  autoFocus
                />
              ) : (
                <h2 
                  className="text-sm font-medium text-gray-900 cursor-pointer hover:text-[#0064FF] transition-colors"
                  onClick={() => {
                    setEditingTitle(endpoint.name)
                    setIsEditingTitle(true)
                  }}
                >
                  {endpoint.name}
                </h2>
              )}
            </div>
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
              endpoint.method === 'GET' ? 'bg-[#E6F0FF] text-[#0064FF]' :
              endpoint.method === 'POST' ? 'bg-green-50 text-green-700' :
              endpoint.method === 'PUT' ? 'bg-orange-50 text-orange-700' :
              endpoint.method === 'DELETE' ? 'bg-red-50 text-red-700' :
              endpoint.method === 'PATCH' ? 'bg-purple-50 text-purple-700' :
              'bg-gray-50 text-gray-700'
            }`}>
              {endpoint.method}
            </span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button 
              onClick={async () => {
                try {
                  const updateData: any = {
                    name: endpoint.name,
                    path: endpoint.path,
                    description: endpoint.description || undefined
                  }
                  if (endpoint.method) {
                    updateData.method = endpoint.method
                  }
                  await EndpointApi.updateEndpoint(project!.id, endpoint.id, updateData)
                  onUpdateTab({ isModified: false })
                  alert('Endpoint saved successfully!')
                } catch (error) {
                  alert('Failed to save endpoint')
                }
              }}
              className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors"
            >
              <Save size={12} className="inline mr-1" />
              Save
            </button>
            <button 
              onClick={async () => {
                if (confirm('Delete this endpoint?')) {
                  await EndpointApi.deleteEndpoint(project!.id, endpoint.id)
                  onCloseTab()
                  window.location.reload()
                }
              }}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {endpoint.type === 'GRAPHQL' && project ? (
          <GraphQLEndpointDetail 
            projectId={project.id} 
            endpoint={endpoint} 
            variables={variables} 
            project={project} 
          />
        ) : endpoint.type === 'WEBSOCKET' && project ? (
          <WebSocketEndpointDetail 
            projectId={project.id} 
            endpoint={endpoint} 
            variables={variables} 
            project={project} 
          />
        ) : endpoint.type === 'SOCKETIO' && project ? (
          <SocketIOEndpointDetail 
            projectId={project.id} 
            endpoint={endpoint} 
            variables={variables} 
            project={project} 
          />
        ) : endpoint.type === 'GRPC' && project ? (
          <GRPCEndpointDetail 
            projectId={project.id} 
            endpoint={endpoint} 
            variables={variables} 
            project={project} 
          />
        ) : endpoint.type === 'STOMP' && project ? (
          <STOMPEndpointDetail 
            projectId={project.id} 
            endpoint={endpoint} 
            variables={variables} 
            project={project} 
          />
        ) : endpoint.type === 'MQTT' && project ? (
          <MQTTEndpointDetail 
            projectId={project.id} 
            endpoint={endpoint} 
            variables={variables} 
            project={project} 
          />
        ) : endpoint.type === 'SSE' && project ? (
          <SSEEndpointDetail 
            projectId={project.id} 
            endpoint={endpoint} 
            variables={variables} 
            project={project} 
          />
        ) : (
          <TestSection 
            endpoint={endpoint}
            variables={variables}
            requestData={requestData}
            setRequestData={updateRequestData}
            onUpdateRequestData={onUpdateRequestData}
            response={response}
            isLoading={isLoading}
            onTest={(selectedServer) => handleTest(selectedServer)}
            project={project}
          />
        )}
      </div>
    </div>
  )
}

function NewRequestTabContent({ 
  tab,
  onSave,
  onUpdateTab
}: { 
  tab: Tab
  onSave: (tabId: string, data: any) => void
  onUpdateTab: (tabId: string, updates: Partial<Tab>) => void
}) {
  const [activeSection, setActiveSection] = useState<'params' | 'authorization' | 'headers' | 'body'>('params')
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<any>(null)
  const [requestData, setRequestData] = useState({
    url: '',
    method: 'GET',
    headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }],
    params: [],
    body: '',
    bodyType: 'none',
    formData: [],
    auth: { type: 'none', credentials: {} },
    cookies: []
  })
  
  const data = tab.newData!
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'error' | 'idle'>('idle')
  
  const updateData = (updates: Partial<typeof data>) => {
    const newData = { ...data, ...updates }
    onUpdateTab(tab.id, { 
      newData,
      title: newData.name || 'Untitled Request',
      isModified: true
    })
  }

  
  useAutoSave(data, {
    delay: 2000, 
    enabled: !!(data.name && data.path), 
    onSave: async () => {
      try {
        setSaveStatus('saving')
        await new Promise(resolve => {
          onSave(tab.id, data)
          resolve(undefined)
        })
        setSaveStatus('saved')
        
        setTimeout(() => setSaveStatus('idle'), 2000)
      } catch (error) {
        setSaveStatus('error')
        console.error('Auto-save failed:', error)
        
        setTimeout(() => setSaveStatus('idle'), 3000)
      }
    }
  })


  const handleSend = async () => {
    setIsLoading(true)
    const startTime = Date.now()
    
    try {
      const headers: Record<string, string> = {}
      requestData.headers.forEach((h: { enabled: boolean; key: string; value: string }) => {
        if (h.enabled && h.key) headers[h.key] = h.value
      })
      
      if (requestData.auth.type === 'bearer' && requestData.auth.credentials && 'bearerToken' in requestData.auth.credentials) {
        headers['Authorization'] = `Bearer ${(requestData.auth.credentials as { bearerToken: string }).bearerToken}`
      }
      
      let url = data.path
      if (requestData.params?.length > 0) {
        const params = new URLSearchParams()
        requestData.params.forEach((p: any) => {
          if (p.enabled && p.key) params.append(p.key, p.value)
        })
        const queryString = params.toString()
        if (queryString) url += `?${queryString}`
      }
      
      const options: RequestInit = {
        method: data.method,
        headers,
      }
      
      if (['POST', 'PUT', 'PATCH'].includes(data.method) && requestData.body) {
        options.body = requestData.body
      }
      
      const response = await fetch(url, options)
      const responseText = await response.text()
      const endTime = Date.now()
      
      let formattedBody = responseText
      try {
        const jsonData = JSON.parse(responseText)
        formattedBody = JSON.stringify(jsonData, null, 2)
      } catch (e) {
      }
      
      const responseHeaders: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })
      
      const responseData = {
        status: response.status,
        statusText: response.statusText,
        time: `${endTime - startTime}ms`,
        size: `${new Blob([responseText]).size} bytes`,
        headers: responseHeaders,
        body: formattedBody,
        request: {
          url,
          method: requestData.method,
          headers,
          body: options.body as string || undefined
        }
      }
      setResponse(responseData)
    } catch (error: any) {
      const endTime = Date.now()
      setResponse({
        status: 0,
        statusText: 'Network Error',
        time: `${endTime - startTime}ms`,
        size: '0 bytes',
        body: error.message || 'Failed to fetch'
      })
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <input
            type="text"
            value={data.name}
            onChange={(e) => updateData({ name: e.target.value })}
            placeholder="Untitled Request"
            className="text-[13px] font-medium bg-transparent outline-none placeholder:text-gray-400"
          />
          <AutoSaveIndicator status={saveStatus} />
        </div>
      </div>

      <div className="px-3 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <select 
            value={data.method}
            onChange={(e) => updateData({ method: e.target.value })}
            className="px-2.5 py-1.5 text-[13px] font-medium border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0064FF] min-w-[80px]"
          >
            {httpMethods.map(method => (
              <option key={method.value} value={method.value}>{method.label}</option>
            ))}
          </select>
          <input
            type="text"
            value={data.path}
            onChange={(e) => updateData({ path: e.target.value })}
            placeholder="https://api.example.com/endpoint"
            className="flex-1 px-3 py-1.5 text-[13px] border border-gray-200 rounded-md placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0064FF]"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !data.path}
            className="px-3 py-1.5 text-[13px] font-medium bg-[#0064FF] hover:bg-[#0050C8] disabled:bg-gray-300 text-white rounded-md transition-colors flex items-center gap-1.5"
          >
            <Send size={12} />
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>

      <div className="flex border-b border-gray-100 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {[
          { key: 'params', label: 'Params' },
          { key: 'authorization', label: 'Authorization' },
          { key: 'headers', label: 'Headers' },
          { key: 'body', label: 'Body' }
        ].map(section => (
          <button
            key={section.key}
            onClick={() => setActiveSection(section.key as any)}
            className={`px-3 py-2 text-[13px] font-medium transition-all flex-shrink-0 ${
              activeSection === section.key
                ? 'text-[#0064FF] border-b-2 border-[#0064FF]'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className={`${response ? 'w-1/2' : 'flex-1'} flex flex-col min-w-0`}>
          <div className="flex-1 p-3 overflow-y-auto min-h-0">
            {activeSection === 'params' && <ParamsSection requestData={requestData} setRequestData={setRequestData} />}
            {activeSection === 'authorization' && <AuthorizationSection requestData={requestData} setRequestData={setRequestData} />}
            {activeSection === 'headers' && <HeadersSection requestData={requestData} setRequestData={setRequestData} />}
            {activeSection === 'body' && <BodySection requestData={requestData} setRequestData={setRequestData} />}
          </div>
        </div>

        {response && (
          <div className="w-1/2 flex flex-col border-l border-gray-100 min-w-0">
            <div className="px-3 py-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-medium text-gray-900">Response</h3>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${
                    response.status >= 200 && response.status < 300 
                      ? 'bg-green-50 text-green-700' 
                      : 'bg-red-50 text-red-700'
                  }`}>
                    {response.status} {response.statusText}
                  </span>
                  <span className="text-gray-500">{response.time}</span>
                  <span className="text-gray-500">{response.size}</span>
                </div>
              </div>
            </div>
            <ResponseViewer response={response} />
          </div>
        )}
      </div>
    </div>
  )
}

function TestSection({ 
  endpoint,
  variables,
  requestData,
  setRequestData,
  onUpdateRequestData,
  response,
  isLoading,
  onTest,
  project
}: {
  endpoint: Endpoint
  variables: Variable[]
  requestData: any
  setRequestData: (data: any) => void
  onUpdateRequestData: (data: any) => void
  response: any
  isLoading: boolean
  onTest: (selectedServer?: Server | null) => void
  project?: Project | null
}) {
  const [activeTab, setActiveTab] = useState<'params' | 'auth' | 'headers' | 'body' | 'docs' | 'cookies'>('params')
  const [selectedServer, setSelectedServer] = useState<Server | null>(
    project?.servers?.[0] || null
  )

  const parseServers = (serversJson: any): Server[] => {
    if (!serversJson) return []
    if (Array.isArray(serversJson)) return serversJson
    if (typeof serversJson === 'string') {
      try {
        return JSON.parse(serversJson)
      } catch {
        return []
      }
    }
    return []
  }

  const servers = parseServers(project?.servers)

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className={`${response ? 'w-1/2' : 'flex-1'} flex flex-col min-w-0`}>
        <div className="px-3 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <select
              value={requestData?.method || 'GET'}
              onChange={(e) => {
                const newMethod = e.target.value
                setRequestData({ ...requestData, method: newMethod })
                onUpdateRequestData({ ...requestData, method: newMethod })
              }}
              className="px-2.5 py-1.5 text-[13px] font-medium border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF] min-w-[80px]"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
              <option value="HEAD">HEAD</option>
              <option value="OPTIONS">OPTIONS</option>
            </select>
            <div className="flex-1 flex">
              {servers.length > 0 && (
                <ServerSelector
                  servers={servers}
                  selectedServer={selectedServer || undefined}
                  onSelect={(server) => {
                    setSelectedServer(server)
                    if (server && requestData?.url && !requestData.url.startsWith('http')) {
                      const fullUrl = server.url + (requestData.url.startsWith('/') ? requestData.url : '/' + requestData.url)
                      setRequestData({ ...requestData, url: fullUrl })
                      onUpdateRequestData({ ...requestData, url: fullUrl })
                    }
                  }}
                />
              )}
              <VariableUrlInput
                value={requestData?.url || ''}
                onChange={(newUrl) => {
                  setRequestData({ ...requestData, url: newUrl })
                  onUpdateRequestData({ ...requestData, url: newUrl })
                }}
                variables={variables || []}
                placeholder={selectedServer ? "/endpoint" : "https://api.example.com/endpoint"}
                className={`text-[13px] border border-gray-200 ${servers.length > 0 ? 'rounded-r-md' : 'rounded-md'} focus:outline-none focus:ring-1 focus:ring-[#0064FF] bg-white`}
              />
            </div>
            <button
              onClick={() => onTest(selectedServer)}
              disabled={isLoading}
              className="px-3 py-1.5 bg-[#0064FF] hover:bg-[#0050C8] disabled:bg-gray-300 text-white text-[13px] font-medium rounded-md transition-colors flex items-center gap-1.5"
            >
              <Send size={12} />
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>

        <div className="flex bg-white border-b border-gray-100 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {(['params', 'auth', 'headers', 'body', 'cookies', 'docs'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 text-[13px] font-medium transition-colors capitalize flex-shrink-0 ${
                activeTab === tab
                  ? 'text-[#0064FF] border-b-2 border-[#0064FF]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'params' ? 'Params' : 
               tab === 'auth' ? 'Authorization' : 
               tab === 'headers' ? 'Headers' : 
               tab === 'body' ? 'Body' : 
               tab === 'cookies' ? 'Cookies' : 
               tab === 'docs' ? 'Documentation' : tab}
            </button>
          ))}
        </div>

        <div className="flex-1 p-3 overflow-y-auto bg-white min-h-0">
          {activeTab === 'params' && <ParamsSection requestData={requestData} setRequestData={setRequestData} />}
          {activeTab === 'auth' && <AuthorizationSection requestData={requestData} setRequestData={setRequestData} />}
          {activeTab === 'headers' && <HeadersSection requestData={requestData} setRequestData={setRequestData} />}
          {activeTab === 'body' && <BodySection requestData={requestData} setRequestData={setRequestData} />}
          {activeTab === 'cookies' && <CookiesSection requestData={requestData} setRequestData={setRequestData} />}
          {activeTab === 'docs' && <DocsSection projectId={project!.id} endpoint={endpoint} />}
        </div>
      </div>

      {response && (
        <div className="w-1/2 flex flex-col border-l border-gray-100 min-w-0">
          <div className="px-3 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-medium text-gray-900">Response</h3>
              <div className="flex items-center gap-2 text-[11px]">
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${
                  response.status >= 200 && response.status < 300
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}>
                  {response.status} {response.statusText}
                </span>
                <span className="text-gray-500">{response.time}</span>
                <span className="text-gray-500">{response.size}</span>
              </div>
            </div>
          </div>
          <ResponseViewer response={response} />
        </div>
      )}
    </div>
  )
}


function ParamsSection({ requestData, setRequestData }: { requestData: any; setRequestData: (data: any) => void }) {
  const params = requestData.params || []

  const addParam = () => {
    const newParams = [...params, { key: '', value: '', description: '', enabled: true }]
    setRequestData({ ...requestData, params: newParams })
  }

  const updateParam = (index: number, field: string, value: any) => {
    const updated = [...params]
    updated[index] = { ...updated[index], [field]: value }
    setRequestData({ ...requestData, params: updated })
  }

  const removeParam = (index: number) => {
    const updated = params.filter((_: any, i: number) => i !== index)
    setRequestData({ ...requestData, params: updated })
  }

  const ensureEmptyRow = () => {
    if (params.length === 0 || params[params.length - 1].key !== '') {
      addParam()
    }
  }

  useEffect(() => {
    ensureEmptyRow()
  }, [params.length])

  return (
    <div>
      <div className="border border-gray-100 rounded-md overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="w-10 px-3 py-2"></th>
              <th className="text-left text-[11px] font-medium text-gray-500 uppercase px-3 py-2">Key</th>
              <th className="text-left text-[11px] font-medium text-gray-500 uppercase px-3 py-2">Value</th>
              <th className="text-left text-[11px] font-medium text-gray-500 uppercase px-3 py-2">Description</th>
              <th className="w-8 px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {params.map((param: any, index: number) => (
              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2">
                  <input 
                    type="checkbox" 
                    checked={param.enabled}
                    onChange={(e) => updateParam(index, 'enabled', e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-gray-200 text-[#0064FF] focus:ring-1 focus:ring-[#0064FF] focus:ring-offset-0" 
                  />
                </td>
                <td className="px-3 py-2">
                  <input 
                    placeholder="Key" 
                    value={param.key}
                    onChange={(e) => {
                      updateParam(index, 'key', e.target.value)
                      if (index === params.length - 1 && e.target.value !== '') {
                        ensureEmptyRow()
                      }
                    }}
                    className="w-full px-2 py-1 text-[13px] bg-transparent hover:bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF] border border-transparent hover:border-gray-200 rounded-md transition-colors"
                  />
                </td>
                <td className="px-3 py-2">
                  <input 
                    placeholder="Value" 
                    value={param.value}
                    onChange={(e) => updateParam(index, 'value', e.target.value)}
                    className="w-full px-2 py-1 text-[13px] bg-transparent hover:bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF] border border-transparent hover:border-gray-200 rounded-md transition-colors"
                  />
                </td>
                <td className="px-3 py-2">
                  <input 
                    placeholder="Description" 
                    value={param.description}
                    onChange={(e) => updateParam(index, 'description', e.target.value)}
                    className="w-full px-2 py-1 text-[13px] bg-transparent hover:bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF] border border-transparent hover:border-gray-200 rounded-md transition-colors"
                  />
                </td>
                <td className="px-3 py-2">
                  {index !== params.length - 1 && (
                    <button 
                      onClick={() => removeParam(index)}
                      className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AuthorizationSection({ requestData, setRequestData }: { requestData: any; setRequestData: (data: any) => void }) {
  const [authType, setAuthType] = useState(requestData.auth?.type || 'none')
  const [credentials, setCredentials] = useState({
    bearerToken: requestData.auth?.credentials?.bearerToken || '',
    basicUsername: requestData.auth?.credentials?.basicUsername || '',
    basicPassword: requestData.auth?.credentials?.basicPassword || '',
    apiKey: requestData.auth?.credentials?.apiKey || '',
    apiValue: requestData.auth?.credentials?.apiValue || '',
    apiLocation: requestData.auth?.credentials?.apiLocation || 'header'
  })

  const updateAuth = (type: string, creds?: any) => {
    setAuthType(type)
    if (creds) setCredentials(creds)
    setRequestData({ ...requestData, auth: { type, credentials: creds || credentials } })
  }

  return (
    <div className="flex gap-3">
      <div className="w-[160px] flex-shrink-0">
        <h3 className="text-xs font-medium text-gray-900 mb-2">Authorization Type</h3>
        <div className="space-y-0.5">
          {[
            { value: 'none', label: 'No Auth' },
            { value: 'bearer', label: 'Bearer Token' },
            { value: 'basic', label: 'Basic Auth' },
            { value: 'apikey', label: 'API Key' },
            { value: 'oauth2', label: 'OAuth 2.0' }
          ].map(option => (
            <button
              key={option.value}
              onClick={() => updateAuth(option.value)}
              className={`w-full text-left px-2 py-1 text-xs rounded transition-colors ${
                authType === option.value
                  ? 'bg-[#0064FF] text-white'
                  : 'hover:bg-gray-50 text-gray-600'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1">
        {authType === 'none' && (
          <div className="flex items-center justify-center h-full text-gray-500 text-xs">
            This request does not use any authorization
          </div>
        )}
        
        {authType === 'bearer' && (
          <div>
            <h3 className="text-xs font-medium text-gray-900 mb-2">Bearer Token</h3>
            <label className="block text-xs text-gray-500 mb-1">Token</label>
            <input 
              type="text"
              value={credentials.bearerToken}
              onChange={(e) => updateAuth(authType, { ...credentials, bearerToken: e.target.value })}
              placeholder="Enter bearer token"
              className="w-full px-2 py-1 text-xs border border-gray-100 rounded font-mono focus:outline-none focus:ring-1 focus:ring-[#0064FF]"
            />
            <p className="text-xs text-gray-400 mt-1">
              The authorization header will be automatically generated when you send the request.
            </p>
          </div>
        )}
        
        {authType === 'basic' && (
          <div>
            <h3 className="text-xs font-medium text-gray-900 mb-2">Basic Authentication</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Username</label>
                <input 
                  type="text"
                  value={credentials.basicUsername}
                  onChange={(e) => updateAuth(authType, { ...credentials, basicUsername: e.target.value })}
                  placeholder="Enter username"
                  className="w-full px-2 py-1 text-xs border border-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-[#0064FF]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Password</label>
                <input 
                  type="password"
                  value={credentials.basicPassword}
                  onChange={(e) => updateAuth(authType, { ...credentials, basicPassword: e.target.value })}
                  placeholder="Enter password"
                  className="w-full px-2 py-1 text-xs border border-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-[#0064FF]"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              The authorization header will be automatically generated when you send the request.
            </p>
          </div>
        )}

        {authType === 'apikey' && (
          <div>
            <h3 className="text-xs font-medium text-gray-900 mb-2">API Key</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Key</label>
                <input 
                  type="text"
                  value={credentials.apiKey}
                  onChange={(e) => updateAuth(authType, { ...credentials, apiKey: e.target.value })}
                  placeholder="e.g. X-API-Key"
                  className="w-full px-2 py-1 text-xs border border-gray-100 rounded font-mono focus:outline-none focus:ring-1 focus:ring-[#0064FF]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Value</label>
                <input 
                  type="text"
                  value={credentials.apiValue}
                  onChange={(e) => updateAuth(authType, { ...credentials, apiValue: e.target.value })}
                  placeholder="Enter API key value"
                  className="w-full px-2 py-1 text-xs border border-gray-100 rounded font-mono focus:outline-none focus:ring-1 focus:ring-[#0064FF]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Add to</label>
                <select 
                  value={credentials.apiLocation}
                  onChange={(e) => updateAuth(authType, { ...credentials, apiLocation: e.target.value })}
                  className="w-full px-2 py-1 text-xs border border-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-[#0064FF]"
                >
                  <option value="header">Header</option>
                  <option value="query">Query Params</option>
                </select>
              </div>
            </div>
          </div>
        )}
        
        {authType === 'oauth2' && (
          <div className="flex items-center justify-center h-full text-gray-500 text-xs">
            OAuth 2.0 configuration coming soon
          </div>
        )}
      </div>
    </div>
  )
}

function HeadersSection({ requestData, setRequestData }: { requestData: any; setRequestData: (data: any) => void }) {
  const headers = requestData.headers || []

  const addHeader = () => {
    const newHeaders = [...headers, { key: '', value: '', description: '', enabled: true }]
    setRequestData({ ...requestData, headers: newHeaders })
  }

  const updateHeader = (index: number, field: string, value: any) => {
    const updated = [...headers]
    updated[index] = { ...updated[index], [field]: value }
    setRequestData({ ...requestData, headers: updated })
  }

  const removeHeader = (index: number) => {
    const updated = headers.filter((_: any, i: number) => i !== index)
    setRequestData({ ...requestData, headers: updated })
  }

  const ensureEmptyRow = () => {
    if (headers.length === 0 || headers[headers.length - 1].key !== '') {
      addHeader()
    }
  }

  useEffect(() => {
    ensureEmptyRow()
  }, [headers.length])

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">Headers</h3>
      </div>
      
      <div className="border border-gray-100 rounded overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="w-12 px-3 py-2"></th>
              <th className="text-left text-xs font-medium text-gray-600 px-3 py-2">KEY</th>
              <th className="text-left text-xs font-medium text-gray-600 px-3 py-2">VALUE</th>
              <th className="text-left text-xs font-medium text-gray-600 px-3 py-2">DESCRIPTION</th>
              <th className="w-10 px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {headers.map((header: any, index: number) => (
              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2">
                  <input 
                    type="checkbox" 
                    checked={header.enabled}
                    onChange={(e) => updateHeader(index, 'enabled', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#0064FF] focus:ring-[#0064FF]" 
                  />
                </td>
                <td className="px-3 py-2">
                  <input 
                    placeholder="Header name" 
                    value={header.key}
                    onChange={(e) => {
                      updateHeader(index, 'key', e.target.value)
                      if (index === headers.length - 1 && e.target.value !== '') {
                        ensureEmptyRow()
                      }
                    }}
                    className="w-full px-2 py-1 text-[13px] bg-transparent hover:bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF] border border-transparent hover:border-gray-200 rounded-md transition-colors"
                  />
                </td>
                <td className="px-3 py-2">
                  <input 
                    placeholder="Value" 
                    value={header.value}
                    onChange={(e) => updateHeader(index, 'value', e.target.value)}
                    className="w-full px-2 py-1 text-[13px] bg-transparent hover:bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF] border border-transparent hover:border-gray-200 rounded-md transition-colors"
                  />
                </td>
                <td className="px-3 py-2">
                  <input 
                    placeholder="Description" 
                    value={header.description}
                    onChange={(e) => updateHeader(index, 'description', e.target.value)}
                    className="w-full px-2 py-1 text-[13px] bg-transparent hover:bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF] border border-transparent hover:border-gray-200 rounded-md transition-colors"
                  />
                </td>
                <td className="px-3 py-2">
                  {index !== headers.length - 1 && (
                    <button 
                      onClick={() => removeHeader(index)}
                      className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CookiesSection({ requestData, setRequestData }: { requestData: any; setRequestData: (data: any) => void }) {
  const cookies = requestData.cookies || []

  const addCookie = () => {
    const newCookies = [...cookies, { name: '', value: '', domain: '', path: '/', expires: '', secure: false, httpOnly: false, sameSite: 'None', enabled: true }]
    setRequestData({ ...requestData, cookies: newCookies })
  }

  const updateCookie = (index: number, field: string, value: any) => {
    const updated = [...cookies]
    updated[index] = { ...updated[index], [field]: value }
    setRequestData({ ...requestData, cookies: updated })
  }

  const removeCookie = (index: number) => {
    const updated = cookies.filter((_: any, i: number) => i !== index)
    setRequestData({ ...requestData, cookies: updated })
  }

  const ensureEmptyRow = () => {
    if (cookies.length === 0 || cookies[cookies.length - 1].name !== '') {
      addCookie()
    }
  }

  useEffect(() => {
    ensureEmptyRow()
  }, [cookies.length])

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">Cookies</h3>
      </div>
      
      <div className="border border-gray-100 rounded overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="w-10 px-2 py-1.5"></th>
              <th className="text-left text-xs font-medium text-gray-500 px-2 py-1.5">NAME</th>
              <th className="text-left text-xs font-medium text-gray-500 px-2 py-1.5">VALUE</th>
              <th className="text-left text-xs font-medium text-gray-500 px-2 py-1.5">DOMAIN</th>
              <th className="text-left text-xs font-medium text-gray-500 px-2 py-1.5">PATH</th>
              <th className="text-left text-xs font-medium text-gray-500 px-2 py-1.5">EXPIRES</th>
              <th className="text-center text-xs font-medium text-gray-500 px-2 py-1.5">OPTIONS</th>
              <th className="w-8 px-2 py-1.5"></th>
            </tr>
          </thead>
          <tbody>
            {cookies.map((cookie: any, index: number) => (
              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2">
                  <input 
                    type="checkbox" 
                    checked={cookie.enabled}
                    onChange={(e) => updateCookie(index, 'enabled', e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-gray-200 text-[#0064FF] focus:ring-1 focus:ring-[#0064FF] focus:ring-offset-0" 
                  />
                </td>
                <td className="px-3 py-2">
                  <input 
                    placeholder="Cookie name" 
                    value={cookie.name}
                    onChange={(e) => {
                      updateCookie(index, 'name', e.target.value)
                      if (index === cookies.length - 1 && e.target.value !== '') {
                        ensureEmptyRow()
                      }
                    }}
                    className="w-full px-2 py-1 text-[13px] bg-transparent hover:bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF] border border-transparent hover:border-gray-200 rounded-md transition-colors"
                  />
                </td>
                <td className="px-3 py-2">
                  <input 
                    placeholder="Value" 
                    value={cookie.value}
                    onChange={(e) => updateCookie(index, 'value', e.target.value)}
                    className="w-full px-2 py-1 text-[13px] bg-transparent hover:bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF] border border-transparent hover:border-gray-200 rounded-md transition-colors"
                  />
                </td>
                <td className="px-3 py-2">
                  <input 
                    placeholder="Domain" 
                    value={cookie.domain}
                    onChange={(e) => updateCookie(index, 'domain', e.target.value)}
                    className="w-full px-2 py-1 text-[13px] bg-transparent hover:bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF] border border-transparent hover:border-gray-200 rounded-md transition-colors"
                  />
                </td>
                <td className="px-3 py-2">
                  <input 
                    placeholder="/" 
                    value={cookie.path}
                    onChange={(e) => updateCookie(index, 'path', e.target.value)}
                    className="w-full px-2 py-1 text-[13px] bg-transparent hover:bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF] border border-transparent hover:border-gray-200 rounded-md transition-colors"
                  />
                </td>
                <td className="px-3 py-2">
                  <input 
                    placeholder="Expires" 
                    value={cookie.expires}
                    onChange={(e) => updateCookie(index, 'expires', e.target.value)}
                    className="w-full px-2 py-1 text-[13px] bg-transparent hover:bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF] border border-transparent hover:border-gray-200 rounded-md transition-colors"
                  />
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center justify-center gap-3 text-xs">
                    <label className="flex items-center gap-1">
                      <input 
                        type="checkbox" 
                        checked={cookie.secure}
                        onChange={(e) => updateCookie(index, 'secure', e.target.checked)}
                        className="rounded border-gray-300 text-[#0064FF] focus:ring-[#0064FF]" 
                      />
                      <span className="text-gray-600">Secure</span>
                    </label>
                    <label className="flex items-center gap-1">
                      <input 
                        type="checkbox" 
                        checked={cookie.httpOnly}
                        onChange={(e) => updateCookie(index, 'httpOnly', e.target.checked)}
                        className="rounded border-gray-300 text-[#0064FF] focus:ring-[#0064FF]" 
                      />
                      <span className="text-gray-600">HttpOnly</span>
                    </label>
                  </div>
                </td>
                <td className="px-3 py-2">
                  {index !== cookies.length - 1 && (
                    <button 
                      onClick={() => removeCookie(index)}
                      className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function BodySection({ requestData, setRequestData }: { requestData: any; setRequestData: (data: any) => void }) {
  const [bodyType, setBodyType] = useState(requestData.bodyType || 'none')
  const [bodyContent, setBodyContent] = useState(requestData.body || '')
  const [formData, setFormData] = useState(requestData.formData || [])
  const [bodyFormat, setBodyFormat] = useState('json')
  const [jsonError, setJsonError] = useState<string | null>(null)

  const updateBody = (type: string, content?: string, form?: any[]) => {
    setBodyType(type)
    if (content !== undefined) {
      setBodyContent(content)
      if (type === 'raw' && bodyFormat === 'json' && content) {
        try {
          JSON.parse(content)
          setJsonError(null)
        } catch (e) {
          setJsonError('Invalid JSON format')
        }
      }
    }
    if (form !== undefined) setFormData(form)
    setRequestData({ ...requestData, bodyType: type, body: content || bodyContent, formData: form || formData })
  }

  const formatJSON = () => {
    try {
      const parsed = JSON.parse(bodyContent)
      const formatted = JSON.stringify(parsed, null, 2)
      updateBody(bodyType, formatted)
    } catch (e) {
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">Body</h3>
      </div>
      <div className="flex items-center gap-2 mb-3">
        {[
          { value: 'none', label: 'None', icon: null },
          { value: 'raw', label: 'Raw', icon: <FileCode size={14} /> },
          { value: 'form-data', label: 'Form Data', icon: null },
          { value: 'x-www-form-urlencoded', label: 'URL Encoded', icon: null }
        ].map((type) => (
          <button
            key={type.value}
            onClick={() => updateBody(type.value)}
            className={`flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded transition-all ${
              bodyType === type.value
                ? 'bg-[#0064FF] text-white'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {type.icon}
            {type.label}
          </button>
        ))}
      </div>

      {bodyType === 'raw' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <select 
              value={bodyFormat}
              onChange={(e) => setBodyFormat(e.target.value)}
              className="px-2 py-1 text-xs border border-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-[#0064FF]"
            >
              <option value="json">JSON</option>
              <option value="xml">XML</option>
              <option value="html">HTML</option>
              <option value="text">Text</option>
            </select>
            {bodyFormat === 'json' && (
              <button
                onClick={formatJSON}
                className="px-2 py-1 text-xs font-medium text-[#0064FF] hover:bg-[#E6F0FF] rounded transition-colors"
              >
                Format JSON
              </button>
            )}
            {jsonError && (
              <span className="text-xs text-red-600">{jsonError}</span>
            )}
          </div>
          {bodyFormat === 'json' ? (
            <div className="border border-gray-100 rounded overflow-hidden">
              <JsonEditor
                value={bodyContent}
                onChange={(value) => updateBody(bodyType, value || '')}
                height="250px"
              />
            </div>
          ) : (
            <textarea
              value={bodyContent}
              onChange={(e) => updateBody(bodyType, e.target.value)}
              className="w-full h-56 px-3 py-2 text-xs border border-gray-100 rounded font-mono focus:outline-none focus:ring-1 focus:ring-[#0064FF] resize-none"
              placeholder={bodyFormat === 'json' ? '{\n  "key": "value"\n}' : 'Enter request body...'}
            />
          )}
        </div>
      )}

      {bodyType === 'form-data' && (
        <div className="space-y-1.5">
          {formData.map((item: any, index: number) => (
            <div key={index} className="flex items-center gap-1.5">
              <input 
                placeholder="Key"
                value={item.key}
                onChange={(e) => {
                  const updated = [...formData]
                  updated[index] = { ...updated[index], key: e.target.value }
                  updateBody(bodyType, bodyContent, updated)
                }}
                className="flex-1 px-2 py-1 text-xs border border-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-[#0064FF]"
              />
              <input 
                placeholder="Value"
                value={item.value}
                onChange={(e) => {
                  const updated = [...formData]
                  updated[index] = { ...updated[index], value: e.target.value }
                  updateBody(bodyType, bodyContent, updated)
                }}
                className="flex-1 px-2 py-1 text-xs border border-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-[#0064FF]"
              />
              <select 
                value={item.type}
                onChange={(e) => {
                  const updated = [...formData]
                  updated[index] = { ...updated[index], type: e.target.value }
                  updateBody(bodyType, bodyContent, updated)
                }}
                className="px-2 py-1 text-xs border border-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-[#0064FF]"
              >
                <option value="text">Text</option>
                <option value="file">File</option>
              </select>
              <button 
                onClick={() => {
                  const updated = formData.filter((_: any, i: number) => i !== index)
                  updateBody(bodyType, bodyContent, updated)
                }}
                className="p-0.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          <button 
            onClick={() => {
              const updated = [...formData, { key: '', value: '', type: 'text' }]
              updateBody(bodyType, bodyContent, updated)
            }}
            className="text-xs text-[#0064FF] hover:text-[#0050C8]"
          >
            + Add field
          </button>
        </div>
      )}

      {bodyType === 'x-www-form-urlencoded' && (
        <div className="py-4 text-center border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-sm text-gray-500">URL Encoded form data coming soon</p>
        </div>
      )}
    </div>
  )
}

function OverviewTabContent({ 
  project,
  projectId
}: { 
  project?: Project | null
  projectId: string
}) {
  const { openModal } = useUIStore()
  const [isEditingName, setIsEditingName] = useState(false)
  const [editingName, setEditingName] = useState(project?.name || '')
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [editingDescription, setEditingDescription] = useState(project?.description || '')

  if (!project) {
    return <LoadingState message="Loading project overview..." />
  }

  const updateProject = async (updates: Partial<Project>) => {
    try {
      const updateData: any = {}
      if (updates.name !== undefined) updateData.name = updates.name
      if (updates.description !== undefined) updateData.description = updates.description === null ? undefined : updates.description
      if (updates.isPublic !== undefined) updateData.isPublic = updates.isPublic
      
      await ProjectApi.updateProject(projectId, updateData)
      window.location.reload()
    } catch (error) {
      console.error('Failed to update project:', error)
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0064FF] rounded-lg flex items-center justify-center">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <path d="M9 3v18" />
                <path d="M15 3v18" />
                <path d="M3 9h18" />
                <path d="M3 15h18" />
              </svg>
            </div>
            <div className="flex-1">
              {isEditingName ? (
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={async () => {
                    if (editingName.trim() && editingName !== project.name) {
                      await updateProject({ name: editingName.trim() })
                    }
                    setIsEditingName(false)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur()
                    } else if (e.key === 'Escape') {
                      setEditingName(project.name)
                      setIsEditingName(false)
                    }
                  }}
                  className="text-2xl font-bold bg-transparent border-0 border-b-2 border-[#0064FF] px-0 py-0 focus:outline-none"
                  autoFocus
                />
              ) : (
                <h1 
                  className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-[#0064FF] transition-colors"
                  onClick={() => {
                    setEditingName(project.name)
                    setIsEditingName(true)
                  }}
                >
                  {project.name}
                </h1>
              )}
            </div>
            </div>
            <button
              onClick={() => openModal('settings', { project })}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Settings size={16} />
              프로젝트 설정
            </button>
          </div>
          
          {isEditingDescription ? (
            <textarea
              value={editingDescription}
              onChange={(e) => setEditingDescription(e.target.value)}
              onBlur={async () => {
                if (editingDescription !== project.description) {
                  await updateProject({ description: editingDescription || null })
                }
                setIsEditingDescription(false)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setEditingDescription(project.description || '')
                  setIsEditingDescription(false)
                }
              }}
              className="w-full p-2 text-gray-600 bg-gray-50 border border-[#0064FF] rounded resize-none focus:outline-none"
              rows={3}
              autoFocus
            />
          ) : (
            <p 
              className="text-gray-600 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
              onClick={() => {
                setEditingDescription(project.description || '')
                setIsEditingDescription(true)
              }}
            >
              {project.description || 'Click to add a project description...'}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Project Information</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Created</span>
                <span className="text-gray-900">{new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Last Updated</span>
                <span className="text-gray-900">{new Date(project.updatedAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Visibility</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  project.isPublic ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'
                }`}>
                  {project.isPublic ? 'Public' : 'Private'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">API Configuration</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Servers</span>
                <span className="text-gray-900">{project.servers?.length || 0} configured</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">MSA Mode</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  (project.servers && Array.isArray(project.servers) && project.servers.length > 1) ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'
                }`}>
                  {(project.servers && Array.isArray(project.servers) && project.servers.length > 1) ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Getting Started</h2>
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-600">
              Welcome to your API documentation project. Here's how to get started:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>Create folders to organize your API endpoints</li>
              <li>Add endpoints to document your API operations</li>
              <li>Define schemas for request and response models</li>
              <li>Set up variables for environment-specific values</li>
              <li>Test your APIs directly from the documentation</li>
            </ol>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('openProjectSettings'))}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            Project Settings
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('openImportModal'))}
            className="px-4 py-2 bg-[#0064FF] hover:bg-[#0050C8] text-white rounded-lg text-sm font-medium transition-colors"
          >
            Import OpenAPI
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('openExportModal'))}
            className="px-4 py-2 border border-gray-200 hover:border-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            Export Documentation
          </button>
        </div>
      </div>
    </div>
  )
}
