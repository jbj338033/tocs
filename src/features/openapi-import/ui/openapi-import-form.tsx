"use client"

import { useState } from "react"

import { EndpointApi, FolderApi, HttpMethod, ParameterType, ParameterLocation } from "@/entities/folder"

import { Button, Card } from "@/shared/ui/components"

interface OpenAPIImportFormProps {
  projectId: string
  onSuccess?: () => void
  onCancel?: () => void
}

interface OpenAPIEndpoint {
  url: string
  path: string
  format: string
}

interface OpenAPISpec {
  openapi?: string
  swagger?: string
  info: {
    title: string
    version: string
    description?: string
  }
  paths: {
    [path: string]: {
      [method: string]: {
        summary?: string
        description?: string
        parameters?: Array<{
          name: string
          in: "query" | "path" | "header" | "cookie"
          required?: boolean
          schema?: {
            type: string
            default?: any
            example?: any
          }
          description?: string
        }>
        requestBody?: {
          content: {
            [contentType: string]: {
              schema?: any
              example?: any
            }
          }
        }
        responses: {
          [statusCode: string]: {
            description?: string
            content?: {
              [contentType: string]: {
                schema?: any
                example?: any
              }
            }
          }
        }
        tags?: string[]
      }
    }
  }
  tags?: Array<{
    name: string
    description?: string
  }>
}

