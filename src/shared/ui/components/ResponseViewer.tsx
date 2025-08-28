"use client"

import { useState } from "react"
import { Editor } from "@monaco-editor/react"

interface TimingData {
  dns?: number
  connect?: number
  ssl?: number
  send?: number
  wait?: number
  receive?: number
  total: number
}

interface ResponseData {
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
  time: number
  size: number
  // Additional detailed info
  url?: string
  method?: string
  remoteAddress?: string
  protocol?: string
  requestHeaders?: Record<string, string>
  timing?: TimingData
}

interface ResponseViewerProps {
  response: ResponseData | null
  isLoading?: boolean
  request?: {
    url: string
    method: string
    headers: Record<string, string>
  }
}

export function ResponseViewer({ response, isLoading, request }: ResponseViewerProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'response' | 'request' | 'timing'>('response')

  if (!response && !isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-[13px] text-gray-400">Click Send to see the response</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-[13px] text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!response) return null

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / 1048576).toFixed(2)} MB`
  }

  const getStatusColor = (status: number) => {
    if (status < 300) return 'text-green-600'
    if (status < 400) return 'text-blue-600'
    if (status < 500) return 'text-orange-600'
    return 'text-red-600'
  }

  const detectLanguage = (content: string): string => {
    if (!content) return 'text'
    
    const trimmed = content.trim()
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      return 'json'
    } else if (trimmed.startsWith('<?xml') || trimmed.startsWith('<')) {
      return 'xml'
    } else if (trimmed.includes('<!DOCTYPE html>') || trimmed.includes('<html')) {
      return 'html'
    }
    return 'text'
  }

  const tabs = [
    { id: 'general' as const, label: 'General' },
    { id: 'response' as const, label: 'Response' },
    { id: 'request' as const, label: 'Request' },
    { id: 'timing' as const, label: 'Timing' }
  ]

  return (
    <div className="h-full flex flex-col">
      {/* Status Bar */}
      <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-4">
            <span className={`font-semibold ${getStatusColor(response.status)}`}>
              {response.status} {response.statusText}
            </span>
            <span className="text-gray-500">{response.time} ms</span>
            <span className="text-gray-500">{formatSize(response.size)}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-[12px] font-medium border-b-2 transition-all ${
              activeTab === tab.id
                ? 'text-[#0064FF] border-[#0064FF] bg-blue-50/30'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'general' && (
          <div className="p-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-[11px] font-semibold text-gray-500 uppercase mb-2">General</h3>
                <div className="space-y-2">
                  <div className="flex">
                    <span className="text-[12px] text-gray-500 w-32">Request URL:</span>
                    <span className="text-[12px] text-gray-700 font-mono break-all">{request?.url || response.url || '-'}</span>
                  </div>
                  <div className="flex">
                    <span className="text-[12px] text-gray-500 w-32">Request Method:</span>
                    <span className="text-[12px] text-gray-700 font-medium">{request?.method || response.method || '-'}</span>
                  </div>
                  <div className="flex">
                    <span className="text-[12px] text-gray-500 w-32">Status Code:</span>
                    <span className={`text-[12px] font-medium ${getStatusColor(response.status)}`}>
                      {response.status} {response.statusText}
                    </span>
                  </div>
                  {response.remoteAddress && (
                    <div className="flex">
                      <span className="text-[12px] text-gray-500 w-32">Remote Address:</span>
                      <span className="text-[12px] text-gray-700 font-mono">{response.remoteAddress}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-[11px] font-semibold text-gray-500 uppercase mb-2">Response Headers</h3>
                <div className="border border-gray-100 rounded-lg overflow-hidden">
                  <table className="w-full text-[11px]">
                    <tbody>
                      {Object.entries(response.headers).map(([key, value], index) => (
                        <tr key={index} className="border-b border-gray-50 last:border-0">
                          <td className="px-3 py-2 text-gray-600 w-1/3 bg-gray-50/50">{key}</td>
                          <td className="px-3 py-2 text-gray-700 font-mono break-all">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'response' && (
          <div className="h-full">
            <Editor
              height="100%"
              language={detectLanguage(response.body)}
              value={response.body}
              theme="vs"
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 12,
                lineHeight: 20,
                padding: { top: 12, bottom: 12 },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                automaticLayout: true,
              }}
              onMount={(editor, monaco) => {
                if (detectLanguage(response.body) === 'json' && response.body) {
                  try {
                    const formatted = JSON.stringify(JSON.parse(response.body), null, 2)
                    editor.setValue(formatted)
                  } catch {}
                }
              }}
            />
          </div>
        )}
        
        {activeTab === 'request' && (
          <div className="p-4">
            <div className="space-y-4">
              {request && (
                <>
                  <div>
                    <h3 className="text-[11px] font-semibold text-gray-500 uppercase mb-2">Request Headers</h3>
                    <div className="border border-gray-100 rounded-lg overflow-hidden">
                      <table className="w-full text-[11px]">
                        <tbody>
                          {Object.entries(request.headers).map(([key, value], index) => (
                            <tr key={index} className="border-b border-gray-50 last:border-0">
                              <td className="px-3 py-2 text-gray-600 w-1/3 bg-gray-50/50">{key}</td>
                              <td className="px-3 py-2 text-gray-700 font-mono break-all">{value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'timing' && (
          <div className="p-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-[11px] font-semibold text-gray-500 uppercase mb-3">Request/Response</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <span className="text-[12px] text-gray-600 w-40">Total Time:</span>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#0064FF]" style={{ width: '100%' }} />
                      </div>
                      <span className="text-[12px] text-gray-700 font-medium w-16 text-right">{response.time} ms</span>
                    </div>
                  </div>
                  
                  {response.timing && (
                    <>
                      {response.timing.dns !== undefined && (
                        <div className="flex items-center">
                          <span className="text-[12px] text-gray-600 w-40">DNS Lookup:</span>
                          <div className="flex-1 flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-purple-500" style={{ width: `${(response.timing.dns / response.time) * 100}%` }} />
                            </div>
                            <span className="text-[12px] text-gray-700 w-16 text-right">{response.timing.dns} ms</span>
                          </div>
                        </div>
                      )}
                      
                      {response.timing.connect !== undefined && (
                        <div className="flex items-center">
                          <span className="text-[12px] text-gray-600 w-40">Initial Connection:</span>
                          <div className="flex-1 flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-orange-500" style={{ width: `${(response.timing.connect / response.time) * 100}%` }} />
                            </div>
                            <span className="text-[12px] text-gray-700 w-16 text-right">{response.timing.connect} ms</span>
                          </div>
                        </div>
                      )}
                      
                      {response.timing.ssl !== undefined && (
                        <div className="flex items-center">
                          <span className="text-[12px] text-gray-600 w-40">SSL Handshake:</span>
                          <div className="flex-1 flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-pink-500" style={{ width: `${(response.timing.ssl / response.time) * 100}%` }} />
                            </div>
                            <span className="text-[12px] text-gray-700 w-16 text-right">{response.timing.ssl} ms</span>
                          </div>
                        </div>
                      )}
                      
                      {response.timing.wait !== undefined && (
                        <div className="flex items-center">
                          <span className="text-[12px] text-gray-600 w-40">Waiting (TTFB):</span>
                          <div className="flex-1 flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-green-500" style={{ width: `${(response.timing.wait / response.time) * 100}%` }} />
                            </div>
                            <span className="text-[12px] text-gray-700 w-16 text-right">{response.timing.wait} ms</span>
                          </div>
                        </div>
                      )}
                      
                      {response.timing.receive !== undefined && (
                        <div className="flex items-center">
                          <span className="text-[12px] text-gray-600 w-40">Content Download:</span>
                          <div className="flex-1 flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500" style={{ width: `${(response.timing.receive / response.time) * 100}%` }} />
                            </div>
                            <span className="text-[12px] text-gray-700 w-16 text-right">{response.timing.receive} ms</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-100">
                <p className="text-[11px] text-gray-500">
                  Size: <span className="text-gray-700 font-medium">{formatSize(response.size)}</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}