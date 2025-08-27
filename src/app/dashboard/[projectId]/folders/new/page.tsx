"use client"

import { useRouter, useParams } from "next/navigation"
import { useState } from "react"

import { FolderApi } from "@/entities/folder"

import { Button, Input } from "@/shared/ui/components"
import { ArrowLeft, Folder } from "@/shared/ui/icons"


export default function NewFolder() {
  const router = useRouter()
  const params = useParams()
  const projectId = params?.projectId as string

  const [formData, setFormData] = useState({
    name: "",
    description: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) {
      setError("Folder name is required")
      return
    }

    try {
      setIsLoading(true)
      setError(undefined)
      
      await FolderApi.createFolder(projectId, {
        name: formData.name,
        description: formData.description
      })
      
      router.push(`/dashboard/${projectId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create folder')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    router.push(`/dashboard/${projectId}`)
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="p-2"
            >
              <ArrowLeft size={16} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create New Folder</h1>
              <p className="text-gray-600">Organize your endpoints into folders</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Folder Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., User Management"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description of this folder"
                className="w-full px-4 py-2.5 border-0 bg-gray-50 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all resize-none"
                rows={3}
              />
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-medium text-gray-900 mb-3">Preview</h3>
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Folder size={16} className="text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">
                    {formData.name || 'Folder Name'}
                  </h4>
                  {formData.description && (
                    <p className="text-xs text-gray-500 mt-1">{formData.description}</p>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
              <Button
                type="submit"
                disabled={isLoading || !formData.name}
                className="flex-1"
              >
                {isLoading ? 'Creating...' : 'Create Folder'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleBack}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}