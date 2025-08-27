"use client"

import { useState } from "react"
import { Button, Input, Card } from "@/shared/ui/components"
import { Upload, FileText, X } from "@/shared/ui/icons"

interface OpenAPIImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (data: any) => Promise<void>
  projectId: string
}

export function OpenAPIImportModal({ isOpen, onClose, onImport, projectId }: OpenAPIImportModalProps) {
  const [importMethod, setImportMethod] = useState<'url' | 'file' | 'text'>('file')
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleImport = async () => {
    setIsLoading(true)
    setError('')

    try {
      let data: any = null

      if (importMethod === 'url') {
        if (!url.trim()) {
          setError('Please enter a valid URL')
          setIsLoading(false)
          return
        }
        
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`Failed to fetch from URL: ${response.statusText}`)
        }
        data = await response.json()
        
      } else if (importMethod === 'file') {
        if (!file) {
          setError('Please select a file')
          setIsLoading(false)
          return
        }
        
        const fileText = await file.text()
        data = JSON.parse(fileText)
        
      } else if (importMethod === 'text') {
        if (!text.trim()) {
          setError('Please enter OpenAPI specification')
          setIsLoading(false)
          return
        }
        
        data = JSON.parse(text)
      }

      if (!data.openapi && !data.swagger) {
        throw new Error('Invalid OpenAPI specification. Missing "openapi" or "swagger" field.')
      }

      await onImport(data)
      onClose()
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import OpenAPI specification')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError('')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Import OpenAPI</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X size={16} />
            </Button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Import Method</label>
              <div className="flex gap-2">
                <Button
                  variant={importMethod === 'file' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setImportMethod('file')}
                >
                  <Upload size={14} className="mr-1" />
                  File
                </Button>
                <Button
                  variant={importMethod === 'url' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setImportMethod('url')}
                >
                  <FileText size={14} className="mr-1" />
                  URL
                </Button>
                <Button
                  variant={importMethod === 'text' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setImportMethod('text')}
                >
                  <FileText size={14} className="mr-1" />
                  Text
                </Button>
              </div>
            </div>

            {importMethod === 'file' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select OpenAPI File (JSON/YAML)
                </label>
                <input
                  type="file"
                  accept=".json,.yaml,.yml"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {file && (
                  <p className="mt-2 text-sm text-gray-600">
                    Selected: {file.name} ({(file.size / 1024).toFixed(1)}KB)
                  </p>
                )}
              </div>
            )}

            {importMethod === 'url' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OpenAPI Specification URL
                </label>
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://api.example.com/openapi.json"
                />
              </div>
            )}

            {importMethod === 'text' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OpenAPI Specification (JSON)
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder='{"openapi": "3.0.0", "info": {"title": "My API", "version": "1.0.0"}, ...}'
                />
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button variant="ghost" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={isLoading}>
                {isLoading ? 'Importing...' : 'Import'}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}