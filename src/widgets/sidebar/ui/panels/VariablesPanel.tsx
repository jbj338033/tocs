"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Copy } from "@/shared/ui/icons";
import { useVariableStore } from "@/shared/stores";
import { VariableApi } from "@/entities/variable";
import { LoadingState, ErrorMessage } from "@/shared/ui";
import { useToast } from "@/shared/hooks/useToast";

interface VariablesPanelProps {
  projectId: string;
}

export function VariablesPanel({ projectId }: VariablesPanelProps) {
  const { variables, setVariables, selectedVariableId, setSelectedVariable } = useVariableStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newVariable, setNewVariable] = useState({ key: "", value: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    loadVariables();
  }, [projectId]);

  const loadVariables = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await VariableApi.getVariables(projectId);
      setVariables(data);
    } catch (error) {
      console.error("Failed to load variables:", error);
      setError(error instanceof Error ? error.message : "Failed to load variables");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (newVariable.key && newVariable.value) {
      try {
        await VariableApi.createVariable(projectId, newVariable);
        await loadVariables();
        setNewVariable({ key: "", value: "" });
        setIsAdding(false);
        toast.success("Variable added successfully");
      } catch (error) {
        console.error("Failed to add variable:", error);
        toast.error("Failed to add variable");
      }
    }
  };

  const handleUpdate = async (id: string, updates: { key?: string; value?: string }) => {
    try {
      await VariableApi.updateVariable(projectId, id, updates);
      await loadVariables();
      toast.success("Variable updated successfully");
    } catch (error) {
      console.error("Failed to update variable:", error);
      toast.error("Failed to update variable");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await VariableApi.deleteVariable(projectId, id);
      await loadVariables();
      toast.success("Variable deleted successfully");
    } catch (error) {
      console.error("Failed to delete variable:", error);
      toast.error("Failed to delete variable");
    }
  };

  const handleCopy = (variable: any) => {
    navigator.clipboard.writeText(`{{${variable.key}}}`);
    toast.success("Variable copied to clipboard");
  };

  if (loading) {
    return <LoadingState message="Loading variables..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        title="Failed to load variables"
        message={error}
        onRetry={loadVariables}
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
          <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Variables</h3>
          <button
            onClick={() => setIsAdding(true)}
            className="text-blue hover:bg-blue-50 p-1 rounded transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isAdding && (
          <div className="mb-4 p-3 border border-gray-200 rounded-lg">
            <input
              type="text"
              placeholder="Variable name"
              value={newVariable.key}
              onChange={(e) => setNewVariable({ ...newVariable, key: e.target.value })}
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded mb-2"
              autoFocus
            />
            <input
              type="text"
              placeholder="Value"
              value={newVariable.value}
              onChange={(e) => setNewVariable({ ...newVariable, value: e.target.value })}
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded mb-2"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                className="px-3 py-1 text-sm text-blue bg-blue-50 rounded hover:bg-blue-100 transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setNewVariable({ key: "", value: "" });
                }}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {variables.length === 0 && !isAdding ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 mb-3">No variables yet</p>
            <button
              onClick={() => setIsAdding(true)}
              className="text-sm text-blue hover:text-blue-600"
            >
              Add your first variable
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {variables.map((variable) => (
              <div
                key={variable.id}
                onClick={() => setSelectedVariable(variable)}
                className={`p-3 border rounded-lg transition-colors cursor-pointer ${
                  selectedVariableId === variable.id
                    ? "border-gray-300 bg-gray-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                {editingId === variable.id ? (
                  <div>
                    <input
                      type="text"
                      value={variable.key}
                      onChange={(e) => {
                        const updatedVariables = variables.map(v => 
                          v.id === variable.id ? { ...v, key: e.target.value } : v
                        );
                        setVariables(updatedVariables);
                      }}
                      className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded mb-2"
                    />
                    <input
                      type="text"
                      value={variable.value}
                      onChange={(e) => {
                        const updatedVariables = variables.map(v => 
                          v.id === variable.id ? { ...v, value: e.target.value } : v
                        );
                        setVariables(updatedVariables);
                      }}
                      className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded mb-2"
                    />
                    <button
                      onClick={() => {
                        const variable = variables.find(v => v.id === editingId);
                        if (variable) {
                          handleUpdate(variable.id, { key: variable.key, value: variable.value });
                        }
                        setEditingId(null);
                      }}
                      className="text-sm text-blue hover:text-blue-600"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{`{{${variable.key}}}`}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCopy(variable)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Copy"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={() => setEditingId(variable.id)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(variable.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{variable.value}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}