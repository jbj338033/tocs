"use client";

import { useState, useEffect } from "react";
import { useProjectStore } from "@/shared/stores";
import { Plus, Pencil, Trash2, Globe, Server } from "@/shared/ui/icons";

interface OverviewPanelProps {
  project: any;
}

export function OverviewPanel({ project }: OverviewPanelProps) {
  const { servers, activeServer, setServers, setActiveServer } = useProjectStore();
  const [isEditingServers, setIsEditingServers] = useState(false);
  const [localServers, setLocalServers] = useState(servers);

  useEffect(() => {
    if (project?.servers) {
      setServers(project.servers);
      setLocalServers(project.servers);
    }
  }, [project, setServers]);

  const handleAddServer = () => {
    const newServer = {
      name: `Server ${localServers.length + 1}`,
      url: "https://",
      description: "",
    };
    setLocalServers([...localServers, newServer]);
  };

  const handleUpdateServer = (index: number, updates: any) => {
    const updated = [...localServers];
    updated[index] = { ...updated[index], ...updates };
    setLocalServers(updated);
  };

  const handleDeleteServer = (index: number) => {
    setLocalServers(localServers.filter((_, i) => i !== index));
  };

  const handleSaveServers = async () => {
    // TODO: Save to API
    setServers(localServers);
    setIsEditingServers(false);
  };

  return (
    <div className="p-4">
      {/* Project Info */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Project Information</h3>
        <div className="space-y-2">
          <div>
            <label className="text-xs text-gray-500">Name</label>
            <p className="text-sm text-gray-900">{project.name}</p>
          </div>
          {project.description && (
            <div>
              <label className="text-xs text-gray-500">Description</label>
              <p className="text-sm text-gray-900">{project.description}</p>
            </div>
          )}
          {project.version && (
            <div>
              <label className="text-xs text-gray-500">Version</label>
              <p className="text-sm text-gray-900">{project.version}</p>
            </div>
          )}
          <div>
            <label className="text-xs text-gray-500">Visibility</label>
            <p className="text-sm text-gray-900 flex items-center gap-1">
              <Globe size={14} />
              {project.isPublic ? "Public" : "Private"}
            </p>
          </div>
        </div>
      </div>

      {/* Servers */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Servers</h3>
          <button
            onClick={() => setIsEditingServers(!isEditingServers)}
            className="text-xs text-blue hover:text-blue-600"
          >
            {isEditingServers ? "Cancel" : "Edit"}
          </button>
        </div>

        {isEditingServers ? (
          <div className="space-y-3">
            {localServers.map((server, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <div className="space-y-2">
                  <input
                    type="text"
                    value={server.name}
                    onChange={(e) => handleUpdateServer(index, { name: e.target.value })}
                    placeholder="Server name"
                    className="w-full px-2 py-1 text-sm border border-gray-200 rounded"
                  />
                  <input
                    type="url"
                    value={server.url}
                    onChange={(e) => handleUpdateServer(index, { url: e.target.value })}
                    placeholder="Server URL"
                    className="w-full px-2 py-1 text-sm border border-gray-200 rounded"
                  />
                  <input
                    type="text"
                    value={server.description || ""}
                    onChange={(e) => handleUpdateServer(index, { description: e.target.value })}
                    placeholder="Description (optional)"
                    className="w-full px-2 py-1 text-sm border border-gray-200 rounded"
                  />
                  <button
                    onClick={() => handleDeleteServer(index)}
                    className="text-red-500 hover:text-red-600 text-xs"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={handleAddServer}
              className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-gray-400 hover:text-gray-700 flex items-center justify-center gap-2"
            >
              <Plus size={14} />
              Add Server
            </button>
            <button
              onClick={handleSaveServers}
              className="w-full py-2 bg-blue text-white rounded-lg text-sm hover:bg-blue-600"
            >
              Save Servers
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {servers.length === 0 ? (
              <p className="text-sm text-gray-500">No servers configured</p>
            ) : (
              servers.map((server) => (
                <div
                  key={server.name}
                  onClick={() => setActiveServer(server.name)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    activeServer === server.name
                      ? "border-blue bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Server size={14} className={activeServer === server.name ? "text-blue" : "text-gray-600"} />
                    <span className="text-sm font-medium">{server.name}</span>
                    {activeServer === server.name && (
                      <span className="text-xs text-blue bg-blue-100 px-2 py-0.5 rounded">Active</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600">{server.url}</p>
                  {server.description && (
                    <p className="text-xs text-gray-500 mt-1">{server.description}</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Statistics</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Endpoints</p>
            <p className="text-lg font-semibold">0</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Schemas</p>
            <p className="text-lg font-semibold">0</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Folders</p>
            <p className="text-lg font-semibold">0</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Variables</p>
            <p className="text-lg font-semibold">0</p>
          </div>
        </div>
      </div>
    </div>
  );
}