"use client";

import { useState, useEffect } from "react";
import { Plus, FileCode, Search } from "@/shared/ui/icons";
import { useSchemaStore } from "@/shared/stores/schema";
import { useUIStore } from "@/shared/stores/ui";
import { useTabStore } from "@/shared/stores/tab";
import { SchemaApi } from "@/entities/schema";

interface SchemasPanelProps {
  projectId: string;
}

export function SchemasPanel({ projectId }: SchemasPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const { schemas, selectedSchemaId, setSchemas, setSelectedSchema } = useSchemaStore();
  const { openModal } = useUIStore();
  const { openSchema } = useTabStore();

  useEffect(() => {
    loadSchemas();
  }, [projectId]);

  const loadSchemas = async () => {
    try {
      setLoading(true);
      const data = await SchemaApi.getSchemas(projectId);
      setSchemas(data as any);
    } catch (error) {
      console.error("Failed to load schemas:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSchemas = schemas.filter((schema) => {
    const matchesSearch = schema.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         schema.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getSchemaIcon = (type: string) => {
    switch (type) {
      case "request":
        return "→";
      case "response":
        return "←";
      case "shared":
        return "↔";
      default:
        return "•";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-sm text-gray-500">Loading schemas...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b border-gray-200">
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search schemas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="px-3 py-2">
        <button
          onClick={() => openModal("newSchema", { projectId })}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm text-white bg-blue hover:bg-blue-600 rounded-lg transition-colors"
        >
          <Plus size={14} />
          New Schema
        </button>
      </div>

      {/* Schema List */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {filteredSchemas.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 mb-3">
              {searchQuery ? "No schemas found" : "No schemas yet"}
            </p>
            {!searchQuery && (
              <button
                onClick={() => openModal("newSchema", { projectId })}
                className="text-sm text-blue hover:text-blue-600"
              >
                Create your first schema
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredSchemas.map((schema) => (
              <div
                key={schema.id}
                onClick={() => {
                  setSelectedSchema(schema);
                  openSchema(schema);
                }}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedSchemaId === schema.id
                    ? "bg-blue-50 border border-blue"
                    : "hover:bg-gray-50 border border-transparent"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <FileCode size={16} className={selectedSchemaId === schema.id ? "text-blue" : "text-gray-500"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">{schema.name}</span>
                      <span className="text-xs text-gray-500 font-mono">{getSchemaIcon(schema.type)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        schema.type === "request" ? "bg-green-100 text-green-700" :
                        schema.type === "response" ? "bg-blue-100 text-blue-700" :
                        schema.type === "shared" ? "bg-purple-100 text-purple-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {schema.type}
                      </span>
                    </div>
                    {schema.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{schema.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}