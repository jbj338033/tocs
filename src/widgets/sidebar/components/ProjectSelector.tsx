"use client"

import { useState } from "react"
import { ChevronDown, Plus, Project as ProjectIcon } from "@/shared/ui/icons"
import { Project } from "@/entities/project"

interface ProjectSelectorProps {
  projects: Project[]
  currentProject?: Project
  onProjectSelect: (projectId: string) => void
}

export function ProjectSelector({ projects, currentProject, onProjectSelect }: ProjectSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="px-4 py-3 border-b border-gray-200">
      <div className="relative">
        <div className="w-full">
          <div 
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-[#0064FF] to-[#0064FF]/80 rounded-lg flex items-center justify-center flex-shrink-0">
                <ProjectIcon size={16} className="text-white" />
              </div>
              <div className="text-left flex-1">
                <div className="text-[14px] font-semibold text-gray-900">
                  {currentProject?.name || "프로젝트 선택"}
                </div>
                <div className="text-[11px] text-gray-500">
                  {currentProject?.isPublic ? "퍼블릭" : "프라이빗"}
                </div>
              </div>
            </div>
            <ChevronDown size={14} className="text-gray-400" />
          </div>
        </div>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-[300px] overflow-y-auto">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => {
                  if (project.id !== currentProject?.id) {
                    onProjectSelect(project.id)
                  }
                  setIsOpen(false)
                }}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-gray-200 to-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ProjectIcon size={14} className="text-gray-600" />
                </div>
                <div className="text-left flex-1">
                  <div className="text-[13px] font-medium text-gray-900">
                    {project.name}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {project.isPublic ? "퍼블릭" : "프라이빗"}
                  </div>
                </div>
              </button>
            ))}
            <div className="border-t border-gray-200">
              <button
                onClick={() => {
                  window.location.href = "/dashboard"
                  setIsOpen(false)
                }}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Plus size={14} className="text-gray-600" />
                </div>
                <span className="text-[13px] font-medium text-gray-700">
                  새 프로젝트
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}