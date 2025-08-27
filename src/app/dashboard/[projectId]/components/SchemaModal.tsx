"use client"

import { useState } from "react"
import { X } from "@/shared/ui/icons"
import { SchemaApi, CreateSchemaData } from "@/entities/schema"

interface SchemaModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (schema: CreateSchemaData) => void
  projectId: string
}

export function SchemaModal({ isOpen, onClose, onCreate, projectId }: SchemaModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<"object" | "array" | "enum">("object")
  const [isCreating, setIsCreating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    try {
      setIsCreating(true)
      const newSchema = await SchemaApi.createSchema(projectId, {
        name: name.trim(),
        description: description.trim() || undefined,
        type,
      })
      onCreate(newSchema)
      handleClose()
    } catch (error) {
      console.error("Failed to create schema:", error)
      alert("Failed to create schema")
    } finally {
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    setName("")
    setDescription("")
    setType("object")
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={handleClose}
      />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Create Schema</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Schema Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="User Response"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Schema for user response objects"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Schema Type
              </label>
              <div className="flex gap-3">
                {(["object", "array", "enum"] as const).map((t) => (
                  <label key={t} className="flex items-center">
                    <input
                      type="radio"
                      value={t}
                      checked={type === t}
                      onChange={(e) => setType(e.target.value as typeof type)}
                      className="mr-2"
                    />
                    <span className="text-sm capitalize">{t}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || !name.trim()}
              className="flex-1 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {isCreating ? "Creating..." : "Create Schema"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}