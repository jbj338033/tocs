"use client"

import { useRouter, useParams } from "next/navigation"
import { useState, useEffect } from "react"

import { ProjectApi, Project, Server } from "@/entities/project"

import { LoadingState, ErrorMessage } from "@/shared/ui"
import { Button, Input } from "@/shared/ui/components"
import { ArrowLeft, Trash2, Globe, Lock } from "@/shared/ui/icons"



export default function ProjectSettings() {
  const router = useRouter()
  const params = useParams()
  const projectId = params?.projectId as string

  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string>()
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isPublic: false,
    isMSA: false,
    servers: [] as Server[]
  })

  useEffect(() => {
    loadProject()
  }, [projectId])

  const loadProject = async () => {
    try {
      setIsLoading(true)
      setError(undefined)
      const data = await ProjectApi.getProject(projectId)
      setProject(data)
      setFormData({
        name: data.name,
        description: data.description || "",
        isPublic: data.isPublic,
        isMSA: !!(data.servers && data.servers.length > 1),
        servers: data.servers || [{ name: 'default', url: 'https://api.example.com' }]
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) return

    try {
      setIsSaving(true)
      setError(undefined)
      
      await ProjectApi.updateProject(projectId, {
        name: formData.name,
        description: formData.description,
        isPublic: formData.isPublic,
        servers: formData.servers
      })
      
      router.push(`/dashboard/${projectId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return
    }

    try {
      setError(undefined)
      await ProjectApi.deleteProject(projectId)
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project')
    }
  }

  const handleBack = () => {
    router.push(`/dashboard/${projectId}`)
  }

  if (isLoading) {
    return <LoadingState message="Loading project settings..." />
  }

  if (error && !project) {
    return (
      <div className="h-full flex items-center justify-center">
        <ErrorMessage
          title="Failed to load project"
          message={error}
          onRetry={loadProject}
        />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="bg-white rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="p-2"
            >
              <ArrowLeft size={16} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Project Settings</h1>
              <p className="text-gray-600">Manage your project configuration</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <Input
              label="Project Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter project name"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional project description"
                className="w-full px-4 py-2.5 border-0 bg-gray-50 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all resize-none"
                rows={3}
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Visibility
              </label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 transition-colors">
                  <input
                    type="radio"
                    name="visibility"
                    checked={!formData.isPublic}
                    onChange={() => setFormData({ ...formData, isPublic: false })}
                    className="text-blue-600"
                  />
                  <Lock size={16} className="text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">Private</p>
                    <p className="text-sm text-gray-500">Only project members can access</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 transition-colors">
                  <input
                    type="radio"
                    name="visibility"
                    checked={formData.isPublic}
                    onChange={() => setFormData({ ...formData, isPublic: true })}
                    className="text-blue-600"
                  />
                  <Globe size={16} className="text-green-500" />
                  <div>
                    <p className="font-medium text-gray-900">Public</p>
                    <p className="text-sm text-gray-500">Anyone can view this project</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Server Configuration
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const newIsMSA = !formData.isMSA
                    setFormData({
                      ...formData,
                      isMSA: newIsMSA,
                      servers: newIsMSA 
                        ? [
                            { name: 'auth', url: 'https://auth.api.example.com' },
                            { name: 'user', url: 'https://user.api.example.com' }
                          ]
                        : [{ name: 'default', url: formData.servers[0]?.url || 'https://api.example.com' }]
                    })
                  }}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                    ${formData.isMSA ? 'bg-[#0064FF]' : 'bg-gray-200'}
                  `}
                >
                  <span className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${formData.isMSA ? 'translate-x-6' : 'translate-x-1'}
                  `} />
                  <span className="sr-only">MSA 환경</span>
                </button>
              </div>
              <p className="text-xs text-gray-500">
                {formData.isMSA 
                  ? '마이크로서비스별로 다른 서버를 설정할 수 있습니다.' 
                  : '단일 서버를 사용합니다.'}
              </p>

              {formData.isMSA ? (
                <div className="space-y-3">
                  {formData.servers.map((server, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={server.name}
                        onChange={(e) => {
                          const newServers = [...formData.servers]
                          newServers[index] = { ...server, name: e.target.value }
                          setFormData({ ...formData, servers: newServers })
                        }}
                        placeholder="서비스명"
                        className="w-32 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0064FF]"
                      />
                      <input
                        type="url"
                        value={server.url}
                        onChange={(e) => {
                          const newServers = [...formData.servers]
                          newServers[index] = { ...server, url: e.target.value }
                          setFormData({ ...formData, servers: newServers })
                        }}
                        placeholder="https://api.example.com"
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0064FF]"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newServers = formData.servers.filter((_, i) => i !== index)
                          setFormData({ ...formData, servers: newServers })
                        }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        servers: [...formData.servers, { name: `service${formData.servers.length + 1}`, url: 'https://api.example.com' }]
                      })
                    }}
                    className="text-[#0064FF]"
                  >
                    + 서비스 추가
                  </Button>
                </div>
              ) : (
                <div>
                  <input
                    type="url"
                    value={formData.servers[0]?.url || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, servers: [{ name: 'default', url: e.target.value }] })
                    }}
                    placeholder="https://api.example.com"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0064FF]"
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
              <Button
                type="submit"
                disabled={isSaving || !formData.name}
                className="flex-1"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleBack}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-red-200">
          <h2 className="text-lg font-bold text-red-900 mb-2">Danger Zone</h2>
          <p className="text-red-700 mb-4 text-sm">
            Once you delete a project, there is no going back. Please be certain.
          </p>
          <Button
            variant="ghost"
            onClick={handleDelete}
            className="bg-red-50 text-red-700 hover:bg-red-100"
          >
            <Trash2 size={14} className="mr-2" />
            Delete Project
          </Button>
        </div>
      </div>
    </div>
  )
}