"use client"

import { useState } from "react"
import { X, Globe, Lock, Trash2, Save } from "@/shared/ui/icons"
import { Project, Server } from "@/entities/project"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  project: Project | null
  onUpdate: (data: {
    name?: string
    description?: string
    isPublic?: boolean
    servers?: Server[]
    delete?: boolean
  }) => void
}

export function SettingsModal({ isOpen, onClose, project, onUpdate }: SettingsModalProps) {
  const [formData, setFormData] = useState({
    name: project?.name || "",
    description: project?.description || "",
    visibility: project?.isPublic ? "public" : "private"
  })
  const [servers, setServers] = useState<Server[]>(
    project?.servers?.map((s, idx) => ({ name: s.name || `Server ${idx + 1}`, url: s.url, description: s.description })) || []
  )
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'danger'>('general')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate({
      ...formData,
      servers,
      isPublic: formData.visibility === 'public'
    })
    onClose()
  }

  const addServer = () => {
    setServers([...servers, { name: `Server ${servers.length + 1}`, url: '' }])
  }

  const updateServer = (index: number, field: keyof Server, value: string) => {
    setServers(servers.map((server, idx) => 
      idx === index ? { ...server, [field]: value } : server
    ))
  }

  const removeServer = (index: number) => {
    setServers(servers.filter((_, idx) => idx !== index))
  }


  const handleDelete = () => {
    if (confirm("정말로 이 프로젝트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      onUpdate({ delete: true })
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">프로젝트 설정</h2>
          <button 
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'general'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            일반
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'security'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            보안
          </button>
          <button
            onClick={() => setActiveTab('danger')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'danger'
                ? 'text-red-600 border-red-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            위험 구역
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    프로젝트 이름
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    설명
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Servers (MSA 지원)
                    </label>
                    <button
                      type="button"
                      onClick={addServer}
                      className="text-sm text-[#0064FF] hover:text-[#0050C8]"
                    >
                      + 추가
                    </button>
                  </div>
                  <div className="space-y-2">
                    {servers.length === 0 ? (
                      <div className="text-sm text-gray-500 py-2">
                        서버를 추가하여 API 엔드포인트의 기본 주소를 설정하세요
                      </div>
                    ) : (
                      servers.map((server, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                          <input
                            type="text"
                            value={server.name}
                            onChange={(e) => updateServer(index, 'name', e.target.value)}
                            placeholder="서비스명 (예: Auth API)"
                            className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0064FF]"
                          />
                          <input
                            type="text"
                            value={server.url}
                            onChange={(e) => updateServer(index, 'url', e.target.value)}
                            placeholder="https://api.example.com"
                            className="flex-[2] px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0064FF]"
                          />
                          <button
                            type="button"
                            onClick={() => removeServer(index)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    프로젝트 공개 설정
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        value="private"
                        checked={formData.visibility === 'private'}
                        onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Lock size={16} className="text-gray-600" />
                          <span className="text-sm font-medium text-gray-900">비공개</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">팀 멤버만 이 프로젝트에 접근할 수 있습니다</p>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        value="public"
                        checked={formData.visibility === 'public'}
                        onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Globe size={16} className="text-gray-600" />
                          <span className="text-sm font-medium text-gray-900">공개</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">링크가 있는 모든 사람이 볼 수 있습니다</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">인증 설정</h3>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm text-gray-700">API 키 필수</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm text-gray-700">OAuth 2.0 사용</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">CORS 설정</h3>
                  <textarea
                    placeholder="허용할 도메인을 한 줄에 하나씩 입력하세요"
                    rows={4}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>
            )}

            {activeTab === 'danger' && (
              <div className="space-y-6">
                <div className="p-4 bg-red-50 rounded-lg">
                  <h3 className="text-sm font-medium text-red-900 mb-2">프로젝트 삭제</h3>
                  <p className="text-sm text-red-700 mb-4">
                    프로젝트를 삭제하면 모든 엔드포인트, 컬렉션, 설정이 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                  </p>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors flex items-center gap-2"
                  >
                    <Trash2 size={16} />
                    프로젝트 삭제
                  </button>
                </div>
              </div>
            )}
          </div>

          {activeTab !== 'danger' && (
            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors flex items-center justify-center gap-2"
              >
                <Save size={16} />
                저장
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}