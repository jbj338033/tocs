"use client"

import { useState } from "react"
import { Copy, Check, FileCode, FileText, Table, AlertCircle } from "@/shared/ui/icons"
import { JsonEditor } from "@/shared/ui"

interface ResponseViewerProps {
  response: {
    status: number
    statusText: string
    time: string
    size: string
    headers?: Record<string, string>
    body: string
    request?: {
      url: string
      method: string
      headers: Record<string, string>
      body?: string
    }
  }
}

export function ResponseViewer({ response }: ResponseViewerProps) {
  const [activeTab, setActiveTab] = useState<'body' | 'headers' | 'preview' | 'request' | 'info'>('body')
  const [copied, setCopied] = useState(false)
  const [viewMode, setViewMode] = useState<'pretty' | 'raw'>('pretty')

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(response.body)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getContentType = () => {
    const contentType = response.headers?.['content-type'] || response.headers?.['Content-Type'] || ''
    return contentType.toLowerCase()
  }

  const isJSON = () => {
    try {
      JSON.parse(response.body)
      return true
    } catch {
      return false
    }
  }

  const isXML = () => {
    const contentType = getContentType()
    return contentType.includes('xml') || 
           contentType.includes('application/rss+xml') ||
           contentType.includes('application/atom+xml') ||
           response.body.trim().startsWith('<')
  }

  const isHTML = () => {
    const contentType = getContentType()
    return contentType.includes('text/html') || 
           (response.body.includes('<html') || response.body.includes('<!DOCTYPE html'))
  }

  const isImage = () => {
    const contentType = getContentType()
    return contentType.startsWith('image/')
  }

  const isPDF = () => {
    const contentType = getContentType()
    return contentType.includes('application/pdf')
  }

  const renderBody = () => {
    if (viewMode === 'raw') {
      return (
        <pre className="text-sm font-mono whitespace-pre-wrap break-all p-4">
          {response.body}
        </pre>
      )
    }

    
    if (isJSON()) {
      return (
        <JsonEditor
          value={response.body}
          onChange={() => {}}
          readOnly
          height="calc(100vh - 300px)"
        />
      )
    }

    if (isHTML()) {
      return (
        <div className="h-full">
          <iframe
            srcDoc={response.body}
            className="w-full h-full border-0"
            sandbox="allow-same-origin"
            title="HTML Preview"
          />
        </div>
      )
    }

    if (isXML()) {
      return (
        <pre className="text-sm font-mono whitespace-pre-wrap break-all p-4 bg-white">
          <code className="language-xml">
            {response.body}
          </code>
        </pre>
      )
    }

    if (isImage()) {
      return (
        <div className="flex items-center justify-center h-full p-4">
          <img 
            src={`data:${getContentType()};base64,${response.body}`}
            alt="Response image"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )
    }

    if (isPDF()) {
      return (
        <div className="flex items-center justify-center h-full p-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">PDF content detected</p>
            <button
              onClick={() => {
                const blob = new Blob([response.body], { type: 'application/pdf' })
                const url = URL.createObjectURL(blob)
                window.open(url, '_blank')
              }}
              className="px-4 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600"
            >
              Open PDF in new tab
            </button>
          </div>
        </div>
      )
    }

    
    return (
      <pre className="text-sm font-mono whitespace-pre-wrap break-all p-4">
        {response.body}
      </pre>
    )
  }

  const renderPreview = () => {
    const contentType = getContentType()
    
    
    if (isJSON()) {
      try {
        const data = JSON.parse(response.body)
        
        
        if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
          const keys = Object.keys(data[0])
          return (
            <div className="overflow-auto">
              <div className="p-4 bg-gray-50 border-b text-sm text-gray-600">
                Array with {data.length} items
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {keys.map(key => (
                      <th key={key} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((row, i) => (
                    <tr key={i}>
                      {keys.map(key => (
                        <td key={key} className="px-4 py-2 text-sm text-gray-900">
                          {typeof row[key] === 'object' ? JSON.stringify(row[key]) : String(row[key])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
        
        
        if (typeof data === 'object' && data !== null) {
          const entries = Object.entries(data)
          return (
            <div className="p-4">
              <div className="mb-4 text-sm text-gray-600">
                Object with {entries.length} properties
              </div>
              <div className="space-y-2">
                {entries.map(([key, value]) => (
                  <div key={key} className="flex">
                    <span className="font-medium text-gray-700 w-1/3">{key}:</span>
                    <span className="text-gray-900 w-2/3">
                      {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        }
        
        
        return (
          <div className="p-4">
            <div className="text-sm text-gray-600 mb-2">
              Type: {typeof data}
            </div>
            <div className="text-gray-900">
              {String(data)}
            </div>
          </div>
        )
      } catch {
        return (
          <div className="p-4 text-sm text-gray-600">
            Invalid JSON format
          </div>
        )
      }
    }
    
    
    if (isHTML()) {
      return (
        <div className="p-4">
          <div className="text-sm text-gray-600 mb-4">
            HTML content detected. Use the Body tab to see the rendered preview.
          </div>
          <div className="text-xs text-gray-500">
            Content-Type: {contentType || 'text/html'}
          </div>
        </div>
      )
    }
    
    
    if (isXML()) {
      return (
        <div className="p-4">
          <div className="text-sm text-gray-600 mb-4">
            XML content detected. Use the Body tab with "Formatted XML" mode for better viewing.
          </div>
          <div className="text-xs text-gray-500">
            Content-Type: {contentType}
          </div>
        </div>
      )
    }
    
    
    if (isImage()) {
      return (
        <div className="p-4">
          <div className="text-sm text-gray-600 mb-4">
            Image content detected. Use the Body tab to view the image.
          </div>
          <div className="text-xs text-gray-500">
            Content-Type: {contentType}
          </div>
        </div>
      )
    }
    
    
    return (
      <div className="p-4">
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium text-gray-700">Content-Type:</span>
            <span className="ml-2 text-gray-900">{contentType || 'unknown'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Size:</span>
            <span className="ml-2 text-gray-900">{response.size}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Response Time:</span>
            <span className="ml-2 text-gray-900">{response.time}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
        <div className="flex items-center gap-2">
          {[
            { id: 'body', label: 'Body', icon: <FileCode size={14} /> },
            { id: 'headers', label: 'Headers', icon: <FileText size={14} /> },
            { id: 'preview', label: 'Preview', icon: <Table size={14} /> },
            { id: 'request', label: 'Request', icon: <FileText size={14} /> },
            { id: 'info', label: 'Info', icon: <AlertCircle size={14} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'body' && (isJSON() || isHTML() || isXML()) && (
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as any)}
              className="px-2 py-1 text-xs border border-gray-200 rounded-md"
            >
              <option value="pretty">
                {isJSON() ? 'Pretty JSON' : isHTML() ? 'HTML Preview' : isXML() ? 'Formatted XML' : 'Pretty'}
              </option>
              <option value="raw">Raw</option>
            </select>
          )}
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-white rounded-md transition-colors"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {activeTab === 'body' && renderBody()}
        {activeTab === 'headers' && (
          <div className="p-4">
            {response.headers && Object.entries(response.headers).length > 0 ? (
              <table className="min-w-full">
                <tbody>
                  {Object.entries(response.headers).map(([key, value]) => (
                    <tr key={key} className="border-b border-gray-100">
                      <td className="py-2 pr-4 text-sm font-medium text-gray-700">{key}</td>
                      <td className="py-2 text-sm text-gray-600">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-gray-500">No headers available</p>
            )}
          </div>
        )}
        {activeTab === 'preview' && renderPreview()}
        {activeTab === 'request' && response.request && (
          <div className="p-4 space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Request URL</h4>
              <div className="flex items-center gap-2 p-2 bg-gray-100 rounded font-mono text-sm">
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                  response.request.method === 'GET' ? 'bg-blue-100 text-blue-700' :
                  response.request.method === 'POST' ? 'bg-green-100 text-green-700' :
                  response.request.method === 'PUT' ? 'bg-orange-100 text-orange-700' :
                  response.request.method === 'DELETE' ? 'bg-red-100 text-red-700' :
                  'bg-gray-200 text-gray-700'
                }`}>
                  {response.request.method}
                </span>
                <span className="flex-1 text-gray-800 break-all">{response.request.url}</span>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Request Headers</h4>
              <div className="bg-gray-50 rounded p-3">
                {Object.entries(response.request.headers).length > 0 ? (
                  <table className="min-w-full">
                    <tbody>
                      {Object.entries(response.request.headers).map(([key, value]) => (
                        <tr key={key} className="border-b border-gray-200 last:border-0">
                          <td className="py-1.5 pr-4 text-sm font-medium text-gray-700">{key}</td>
                          <td className="py-1.5 text-sm text-gray-600 font-mono break-all">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-sm text-gray-500">No headers</p>
                )}
              </div>
            </div>
            
            {response.request.body && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Request Body</h4>
                <pre className="bg-gray-50 rounded p-3 text-sm font-mono whitespace-pre-wrap break-all overflow-auto max-h-96">
                  {response.request.body}
                </pre>
              </div>
            )}
          </div>
        )}
        {activeTab === 'info' && (
          <div className="p-4 space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Response Information</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Status</div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      response.status >= 200 && response.status < 300 
                        ? 'bg-green-100 text-green-700' 
                        : response.status >= 400 
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {response.status} {response.statusText}
                    </span>
                  </div>
                </div>
                
                <div>
                  <div className="text-xs text-gray-500 mb-1">Response Time</div>
                  <div className="text-sm font-medium text-gray-900">{response.time}</div>
                </div>
                
                <div>
                  <div className="text-xs text-gray-500 mb-1">Size</div>
                  <div className="text-sm font-medium text-gray-900">{response.size}</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Content Type</div>
                  <div className="text-sm font-medium text-gray-900">
                    {getContentType() || 'Not specified'}
                  </div>
                </div>
                
                <div>
                  <div className="text-xs text-gray-500 mb-1">Headers Count</div>
                  <div className="text-sm font-medium text-gray-900">
                    {response.headers ? Object.keys(response.headers).length : 0}
                  </div>
                </div>
              </div>
            </div>
            
            {response.headers && response.headers['set-cookie'] && (
              <div className="mt-6">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Cookies</h5>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  {response.headers['set-cookie'].split('\n').map((cookie: string, i: number) => {
                    const [nameValue, ...attributes] = cookie.split(';')
                    const [name, value] = nameValue.split('=')
                    return (
                      <div key={i} className="text-sm">
                        <span className="font-medium text-gray-900">{name?.trim()}</span>
                        <span className="text-gray-600"> = </span>
                        <span className="text-gray-700">{value?.trim()}</span>
                        {attributes.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {attributes.join('; ').trim()}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            
            <div className="mt-6">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Response Timeline</h5>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-20 text-xs text-gray-500">DNS Lookup</div>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: '10%' }}></div>
                  </div>
                  <div className="text-xs text-gray-700">~10ms</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-20 text-xs text-gray-500">TCP Connect</div>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: '15%' }}></div>
                  </div>
                  <div className="text-xs text-gray-700">~15ms</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-20 text-xs text-gray-500">SSL/TLS</div>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500" style={{ width: '20%' }}></div>
                  </div>
                  <div className="text-xs text-gray-700">~20ms</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-20 text-xs text-gray-500">Request</div>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500" style={{ width: '25%' }}></div>
                  </div>
                  <div className="text-xs text-gray-700">~25ms</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-20 text-xs text-gray-500">Response</div>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500" style={{ width: '30%' }}></div>
                  </div>
                  <div className="text-xs text-gray-700">~30ms</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}