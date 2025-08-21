"use client"

import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

import { CollectionApi, EndpointApi, Collection, Endpoint } from "@/entities/collection"
import { ProjectApi, Project } from "@/entities/project"
import { TestHistoryApi } from "@/entities/test"
import { VariableApi, Variable } from "@/entities/variable"

import { LoadingState, ErrorMessage, JsonEditor } from "@/shared/ui"
import { AutoSaveIndicator } from "@/shared/ui/AutoSaveIndicator"
import { useAutoSave } from "@/shared/hooks/useAutoSave"
import { 
  Plus, Trash2, 
  ChevronRight, Folder,
  Send, Clock, Share, Code, Save, FileCode
} from "@/shared/ui/icons"
import { CollectionModal } from "./components/CollectionModal"
import { SettingsModal } from "./components/SettingsModal"
import { ShareModal } from "./components/ShareModal"
import { VariableModal } from "./components/VariableModal"
import { DocsSection } from "./components/DocsSection"
import { ResponseViewer } from "./components/ResponseViewer"
import { Breadcrumb, buildEndpointBreadcrumb } from "./components/Breadcrumb"
import { Sidebar } from "@/widgets/sidebar"

const httpMethods = [
  { value: "GET", label: "GET" },
  { value: "POST", label: "POST" },
  { value: "PUT", label: "PUT" },
  { value: "DELETE", label: "DELETE" },
  { value: "PATCH", label: "PATCH" },
  { value: "HEAD", label: "HEAD" },
  { value: "OPTIONS", label: "OPTIONS" }
]

interface Tab {
  id: string
  type: 'endpoint' | 'new'
  title: string
  endpoint?: Endpoint
  isModified?: boolean
  newData?: {
    name: string
    method: string
    path: string
    description: string
  }
}


