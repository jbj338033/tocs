"use client"

import { useState, useEffect } from "react"
import { Endpoint, HttpMethod } from "@/entities/folder"
import { Variable, VariableApi } from "@/entities/variable"
import { Project } from "@/entities/project"
import { HistoryApi } from "@/entities/test"
import { VariableInput } from "@/shared/ui/components/VariableInput"
import { CodeEditor } from "@/shared/ui/components/CodeEditor"
import { ResponseViewer } from "@/shared/ui/components/ResponseViewer"
import { DetailButton, ProtocolBadge, IconButton } from "@/shared/ui/components"
import { Play, Copy, X } from "@/shared/ui/icons"
import { interpolateVariables } from "@/shared/lib/variables"
import { UnifiedProtocolDetail, RequestSection, ResponseSection, KeyValueEditor } from "./UnifiedProtocolDetail"
import { useProjectStore } from "@/shared/stores"

interface HTTPEndpointDetailProps {
  projectId: string
  endpoint: Endpoint
  variables?: Variable[]
  project?: Project
  isReadOnly?: boolean
}

export function HTTPEndpointDetail({ projectId, endpoint, variables = [], project, isReadOnly = false }: HTTPEndpointDetailProps) {
  const { getSelectedServerUrl } = useProjectStore()
  const [httpUrl, setHttpUrl] = useState('')
  const [activeTab, setActiveTab] = useState<'params' | 'auth' | 'headers' | 'body' | 'cookies' | 'docs'>('params')
  const [response, setResponse] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [responseTime, setResponseTime] = useState<number | null>(null)
  const [responseStatus, setResponseStatus] = useState<number | null>(null)
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({})
  const [responseUrl, setResponseUrl] = useState('')
  const [responseSize, setResponseSize] = useState(0)
  const [method, setMethod] = useState<HttpMethod>((endpoint.method || 'GET') as HttpMethod)
  
  const [params, setParams] = useState<Array<{ key: string; value: string; enabled: boolean }>>([])
  const [headers, setHeaders] = useState<Array<{ key: string; value: string; enabled: boolean }>>([
    { key: 'Content-Type', value: 'application/json', enabled: true }
  ])
  const [body, setBody] = useState('')
  const [authType, setAuthType] = useState<'none' | 'bearer' | 'basic' | 'api-key'>('none')
  const [authToken, setAuthToken] = useState('')
  const [authUsername, setAuthUsername] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [cookies, setCookies] = useState<Array<{ key: string; value: string; enabled: boolean }>>([])  
  const [documentation, setDocumentation] = useState({
    description: '',
    examples: [] as Array<{ name: string; request: string; response: string }>
  })

  useEffect(() => {
    const initialParams = endpoint.parameters?.map(param => ({
      key: param.name,
      value: param.defaultValue || '',
      enabled: true
    })) || []
    setParams(initialParams)
    
    const initialHeaders = [{ key: 'Content-Type', value: 'application/json', enabled: true }]
    endpoint.headers?.forEach(header => {
      if (header.value) {
        initialHeaders.push({ key: header.key, value: header.value, enabled: true })
      }
    })
    setHeaders(initialHeaders)
    
    setBody(endpoint.body?.example || '')
    setHttpUrl(endpoint.path || '/api')
  }, [endpoint])

  const getServerUrl = () => {
    const selectedUrl = getSelectedServerUrl()
    if (selectedUrl) {
      return selectedUrl
    }
    if (project?.servers && project.servers.length > 0) {
      return project.servers[0].url
    }
    return ''
  }

  const buildRequestUrl = () => {
    const serverUrl = interpolateVariables(getServerUrl(), variables)
    let path = interpolateVariables(httpUrl, variables)
    
    params.forEach(param => {
      if (param.enabled) {
        const value = interpolateVariables(param.value, variables)
        path = path.replace(`{${param.key}}`, encodeURIComponent(value))
      }
    })
    
    const url = new URL(path, serverUrl)
    
    params.forEach(param => {
      if (param.enabled && param.value && !path.includes(`{${param.key}}`)) {
        url.searchParams.append(param.key, interpolateVariables(param.value, variables))
      }
    })
    
    return url.toString()
  }

  const handleExecute = async () => {
    setIsLoading(true)
    setResponseTime(null)
    setResponseStatus(null)
    const startTime = Date.now()
    
    try {
      const url = buildRequestUrl()
      setResponseUrl(url)
      
      const enabledHeaders: Record<string, string> = {}
      headers.forEach(header => {
        if (header.enabled && header.key) {
          enabledHeaders[header.key] = interpolateVariables(header.value, variables)
        }
      })
      
      if (authType === 'bearer' && authToken) {
        enabledHeaders['Authorization'] = `Bearer ${interpolateVariables(authToken, variables)}`
      } else if (authType === 'basic' && authUsername && authPassword) {
        const credentials = btoa(`${authUsername}:${authPassword}`)
        enabledHeaders['Authorization'] = `Basic ${credentials}`
      } else if (authType === 'api-key' && authToken) {
        enabledHeaders['X-API-Key'] = interpolateVariables(authToken, variables)
      }
      
      const enabledCookies = cookies
        .filter(cookie => cookie.enabled && cookie.key)
        .map(cookie => `${cookie.key}=${interpolateVariables(cookie.value, variables)}`)
      
      if (enabledCookies.length > 0) {
        enabledHeaders['Cookie'] = enabledCookies.join('; ')
      }
      
      
      let requestBody
      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        if (body) {
          const interpolated = interpolateVariables(body, variables)
          try {
            requestBody = JSON.parse(interpolated)
          } catch {
            requestBody = interpolated
          }
        }
      }

      const proxyRes = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          method: method,
          headers: enabledHeaders,
          body: requestBody
        })
      })

      const data = await proxyRes.json()
      const endTime = Date.now()

      if (!proxyRes.ok) {
        throw new Error(data.error || 'Request failed')
      }

      const responseBody = typeof data.body === 'string' 
        ? data.body 
        : JSON.stringify(data.body, null, 2)

      setResponse({
        status: data.status,
        statusText: data.statusText,
        headers: data.headers,
        body: responseBody,
        time: endTime - startTime,
        size: data.size
      })
      setResponseTime(endTime - startTime)
      setResponseStatus(data.status)
      setResponseHeaders(data.headers)
      setResponseSize(data.size)
      
      await HistoryApi.createHistory(projectId, endpoint.id, {
        method: method,
        url,
        headers: enabledHeaders,
        params: Object.fromEntries(params.filter(p => p.enabled).map(p => [p.key, p.value])),
        body: body || undefined,
        status: data.status,
        statusText: data.statusText,
        responseTime: endTime - startTime,
        responseSize: data.size,
        responseHeaders: data.headers,
        responseBody
      })
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const errorBody = JSON.stringify({ 
        error: errorMessage,
        type: "NetworkError"
      }, null, 2)
      
      setResponse({
        status: 0,
        statusText: 'Network Error',
        headers: {},
        body: errorBody,
        time: Date.now() - startTime,
        size: new Blob([errorBody]).size
      })
      setResponseStatus(0)
    } finally {
      setIsLoading(false)
    }
  }

  const addParam = () => {
    setParams([...params, { key: '', value: '', enabled: true }])
  }

  const updateParam = (index: number, field: 'key' | 'value' | 'enabled' | 'description', value: string | boolean) => {
    const newParams = [...params]
    newParams[index] = { ...newParams[index], [field]: value }
    setParams(newParams)
  }

  const removeParam = (index: number) => {
    setParams(params.filter((_, i) => i !== index))
  }

  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '', enabled: true }])
  }

  const updateHeader = (index: number, field: 'key' | 'value' | 'enabled' | 'description', value: string | boolean) => {
    const newHeaders = [...headers]
    newHeaders[index] = { ...newHeaders[index], [field]: value }
    setHeaders(newHeaders)
  }

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index))
  }

  const ParamsContent = (
    <RequestSection>
      <div className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[12px] font-medium text-gray-700">Query Parameters</h4>
            <button
              onClick={addParam}
              className="text-[12px] text-[#0064FF] hover:text-[#0050CC] transition-colors"
              disabled={isReadOnly}
            >
              + Add Parameter
            </button>
          </div>
          {params.length === 0 ? (
            <p className="text-[12px] text-gray-400 text-center py-8">No parameters added</p>
          ) : (
            <div className="space-y-2">
              {params.map((param, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={param.enabled}
                    onChange={(e) => updateParam(index, 'enabled', e.target.checked)}
                    className="rounded border-gray-300"
                    disabled={isReadOnly}
                  />
                  <input
                    type="text"
                    value={param.key}
                    onChange={(e) => updateParam(index, 'key', e.target.value)}
                    placeholder="Key"
                    className="flex-1 px-3 py-1.5 text-[12px] border border-gray-100 rounded bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF]"
                    readOnly={isReadOnly}
                  />
                  <input
                    type="text"
                    value={param.value}
                    onChange={(e) => updateParam(index, 'value', e.target.value)}
                    placeholder="Value"
                    className="flex-1 px-3 py-1.5 text-[12px] border border-gray-100 rounded bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF]"
                    readOnly={isReadOnly}
                  />
                  <button
                    onClick={() => removeParam(index)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    disabled={isReadOnly}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </RequestSection>
  )

  const HeadersContent = (
    <RequestSection>
      <div className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[12px] font-medium text-gray-700">Request Headers</h4>
            <button
              onClick={addHeader}
              className="text-[12px] text-[#0064FF] hover:text-[#0050CC] transition-colors"
              disabled={isReadOnly}
            >
              + Add Header
            </button>
          </div>
          {headers.length === 0 ? (
            <p className="text-[12px] text-gray-400 text-center py-8">No headers added</p>
          ) : (
            <div className="space-y-2">
              {headers.map((header, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={header.enabled}
                    onChange={(e) => updateHeader(index, 'enabled', e.target.checked)}
                    className="rounded border-gray-300"
                    disabled={isReadOnly}
                  />
                  <input
                    type="text"
                    value={header.key}
                    onChange={(e) => updateHeader(index, 'key', e.target.value)}
                    placeholder="Header name"
                    className="flex-1 px-3 py-1.5 text-[12px] border border-gray-100 rounded bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF]"
                    readOnly={isReadOnly}
                  />
                  <input
                    type="text"
                    value={header.value}
                    onChange={(e) => updateHeader(index, 'value', e.target.value)}
                    placeholder="Value"
                    className="flex-1 px-3 py-1.5 text-[12px] border border-gray-100 rounded bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF]"
                    readOnly={isReadOnly}
                  />
                  <button
                    onClick={() => removeHeader(index)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    disabled={isReadOnly}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </RequestSection>
  )

  const BodyContent = (
    <RequestSection>
      <div className="h-full p-4">
        <CodeEditor
          value={body}
          onChange={setBody}
          language="json"
          variables={variables}
          readOnly={isReadOnly}
        />
      </div>
    </RequestSection>
  )
  
  const addCookie = () => {
    setCookies([...cookies, { key: '', value: '', enabled: true }])
  }

  const updateCookie = (index: number, field: 'key' | 'value' | 'enabled', value: string | boolean) => {
    const newCookies = [...cookies]
    newCookies[index] = { ...newCookies[index], [field]: value }
    setCookies(newCookies)
  }

  const removeCookie = (index: number) => {
    setCookies(cookies.filter((_, i) => i !== index))
  }

  const addExample = () => {
    setDocumentation({
      ...documentation,
      examples: [...documentation.examples, { name: '', request: '', response: '' }]
    })
  }

  const updateExample = (index: number, field: 'name' | 'request' | 'response', value: string) => {
    const newExamples = [...documentation.examples]
    newExamples[index] = { ...newExamples[index], [field]: value }
    setDocumentation({ ...documentation, examples: newExamples })
  }

  const removeExample = (index: number) => {
    setDocumentation({
      ...documentation,
      examples: documentation.examples.filter((_, i) => i !== index)
    })
  }

  const CookiesContent = (
    <RequestSection>
      <div className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[12px] font-medium text-gray-700">Request Cookies</h4>
            <button
              onClick={addCookie}
              className="text-[12px] text-[#0064FF] hover:text-[#0050CC] transition-colors"
              disabled={isReadOnly}
            >
              + Add Cookie
            </button>
          </div>
          {cookies.length === 0 ? (
            <p className="text-[12px] text-gray-400 text-center py-8">No cookies added</p>
          ) : (
            <div className="space-y-2">
              {cookies.map((cookie, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={cookie.enabled}
                    onChange={(e) => updateCookie(index, 'enabled', e.target.checked)}
                    className="rounded border-gray-300"
                    disabled={isReadOnly}
                  />
                  <input
                    type="text"
                    value={cookie.key}
                    onChange={(e) => updateCookie(index, 'key', e.target.value)}
                    placeholder="Cookie name"
                    className="flex-1 px-3 py-1.5 text-[12px] border border-gray-100 rounded bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF]"
                    readOnly={isReadOnly}
                  />
                  <input
                    type="text"
                    value={cookie.value}
                    onChange={(e) => updateCookie(index, 'value', e.target.value)}
                    placeholder="Value"
                    className="flex-1 px-3 py-1.5 text-[12px] border border-gray-100 rounded bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF]"
                    readOnly={isReadOnly}
                  />
                  <button
                    onClick={() => removeCookie(index)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    disabled={isReadOnly}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </RequestSection>
  )

  const DocumentationContent = (
    <RequestSection>
      <div className="p-4 space-y-4">
        <div>
          <label className="text-[12px] font-medium text-gray-700 mb-2 block">Description</label>
          <textarea
            value={documentation.description}
            onChange={(e) => setDocumentation({ ...documentation, description: e.target.value })}
            placeholder="Describe what this endpoint does..."
            rows={4}
            className="w-full px-3 py-2 text-[12px] border border-gray-100 rounded bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF] resize-none"
            readOnly={isReadOnly}
          />
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[12px] font-medium text-gray-700">Examples</h4>
            <button
              onClick={addExample}
              className="text-[12px] text-[#0064FF] hover:text-[#0050CC] transition-colors"
              disabled={isReadOnly}
            >
              + Add Example
            </button>
          </div>
          {documentation.examples.length === 0 ? (
            <p className="text-[12px] text-gray-400 text-center py-4">No examples added</p>
          ) : (
            <div className="space-y-3">
              {documentation.examples.map((example, index) => (
                <div key={index} className="border border-gray-100 rounded p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={example.name}
                      onChange={(e) => updateExample(index, 'name', e.target.value)}
                      placeholder="Example name"
                      className="flex-1 px-2 py-1 text-[12px] font-medium bg-transparent focus:outline-none focus:ring-1 focus:ring-[#0064FF] rounded"
                      readOnly={isReadOnly}
                    />
                    <button
                      onClick={() => removeExample(index)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      disabled={isReadOnly}
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-gray-500 mb-1 block">Request</label>
                      <textarea
                        value={example.request}
                        onChange={(e) => updateExample(index, 'request', e.target.value)}
                        placeholder="Request example..."
                        rows={3}
                        className="w-full px-2 py-1.5 text-[11px] font-mono border border-gray-100 rounded bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF] resize-none"
                        readOnly={isReadOnly}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-500 mb-1 block">Response</label>
                      <textarea
                        value={example.response}
                        onChange={(e) => updateExample(index, 'response', e.target.value)}
                        placeholder="Response example..."
                        rows={3}
                        className="w-full px-2 py-1.5 text-[11px] font-mono border border-gray-100 rounded bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF] resize-none"
                        readOnly={isReadOnly}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </RequestSection>
  )

  const AuthContent = (
    <RequestSection>
      <div className="p-4">
        <div className="space-y-4">
          <div>
            <label className="text-[12px] font-medium text-gray-700 mb-2 block">Authentication Type</label>
            <select
              value={authType}
              onChange={(e) => setAuthType(e.target.value as any)}
              className="w-full px-3 py-1.5 text-[12px] border border-gray-100 rounded bg-gray-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF]"
              disabled={isReadOnly}
            >
              <option value="none">No Authentication</option>
              <option value="bearer">Bearer Token</option>
              <option value="basic">Basic Authentication</option>
              <option value="api-key">API Key</option>
            </select>
          </div>
        
        {authType === 'bearer' && (
          <div>
            <label className="text-[12px] font-medium text-gray-700 mb-2 block">Token</label>
            <input
              type="text"
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
              placeholder="Enter token"
              className="w-full px-3 py-1.5 text-[12px] border border-gray-100 rounded bg-gray-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF]"
              readOnly={isReadOnly}
            />
          </div>
        )}
        
        {authType === 'basic' && (
          <>
            <div>
              <label className="text-[12px] font-medium text-gray-700 mb-2 block">Username</label>
              <input
                type="text"
                value={authUsername}
                onChange={(e) => setAuthUsername(e.target.value)}
                placeholder="Username"
                className="w-full px-3 py-1.5 text-[12px] border border-gray-100 rounded bg-gray-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF]"
                readOnly={isReadOnly}
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-gray-700 mb-2 block">Password</label>
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-3 py-1.5 text-[12px] border border-gray-100 rounded bg-gray-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF]"
                readOnly={isReadOnly}
              />
            </div>
          </>
        )}
        
        {authType === 'api-key' && (
          <div>
            <label className="text-[12px] font-medium text-gray-700 mb-2 block">API Key</label>
            <div className="space-y-2">
              <input
                type="text"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                placeholder="Enter API key"
                className="w-full px-3 py-1.5 text-[12px] border border-gray-100 rounded bg-gray-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF] font-mono"
              />
              <div className="flex items-center gap-2">
                <select className="text-[12px] px-3 py-1.5 border border-gray-100 rounded bg-gray-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF]">
                  <option>Header</option>
                  <option>Query Param</option>
                </select>
                <input
                  type="text"
                  placeholder="Key name (e.g., X-API-Key)"
                  className="flex-1 px-3 py-1.5 text-[12px] border border-gray-100 rounded bg-gray-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF]"
                />
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </RequestSection>
  )

  const shouldShowBody = ['POST', 'PUT', 'PATCH'].includes(method)

  const requestTabs = [
    {
      id: 'params',
      label: 'Params',
      content: ParamsContent
    },
    {
      id: 'auth',
      label: 'Auth',
      content: AuthContent
    },
    {
      id: 'headers',
      label: 'Headers',
      content: HeadersContent
    },
    ...(shouldShowBody ? [{
      id: 'body',
      label: 'Body',
      content: BodyContent
    }] : []),
    {
      id: 'cookies',
      label: 'Cookies',
      content: CookiesContent
    },
    {
      id: 'docs',
      label: 'Documentation',
      content: DocumentationContent
    }
  ]

  const MethodSelector = (
    <select
      value={method}
      onChange={(e) => setMethod(e.target.value as HttpMethod)}
      className="text-[13px] font-medium text-gray-900"
      disabled={isReadOnly}
    >
      <option value="GET">GET</option>
      <option value="POST">POST</option>
      <option value="PUT">PUT</option>
      <option value="PATCH">PATCH</option>
      <option value="DELETE">DELETE</option>
      <option value="HEAD">HEAD</option>
      <option value="OPTIONS">OPTIONS</option>
    </select>
  )

  return (
    <UnifiedProtocolDetail
      protocol={MethodSelector}
      url={
        <VariableInput
          value={httpUrl}
          onChange={setHttpUrl}
          variables={variables}
          placeholder="/endpoint"
          className="w-full px-3 py-1.5 text-[13px] border border-gray-100 rounded bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF]"
          isReadOnly={isReadOnly}
        />
      }
      headerActions={
        <DetailButton
          onClick={handleExecute}
          disabled={isLoading}
        >
          <Play size={12} />
          {isLoading ? 'Sending...' : 'Send'}
        </DetailButton>
      }
      requestTabs={requestTabs}
      activeRequestTab={activeTab}
      onRequestTabChange={(id) => setActiveTab(id as any)}
      responseStatus={
        responseStatus !== null ? (
          <span className={`text-[12px] font-medium ${
            responseStatus < 400 ? 'text-green-600' : 'text-red-600'
          }`}>
            {responseStatus}
          </span>
        ) : undefined
      }
      responseTime={responseTime ?? undefined}
      responseContent={
        <ResponseSection>
          <ResponseViewer 
            response={response}
            isLoading={isLoading}
          />
        </ResponseSection>
      }
      responseActions={null}
    />
  )
}