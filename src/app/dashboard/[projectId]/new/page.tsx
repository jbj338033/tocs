"use client"

import { useRouter, useParams } from "next/navigation"
import { useState } from "react"

import { EndpointApi } from "@/entities/folder"

import { Button, Input, Select, Badge } from "@/shared/ui/components"
import { ArrowLeft, Plus, Trash2 } from "@/shared/ui/icons"


const httpMethods = [
  { value: "GET", label: "GET" },
  { value: "POST", label: "POST" },
  { value: "PUT", label: "PUT" },
  { value: "DELETE", label: "DELETE" },
  { value: "PATCH", label: "PATCH" },
  { value: "HEAD", label: "HEAD" },
  { value: "OPTIONS", label: "OPTIONS" }
]

const methodColors = {
  GET: "text-blue-600 bg-blue-50",
  POST: "text-green-600 bg-green-50", 
  PUT: "text-orange-600 bg-orange-50",
  DELETE: "text-red-600 bg-red-50",
  PATCH: "text-purple-600 bg-purple-50",
  HEAD: "text-gray-600 bg-gray-50",
  OPTIONS: "text-gray-600 bg-gray-50"
}

export default function NewEndpoint() {
  const router = useRouter()
  const params = useParams()
  const projectId = params?.projectId as string

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    method: "GET",
    path: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.path) {
      setError("Name and path are required")
      return
    }

    try {
      setIsLoading(true)
      setError(undefined)
      
      await EndpointApi.createEndpoint(projectId, {
        name: formData.name,
        description: formData.description,
        method: formData.method as any,
        path: formData.path
      })
      
      router.push(`/dashboard/${projectId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create endpoint')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    router.push(`/dashboard/${projectId}`)
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6">
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
              <h1 className="text-2xl font-bold text-gray-900">Create New Endpoint</h1>
              <p className="text-gray-600">Add a new API endpoint to your project</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Input
                  label="Endpoint Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Get User Profile"
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description of what this endpoint does"
                    className="w-full px-4 py-2.5 border-0 bg-gray-50 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all resize-none"
                    rows={3}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    HTTP Method
                  </label>
                  <Select
                    value={formData.method}
                    onValueChange={(value) => setFormData({ ...formData, method: value })}
                    options={httpMethods}
                  />
                </div>

                <Input
                  label="Path"
                  value={formData.path}
                  onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                  placeholder="e.g., /api/users/{id}"
                  required
                />
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-medium text-gray-900 mb-3">Preview</h3>
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl">
                <Badge className={`px-2 py-1 text-xs font-mono border-0 rounded ${methodColors[formData.method as keyof typeof methodColors]}`}>
                  {formData.method}
                </Badge>
                <span className="font-mono text-sm text-gray-700">
                  {formData.path || '/path/to/endpoint'}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {formData.name || 'Endpoint Name'}
                {formData.description && (
                  <span className="block text-xs text-gray-500 mt-1">
                    {formData.description}
                  </span>
                )}
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
              <Button
                type="submit"
                disabled={isLoading || !formData.name || !formData.path}
                className="flex-1"
              >
                {isLoading ? 'Creating...' : 'Create Endpoint'}
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