export default function Dashboard() {
  const params = useParams()
  const projectId = params?.projectId as string
  const { data: session } = useSession()
  
  const [project, setProject] = useState<Project | null>(null)
  const [collections, setCollections] = useState<Collection[]>([])
  const [endpoints, setEndpoints] = useState<Endpoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>()
  
  const [tabs, setTabs] = useState<Tab[]>([])
  const [activeTabId, setActiveTabId] = useState<string>("")
  
  const [variables, setVariables] = useState<Variable[]>([])
  const [selectedVariable, setSelectedVariable] = useState<Variable | null>(null)
  const [showNewCollection, setShowNewCollection] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showVariableModal, setShowVariableModal] = useState(false)
  const [editingVariable, setEditingVariable] = useState<any | null>(null)
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    if (projectId) {
      loadProjectData()
    }
  }, [projectId])

  useEffect(() => {
    loadAllProjects()
  }, [])


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
      
      const [projectData, collectionsData, endpointsData, variablesData] = await Promise.all([
        ProjectApi.getProject(projectId),
        CollectionApi.getCollections(projectId),
        EndpointApi.getEndpoints(projectId),
        VariableApi.getVariables(projectId)
      ])
      
      setProject(projectData)
      setCollections(collectionsData)
      setEndpoints(endpointsData)
      setVariables(variablesData)
      
      if (!selectedVariable && variablesData.length > 0) {
        setSelectedVariable(variablesData[0])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project data')
    } finally {
      setIsLoading(false)
    }
  }




  const openNewRequestTab = () => {
    const newTab: Tab = {
      id: `new-${Date.now()}`,
      type: 'new',
      title: 'Untitled Request',
      newData: {
        name: "",
        method: "GET", 
        path: "",
        description: ""
      }
    }
    
    setTabs(prev => [...prev, newTab])
    setActiveTabId(newTab.id)
  }

  const closeTab = (tabId: string) => {
    setTabs(prev => {
      const filtered = prev.filter(tab => tab.id !== tabId)
      if (activeTabId === tabId && filtered.length > 0) {
        setActiveTabId(filtered[filtered.length - 1].id)
      } else if (filtered.length === 0) {
        setActiveTabId("")
      }
      return filtered
    })
  }


  const saveNewRequest = async (tabId: string, data: any) => {
    try {
      const created = await EndpointApi.createEndpoint(projectId, {
        ...data,
        method: data.method as any
      })
      
      setEndpoints(prev => [...prev, created])
      
      setTabs(prev => prev.map(tab => 
        tab.id === tabId 
          ? { ...tab, type: 'endpoint' as const, endpoint: created, title: created.name }
          : tab
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create endpoint')
    }
  }


  const handleCreateCollection = async (data: { name: string; description: string }) => {
    try {
      const created = await CollectionApi.createCollection(projectId, data)
      setCollections(prev => [...prev, created])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create collection')
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
    <div className="h-screen flex flex-col">
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
        />

      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        {activeTab && activeTab.type === 'endpoint' && activeTab.endpoint && (
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
            <Breadcrumb 
              items={buildEndpointBreadcrumb(activeTab.endpoint, collections, project?.name || '')}
            />
          </div>
        )}
        
        {tabs.length > 0 && (
          <div className="border-b border-gray-200 bg-white">
            <div className="flex items-center overflow-x-auto px-4 py-2">
              {tabs.map(tab => (
                <div
                  key={tab.id}
                  className={`flex items-center gap-2 px-4 py-2 cursor-pointer border-b-2 transition-colors ${
                    activeTabId === tab.id
                      ? 'border-blue text-gray-900 bg-gray-50'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setActiveTabId(tab.id)}
                >
                  <span className="text-sm">{tab.title}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      closeTab(tab.id)
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button 
                onClick={openNewRequestTab}
                className="px-3 py-2 text-gray-400 hover:text-gray-600"
              >
                +
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          {activeTab ? (
            <TabContent 
              tab={activeTab} 
              variable={selectedVariable}
              projectId={projectId}
              onSave={saveNewRequest}
              onCloseTab={closeTab}
              onUpdateTab={(id, updates) => {
                setTabs(prev => prev.map(tab => 
                  tab.id === id ? { ...tab, ...updates } : tab
                ))
              }}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Code size={28} className="text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  API 문서 작성을 시작하세요
                </h3>
                <p className="text-gray-600 mb-8">
                  새 엔드포인트를 만들거나 사이드바에서 기존 API를 선택하세요
                </p>
                
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={openNewRequestTab} 
                    className="px-6 py-3 bg-[#0064FF] hover:opacity-90 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={18} />
                    새 요청 만들기
                  </button>
                  <button 
                    onClick={() => setShowNewCollection(true)}
                    className="px-6 py-3 border border-gray-300 hover:border-gray-400 text-gray-700 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Folder size={18} />
                    컬렉션 만들기
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <CollectionModal 
        isOpen={showNewCollection}
        onClose={() => setShowNewCollection(false)}
        onCreate={handleCreateCollection}
      />
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        project={project}
        onUpdate={async (data) => {
          if (data.delete) {
            await ProjectApi.deleteProject(projectId)
            window.location.href = '/dashboard'
          } else {
            await ProjectApi.updateProject(projectId, data)
            await loadProjectData()
          }
        }}
      />
      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        project={project}
      />
      {editingVariable && (
        <VariableModal
          isOpen={showVariableModal}
          onClose={() => {
            setShowVariableModal(false)
            setEditingVariable(null)
          }}
          variable={editingVariable}
          onUpdate={async (updatedVariable) => {
            try {
              const updated = updatedVariable
              setVariables(variables.map(v => v.id === updated.id ? updated : v))
              if (selectedVariable?.id === updated.id) {
                setSelectedVariable(updated)
              }
            } catch (error) {
              console.error('Failed to update variable:', error)
              alert('변수 업데이트에 실패했습니다')
            }
          }}
        />
      )}
      </div>
    </div>
  )
}

function TabContent({ 
  tab,
  variable,
  projectId,
  onSave,
  onCloseTab,
  onUpdateTab
}: { 
  tab: Tab
  variable: any | null
  projectId: string
  onSave: (tabId: string, data: any) => void
  onCloseTab: (tabId: string) => void
  onUpdateTab: (tabId: string, updates: Partial<Tab>) => void
}) {
  if (tab.type === 'new') {
    return (
      <NewRequestTabContent 
        tab={tab} 
        variable={variable}
        projectId={projectId}
        onSave={onSave} 
        onUpdateTab={onUpdateTab} 
      />
    )
  }

  return (
    <EndpointTabContent 
      endpoint={tab.endpoint!} 
      variable={variable}
      projectId={projectId}
      onCloseTab={() => onCloseTab(tab.id)}
      onUpdateTab={(updates) => onUpdateTab(tab.id, updates)} 
    />
  )
}

function EndpointTabContent({ 
  endpoint,
  variable,
  projectId,
  onCloseTab,
  onUpdateTab 
}: { 
  endpoint: Endpoint
  variable: any | null
  projectId: string
  onCloseTab: () => void
  onUpdateTab: (updates: Partial<Tab>) => void
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<any>(null)
  const [requestData, setRequestData] = useState({
    url: endpoint.path || '',
    method: endpoint.method || 'GET',
    headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }],
    params: [],
    body: '',
    auth: { type: 'none', credentials: {} },
    cookies: []
  })


  const handleTest = async () => {
    setIsLoading(true)
    const startTime = Date.now()
    
    // Helper function to replace variables in strings
    const replaceVariables = (text: string): string => {
      if (!variable?.variables) return text
      let result = text
      Object.entries(variable.variables).forEach(([key, value]) => {
        const regex = new RegExp('{{' + key + '}}', 'g')
        result = result.replace(regex, value as string)
      })
      return result
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
        body: formattedBody
      }
      setResponse(responseData)
      
      try {
        await TestHistoryApi.createTestHistory(endpoint.id, {
          variableId: variable?.id,
          method: requestData.method,
          url,
          headers,
          params: requestData.params?.reduce((acc: any, p: any) => {
            if (p.enabled && p.key) acc[p.key] = p.value
            return acc
          }, {}),
          body: options.body as string || '',
          status: response.status,
          statusText: response.statusText,
          responseTime: endTime - startTime,
          responseSize: new Blob([responseText]).size,
          responseHeaders,
          responseBody: formattedBody
        })
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
    <div className="flex-1 flex flex-col">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">{endpoint.name}</h2>
            <span className={`text-xs font-semibold px-2 py-1 rounded-md ${
              endpoint.method === 'GET' ? 'bg-[#E6F0FF] text-[#0064FF]' :
              endpoint.method === 'POST' ? 'bg-green-100 text-green-700' :
              endpoint.method === 'PUT' ? 'bg-orange-100 text-orange-700' :
              endpoint.method === 'DELETE' ? 'bg-red-100 text-red-700' :
              endpoint.method === 'PATCH' ? 'bg-purple-100 text-purple-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {endpoint.method}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button 
              onClick={async () => {
                try {
                  await EndpointApi.updateEndpoint(endpoint.id, {
                    name: endpoint.name,
                    method: endpoint.method,
                    path: endpoint.path,
                    description: endpoint.description || undefined
                  })
                  onUpdateTab({ isModified: false })
                  alert('엔드포인트가 저장되었습니다!')
                } catch (error) {
                  alert('저장 중 오류가 발생했습니다')
                }
              }}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Save size={14} className="inline mr-1.5" />
              저장
            </button>
            <button 
              onClick={() => {
                const shareUrl = window.location.origin + '/api/docs/' + projectId + '/endpoint/' + endpoint.id
                navigator.clipboard.writeText(shareUrl)
                alert('공유 링크가 클립보드에 복사되었습니다!')
              }}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Share size={14} className="inline mr-1.5" />
              공유
            </button>
            <button 
              onClick={async () => {
                if (confirm('정말로 이 엔드포인트를 삭제하시겠습니까?')) {
                  await EndpointApi.deleteEndpoint(endpoint.id)
                  onCloseTab()
                  window.location.reload()
                }
              }}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        <TestSection 
          endpoint={endpoint}
          variable={variable}
          requestData={requestData}
          setRequestData={setRequestData}
          response={response}
          isLoading={isLoading}
          onTest={handleTest}
        />
      </div>
    </div>
  )
}

function NewRequestTabContent({ 
  tab,
  variable,
  projectId,
  onSave,
  onUpdateTab
}: { 
  tab: Tab
  variable: any | null
  projectId: string
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

  // Auto-save functionality
  useAutoSave(data, {
    delay: 2000, // 2 second delay
    enabled: !!(data.name && data.path), // Only auto-save if name and path exist
    onSave: async () => {
      try {
        setSaveStatus('saving')
        await new Promise(resolve => {
          onSave(tab.id, data)
          resolve(undefined)
        })
        setSaveStatus('saved')
        // Reset to idle after 2 seconds
        setTimeout(() => setSaveStatus('idle'), 2000)
      } catch (error) {
        setSaveStatus('error')
        console.error('Auto-save failed:', error)
        // Reset to idle after 3 seconds
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
        body: formattedBody
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
    <div className="flex-1 flex flex-col">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <input
            type="text"
            value={data.name}
            onChange={(e) => updateData({ name: e.target.value })}
            placeholder="Untitled Request"
            className="text-lg font-semibold bg-transparent outline-none placeholder:text-gray-400"
          />
          <AutoSaveIndicator status={saveStatus} />
        </div>
      </div>

      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <select 
            value={data.method}
            onChange={(e) => updateData({ method: e.target.value })}
            className="px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0064FF]"
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
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0064FF]"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !data.path}
            className="px-4 py-2 text-sm bg-[#0064FF] hover:bg-[#0050C8] disabled:bg-gray-300 text-white rounded-md transition-colors flex items-center gap-2"
          >
            <Send size={14} />
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>

      <div className="flex px-4 sm:px-6 border-b border-gray-200 overflow-x-auto">
        {[
          { key: 'params', label: 'Params' },
          { key: 'authorization', label: 'Authorization' },
          { key: 'headers', label: 'Headers' },
          { key: 'body', label: 'Body' }
        ].map(section => (
          <button
            key={section.key}
            onClick={() => setActiveSection(section.key as any)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-all ${
              activeSection === section.key
                ? 'text-[#0064FF] border-[#0064FF]'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>

      <div className="flex-1 flex">
        <div className={`${response ? 'w-1/2' : 'flex-1'} flex flex-col`}>
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
            {activeSection === 'params' && <ParamsSection requestData={requestData} setRequestData={setRequestData} />}
            {activeSection === 'authorization' && <AuthorizationSection requestData={requestData} setRequestData={setRequestData} />}
            {activeSection === 'headers' && <HeadersSection requestData={requestData} setRequestData={setRequestData} />}
            {activeSection === 'body' && <BodySection requestData={requestData} setRequestData={setRequestData} />}
          </div>
        </div>

        {response && (
          <div className="w-1/2 flex flex-col border-l border-gray-200">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Response</h3>
                <div className="flex items-center gap-3 text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    response.status >= 200 && response.status < 300 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
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
  variable,
  requestData,
  setRequestData,
  response,
  isLoading,
  onTest
}: {
  endpoint: Endpoint
  variable: any | null
  requestData: any
  setRequestData: (data: any) => void
  response: any
  isLoading: boolean
  onTest: () => void
}) {
  const [activeTab, setActiveTab] = useState<'params' | 'auth' | 'headers' | 'body' | 'docs' | 'cookies'>('params')

  return (
    <div className="flex-1 flex">
      <div className={`${response ? 'w-1/2' : 'flex-1'} flex flex-col`}>
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <select
              value={endpoint.method}
              className="px-3 py-2 text-sm font-semibold bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0064FF]"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
              <option value="HEAD">HEAD</option>
              <option value="OPTIONS">OPTIONS</option>
            </select>
            <input
              type="text"
              value={requestData.url}
              onChange={(e) => setRequestData({ ...requestData, url: e.target.value })}
              className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-md font-mono focus:outline-none focus:ring-2 focus:ring-[#0064FF]"
              placeholder="Enter request URL"
            />
            <button
              onClick={onTest}
              disabled={isLoading}
              className="px-6 py-2 bg-[#0064FF] hover:bg-[#0050C8] disabled:bg-gray-300 text-white text-sm font-medium rounded-md transition-colors flex items-center gap-2"
            >
              <Send size={16} />
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>

        <div className="flex border-b border-gray-100">
          {(['params', 'auth', 'headers', 'body', 'cookies', 'docs'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? 'text-[#0064FF] border-[#0064FF]'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              {tab === 'auth' ? 'Authorization' : tab === 'docs' ? 'Documentation' : tab}
            </button>
          ))}
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'params' && <ParamsSection requestData={requestData} setRequestData={setRequestData} />}
          {activeTab === 'auth' && <AuthorizationSection requestData={requestData} setRequestData={setRequestData} />}
          {activeTab === 'headers' && <HeadersSection requestData={requestData} setRequestData={setRequestData} />}
          {activeTab === 'body' && <BodySection requestData={requestData} setRequestData={setRequestData} />}
          {activeTab === 'cookies' && <CookiesSection requestData={requestData} setRequestData={setRequestData} />}
          {activeTab === 'docs' && <DocsSection endpoint={endpoint} />}
        </div>
      </div>

      {response && (
        <div className="w-1/2 flex flex-col border-l border-gray-100">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Response</h3>
              <div className="flex items-center gap-4 text-sm">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  response.status >= 200 && response.status < 300
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
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
  const [params, setParams] = useState(requestData.params || [])

  const addParam = () => {
    setParams([...params, { key: '', value: '', description: '', enabled: true }])
  }

  const updateParam = (index: number, field: string, value: any) => {
    const updated = [...params]
    updated[index] = { ...updated[index], [field]: value }
    setParams(updated)
    setRequestData({ ...requestData, params: updated })
  }

  const removeParam = (index: number) => {
    const updated = params.filter((_: any, i: number) => i !== index)
    setParams(updated)
    setRequestData({ ...requestData, params: updated })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-900">Query Parameters</h3>
        <button onClick={addParam} className="text-sm text-[#0064FF] hover:text-[#0050C8]">
          + Add
        </button>
      </div>
      
      {params.length === 0 ? (
        <div className="py-8 sm:py-12 text-center border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-sm text-gray-500 mb-2">No parameters added yet</p>
          <button onClick={addParam} className="text-sm text-[#0064FF] hover:text-[#0050C8]">
            Add your first parameter
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {params.map((param: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <input 
                type="checkbox" 
                checked={param.enabled}
                onChange={(e) => updateParam(index, 'enabled', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#0064FF] focus:ring-[#0064FF]" 
              />
              <input 
                placeholder="Key" 
                value={param.key}
                onChange={(e) => updateParam(index, 'key', e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0064FF]"
              />
              <input 
                placeholder="Value" 
                value={param.value}
                onChange={(e) => updateParam(index, 'value', e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0064FF]"
              />
              <input 
                placeholder="Description (optional)" 
                value={param.description}
                onChange={(e) => updateParam(index, 'description', e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0064FF]"
              />
              <button 
                onClick={() => removeParam(index)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
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
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">Type</label>
        <select 
          value={authType}
          onChange={(e) => updateAuth(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0064FF]"
        >
          <option value="none">No Auth</option>
          <option value="bearer">Bearer Token</option>
          <option value="basic">Basic Auth</option>
          <option value="apikey">API Key</option>
          <option value="oauth2">OAuth 2.0</option>
        </select>
      </div>
        
      {authType === 'bearer' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Token</label>
          <input 
            type="text"
            value={credentials.bearerToken}
            onChange={(e) => updateAuth(authType, { ...credentials, bearerToken: e.target.value })}
            placeholder="Enter bearer token"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md font-mono focus:outline-none focus:ring-2 focus:ring-[#0064FF]"
          />
        </div>
      )}
        
      {authType === 'basic' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input 
              type="text"
              value={credentials.basicUsername}
              onChange={(e) => updateAuth(authType, { ...credentials, basicUsername: e.target.value })}
              placeholder="Username"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0064FF]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password"
              value={credentials.basicPassword}
              onChange={(e) => updateAuth(authType, { ...credentials, basicPassword: e.target.value })}
              placeholder="Password"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0064FF]"
            />
          </div>
        </div>
      )}

      {authType === 'apikey' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Key</label>
              <input 
                type="text"
                value={credentials.apiKey}
                onChange={(e) => updateAuth(authType, { ...credentials, apiKey: e.target.value })}
                placeholder="e.g. X-API-Key"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md font-mono focus:outline-none focus:ring-2 focus:ring-[#0064FF]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
              <input 
                type="text"
                value={credentials.apiValue}
                onChange={(e) => updateAuth(authType, { ...credentials, apiValue: e.target.value })}
                placeholder="API key value"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md font-mono focus:outline-none focus:ring-2 focus:ring-[#0064FF]"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Add to</label>
            <select 
              value={credentials.apiLocation}
              onChange={(e) => updateAuth(authType, { ...credentials, apiLocation: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0064FF]"
            >
              <option value="header">Header</option>
              <option value="query">Query Params</option>
            </select>
          </div>
        </div>
      )}
    </div>
  )
}

function HeadersSection({ requestData, setRequestData }: { requestData: any; setRequestData: (data: any) => void }) {
  const [headers, setHeaders] = useState(requestData.headers || [])

  const addHeader = () => {
    const newHeaders = [...headers, { key: '', value: '', description: '', enabled: true }]
    setHeaders(newHeaders)
    setRequestData({ ...requestData, headers: newHeaders })
  }

  const updateHeader = (index: number, field: string, value: any) => {
    const updated = [...headers]
    updated[index] = { ...updated[index], [field]: value }
    setHeaders(updated)
    setRequestData({ ...requestData, headers: updated })
  }

  const removeHeader = (index: number) => {
    const updated = headers.filter((_: any, i: number) => i !== index)
    setHeaders(updated)
    setRequestData({ ...requestData, headers: updated })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-900">Headers</h3>
        <button onClick={addHeader} className="text-sm text-[#0064FF] hover:text-[#0050C8]">
          + Add
        </button>
      </div>
      
      <div className="space-y-2">
        {headers.map((header: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={header.enabled}
              onChange={(e) => updateHeader(index, 'enabled', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-[#0064FF] focus:ring-[#0064FF]" 
            />
            <input 
              placeholder="Header name" 
              value={header.key}
              onChange={(e) => updateHeader(index, 'key', e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0064FF]"
            />
            <input 
              placeholder="Value" 
              value={header.value}
              onChange={(e) => updateHeader(index, 'value', e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0064FF]"
            />
            <input 
              placeholder="Description (optional)" 
              value={header.description}
              onChange={(e) => updateHeader(index, 'description', e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0064FF]"
            />
            <button 
              onClick={() => removeHeader(index)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function CookiesSection({ requestData, setRequestData }: { requestData: any; setRequestData: (data: any) => void }) {
  const [cookies, setCookies] = useState(requestData.cookies || [])

  const addCookie = () => {
    const newCookies = [...cookies, { name: '', value: '', domain: '', path: '/', enabled: true }]
    setCookies(newCookies)
    setRequestData({ ...requestData, cookies: newCookies })
  }

  const updateCookie = (index: number, field: string, value: any) => {
    const updated = [...cookies]
    updated[index] = { ...updated[index], [field]: value }
    setCookies(updated)
    setRequestData({ ...requestData, cookies: updated })
  }

  const removeCookie = (index: number) => {
    const updated = cookies.filter((_: any, i: number) => i !== index)
    setCookies(updated)
    setRequestData({ ...requestData, cookies: updated })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-900">Cookies</h3>
        <button onClick={addCookie} className="text-sm text-[#0064FF] hover:text-[#0050C8]">
          + Add
        </button>
      </div>
      
      {cookies.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-sm text-gray-500 mb-2">No cookies added yet</p>
          <button onClick={addCookie} className="text-sm text-[#0064FF] hover:text-[#0050C8]">
            Add your first cookie
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {cookies.map((cookie: any, index: number) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-center">
              <input 
                type="checkbox" 
                checked={cookie.enabled}
                onChange={(e) => updateCookie(index, 'enabled', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#0064FF] focus:ring-[#0064FF]" 
              />
              <input 
                placeholder="Name" 
                value={cookie.name}
                onChange={(e) => updateCookie(index, 'name', e.target.value)}
                className="col-span-3 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0064FF]"
              />
              <input 
                placeholder="Value" 
                value={cookie.value}
                onChange={(e) => updateCookie(index, 'value', e.target.value)}
                className="col-span-3 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0064FF]"
              />
              <input 
                placeholder="Domain" 
                value={cookie.domain}
                onChange={(e) => updateCookie(index, 'domain', e.target.value)}
                className="col-span-2 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0064FF]"
              />
              <input 
                placeholder="Path" 
                value={cookie.path}
                onChange={(e) => updateCookie(index, 'path', e.target.value)}
                className="col-span-2 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0064FF]"
              />
              <button 
                onClick={() => removeCookie(index)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
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
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        {[
          { value: 'none', label: 'None', icon: null },
          { value: 'raw', label: 'Raw', icon: <FileCode size={14} /> },
          { value: 'form-data', label: 'Form Data', icon: null },
          { value: 'x-www-form-urlencoded', label: 'URL Encoded', icon: null }
        ].map((type) => (
          <button
            key={type.value}
            onClick={() => updateBody(type.value)}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
              bodyType === type.value
                ? 'bg-[#0064FF] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0064FF]"
            >
              <option value="json">JSON</option>
              <option value="xml">XML</option>
              <option value="html">HTML</option>
              <option value="text">Text</option>
            </select>
            {bodyFormat === 'json' && (
              <button
                onClick={formatJSON}
                className="px-3 py-1.5 text-sm font-medium text-[#0064FF] hover:bg-[#E6F0FF] rounded-md transition-colors"
              >
                Format JSON
              </button>
            )}
            {jsonError && (
              <span className="text-xs text-red-600">{jsonError}</span>
            )}
          </div>
          {bodyFormat === 'json' ? (
            <div className="border border-gray-200 rounded-md overflow-hidden">
              <JsonEditor
                value={bodyContent}
                onChange={(value) => updateBody(bodyType, value || '')}
                height="300px"
              />
            </div>
          ) : (
            <textarea
              value={bodyContent}
              onChange={(e) => updateBody(bodyType, e.target.value)}
              className="w-full h-64 px-4 py-3 text-sm border border-gray-200 rounded-md font-mono focus:outline-none focus:ring-2 focus:ring-[#0064FF] resize-none"
              placeholder={bodyFormat === 'json' ? '{\n  "key": "value"\n}' : 'Enter request body...'}
            />
          )}
        </div>
      )}

      {bodyType === 'form-data' && (
        <div className="space-y-2">
          {formData.map((item: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <input 
                placeholder="Key"
                value={item.key}
                onChange={(e) => {
                  const updated = [...formData]
                  updated[index] = { ...updated[index], key: e.target.value }
                  updateBody(bodyType, bodyContent, updated)
                }}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0064FF]"
              />
              <input 
                placeholder="Value"
                value={item.value}
                onChange={(e) => {
                  const updated = [...formData]
                  updated[index] = { ...updated[index], value: e.target.value }
                  updateBody(bodyType, bodyContent, updated)
                }}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0064FF]"
              />
              <select 
                value={item.type}
                onChange={(e) => {
                  const updated = [...formData]
                  updated[index] = { ...updated[index], type: e.target.value }
                  updateBody(bodyType, bodyContent, updated)
                }}
                className="px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0064FF]"
              >
                <option value="text">Text</option>
                <option value="file">File</option>
              </select>
              <button 
                onClick={() => {
                  const updated = formData.filter((_: any, i: number) => i !== index)
                  updateBody(bodyType, bodyContent, updated)
                }}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button 
            onClick={() => {
              const updated = [...formData, { key: '', value: '', type: 'text' }]
              updateBody(bodyType, bodyContent, updated)
            }}
            className="text-sm text-[#0064FF] hover:text-[#0050C8]"
          >
            + Add field
          </button>
        </div>
      )}

      {bodyType === 'x-www-form-urlencoded' && (
        <div className="py-6 sm:py-8 text-center border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-sm text-gray-500">URL Encoded form data coming soon</p>
        </div>
      )}
    </div>
  )
}


