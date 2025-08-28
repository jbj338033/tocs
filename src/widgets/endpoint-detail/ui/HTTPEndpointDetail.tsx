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
import { Play, Copy } from "@/shared/ui/icons"
import { interpolateVariables } from "@/shared/lib/variables"
import { UnifiedProtocolDetail, RequestSection, ResponseSection, KeyValueEditor } from "./UnifiedProtocolDetail"
import { useProjectStore } from "@/shared/stores"

interface HTTPEndpointDetailProps {
  projectId: string
  endpoint: Endpoint
  variables: Variable[]
  project: Project
}

export function HTTPEndpointDetail({ projectId, endpoint, variables, project }: HTTPEndpointDetailProps) {
  const { getSelectedServerUrl } = useProjectStore()
  const [httpUrl, setHttpUrl] = useState('')
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body' | 'auth'>('params')
  const [response, setResponse] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [responseTime, setResponseTime] = useState<number | null>(null)
  const [responseStatus, setResponseStatus] = useState<number | null>(null)
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({})
  const [responseUrl, setResponseUrl] = useState('')
  const [responseSize, setResponseSize] = useState(0)
  
  const [params, setParams] = useState<Array<{ key: string; value: string; enabled: boolean }>>([])
  const [headers, setHeaders] = useState<Array<{ key: string; value: string; enabled: boolean }>>([
    { key: 'Content-Type', value: 'application/json', enabled: true }
  ])
  const [body, setBody] = useState('')
  const [authType, setAuthType] = useState<'none' | 'bearer' | 'basic'>('none')
  const [authToken, setAuthToken] = useState('')
  const [authUsername, setAuthUsername] = useState('')
  const [authPassword, setAuthPassword] = useState('')

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
    
    endpoint.parameters?.forEach(paramDef => {
      if (paramDef.location === 'QUERY') {
        const param = params.find(p => p.key === paramDef.name)
        if (param?.enabled && param.value) {
          url.searchParams.append(paramDef.name, interpolateVariables(param.value, variables))
        }
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
      
      // Apply authorization
      if (authType === 'bearer' && authToken) {
        enabledHeaders['Authorization'] = `Bearer ${interpolateVariables(authToken, variables)}`
      } else if (authType === 'basic' && authUsername && authPassword) {
        const credentials = btoa(`${authUsername}:${authPassword}`)
        enabledHeaders['Authorization'] = `Basic ${credentials}`
      }
      
      
      let requestBody
      if (['POST', 'PUT', 'PATCH'].includes(endpoint.method || '')) {
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
          method: endpoint.method || 'GET',
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
        method: endpoint.method || 'GET',
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

  const updateParam = (index: number, field: 'key' | 'value' | 'enabled', value: string | boolean) => {
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

  const updateHeader = (index: number, field: 'key' | 'value' | 'enabled', value: string | boolean) => {
    const newHeaders = [...headers]
    newHeaders[index] = { ...newHeaders[index], [field]: value }
    setHeaders(newHeaders)
  }

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index))
  }

  const ParamsContent = (
    <RequestSection>
      <KeyValueEditor
        items={params}
        onAdd={addParam}
        onUpdate={updateParam}
        onRemove={removeParam}
        addLabel="+ Add Parameter"
        keyPlaceholder="Parameter name"
        valuePlaceholder="Value"
      />
    </RequestSection>
  )

  const HeadersContent = (
    <RequestSection>
      <KeyValueEditor
        items={headers}
        onAdd={addHeader}
        onUpdate={updateHeader}
        onRemove={removeHeader}
        addLabel="+ Add Header"
        keyPlaceholder="Header name"
        valuePlaceholder="Value"
      />
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
        />
      </div>
    </RequestSection>
  )
  
  const AuthContent = (
    <RequestSection>
      <div className="p-4 space-y-4">
        <div>
          <label className="text-[12px] font-medium text-gray-700 mb-2 block">Auth Type</label>
          <select
            value={authType}
            onChange={(e) => setAuthType(e.target.value as any)}
            className="w-full px-3 py-1.5 text-[12px] border border-gray-100 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF]"
          >
            <option value="none">No Auth</option>
            <option value="bearer">Bearer Token</option>
            <option value="basic">Basic Auth</option>
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
              />
            </div>
          </>
        )}
      </div>
    </RequestSection>
  )


  const shouldShowBody = ['POST', 'PUT', 'PATCH'].includes(endpoint.method || '')

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
    }] : [])
  ]

  return (
    <UnifiedProtocolDetail
      protocol={<ProtocolBadge protocol="HTTP" method={endpoint.method || undefined} />}
      url={
        <VariableInput
          value={httpUrl}
          onChange={setHttpUrl}
          variables={variables}
          placeholder="/api/endpoint"
          className="w-full px-3 py-1.5 text-[13px] border border-gray-100 rounded bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF]"
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
        <div className="h-full">
          <ResponseViewer 
            response={response}
            isLoading={isLoading}
          />
        </div>
      }
      responseActions={null}
    />
  )
}