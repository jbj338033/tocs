"use client"

import { useState, useEffect } from "react"
import { 
  Settings, Plus, ChevronRight, ChevronDown
} from "@/shared/ui/icons"
import { Project } from "@/entities/project"

interface SidebarProps {
  projects: Project[]
  currentProjectId?: string
  onProjectSelect: (projectId: string) => void
  onCreateProject: () => void
  user?: { name?: string | null; email?: string | null; image?: string | null }
}

type CategoryType = 'collections' | 'variables'

export function Sidebar({ 
  projects, 
  currentProjectId,
  onProjectSelect,
  onCreateProject,
  user
}: SidebarProps) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('collections')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [showProjectMenu, setShowProjectMenu] = useState(false)
  const [showProjectSettings, setShowProjectSettings] = useState(false)

  const toggleItem = (itemId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  const currentProject = projects.find(p => p.id === currentProjectId)

  return (
    <div className="w-[320px] h-screen bg-white flex flex-col flex-shrink-0 border-r border-gray-200">
      {/* Project Selector - Full Width */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="relative">
          <button 
            onClick={() => setShowProjectMenu(!showProjectMenu)}
            className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue to-blue/80 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor"/>
                </svg>
              </div>
              <div className="text-left">
                <div className="text-[14px] font-semibold text-gray-900">
                  {currentProject?.name || '프로젝트 선택'}
                </div>
                <div className="text-[11px] text-gray-500">
                  {currentProject?.isPublic ? '퍼블릭' : '프라이빗'}
                </div>
              </div>
            </div>
            <ChevronDown size={14} className="text-gray-400" />
          </button>
          
          {showProjectMenu && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-[300px] overflow-y-auto">
              {projects.map(project => (
                <button
                  key={project.id}
                  onClick={() => {
                    onProjectSelect(project.id)
                    setShowProjectMenu(false)
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-200 to-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-gray-600">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor"/>
                    </svg>
                  </div>
                  <div className="text-left flex-1">
                    <div className="text-[13px] font-medium text-gray-900">
                      {project.name}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {project.isPublic ? '퍼블릭' : '프라이빗'}
                    </div>
                  </div>
                </button>
              ))}
              <div className="border-t border-gray-200">
                <button
                  onClick={() => {
                    onCreateProject()
                    setShowProjectMenu(false)
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Plus size={14} className="text-gray-600" />
                  </div>
                  <span className="text-[13px] font-medium text-gray-700">새 프로젝트</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Left Column - Categories */}
        <div className="w-[80px] bg-gray-50 flex flex-col">
          <div className="flex-1 py-2">
            <button 
              onClick={() => setSelectedCategory('collections')}
              className={`w-full flex flex-col items-center gap-1 py-3 px-2 transition-colors ${
                selectedCategory === 'collections' 
                  ? 'text-blue bg-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
              </svg>
              <span className="text-[10px] font-medium">Collections</span>
            </button>

            <button 
              onClick={() => setSelectedCategory('variables')}
              className={`w-full flex flex-col items-center gap-1 py-3 px-2 transition-colors ${
                selectedCategory === 'variables' 
                  ? 'text-blue bg-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3"/>
                <circle cx="6" cy="12" r="3"/>
                <circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              <span className="text-[10px] font-medium">Variables</span>
            </button>
          </div>

          {/* Settings Button */}
          <div className="p-2 border-t border-gray-200">
            <button
              onClick={() => setShowProjectSettings(!showProjectSettings)}
              className="w-full flex flex-col items-center gap-1 py-2 hover:bg-gray-100 rounded-lg transition-colors relative"
            >
              <Settings size={16} className="text-gray-500" />
              <span className="text-[9px] text-gray-600">Settings</span>
              
              {showProjectSettings && (
                <div className="absolute bottom-full right-0 mb-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 w-40">
                  <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-left">
                    <Settings size={12} className="text-gray-400" />
                    <span className="text-[12px] text-gray-600">프로젝트 설정</span>
                  </button>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Right Column - Category Content */}
        <div className="flex-1 bg-white">
          {selectedCategory === 'collections' && currentProject && (
            <CollectionsContent 
              projectId={currentProjectId!}
              expandedItems={expandedItems}
              toggleItem={toggleItem}
            />
          )}
          
          {selectedCategory === 'variables' && currentProject && (
            <VariablesContent projectId={currentProjectId!} />
          )}
        </div>
      </div>
    </div>
  )
}

function CollectionsContent({ 
  projectId,
  expandedItems, 
  toggleItem 
}: { 
  projectId: string
  expandedItems: Set<string>
  toggleItem: (id: string) => void 
}) {
  const [collections, setCollections] = useState<{ id: string; name: string; parentId?: string }[]>([])
  const [endpoints, setEndpoints] = useState<{ id: string; name: string; method: string; collectionId?: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  useEffect(() => {
    loadData()
  }, [projectId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [collectionsRes, endpointsRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/collections`, { credentials: 'include' }),
        fetch(`/api/projects/${projectId}/endpoints`, { credentials: 'include' })
      ])
      
      if (collectionsRes.ok) {
        const collectionsData = await collectionsRes.json()
        setCollections(collectionsData)
      }
      
      if (endpointsRes.ok) {
        const endpointsData = await endpointsRes.json()
        setEndpoints(endpointsData)
      }
    } catch (error) {
      console.error('Failed to load collections:', error)
    } finally {
      setLoading(false)
    }
  }

  const createCollection = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/collections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: '새 컬렉션', description: '' })
      })
      
      if (response.ok) {
        const newCollection = await response.json()
        setCollections(prev => [...prev, newCollection])
        setEditingId(newCollection.id)
        setEditingName(newCollection.name)
      }
    } catch (error) {
      console.error('Failed to create collection:', error)
    }
  }

  const updateCollection = async (id: string, name: string) => {
    if (!name.trim()) return
    
    try {
      const response = await fetch(`/api/projects/${projectId}/collections/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: name.trim() })
      })
      
      if (response.ok) {
        setCollections(prev => prev.map(c => c.id === id ? { ...c, name: name.trim() } : c))
        setEditingId(null)
        setEditingName('')
      }
    } catch (error) {
      console.error('Failed to update collection:', error)
      setEditingId(null)
      setEditingName('')
    }
  }

  const createEndpoint = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/endpoints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          name: '새 요청', 
          method: 'GET',
          path: '/new-endpoint',
          description: ''
        })
      })
      
      if (response.ok) {
        const newEndpoint = await response.json()
        setEndpoints(prev => [...prev, newEndpoint])
      }
    } catch (error) {
      console.error('Failed to create endpoint:', error)
    }
  }

  const createEndpointInCollection = async (collectionId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/endpoints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          name: '새 요청', 
          method: 'GET',
          path: '/new-endpoint',
          description: '',
          collectionId
        })
      })
      
      if (response.ok) {
        const newEndpoint = await response.json()
        setEndpoints(prev => [...prev, newEndpoint])
        // Expand the collection to show the new endpoint
        setExpandedItems(prev => new Set([...prev, collectionId]))
      }
    } catch (error) {
      console.error('Failed to create endpoint in collection:', error)
    }
  }

  const getEndpointsByCollection = (collectionId: string) => {
    return endpoints.filter(e => e.collectionId === collectionId)
  }

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'text-blue bg-blue/10'
      case 'POST': return 'text-green-600 bg-green-50'
      case 'PUT': return 'text-orange-600 bg-orange-50'
      case 'DELETE': return 'text-red-600 bg-red-50'
      case 'PATCH': return 'text-purple-600 bg-purple-50'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-[11px] text-gray-500">로딩중...</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-[14px] font-semibold text-gray-900">Collections</h3>
          <div className="relative">
            <button 
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="추가"
            >
              <Plus size={14} className="text-gray-500" />
            </button>
            
            {showAddMenu && (
              <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-40">
                <button 
                  onClick={() => {
                    createEndpoint()
                    setShowAddMenu(false)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue">
                    <polyline points="16 18 22 12 16 6"/>
                    <polyline points="8 6 2 12 8 18"/>
                  </svg>
                  <span className="text-[13px] text-gray-700">새 요청</span>
                </button>
                <button 
                  onClick={() => {
                    createCollection()
                    setShowAddMenu(false)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-500">
                    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
                  </svg>
                  <span className="text-[13px] text-gray-700">새 컬렉션</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {collections.length === 0 && endpoints.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-[13px] text-gray-500 mb-3">아직 API가 없습니다</p>
            <div className="space-y-2">
              <button 
                onClick={createEndpoint}
                className="w-full text-[12px] text-blue hover:bg-blue/5 px-3 py-2 rounded transition-colors"
              >
                첫 번째 요청 만들기
              </button>
              <button 
                onClick={createCollection}
                className="w-full text-[12px] text-gray-600 hover:bg-gray-50 px-3 py-2 rounded transition-colors"
              >
                컬렉션 만들기
              </button>
            </div>
          </div>
        ) : (
          <div className="py-1">
            {collections.map(collection => {
              const collectionEndpoints = getEndpointsByCollection(collection.id)
              return (
                <div key={collection.id} className="group">
                  <div className="flex items-center">
                    <div className="flex-1 flex items-center gap-2 px-4 py-2 text-[13px]">
                      <button
                        onClick={() => toggleItem(collection.id)}
                        className="flex items-center gap-2 hover:bg-gray-50 px-1 py-1 rounded transition-colors"
                      >
                        {expandedItems.has(collection.id) ? (
                          <ChevronDown size={12} className="text-gray-400" />
                        ) : (
                          <ChevronRight size={12} className="text-gray-400" />
                        )}
                      </button>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-500">
                        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
                      </svg>
                      {editingId === collection.id ? (
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onBlur={() => updateCollection(collection.id, editingName)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateCollection(collection.id, editingName)
                            } else if (e.key === 'Escape') {
                              setEditingId(null)
                              setEditingName('')
                            }
                          }}
                          className="flex-1 text-left font-medium text-gray-900 bg-transparent border-b border-blue focus:outline-none"
                          autoFocus
                        />
                      ) : (
                        <span 
                          className="flex-1 text-left font-medium text-gray-900 cursor-text"
                          onDoubleClick={() => {
                            setEditingId(collection.id)
                            setEditingName(collection.name)
                          }}
                        >
                          {collection.name}
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        createEndpointInCollection(collection.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 mr-2 hover:bg-gray-100 rounded transition-all"
                      title="컬렉션에 추가"
                    >
                      <Plus size={12} className="text-gray-400" />
                    </button>
                  </div>
                  
                  {expandedItems.has(collection.id) && (
                    <div className="ml-8 space-y-1">
                      {collectionEndpoints.map(endpoint => (
                        <button 
                          key={endpoint.id}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${getMethodColor(endpoint.method)}`}>
                            {endpoint.method}
                          </span>
                          <span className="flex-1 text-left truncate">{endpoint.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
            
            {/* Uncategorized endpoints */}
            {endpoints.filter(e => !e.collectionId).map(endpoint => (
              <button 
                key={endpoint.id}
                className="w-full flex items-center gap-2 px-4 py-2 text-[13px] text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${getMethodColor(endpoint.method)}`}>
                  {endpoint.method}
                </span>
                <span className="flex-1 text-left truncate">{endpoint.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function VariablesContent({ projectId }: { projectId: string }) {
  const [variables, setVariables] = useState<{ id: string; key: string; value: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')

  useEffect(() => {
    loadVariables()
  }, [projectId])

  const loadVariables = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${projectId}/variables`, { 
        credentials: 'include' 
      })
      
      if (response.ok) {
        const data = await response.json()
        setVariables(data)
      }
    } catch (error) {
      console.error('Failed to load variables:', error)
    } finally {
      setLoading(false)
    }
  }

  const addVariable = async () => {
    if (!newKey.trim() || !newValue.trim()) return
    
    try {
      const response = await fetch(`/api/projects/${projectId}/variables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          key: newKey.trim(),
          value: newValue.trim()
        })
      })
      
      if (response.ok) {
        const newVariable = await response.json()
        setVariables(prev => [...prev, newVariable])
        setNewKey('')
        setNewValue('')
        setShowForm(false)
      }
    } catch (error) {
      console.error('Failed to add variable:', error)
    }
  }

  const removeVariable = async (variableId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/variables/${variableId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (response.ok) {
        setVariables(prev => prev.filter(v => v.id !== variableId))
      }
    } catch (error) {
      console.error('Failed to remove variable:', error)
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-[12px] text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-[14px] font-semibold text-gray-900">Variables</h3>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="변수 추가"
          >
            <Plus size={14} className="text-gray-500" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-1">
        {showForm && (
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="space-y-2">
              <input
                type="text"
                placeholder="변수명 (예: base_url)"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue"
              />
              <input
                type="text"
                placeholder="값 (예: https://api.example.com)"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue"
              />
              <div className="flex gap-2">
                <button
                  onClick={addVariable}
                  className="px-3 py-1.5 text-[12px] bg-blue text-white rounded hover:opacity-90 transition-opacity"
                >
                  추가
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="px-3 py-1.5 text-[12px] text-gray-600 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}
        
        {variables.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-[12px] text-gray-500 mb-2">변수가 없습니다</p>
            <button 
              onClick={() => setShowForm(true)}
              className="text-[12px] text-blue hover:underline"
            >
              첫 번째 변수 추가하기
            </button>
          </div>
        ) : (
          <div className="px-4 space-y-2">
            {variables.map(variable => (
              <div key={variable.id} className="group p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-[13px] text-blue font-medium">
                      {"{{"}
                      {variable.key}
                      {"}}"}
                    </div>
                    <div className="text-[12px] text-gray-600 mt-1 break-all">{variable.value}</div>
                  </div>
                  <button
                    onClick={() => removeVariable(variable.id)}
                    className="opacity-0 group-hover:opacity-100 ml-2 p-1 text-gray-400 hover:text-red-500 transition-all"
                    title="변수 삭제"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}