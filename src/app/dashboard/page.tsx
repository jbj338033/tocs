"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

import { ProjectApi, Project } from "@/entities/project"
import { LoadingState, ErrorMessage, Modal } from "@/shared/ui"
import { Plus, User } from "@/shared/ui/icons"

export default function DashboardPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [showCreateModal, setShowCreateModal] = useState(false)

  const loadProjects = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(undefined)
      const data = await ProjectApi.getProjects()
      setProjects(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleCreateProject = useCallback(async (name: string, description?: string, serverUrl?: string) => {
    try {
      const newProject = await ProjectApi.createProject({ 
        name, 
        description,
        servers: [{
          name: 'Default',
          url: serverUrl || 'https://api.example.com'
        }]
      })
      setProjects(prev => [...prev, newProject])
      setShowCreateModal(false)
      router.push(`/dashboard/${newProject.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
    }
  }, [router])

  const handleProjectClick = useCallback((projectId: string) => {
    router.push(`/dashboard/${projectId}`)
  }, [router])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  if (isLoading) {
    return <LoadingState message="Loading projects..." />
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <ErrorMessage
          title="Failed to load projects"
          message={error}
          onRetry={loadProjects}
        />
      </div>
    )
  }

  return (
    <>
      <div className="h-screen bg-gray-50 flex flex-col">
        <Header 
          onCreateProject={() => setShowCreateModal(true)}
          user={session?.user}
        />
        
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto">
            {projects.length === 0 ? (
              <EmptyState onCreateProject={() => setShowCreateModal(true)} />
            ) : (
              <ProjectGrid 
                projects={projects} 
                onProjectClick={handleProjectClick}
              />
            )}
          </div>
        </main>
      </div>

      <Modal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="새 프로젝트"
      >
        <CreateProjectForm 
          onSubmit={handleCreateProject}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>
    </>
  )
}


interface HeaderProps {
  onCreateProject: () => void
  user?: { image?: string | null; name?: string | null; email?: string | null }
}

function Header({ onCreateProject, user }: HeaderProps) {
  return (
    <header className="bg-white px-8 h-16 flex items-center border-b border-gray-200">
      <div className="w-full max-w-[1400px] mx-auto flex items-center justify-between">
        <h1 className="text-xl font-semibold text-black">Tocs</h1>
        <div className="flex items-center gap-4">
          <button 
            onClick={onCreateProject}
            className="px-4 h-9 bg-blue text-white rounded-lg text-[14px] font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5"
          >
            <Plus size={16} />
            새 프로젝트
          </button>
          <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden cursor-pointer hover:bg-gray-200 transition-colors">
            {user?.image ? (
              <img 
                src={user.image} 
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={18} className="text-gray-500" />
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

interface EmptyStateProps {
  onCreateProject: () => void
}

function EmptyState({ onCreateProject }: EmptyStateProps) {
  return (
    <div className="h-full flex items-center justify-center min-h-[500px]">
      <div className="text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Plus size={32} className="text-gray-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">프로젝트가 없습니다</h2>
        <p className="text-gray-500 mb-8 text-[15px]">첫 번째 프로젝트를 만들어 시작해보세요</p>
        <button 
          onClick={onCreateProject}
          className="px-6 h-11 bg-blue text-white rounded-lg font-medium text-[15px] hover:opacity-90 transition-opacity"
        >
          프로젝트 만들기
        </button>
      </div>
    </div>
  )
}

interface ProjectGridProps {
  projects: Project[]
  onProjectClick: (projectId: string) => void
}

function ProjectGrid({ projects, onProjectClick }: ProjectGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {projects.map(project => (
        <ProjectCard 
          key={project.id}
          project={project}
          onClick={() => onProjectClick(project.id)}
        />
      ))}
    </div>
  )
}

interface ProjectCardProps {
  project: Project
  onClick: () => void
}

function ProjectCard({ project, onClick }: ProjectCardProps) {
  return (
    <div 
      className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 hover:shadow-md cursor-pointer transition-all group"
      onClick={onClick}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <div className="w-5 h-5 bg-blue rounded"></div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-[15px] truncate mb-1">
            {project.name}
          </h3>
          {project.description && (
            <p className="text-[13px] text-gray-500 line-clamp-2 leading-[1.5]">
              {project.description}
            </p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-3 text-[12px] text-gray-400 font-medium">
        <span>{project.isPublic ? '퍼블릭' : '프라이빗'}</span>
        <span>•</span>
        <span>멤버 {project.members?.length || 0}명</span>
      </div>
    </div>
  )
}

interface CreateProjectFormProps {
  onSubmit: (name: string, description?: string, serverUrl?: string) => void
  onCancel: () => void
}

function CreateProjectForm({ onSubmit, onCancel }: CreateProjectFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [serverUrl, setServerUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !serverUrl.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await onSubmit(name.trim(), description.trim() || undefined, serverUrl.trim())
    } catch (error) {
      console.error('Failed to create project:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label 
          htmlFor="name" 
          className="block text-[14px] font-medium text-gray-700 mb-1.5"
        >
          이름
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 h-10 border border-gray-300 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
          placeholder="프로젝트 이름"
          required
          autoFocus
        />
      </div>

      <div>
        <label 
          htmlFor="serverUrl" 
          className="block text-[14px] font-medium text-gray-700 mb-1.5"
        >
          Server URL
        </label>
        <input
          id="serverUrl"
          type="text"
          value={serverUrl}
          onChange={(e) => setServerUrl(e.target.value)}
          className="w-full px-3 h-10 border border-gray-300 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
          placeholder="https://api.example.com"
          required
        />
      </div>

      <div>
        <label 
          htmlFor="description" 
          className="block text-[14px] font-medium text-gray-700 mb-1.5"
        >
          설명 <span className="text-gray-400">(선택)</span>
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px] resize-none focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
          placeholder="프로젝트에 대한 간단한 설명"
          rows={3}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 h-10 bg-gray-100 text-gray-700 rounded-lg text-[14px] font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={!name.trim() || !serverUrl.trim() || isSubmitting}
          className="flex-1 h-10 bg-blue text-white rounded-lg text-[14px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '생성 중...' : '생성'}
        </button>
      </div>
    </form>
  )
}