"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Plus, Edit, Check, X } from "@/shared/ui/icons";
import { Project, Server } from "@/entities/project";
import { ProjectApi } from "@/entities/project";

interface ServerSelectorProps {
  project: Project;
  selectedServerId: number;
  onServerSelect: (serverId: number) => void;
}

export function ServerSelector({ project, selectedServerId, onServerSelect }: ServerSelectorProps) {
  const [showServerMenu, setShowServerMenu] = useState(false);
  const [isAddingServer, setIsAddingServer] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newServerName, setNewServerName] = useState("");
  const [newServerUrl, setNewServerUrl] = useState("");
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  const servers = project.servers || [];
  const selectedServer = servers[selectedServerId] || servers[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowServerMenu(false);
        setIsAddingServer(false);
        setEditingIndex(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddServer = async () => {
    if (!newServerName.trim() || !newServerUrl.trim()) return;

    const newServers = [...servers, { name: newServerName, url: newServerUrl }];
    await ProjectApi.updateProject(project.id, { servers: newServers });
    
    setNewServerName("");
    setNewServerUrl("");
    setIsAddingServer(false);
    onServerSelect(newServers.length - 1);
  };

  const handleEditServer = async (index: number) => {
    if (!editName.trim() || !editUrl.trim()) return;

    const newServers = [...servers];
    newServers[index] = { name: editName, url: editUrl };
    await ProjectApi.updateProject(project.id, { servers: newServers });
    
    setEditingIndex(null);
  };

  const handleDeleteServer = async (index: number) => {
    if (servers.length <= 1) {
      alert("Project must have at least one server");
      return;
    }

    const newServers = servers.filter((_, i) => i !== index);
    await ProjectApi.updateProject(project.id, { servers: newServers });
    
    if (selectedServerId >= newServers.length) {
      onServerSelect(newServers.length - 1);
    } else if (selectedServerId > index) {
      onServerSelect(selectedServerId - 1);
    }
  };

  return (
    <div className="px-3 py-2 border-b border-gray-100">
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowServerMenu(!showServerMenu)}
          className="w-full flex items-center justify-between px-2 py-1.5 text-[12px] hover:bg-gray-50 rounded transition-colors"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
            <span className="font-medium text-gray-700 truncate">{selectedServer?.name || "No Server"}</span>
            <span className="text-gray-400 truncate text-[11px]">{selectedServer?.url || ""}</span>
          </div>
          <ChevronDown size={12} className={`text-gray-400 transition-transform ${showServerMenu ? 'rotate-180' : ''}`} />
        </button>

        {showServerMenu && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-[300px] overflow-y-auto">
            {servers.map((server, index) => (
              <div key={index}>
                {editingIndex === index ? (
                  <div className="p-2 border-b border-gray-100">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Server name"
                      className="w-full px-2 py-1 text-[12px] border border-gray-200 rounded mb-1 focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF]"
                      autoFocus
                    />
                    <input
                      type="text"
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                      placeholder="Server URL"
                      className="w-full px-2 py-1 text-[12px] border border-gray-200 rounded mb-1 focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF]"
                    />
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditServer(index)}
                        className="flex-1 px-2 py-1 text-[11px] bg-[#0064FF] text-white rounded hover:bg-[#0050C8] transition-colors"
                      >
                        <Check size={12} className="inline mr-1" />
                        Save
                      </button>
                      <button
                        onClick={() => setEditingIndex(null)}
                        className="flex-1 px-2 py-1 text-[11px] bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                      >
                        <X size={12} className="inline mr-1" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition-colors cursor-pointer group ${index === selectedServerId ? 'bg-blue-50' : ''}`}
                    onClick={() => {
                      onServerSelect(index);
                      setShowServerMenu(false);
                    }}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${index === selectedServerId ? 'bg-[#0064FF]' : 'bg-gray-300'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-medium text-gray-700 truncate">{server.name}</div>
                        <div className="text-[11px] text-gray-500 truncate">{server.url}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditName(server.name);
                          setEditUrl(server.url);
                          setEditingIndex(index);
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Edit size={12} className="text-gray-600" />
                      </button>
                      {servers.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteServer(index);
                          }}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <X size={12} className="text-gray-600" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {isAddingServer ? (
              <div className="p-2 border-t border-gray-100">
                <input
                  type="text"
                  value={newServerName}
                  onChange={(e) => setNewServerName(e.target.value)}
                  placeholder="Server name (e.g., Production)"
                  className="w-full px-2 py-1 text-[12px] border border-gray-200 rounded mb-1 focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF]"
                  autoFocus
                />
                <input
                  type="text"
                  value={newServerUrl}
                  onChange={(e) => setNewServerUrl(e.target.value)}
                  placeholder="Server URL (e.g., https://api.example.com)"
                  className="w-full px-2 py-1 text-[12px] border border-gray-200 rounded mb-1 focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF]"
                />
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleAddServer}
                    className="flex-1 px-2 py-1 text-[11px] bg-[#0064FF] text-white rounded hover:bg-[#0050C8] transition-colors"
                  >
                    <Check size={12} className="inline mr-1" />
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingServer(false);
                      setNewServerName("");
                      setNewServerUrl("");
                    }}
                    className="flex-1 px-2 py-1 text-[11px] bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    <X size={12} className="inline mr-1" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingServer(true)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-[#0064FF] border-t border-gray-100"
              >
                <Plus size={14} />
                <span className="text-[12px] font-medium">Add Server</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}