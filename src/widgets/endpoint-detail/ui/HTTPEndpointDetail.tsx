"use client"

import { useState, useEffect } from "react"
import { Endpoint, HttpMethod } from "@/entities/folder"
import { Variable, VariableApi } from "@/entities/variable"
import { Project } from "@/entities/project"
import { HistoryApi } from "@/entities/test"
import { VariableInput } from "@/shared/ui/components/VariableInput"
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
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body'>('params')
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [responseTime, setResponseTime] = useState<number | null>(null)
  const [responseStatus, setResponseStatus] = useState<number | null>(null)
  const [responseUrl, setResponseUrl] = useState('')
  
  const [params, setParams] = useState<Array<{ key: string; value: string; enabled: boolean }>>([])
  const [headers, setHeaders] = useState<Array<{ key: string; value: string; enabled: boolean }>>([
    { key: 'Content-Type', value: 'application/json', enabled: true }
  ])
  const [body, setBody] = useState('')

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
      
      const requestOptions: RequestInit = {
        method: endpoint.method || 'GET',
        headers: enabledHeaders,
        mode: 'cors',
        credentials: 'include'
      }
      
      if (['POST', 'PUT', 'PATCH'].includes(endpoint.method || '')) {
        if (body) {
          requestOptions.body = interpolateVariables(body, variables)
        }
      }
      
      const response = await fetch(url, requestOptions)
      const responseHeaders: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })
      
      const contentType = response.headers.get('content-type') || ''
      let responseBody = ''
      
      if (contentType.includes('application/json')) {
        const json = await response.json()
        responseBody = JSON.stringify(json, null, 2)
      } else if (contentType.includes('text/')) {
        responseBody = await response.text()
      } else {
        responseBody = 'Binary response (not displayed)'
      }
      
      const endTime = Date.now()
      
      setResponse(responseBody)
      setResponseTime(endTime - startTime)
      setResponseStatus(response.status)
      
      await HistoryApi.createHistory(projectId, endpoint.id, {
        method: endpoint.method || 'GET',
        url,
        headers: enabledHeaders,
        params: Object.fromEntries(params.filter(p => p.enabled).map(p => [p.key, p.value])),
        body: body || undefined,
        status: response.status,
        statusText: response.statusText,
        responseTime: endTime - startTime,
        responseSize: new Blob([responseBody]).size,
        responseHeaders,
        responseBody
      })
      
    } catch (error) {
      setResponse(JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        type: "NetworkError"
      }, null, 2))
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
        <VariableInput
          value={body}
          onChange={setBody}
          placeholder='{\n  "key": "value"\n}'
          variables={variables}
          multiline
          className="w-full h-full p-3 font-mono text-[12px] resize-none border border-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF] bg-gray-50 focus:bg-white"
        />
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
        <ResponseSection>
          {responseUrl && (
            <div className="mb-4 pb-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-gray-500 font-medium uppercase">Request URL</span>
                <IconButton
                  onClick={() => navigator.clipboard.writeText(responseUrl)}
                  size="sm"
                  title="Copy URL"
                >
                  <Copy size={11} />
                </IconButton>
              </div>
              <div className="font-mono text-[11px] text-gray-600 break-all bg-gray-50 p-2 rounded">
                {responseUrl}
              </div>
            </div>
          )}
          <pre className="text-[12px] font-mono text-gray-600 whitespace-pre-wrap">
            {response || 'Send request to see response'}
          </pre>
        </ResponseSection>
      }
      responseActions={
        response && (
          <IconButton
            onClick={() => navigator.clipboard.writeText(response)}
            size="sm"
            title="Copy response"
          >
            <Copy size={12} />
          </IconButton>
        )
      }
    />
  )
}