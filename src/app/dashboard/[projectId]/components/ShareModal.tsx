"use client"

import { useState, useEffect } from "react"
import { X, Copy, Globe, Lock, Users, ExternalLink, Check } from "@/shared/ui/icons"
import { Project } from "@/entities/project"

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  project: Project | null
}

export function ShareModal({ isOpen, onClose, project }: ShareModalProps) {
  const [visibility, setVisibility] = useState(project?.isPublic ? 'public' : 'private')
  const [copied, setCopied] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [members, setMembers] = useState<any[]>([])
  const shareUrl = `${window.location.origin}/docs/${project?.id}`

  useEffect(() => {
    if (project?.members) {
      setMembers(project.members)
    }
  }, [project])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">프로젝트 공유</h2>
          <button 
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">공개 설정</label>
            <div className="space-y-2">
              <button
                onClick={() => setVisibility('private')}
                className={`w-full flex items-start gap-3 p-3 border rounded-md transition-colors ${
                  visibility === 'private' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Lock size={16} className={visibility === 'private' ? 'text-blue-600' : 'text-gray-600'} />
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-gray-900">비공개</div>
                  <div className="text-xs text-gray-500 mt-0.5">팀 멤버만 접근 가능</div>
                </div>
              </button>

              <button
                onClick={() => setVisibility('public')}
                className={`w-full flex items-start gap-3 p-3 border rounded-md transition-colors ${
                  visibility === 'public' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Globe size={16} className={visibility === 'public' ? 'text-blue-600' : 'text-gray-600'} />
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-gray-900">공개</div>
                  <div className="text-xs text-gray-500 mt-0.5">링크가 있는 누구나 볼 수 있음</div>
                </div>
              </button>
            </div>
          </div>

          {visibility === 'public' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">공유 링크</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50 font-mono"
                />
                <button
                  onClick={handleCopy}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                  {copied ? '복사됨' : '복사'}
                </button>
              </div>
              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-sm text-blue-600 hover:text-blue-700"
              >
                새 탭에서 열기
                <ExternalLink size={14} />
              </a>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">팀 멤버</label>
              <button className="text-sm text-blue-600 hover:text-blue-700">
                멤버 추가
              </button>
            </div>
            <div className="space-y-2">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      {member.user?.image ? (
                        <img src={member.user.image} alt="" className="w-8 h-8 rounded-full" />
                      ) : (
                        <Users size={16} className="text-gray-600" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {member.user?.name || member.user?.email?.split('@')[0] || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-500">{member.user?.email || ''}</div>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-gray-600 bg-gray-200 px-2 py-1 rounded">
                    {member.role}
                  </span>
                </div>
              ))}
              {members.length === 0 && (
                <div className="text-sm text-gray-500 text-center py-4">아직 멤버가 없습니다</div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            닫기
          </button>
          <button
            onClick={async () => {
              setIsSaving(true)
              try {
                const response = await fetch(`/api/projects/${project?.id}/visibility`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ isPublic: visibility === 'public' })
                })
                
                if (!response.ok) {
                  throw new Error('Failed to update visibility')
                }
                
                window.location.reload()
              } catch (error) {
                console.error('Failed to save visibility:', error)
                alert('공개 설정 저장에 실패했습니다.')
              } finally {
                setIsSaving(false)
              }
            }}
            disabled={isSaving}
            className="flex-1 px-4 py-2 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? '저장 중...' : '변경사항 저장'}
          </button>
        </div>
      </div>
    </div>
  )
}