export function OpenAPIImportForm({ projectId, onSuccess, onCancel }: OpenAPIImportFormProps) {
  const [jsonInput, setJsonInput] = useState("")
  const [urlInput, setUrlInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [success, setSuccess] = useState<string>()
  const [detectedEndpoints, setDetectedEndpoints] = useState<OpenAPIEndpoint[]>([])
  const [selectedEndpoint, setSelectedEndpoint] = useState<OpenAPIEndpoint | null>(null)
  const [isScanning, setIsScanning] = useState(false)

  const parseOpenAPISpec = (jsonString: string): OpenAPISpec => {
    try {
      return JSON.parse(jsonString)
    } catch (err) {
      throw new Error("Invalid JSON format")
    }
  }

  const scanForOpenAPIEndpoints = async (serverUrl: string) => {
    setIsScanning(true)
    setError(undefined)
    setDetectedEndpoints([])
    
    const commonPaths = [
      '/openapi.json',
      '/swagger.json',
      '/v3/api-docs',
      '/v2/api-docs',
      '/api-docs',
      '/api/swagger.json',
      '/api/openapi.json',
      '/swagger/v1/swagger.json',
      '/swagger/v2/swagger.json',
      '/swagger/v3/swagger.json',
      '/api-docs.json',
      '/docs/swagger.json',
      '/docs/openapi.json'
    ]
    
    const detectedList: OpenAPIEndpoint[] = []
    
    for (const path of commonPaths) {
      try {
        const url = serverUrl.replace(/\/$/, '') + path
        const response = await fetch(url, {
          method: 'HEAD',
          mode: 'no-cors'
        })
        
        if (response.ok || response.type === 'opaque') {
          const format = path.includes('swagger') ? 'Swagger' : 'OpenAPI'
          detectedList.push({ url, path, format })
        }
      } catch (error) {
        // Ignore errors for non-existent endpoints
      }
    }
    
    setIsScanning(false)
    
    if (detectedList.length === 0) {
      setError("No OpenAPI endpoints found. Please check the URL or paste the JSON directly.")
    } else {
      setDetectedEndpoints(detectedList)
    }
  }

  const fetchOpenAPISpec = async (endpoint: OpenAPIEndpoint) => {
    try {
      setIsLoading(true)
      setError(undefined)
      
      const response = await fetch(endpoint.url)
      if (!response.ok) {
        throw new Error(`Failed to fetch OpenAPI spec: ${response.statusText}`)
      }
      
      const spec = await response.json()
      setJsonInput(JSON.stringify(spec, null, 2))
      setSelectedEndpoint(endpoint)
      
      // Automatically import after fetching
      await handleImport(spec)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to fetch OpenAPI specification")
    } finally {
      setIsLoading(false)
    }
  }

  const mapHttpMethod = (method: string): HttpMethod => {
    const upperMethod = method.toUpperCase()
    if (Object.values(HttpMethod).includes(upperMethod as HttpMethod)) {
      return upperMethod as HttpMethod
    }
    return HttpMethod.GET
  }

  const mapParameterType = (schemaType?: string): ParameterType => {
    switch (schemaType?.toLowerCase()) {
      case "integer":
        return ParameterType.INTEGER
      case "number":
        return ParameterType.NUMBER
      case "boolean":
        return ParameterType.BOOLEAN
      case "array":
        return ParameterType.ARRAY
      case "object":
        return ParameterType.OBJECT
      default:
        return ParameterType.STRING
    }
  }

  const mapParameterLocation = (location: string): ParameterLocation => {
    switch (location.toLowerCase()) {
      case "query":
        return ParameterLocation.QUERY
      case "path":
        return ParameterLocation.PATH
      case "header":
        return ParameterLocation.HEADER
      case "cookie":
        return ParameterLocation.COOKIE
      default:
        return ParameterLocation.QUERY
    }
  }

  const createFoldersFromTags = async (tags: string[], spec: OpenAPISpec) => {
    const folders = new Map<string, string>()
    
    if (spec.tags) {
      for (const tag of spec.tags) {
        try {
          const folder = await FolderApi.createFolder(projectId, {
            name: tag.name,
            description: tag.description
          })
          folders.set(tag.name, folder.id)
        } catch (err) {
          console.warn(`Failed to create folder for tag: ${tag.name}`)
        }
      }
    }

    for (const tag of tags) {
      if (!folders.has(tag)) {
        try {
          const folder = await FolderApi.createFolder(projectId, {
            name: tag,
            description: `Auto-generated folder for ${tag} endpoints`
          })
          folders.set(tag, folder.id)
        } catch (err) {
          console.warn(`Failed to create folder for tag: ${tag}`)
        }
      }
    }

    return folders
  }

  const handleImport = async (spec?: OpenAPISpec) => {
    if (!spec && !jsonInput.trim()) {
      setError("Please paste your OpenAPI JSON specification or enter a URL")
      return
    }

    try {
      setIsLoading(true)
      setError(undefined)
      setSuccess(undefined)

      if (!spec) {
        spec = parseOpenAPISpec(jsonInput)
      }
      
      if (!spec.openapi && !spec.swagger) {
        throw new Error("Invalid OpenAPI/Swagger specification")
      }

      const allTags = new Set<string>()
      Object.values(spec.paths).forEach(pathMethods => {
        Object.values(pathMethods).forEach(operation => {
          if (operation.tags) {
            operation.tags.forEach(tag => allTags.add(tag))
          }
        })
      })

      const folders = await createFoldersFromTags(Array.from(allTags), spec)
      
      let endpointsCreated = 0
      let defaultFolderId: string | undefined

      for (const [path, methods] of Object.entries(spec.paths)) {
        for (const [method, operation] of Object.entries(methods)) {
          try {
            let folderId: string | undefined

            if (operation.tags && operation.tags.length > 0) {
              folderId = folders.get(operation.tags[0])
            }

            if (!folderId) {
              if (!defaultFolderId) {
                const defaultFolder = await FolderApi.createFolder(projectId, {
                  name: "Imported Endpoints",
                  description: "Endpoints imported from OpenAPI specification"
                })
                defaultFolderId = defaultFolder.id
              }
              folderId = defaultFolderId
            }

            const endpoint = await EndpointApi.createEndpoint(projectId, {
              name: operation.summary || `${method.toUpperCase()} ${path}`,
              description: operation.description,
              method: mapHttpMethod(method),
              path,
              folderId
            })

            endpointsCreated++
          } catch (err) {
            console.warn(`Failed to create endpoint ${method} ${path}:`, err)
          }
        }
      }

      setSuccess(`Successfully imported ${endpointsCreated} endpoints and ${folders.size} folders`)
      
      if (onSuccess) {
        setTimeout(() => {
          onSuccess()
        }, 1500)
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import OpenAPI specification")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setJsonInput(content)
    }
    reader.readAsText(file)
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Import from OpenAPI
          </h2>
          <p className="text-sm text-gray-600">
            Import endpoints from OpenAPI 3.0 or Swagger 2.0 JSON specification
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter API URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="http://localhost:8080"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0064FF] focus:border-transparent"
              />
              <Button
                onClick={() => scanForOpenAPIEndpoints(urlInput)}
                disabled={!urlInput.trim() || isScanning}
                variant="secondary"
              >
                {isScanning ? "스캔중..." : "스캔"}
              </Button>
            </div>
          </div>

          {detectedEndpoints.length > 0 && (
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <p className="text-sm font-medium text-gray-700 mb-2">발견된 OpenAPI 엔드포인트:</p>
              {detectedEndpoints.map((endpoint, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 hover:border-[#0064FF] cursor-pointer transition-colors"
                  onClick={() => fetchOpenAPISpec(endpoint)}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{endpoint.path}</p>
                    <p className="text-xs text-gray-500">{endpoint.format}</p>
                  </div>
                  <span className="text-xs text-[#0064FF]">클릭하여 import</span>
                </div>
              ))}
            </div>
          )}

          <div className="text-center text-sm text-gray-500">또는</div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              JSON 파일 업로드
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#0064FF] file:text-white hover:file:bg-[#0050C8]"
            />
          </div>

          <div className="text-center text-sm text-gray-500">또는</div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              JSON 직접 붙여넣기
            </label>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='OpenAPI JSON을 여기에 붙여넣으세요...\n\n{\n  "openapi": "3.0.0",\n  "info": {\n    "title": "My API",\n    "version": "1.0.0"\n  },\n  "paths": {\n    ...\n  }\n}'
              rows={8}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0064FF] focus:border-transparent resize-none"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            onClick={() => handleImport()}
            disabled={isLoading || !jsonInput.trim()}
            className="flex-1"
          >
            {isLoading ? "Importing..." : "Import OpenAPI"}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}