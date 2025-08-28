"use client"

import { useState, useEffect } from "react"
import { Endpoint } from "@/entities/folder"
import { VariableInput } from "@/shared/ui/components/VariableInput"
import { CodeEditor } from "@/shared/ui/components/CodeEditor"
import { ResponseViewer } from "@/shared/ui/components/ResponseViewer"
import { Play, Copy, FileCode } from "@/shared/ui/icons"
import { DetailButton, ProtocolBadge, IconButton } from "@/shared/ui/components"
import { Variable } from "@/entities/variable"
import { Project } from "@/entities/project"
import { interpolateVariables } from "@/shared/lib/variables"
import { UnifiedProtocolDetail, RequestSection, ResponseSection, KeyValueEditor } from "./UnifiedProtocolDetail"
import { AuthorizationTab, applyAuthorization, type Authorization } from "./AuthorizationTab"
import { DocumentationTab } from "./DocumentationTab"
import { useProjectStore } from "@/shared/stores"

interface GraphQLEndpointDetailProps {
  projectId: string
  endpoint: Endpoint
  variables: Variable[]
  project: Project
}

export function GraphQLEndpointDetail({ projectId, endpoint, variables, project }: GraphQLEndpointDetailProps) {
  const { getSelectedServerUrl } = useProjectStore()
  const [graphqlUrl, setGraphqlUrl] = useState('')
  const [query, setQuery] = useState('')
  const [graphqlVariables, setGraphqlVariables] = useState('{}')
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [responseTime, setResponseTime] = useState<number | null>(null)
  const [responseStatus, setResponseStatus] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'query' | 'variables' | 'authorization' | 'headers' | 'cookies' | 'docs'>('query')
  const [headers, setHeaders] = useState<Array<{ key: string; value: string; enabled: boolean }>>([
    { key: 'Content-Type', value: 'application/json', enabled: true }
  ])
  const [authorization, setAuthorization] = useState<{
    type: 'none' | 'bearer' | 'basic' | 'apikey'
    token?: string
    username?: string
    password?: string
    key?: string
    value?: string
    addTo?: 'header' | 'query'
  }>({ type: 'none' })
  const [cookies, setCookies] = useState<Array<{ key: string; value: string; enabled: boolean }>>([])
  const [documentation, setDocumentation] = useState('')

  useEffect(() => {
    if (endpoint.query) {
      setQuery(endpoint.query)
    }
    if (endpoint.variables) {
      setGraphqlVariables(JSON.stringify(endpoint.variables, null, 2))
    }
    const url = endpoint.path || '/graphql'
    setGraphqlUrl(url)
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

  const replaceVariables = (text: string): string => {
    return interpolateVariables(text, variables)
  }

  const handleExecute = async () => {
    setIsLoading(true)
    setResponseTime(null)
    setResponseStatus(null)
    const startTime = Date.now()
    
    try {
      const serverUrl = replaceVariables(getServerUrl())
      const url = new URL(replaceVariables(graphqlUrl), serverUrl).toString()
      
      const enabledHeaders: Record<string, string> = {}
      headers.forEach(header => {
        if (header.enabled && header.key) {
          enabledHeaders[header.key] = replaceVariables(header.value)
        }
      })
      
      // Apply authorization
      applyAuthorization(authorization, enabledHeaders, variables)
      
      // Apply cookies
      const enabledCookies = cookies.filter(c => c.enabled && c.key)
      if (enabledCookies.length > 0) {
        enabledHeaders['Cookie'] = enabledCookies
          .map(c => `${c.key}=${replaceVariables(c.value)}`)
          .join('; ')
      }
      
      const proxyRes = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          method: 'POST',
          headers: enabledHeaders,
          body: {
            query: replaceVariables(query),
            variables: JSON.parse(replaceVariables(graphqlVariables))
          }
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
      
      setResponse(responseBody)
      setResponseTime(endTime - startTime)
      setResponseStatus(data.status)
      
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

  const QueryContent = (
    <RequestSection>
      <div className="h-full flex flex-col">
        <div className="flex-1 p-4">
          <CodeEditor
            value={query}
            onChange={setQuery}
            language="graphql"
            variables={variables}
          />
        </div>
        <div className="px-4 pb-4">
          <div className="flex gap-2">
            <DetailButton
              onClick={() => setQuery('query {\n  \n}')}
              variant="secondary"
              size="sm"
            >
              <FileCode size={12} />
              Query Template
            </DetailButton>
            <DetailButton
              onClick={() => setQuery('mutation {\n  \n}')}
              variant="secondary"
              size="sm"
            >
              <FileCode size={12} />
              Mutation Template
            </DetailButton>
          </div>
        </div>
      </div>
    </RequestSection>
  )

  const VariablesContent = (
    <RequestSection>
      <div className="h-full p-4">
        <CodeEditor
          value={graphqlVariables}
          onChange={setGraphqlVariables}
          language="json"
          variables={variables}
        />
      </div>
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
  
  const AuthorizationContent = (
    <AuthorizationTab
      authorization={authorization}
      setAuthorization={setAuthorization}
      variables={variables}
    />
  )
  
  const CookiesContent = (
    <RequestSection>
      <KeyValueEditor
        items={cookies}
        onAdd={addCookie}
        onUpdate={updateCookie}
        onRemove={removeCookie}
        addLabel="+ Add Cookie"
        keyPlaceholder="Cookie name"
        valuePlaceholder="Value"
      />
    </RequestSection>
  )
  
  const DocumentationContent = (
    <DocumentationTab
      endpoint={endpoint}
      documentation={documentation}
      setDocumentation={setDocumentation}
    />
  )

  const requestTabs = [
    {
      id: 'query',
      label: 'Query',
      content: QueryContent
    },
    {
      id: 'variables',
      label: 'Variables',
      content: VariablesContent
    },
    {
      id: 'authorization',
      label: 'Authorization',
      content: AuthorizationContent
    },
    {
      id: 'headers',
      label: 'Headers',
      content: HeadersContent
    },
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

  return (
    <UnifiedProtocolDetail
      protocol={<ProtocolBadge protocol="GraphQL" />}
      url={
        <VariableInput
          value={graphqlUrl}
          onChange={setGraphqlUrl}
          variables={variables}
          placeholder="/graphql"
          className="w-full px-3 py-1.5 text-[13px] border border-gray-100 rounded bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF]"
        />
      }
      headerActions={
        <DetailButton
          onClick={handleExecute}
          disabled={isLoading}
        >
          <Play size={12} />
          {isLoading ? 'Executing...' : 'Execute'}
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
          <div className="h-full -m-4">
            <ResponseViewer 
              response={response ? {
                status: responseStatus || 0,
                statusText: responseStatus && responseStatus < 400 ? 'OK' : 'Error',
                headers: {},
                body: response,
                time: responseTime || 0,
                size: new Blob([response]).size
              } : null}
              isLoading={isLoading}
            />
          </div>
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