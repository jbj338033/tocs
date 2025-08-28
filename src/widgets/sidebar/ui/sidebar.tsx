"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, ChevronDown, Upload, Download } from "@/shared/ui/icons";
import { useProjectStore, useEndpointStore, useUIStore } from "@/shared/stores";
import { ApisPanel } from "./panels/ApisPanel";
import { VariablesPanel } from "./panels/VariablesPanel";
import { HistoryPanel } from "./panels/HistoryPanel";

interface SidebarProps {
  projects: any[];
  currentProjectId?: string;
  onProjectSelect: (projectId: string) => void;
  onCreateProject: () => void;
  user?: { name?: string | null; email?: string | null; image?: string | null };
  onOpenOverview?: () => void;
  isReadOnly?: boolean;
}

export function Sidebar({
  projects,
  currentProjectId,
  onProjectSelect,
  onCreateProject,
  user,
  onOpenOverview,
  isReadOnly = false,
}: SidebarProps) {
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { selectedSidebarTab, setSelectedSidebarTab, openModal } = useUIStore();
  const currentProject = projects.find((p) => p.id === currentProjectId);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProjectMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="w-[360px] h-screen bg-white flex flex-col flex-shrink-0 border-r border-gray-100">
      <div className="p-3 border-b border-gray-100">
        <div className="relative" ref={menuRef}>
          <div className="w-full">
            <div
              onClick={() => setShowProjectMenu(!showProjectMenu)}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded-md transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#0064FF] rounded-md flex items-center justify-center flex-shrink-0">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="text-white"
                  >
                    <path
                      d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <div className="text-left flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-gray-900 truncate">
                    {currentProject?.name || "Select Project"}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {currentProject?.isPublic ? "Public" : "Private"}
                  </div>
                </div>
              </div>
              <ChevronDown size={16} className={`text-gray-400 transition-transform ${showProjectMenu ? 'rotate-180' : ''}`} />
            </div>
          </div>

          {showProjectMenu && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-[300px] overflow-y-auto">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => {
                    if (project.id !== currentProjectId) {
                      onProjectSelect(project.id);
                    }
                    setShowProjectMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${project.id === currentProjectId ? 'bg-[#0064FF]' : 'bg-gray-100'}`}>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      className={project.id === currentProjectId ? 'text-white' : 'text-gray-600'}
                    >
                      <path
                        d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-gray-900 truncate">
                      {project.name}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {project.isPublic ? "Public" : "Private"}
                    </div>
                  </div>
                  {project.id === currentProjectId && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#0064FF]">
                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              ))}
              <div className="border-t border-gray-100">
                <button
                  onClick={() => {
                    onCreateProject();
                    setShowProjectMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 transition-colors text-[#0064FF]"
                >
                  <Plus size={16} />
                  <span className="text-[13px] font-medium">New Project</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="w-16 bg-gray-50 border-r border-gray-100 flex flex-col">
          <div className="flex-1 py-2">
            <button
              onClick={() => setSelectedSidebarTab("apis")}
              className={`w-full flex flex-col items-center gap-1 py-3 px-2 ${
                selectedSidebarTab === "apis"
                  ? "text-[#0064FF] bg-white border-l-2 border-[#0064FF]"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              } transition-colors`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
              </svg>
              <span className="text-[10px] font-medium">APIs</span>
            </button>

            <button
              onClick={() => setSelectedSidebarTab("variables")}
              className={`w-full flex flex-col items-center gap-1 py-3 px-2 ${
                selectedSidebarTab === "variables"
                  ? "text-[#0064FF] bg-white border-l-2 border-[#0064FF]"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              } transition-colors`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect x="3" y="8" width="18" height="12" rx="2" />
                <path d="M8 8v-2a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
              <span className="text-[10px] font-medium">Variables</span>
            </button>

            <button
              onClick={() => setSelectedSidebarTab("history")}
              className={`w-full flex flex-col items-center gap-1 py-3 px-2 ${
                selectedSidebarTab === "history"
                  ? "text-[#0064FF] bg-white border-l-2 border-[#0064FF]"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              } transition-colors`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <polyline points="1 4 1 10 7 10" />
                <polyline points="23 20 23 14 17 14" />
                <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
              </svg>
              <span className="text-[10px] font-medium">History</span>
            </button>
          </div>
          
          <div className="border-t border-gray-100 py-2">
            <button
              onClick={() => openModal("import")}
              className="w-full flex flex-col items-center gap-1 py-3 px-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              <Upload size={18} />
              <span className="text-[10px] font-medium">Import</span>
            </button>

            <button
              onClick={() => openModal("export")}
              className="w-full flex flex-col items-center gap-1 py-3 px-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              <Download size={18} />
              <span className="text-[10px] font-medium">Export</span>
            </button>

            <button
              onClick={() => openModal("share")}
              className="w-full flex flex-col items-center gap-1 py-3 px-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="18" cy="9" r="3" />
                <circle cx="12" cy="17" r="3" />
                <circle cx="6" cy="9" r="3" />
                <line x1="13.73" y1="14.91" x2="16.27" y2="11.09" />
                <line x1="6.27" y1="11.09" x2="8.73" y2="14.91" />
              </svg>
              <span className="text-[10px] font-medium">Share</span>
            </button>
          </div>
        </div>

        <div className="flex-1 bg-white overflow-hidden relative min-h-0">
          {currentProject && selectedSidebarTab === "apis" && (
            <ApisPanel project={currentProject} onOpenOverview={onOpenOverview} isReadOnly={isReadOnly} />
          )}

          {currentProject && selectedSidebarTab === "variables" && (
            <VariablesPanel projectId={currentProject.id} isReadOnly={isReadOnly} />
          )}

          {currentProject && selectedSidebarTab === "history" && (
            <HistoryPanel projectId={currentProject.id} isReadOnly={isReadOnly} />
          )}
        </div>
      </div>
    </div>
  );
}