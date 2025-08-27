"use client"

import { useState, useEffect } from "react"
import { Copy, Trash2 } from "@/shared/ui/icons"
import { AutoSaveIndicator } from "@/shared/ui/AutoSaveIndicator"
import { useAutoSave } from "@/shared/hooks/useAutoSave"
import { EndpointApi, Endpoint } from "@/entities/folder"
import { ParameterType, ParameterLocation } from "@prisma/client"

interface DocumentationState {
  description: string
  parameters: Array<{
    id: string
    name: string
    type: ParameterType
    location: ParameterLocation
    required: boolean
    description: string
    defaultValue: string
    example: string
  }>
  body: {
    id: string
    contentType: string
    schema: string
    example: string
    description: string
  } | null
  responses: Array<{
    id: string
    statusCode: number
    description: string
    contentType: string
    schema: string
    example: string
  }>
}

export function DocsSection({ projectId, endpoint }: { projectId: string; endpoint: Endpoint }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'request' | 'response'>('overview')
  const [documentation, setDocumentation] = useState<DocumentationState>({
    description: endpoint.description || '',
    parameters: endpoint.parameters?.map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
      location: p.location,
      required: p.required,
      description: p.description || '',
      defaultValue: p.defaultValue || '',
      example: p.example || ''
    })) || [],
    body: endpoint.body ? {
      id: endpoint.body.id,
      contentType: endpoint.body.contentType,
      schema: endpoint.body.schema || '',
      example: endpoint.body.example || '',
      description: endpoint.body.description || ''
    } : null,
    responses: endpoint.responses?.map(r => ({
      id: r.id,
      statusCode: r.statusCode,
      description: r.description || '',
      contentType: r.contentType || '',
      schema: r.schema || '',
      example: r.example || ''
    })) || []
  })
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'error' | 'idle'>('idle')

  
  useAutoSave(documentation, {
    delay: 2000, 
    enabled: true,
    onSave: async () => {
      try {
        setSaveStatus('saving')
        
        // Update endpoint description
        await EndpointApi.updateEndpoint(projectId, endpoint.id, {
          description: documentation.description
        })
        
        // Save parameters
        await EndpointApi.updateEndpointParameters(projectId, endpoint.id, documentation.parameters)
        
        // Save body
        if (documentation.body) {
          await EndpointApi.updateEndpointBody(projectId, endpoint.id, documentation.body)
        }
        
        // Save responses
        await EndpointApi.updateEndpointResponses(projectId, endpoint.id, documentation.responses)
        
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } catch (error) {
        setSaveStatus('error')
        console.error('Auto-save failed:', error)
        setTimeout(() => setSaveStatus('idle'), 3000)
      }
    }
  })

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'text-[#0064FF] border-[#0064FF]'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            개요
          </button>
          <button
            onClick={() => setActiveTab('request')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'request'
                ? 'text-[#0064FF] border-[#0064FF]'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            요청
          </button>
          <button
            onClick={() => setActiveTab('response')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'response'
                ? 'text-[#0064FF] border-[#0064FF]'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            응답
          </button>
        </div>
        <AutoSaveIndicator status={saveStatus} />
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">설명</label>
            <textarea
              value={documentation.description}
              onChange={(e) => setDocumentation({ ...documentation, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="이 엔드포인트에 대한 설명을 작성하세요..."
            />
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">엔드포인트 URL</h3>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg font-mono text-sm">
              <span className={`px-2 py-1 rounded font-semibold ${
                endpoint.method === 'GET' ? 'bg-blue-100 text-blue-700' :
                endpoint.method === 'POST' ? 'bg-green-100 text-green-700' :
                endpoint.method === 'PUT' ? 'bg-orange-100 text-orange-700' :
                endpoint.method === 'DELETE' ? 'bg-red-100 text-red-700' :
                endpoint.method === 'PATCH' ? 'bg-purple-100 text-purple-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {endpoint.method}
              </span>
              <span className="text-gray-700">{endpoint.path}</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">cURL 예제</h3>
              <button
                onClick={() => {
                  const curlCommand = `curl -X ${endpoint.method} \\
  "{{BASE_URL}}${endpoint.path}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer {{API_TOKEN}}"`
                  navigator.clipboard.writeText(curlCommand)
                  alert('cURL 명령어가 클립보드에 복사되었습니다!')
                }}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Copy size={14} />
                복사
              </button>
            </div>
            <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`curl -X ${endpoint.method} \\
  "{{BASE_URL}}${endpoint.path}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer {{API_TOKEN}}"`}
            </pre>
          </div>
        </div>
      )}

      {activeTab === 'request' && (
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">요청 파라미터</h3>
              <button
                onClick={() => {
                  setDocumentation({
                    ...documentation,
                    parameters: [...documentation.parameters, { 
                      id: `param-${Date.now()}`,
                      name: '', 
                      type: ParameterType.STRING, 
                      location: ParameterLocation.QUERY,
                      required: false, 
                      description: '',
                      defaultValue: '',
                      example: ''
                    }]
                  })
                }}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + 파라미터 추가
              </button>
            </div>
            {documentation.parameters.length > 0 ? (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">이름</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">위치</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">타입</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">필수</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">설명</th>
                      <th className="px-4 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {documentation.parameters.map((param, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={param.name}
                            onChange={(e) => {
                              const updated = [...documentation.parameters]
                              updated[index] = { ...updated[index], name: e.target.value }
                              setDocumentation({ ...documentation, parameters: updated })
                            }}
                            className="w-full px-2 py-1 text-sm font-mono border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0064FF]"
                            placeholder="paramName"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={param.location}
                            onChange={(e) => {
                              const updated = [...documentation.parameters]
                              updated[index] = { ...updated[index], location: e.target.value as ParameterLocation }
                              setDocumentation({ ...documentation, parameters: updated })
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0064FF]"
                          >
                            <option value="QUERY">Query</option>
                            <option value="PATH">Path</option>
                            <option value="HEADER">Header</option>
                            <option value="COOKIE">Cookie</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={param.type}
                            onChange={(e) => {
                              const updated = [...documentation.parameters]
                              updated[index] = { ...updated[index], type: e.target.value as ParameterType }
                              setDocumentation({ ...documentation, parameters: updated })
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0064FF]"
                          >
                            <option value="STRING">string</option>
                            <option value="INTEGER">integer</option>
                            <option value="NUMBER">number</option>
                            <option value="BOOLEAN">boolean</option>
                            <option value="ARRAY">array</option>
                            <option value="OBJECT">object</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={param.required}
                            onChange={(e) => {
                              const updated = [...documentation.parameters]
                              updated[index] = { ...updated[index], required: e.target.checked }
                              setDocumentation({ ...documentation, parameters: updated })
                            }}
                            className="w-4 h-4 rounded border-gray-300 text-[#0064FF] focus:ring-[#0064FF]"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={param.description}
                            onChange={(e) => {
                              const updated = [...documentation.parameters]
                              updated[index] = { ...updated[index], description: e.target.value }
                              setDocumentation({ ...documentation, parameters: updated })
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0064FF]"
                            placeholder="파라미터 설명"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => {
                              setDocumentation({
                                ...documentation,
                                parameters: documentation.parameters.filter((_, i) => i !== index)
                              })
                            }}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center border-2 border-dashed border-gray-200 rounded-lg">
                <p className="text-sm text-gray-500">아직 정의된 파라미터가 없습니다</p>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">요청 본문</h3>
            {documentation.body ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Content Type</label>
                  <select
                    value={documentation.body.contentType}
                    onChange={(e) => {
                      setDocumentation({
                        ...documentation,
                        body: { ...documentation.body!, contentType: e.target.value }
                      })
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0064FF]"
                  >
                    <option value="application/json">application/json</option>
                    <option value="application/xml">application/xml</option>
                    <option value="application/x-www-form-urlencoded">application/x-www-form-urlencoded</option>
                    <option value="multipart/form-data">multipart/form-data</option>
                    <option value="text/plain">text/plain</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">설명</label>
                  <textarea
                    value={documentation.body.description}
                    onChange={(e) => {
                      setDocumentation({
                        ...documentation,
                        body: { ...documentation.body!, description: e.target.value }
                      })
                    }}
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0064FF] resize-none"
                    placeholder="요청 본문에 대한 설명을 작성하세요..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">스키마</label>
                  <textarea
                    value={documentation.body.schema}
                    onChange={(e) => {
                      setDocumentation({
                        ...documentation,
                        body: { ...documentation.body!, schema: e.target.value }
                      })
                    }}
                    rows={6}
                    className="w-full px-3 py-2 text-sm font-mono border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0064FF] resize-none"
                    placeholder={`{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "email": { "type": "string" }
  }
}`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">예제</label>
                  <textarea
                    value={documentation.body.example}
                    onChange={(e) => {
                      setDocumentation({
                        ...documentation,
                        body: { ...documentation.body!, example: e.target.value }
                      })
                    }}
                    rows={6}
                    className="w-full px-3 py-2 text-sm font-mono border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0064FF] resize-none"
                    placeholder={`{
  "name": "John Doe",
  "email": "john@example.com"
}`}
                  />
                </div>

                <button
                  onClick={() => {
                    setDocumentation({ ...documentation, body: null })
                  }}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  요청 본문 제거
                </button>
              </div>
            ) : (
              <div className="py-8 text-center border-2 border-dashed border-gray-200 rounded-lg">
                <p className="text-sm text-gray-500 mb-3">요청 본문이 없습니다</p>
                <button
                  onClick={() => {
                    setDocumentation({
                      ...documentation,
                      body: {
                        id: `body-${Date.now()}`,
                        contentType: 'application/json',
                        schema: '',
                        example: '',
                        description: ''
                      }
                    })
                  }}
                  className="text-sm text-[#0064FF] hover:text-blue-700"
                >
                  + 요청 본문 추가
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'response' && (
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">응답</h3>
              <button
                onClick={() => {
                  setDocumentation({
                    ...documentation,
                    responses: [...documentation.responses, {
                      id: `resp-${Date.now()}`,
                      statusCode: 200,
                      description: '',
                      contentType: 'application/json',
                      schema: '',
                      example: ''
                    }]
                  })
                }}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + 응답 추가
              </button>
            </div>
            
            {documentation.responses.length > 0 ? (
              <div className="space-y-4">
                {documentation.responses.map((response, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          value={response.statusCode}
                          onChange={(e) => {
                            const updated = [...documentation.responses]
                            updated[index] = { ...updated[index], statusCode: parseInt(e.target.value) || 200 }
                            setDocumentation({ ...documentation, responses: updated })
                          }}
                          className={`w-20 px-2 py-1 text-sm font-semibold text-center border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0064FF] ${
                            response.statusCode >= 200 && response.statusCode < 300 ? 'bg-green-50 border-green-200 text-green-700' :
                            response.statusCode >= 400 && response.statusCode < 500 ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                            'bg-red-50 border-red-200 text-red-700'
                          }`}
                          min="100"
                          max="599"
                        />
                        <select
                          value={response.contentType}
                          onChange={(e) => {
                            const updated = [...documentation.responses]
                            updated[index] = { ...updated[index], contentType: e.target.value }
                            setDocumentation({ ...documentation, responses: updated })
                          }}
                          className="px-3 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0064FF]"
                        >
                          <option value="application/json">application/json</option>
                          <option value="application/xml">application/xml</option>
                          <option value="text/plain">text/plain</option>
                          <option value="text/html">text/html</option>
                        </select>
                      </div>
                      <button
                        onClick={() => {
                          setDocumentation({
                            ...documentation,
                            responses: documentation.responses.filter((_, i) => i !== index)
                          })
                        }}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">설명</label>
                      <input
                        type="text"
                        value={response.description}
                        onChange={(e) => {
                          const updated = [...documentation.responses]
                          updated[index] = { ...updated[index], description: e.target.value }
                          setDocumentation({ ...documentation, responses: updated })
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0064FF]"
                        placeholder="응답에 대한 설명을 작성하세요..."
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">스키마</label>
                        <textarea
                          value={response.schema}
                          onChange={(e) => {
                            const updated = [...documentation.responses]
                            updated[index] = { ...updated[index], schema: e.target.value }
                            setDocumentation({ ...documentation, responses: updated })
                          }}
                          rows={6}
                          className="w-full px-3 py-2 text-sm font-mono border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0064FF] resize-none"
                          placeholder={`{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "data": { "type": "object" }
  }
}`}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">예제</label>
                        <textarea
                          value={response.example}
                          onChange={(e) => {
                            const updated = [...documentation.responses]
                            updated[index] = { ...updated[index], example: e.target.value }
                            setDocumentation({ ...documentation, responses: updated })
                          }}
                          rows={6}
                          className="w-full px-3 py-2 text-sm font-mono border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0064FF] resize-none"
                          placeholder={`{
  "success": true,
  "data": {
    "id": "123",
    "name": "John Doe"
  }
}`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center border-2 border-dashed border-gray-200 rounded-lg">
                <p className="text-sm text-gray-500">아직 정의된 응답이 없습니다</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}