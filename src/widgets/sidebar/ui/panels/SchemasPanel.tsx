"use client";

import { useState, useEffect } from "react";
import { Plus, FileCode } from "@/shared/ui/icons";
import { useSchemaStore } from "@/shared/stores/schema";
import { useUIStore } from "@/shared/stores/ui";
import { useTabStore } from "@/shared/stores/tab";
import { SchemaApi } from "@/entities/schema";

interface SchemasPanelProps {
  projectId: string;
}

export function SchemasPanel({ projectId }: SchemasPanelProps) {
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

      {/* Schema List */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {schemas.length === 0 ? (
          <div className="px-3 py-4">
            <p className="text-[12px] text-gray-400">No schemas</p>
          </div>
        ) : (
          <div className="space-y-1">
            {schemas.map((schema) => (
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