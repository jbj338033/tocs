"use client"

import { useState } from "react"
import { X, Download, FileText } from "@/shared/ui/icons"
import { Button } from "@/shared/ui/components"
import { FolderApi, EndpointApi } from "@/entities/folder"
import { ProjectApi } from "@/entities/project"

interface ExportModalProps {
  projectId: string
  isOpen: boolean
  onClose: () => void
}

type ExportFormat = 'openapi' | 'postman'

export function ExportModal({ projectId, isOpen, onClose }: ExportModalProps) {
  const [exportFormat, setExportFormat] = useState<ExportFormat>('openapi')
  const [isExporting, setIsExporting] = useState(false)

  if (!isOpen) return null

  const handleExport = async () => {
    try {
      setIsExporting(true)

      // Load project data
      const project = await ProjectApi.getProject(projectId)
      const folders = await FolderApi.getFolders(projectId)
      const endpoints = await EndpointApi.getEndpoints(projectId)

      if (exportFormat === 'openapi') {
        const openApiSpec = generateOpenAPISpec(project, folders, endpoints)
        downloadJSON(openApiSpec, `${project.name}-openapi.json`)
      } else {
        const postmanCollection = generatePostmanCollection(project, folders, endpoints)
        downloadJSON(postmanCollection, `${project.name}-postman.json`)
      }

      onClose()
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const generateOpenAPISpec = (project: any, folders: any[], endpoints: any[]) => {
    const paths: any = {}

    endpoints.forEach(endpoint => {
      if (!endpoint.type || endpoint.type === 'HTTP') {
        const path = endpoint.path
        if (!paths[path]) {
          paths[path] = {}
        }

        const operation: any = {
          summary: endpoint.name,
          description: endpoint.description,
          tags: []
        }

        // Find folder
        const folder = folders.find(f => f.id === endpoint.folderId)
        if (folder) {
          operation.tags.push(folder.name)
        }

        // Add parameters
        if (endpoint.parameters && endpoint.parameters.length > 0) {
          operation.parameters = endpoint.parameters.map((param: any) => ({
            name: param.name,
            in: param.location.toLowerCase(),
            required: param.required,
            description: param.description,
            schema: {
              type: param.type.toLowerCase()
            }
          }))
        }

        // Add request body
        if (endpoint.body && ['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
          operation.requestBody = {
            content: {
              [endpoint.body.contentType]: {
                schema: endpoint.body.schema ? JSON.parse(endpoint.body.schema) : {},
                example: endpoint.body.example ? JSON.parse(endpoint.body.example) : undefined
              }
            },
            description: endpoint.body.description
          }
        }

        // Add responses
        if (endpoint.responses && endpoint.responses.length > 0) {
          operation.responses = {}
          endpoint.responses.forEach((response: any) => {
            operation.responses[response.statusCode] = {
              description: response.description || `${response.statusCode} response`,
              content: response.contentType ? {
                [response.contentType]: {
                  schema: response.schema ? JSON.parse(response.schema) : {},
                  example: response.example ? JSON.parse(response.example) : undefined
                }
              } : undefined
            }
          })
        } else {
          operation.responses = {
            '200': {
              description: 'Successful response'
            }
          }
        }

        paths[path][endpoint.method.toLowerCase()] = operation
      }
    })

    const servers = project.servers && project.servers.length > 0
      ? project.servers.map((server: any) => ({
          url: server.url,
          description: server.name
        }))
      : [{ url: 'https://api.example.com' }]

    return {
      openapi: '3.0.0',
      info: {
        title: project.name,
        description: project.description || '',
        version: '1.0.0'
      },
      servers,
      paths,
      tags: folders.map(f => ({
        name: f.name,
        description: f.description
      }))
    }
  }

  const generatePostmanCollection = (project: any, folders: any[], endpoints: any[]) => {
    const items: any[] = []

    // Group endpoints by folder
    const folderMap = new Map()
    folders.forEach(folder => {
      folderMap.set(folder.id, {
        ...folder,
        items: []
      })
    })

    // Add uncategorized folder
    folderMap.set(null, {
      name: 'Uncategorized',
      items: []
    })

    endpoints.forEach(endpoint => {
      if (!endpoint.type || endpoint.type === 'HTTP') {
        const request: any = {
          name: endpoint.name,
          request: {
            method: endpoint.method,
            header: [],
            url: {
              raw: '{{base_url}}' + endpoint.path,
              host: ['{{base_url}}'],
              path: endpoint.path.split('/').filter(Boolean)
            }
          }
        }

        // Add headers
        if (endpoint.headers) {
          request.request.header = endpoint.headers.map((header: any) => ({
            key: header.key,
            value: header.value || '',
            description: header.description
          }))
        }

        // Add query parameters
        if (endpoint.parameters) {
          const queryParams = endpoint.parameters.filter((p: any) => p.location === 'QUERY')
          if (queryParams.length > 0) {
            request.request.url.query = queryParams.map((param: any) => ({
              key: param.name,
              value: param.defaultValue || '',
              description: param.description
            }))
          }
        }

        // Add body
        if (endpoint.body && ['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
          request.request.body = {
            mode: 'raw',
            raw: endpoint.body.example || '',
            options: {
              raw: {
                language: 'json'
              }
            }
          }
        }

        const folder = folderMap.get(endpoint.folderId || null)
        if (folder) {
          folder.items.push(request)
        }
      }
    })

    // Build final structure
    folderMap.forEach((folder, id) => {
      if (folder.items.length > 0) {
        items.push({
          name: folder.name,
          item: folder.items
        })
      }
    })

    const variables = project.servers && project.servers.length > 0
      ? project.servers.map((server: any) => ({
          key: server.name === 'default' ? 'base_url' : `base_url_${server.name}`,
          value: server.url,
          type: 'string'
        }))
      : [{
          key: 'base_url',
          value: 'https://api.example.com',
          type: 'string'
        }]

    return {
      info: {
        name: project.name,
        description: project.description || '',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      item: items,
      variable: variables
    }
  }

  const downloadJSON = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Export API Documentation</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-colors">
                <input
                  type="radio"
                  name="format"
                  value="openapi"
                  checked={exportFormat === 'openapi'}
                  onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                  className="text-[#0064FF]"
                />
                <FileText size={16} className="text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">OpenAPI 3.0</p>
                  <p className="text-sm text-gray-500">Standard API specification format</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-colors">
                <input
                  type="radio"
                  name="format"
                  value="postman"
                  checked={exportFormat === 'postman'}
                  onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                  className="text-[#0064FF]"
                />
                <FileText size={16} className="text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Postman Collection</p>
                  <p className="text-sm text-gray-500">Import directly into Postman</p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="flex-1"
            >
              <Download size={16} className="mr-2" />
              {isExporting ? 'Exporting...' : 'Export'}
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isExporting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}