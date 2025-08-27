"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown, Globe, Lock } from "@/shared/ui/icons"

interface PublicDocumentationViewProps {
  project: any
}

export function PublicDocumentationView({ project }: PublicDocumentationViewProps) {
  const [selectedEndpointId, setSelectedEndpointId] = useState<string | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(project.folders.map((f: any) => f.id))
  )

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  const selectedEndpoint = project.folders
    .flatMap((f: any) => f.endpoints)
    .find((e: any) => e.id === selectedEndpointId)

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: "bg-[#E6F0FF] text-[#0064FF]",
      POST: "bg-green-100 text-green-700",
      PUT: "bg-orange-100 text-orange-700",
      DELETE: "bg-red-100 text-red-700",
      PATCH: "bg-purple-100 text-purple-700",
      HEAD: "bg-gray-100 text-gray-700",
      OPTIONS: "bg-gray-100 text-gray-700"
    }
    return colors[method] || "bg-gray-100 text-gray-700"
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-[380px] h-screen bg-white flex flex-col flex-shrink-0 border-r border-gray-200">
          {/* Project Header */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-[#0064FF] to-[#0064FF]/80 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-white"
                >
                  <path
                    d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <div className="text-left flex-1">
                <div className="text-[14px] font-semibold text-gray-900">
                  {project.name}
                </div>
                <div className="text-[11px] text-gray-500 flex items-center gap-1">
                  {project.isPublic ? (
                    <>
                      <Globe size={10} />
                      퍼블릭
                    </>
                  ) : (
                    <>
                      <Lock size={10} />
                      프라이빗
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Folders */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 py-2">
              <h2 className="text-[11px] font-semibold text-gray-500 uppercase mb-2">Folders</h2>
              <nav className="space-y-1">
                {project.folders.map((folder: any) => (
                  <div key={folder.id}>
                    <div 
                      onClick={() => toggleFolder(folder.id)}
                      className="flex items-center px-2 py-2 hover:bg-gray-50 transition-colors rounded-md mx-2 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <div className="flex items-center gap-2">
                          {expandedFolders.has(folder.id) ? (
                            <ChevronDown size={12} className="text-gray-400" />
                          ) : (
                            <ChevronRight size={12} className="text-gray-400" />
                          )}
                        </div>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-orange-500"
                        >
                          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                        </svg>
                        <span className="flex-1 text-left text-[13px] font-medium text-gray-900 select-none">
                          {folder.name}
                        </span>
                      </div>
                    </div>
                    {expandedFolders.has(folder.id) && (
                      <div className="mt-1">
                        {folder.endpoints.map((endpoint: any) => (
                          <div
                            key={endpoint.id}
                            onClick={() => setSelectedEndpointId(endpoint.id)}
                            className={`flex items-center gap-2 py-1.5 px-2 mx-2 ml-8 cursor-pointer rounded-md transition-all ${
                              selectedEndpointId === endpoint.id
                                ? "bg-[#E6F0FF] text-[#0064FF]"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${getMethodColor(endpoint.method)}`}>
                              {endpoint.method}
                            </span>
                            <span className="flex-1 text-[13px] font-medium truncate">
                              {endpoint.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {selectedEndpoint ? (
            <div className="p-6">
              <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900">{selectedEndpoint.name}</h1>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-md ${getMethodColor(selectedEndpoint.method)}`}>
                      {selectedEndpoint.method}
                    </span>
                  </div>
                  {selectedEndpoint.description && (
                    <p className="text-gray-600">{selectedEndpoint.description}</p>
                  )}
                </div>

                {/* Request Section */}
                <div className="bg-white rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Request</h3>
                  
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-semibold px-2 py-1 rounded-md ${getMethodColor(selectedEndpoint.method)}`}>
                        {selectedEndpoint.method}
                      </span>
                      <code className="flex-1 text-sm font-mono text-gray-900">{selectedEndpoint.path}</code>
                    </div>
                  </div>

                  {/* Headers */}
                  {selectedEndpoint.headers.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Headers</h4>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                              <th className="text-left text-xs font-medium text-gray-600 px-4 py-2 uppercase">Name</th>
                              <th className="text-left text-xs font-medium text-gray-600 px-4 py-2 uppercase">Value</th>
                              <th className="text-left text-xs font-medium text-gray-600 px-4 py-2 uppercase">Required</th>
                              <th className="text-left text-xs font-medium text-gray-600 px-4 py-2 uppercase">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedEndpoint.headers.map((header: any) => (
                              <tr key={header.id} className="border-b border-gray-100">
                                <td className="px-4 py-3 text-sm font-mono text-gray-900">{header.key}</td>
                                <td className="px-4 py-3 text-sm font-mono text-gray-600">{header.value || "-"}</td>
                                <td className="px-4 py-3 text-sm">
                                  {header.required ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                                      Required
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                      Optional
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">{header.description || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Parameters */}
                  {selectedEndpoint.parameters.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Parameters</h4>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                              <th className="text-left text-xs font-medium text-gray-600 px-4 py-2 uppercase">Name</th>
                              <th className="text-left text-xs font-medium text-gray-600 px-4 py-2 uppercase">Type</th>
                              <th className="text-left text-xs font-medium text-gray-600 px-4 py-2 uppercase">Location</th>
                              <th className="text-left text-xs font-medium text-gray-600 px-4 py-2 uppercase">Required</th>
                              <th className="text-left text-xs font-medium text-gray-600 px-4 py-2 uppercase">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedEndpoint.parameters.map((param: any) => (
                              <tr key={param.id} className="border-b border-gray-100">
                                <td className="px-4 py-3 text-sm font-mono text-gray-900">{param.name}</td>
                                <td className="px-4 py-3 text-sm">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                    {param.type.toLowerCase()}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                    {param.location.toLowerCase()}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  {param.required ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                                      Required
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                      Optional
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">{param.description || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Request Body */}
                  {selectedEndpoint.body && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Request Body</h4>
                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="mb-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                            {selectedEndpoint.body.contentType}
                          </span>
                        </div>
                        {selectedEndpoint.body.description && (
                          <p className="text-sm text-gray-600 mb-3">{selectedEndpoint.body.description}</p>
                        )}
                        {selectedEndpoint.body.example && (
                          <div>
                            <div className="text-xs font-medium text-gray-500 mb-2">Example</div>
                            <pre className="text-sm font-mono bg-gray-50 p-4 rounded-lg overflow-x-auto">
                              {selectedEndpoint.body.example}
                            </pre>
                          </div>
                        )}
                        {selectedEndpoint.body.schema && (
                          <div className="mt-4">
                            <div className="text-xs font-medium text-gray-500 mb-2">Schema</div>
                            <pre className="text-sm font-mono bg-gray-50 p-4 rounded-lg overflow-x-auto">
                              {selectedEndpoint.body.schema}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Responses Section */}
                {selectedEndpoint.responses.length > 0 && (
                  <div className="bg-white rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Responses</h3>
                    <div className="space-y-4">
                      {selectedEndpoint.responses.map((response: any) => (
                        <div key={response.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <span className={`text-sm font-semibold px-2 py-1 rounded-md ${
                              response.statusCode >= 200 && response.statusCode < 300
                                ? "bg-green-100 text-green-700"
                                : response.statusCode >= 400 && response.statusCode < 500
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}>
                              {response.statusCode}
                            </span>
                            {response.description && (
                              <span className="text-sm text-gray-600">{response.description}</span>
                            )}
                          </div>
                          {response.contentType && (
                            <div className="mb-3">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                {response.contentType}
                              </span>
                            </div>
                          )}
                          {response.example && (
                            <div>
                              <div className="text-xs font-medium text-gray-500 mb-2">Example</div>
                              <pre className="text-sm font-mono bg-gray-50 p-4 rounded-lg overflow-x-auto">
                                {response.example}
                              </pre>
                            </div>
                          )}
                          {response.schema && (
                            <div className="mt-4">
                              <div className="text-xs font-medium text-gray-500 mb-2">Schema</div>
                              <pre className="text-sm font-mono bg-gray-50 p-4 rounded-lg overflow-x-auto">
                                {response.schema}
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center max-w-md">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-gray-400"
                  >
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <path d="M14 2v6h6" />
                    <path d="M16 13H8" />
                    <path d="M16 17H8" />
                    <path d="M10 9H8" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  API 문서를 확인하세요
                </h3>
                <p className="text-gray-600">
                  사이드바에서 엔드포인트를 선택하여 상세 문서를 확인할 수 있습니다
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}