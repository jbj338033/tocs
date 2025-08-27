"use client"

import { useState, useEffect } from "react"
import { Endpoint } from "@/entities/folder"
import { VariableInput } from "@/shared/ui/components/VariableInput"
import { Play, Copy, FileCode } from "@/shared/ui/icons"
import { DetailButton, ProtocolBadge, IconButton } from "@/shared/ui/components"
import { Variable } from "@/entities/variable"
import { Project } from "@/entities/project"
import { interpolateVariables } from "@/shared/lib/variables"
import { UnifiedProtocolDetail, RequestSection, ResponseSection, KeyValueEditor } from "./UnifiedProtocolDetail"
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
  const [activeTab, setActiveTab] = useState<'query' | 'variables' | 'headers'>('query')
  const [headers, setHeaders] = useState<Array<{ key: string; value: string; enabled: boolean }>>([
    { key: 'Content-Type', value: 'application/json', enabled: true }
  ])

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
      
      const response = await fetch(url, {
        method: 'POST',
        headers: enabledHeaders,
        body: JSON.stringify({
          query: replaceVariables(query),
          variables: JSON.parse(replaceVariables(graphqlVariables))
        }),
        mode: 'cors',
        credentials: 'include'
      })
      
      const data = await response.json()
      const endTime = Date.now()
      
      setResponse(JSON.stringify(data, null, 2))
      setResponseTime(endTime - startTime)
      setResponseStatus(response.status)
      
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

  const QueryContent = (
    <RequestSection>
      <div className="h-full flex flex-col">
        <div className="flex-1 p-4">
          <VariableInput
            value={query}
            onChange={setQuery}
            placeholder="query { users { id name email } }"
            variables={variables}
            multiline
            className="w-full h-full p-3 font-mono text-[12px] resize-none border border-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF] bg-gray-50 focus:bg-white"
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
        <VariableInput
          value={graphqlVariables}
          onChange={setGraphqlVariables}
          placeholder='{\n  "id": 123,\n  "name": "John"\n}'
          variables={variables}
          multiline
          className="w-full h-full p-3 font-mono text-[12px] resize-none border border-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF] bg-gray-50 focus:bg-white"
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
      id: 'headers',
      label: 'Headers',
      content: HeadersContent
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
          <pre className="text-[12px] font-mono text-gray-600 whitespace-pre-wrap">
            {response || 'Execute query to see response'}
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