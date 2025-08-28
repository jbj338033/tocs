"use client"

import { useState, useEffect } from "react"
import { Endpoint } from "@/entities/folder"
import { VariableInput } from "@/shared/ui/components/VariableInput"
import { Play, Upload, FileCode, Copy, Server } from "@/shared/ui/icons"
import { DetailButton, ProtocolBadge, IconButton } from "@/shared/ui/components"
import { Variable } from "@/entities/variable"
import { Project } from "@/entities/project"
import { interpolateVariables } from "@/shared/lib/variables"
import { UnifiedProtocolDetail, RequestSection, ResponseSection, KeyValueEditor } from "./UnifiedProtocolDetail"
import { useProjectStore } from "@/shared/stores"

interface GRPCEndpointDetailProps {
  projectId: string
  endpoint: Endpoint
  variables?: Variable[]
  project?: Project
  isReadOnly?: boolean
}

export function GRPCEndpointDetail({ projectId, endpoint, variables = [], project, isReadOnly = false }: GRPCEndpointDetailProps) {
  const { getSelectedServerUrl } = useProjectStore()
  const [serverUrl, setServerUrl] = useState('')
  const [metadata, setMetadata] = useState<Array<{ key: string; value: string; enabled: boolean }>>([
    { key: 'authorization', value: 'Bearer {{token}}', enabled: true }
  ])
  const [requestBody, setRequestBody] = useState('{}')
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [responseTime, setResponseTime] = useState<number | null>(null)
  const [responseStatus, setResponseStatus] = useState<string | null>(null)
  const [protoFile, setProtoFile] = useState(endpoint.protoFile || '')
  const [serviceName, setServiceName] = useState(endpoint.serviceName || '')
  const [methodName, setMethodName] = useState(endpoint.methodName || '')
  const [activeTab, setActiveTab] = useState<'request' | 'proto' | 'metadata'>('request')

  useEffect(() => {
    const url = endpoint.path || 'localhost:50051'
    setServerUrl(url)
    setServiceName(endpoint.serviceName || '')
    setMethodName(endpoint.methodName || '')
    setProtoFile(endpoint.protoFile || '')
    if (endpoint.body?.example) {
      setRequestBody(endpoint.body.example)
    }
  }, [endpoint])

  const getServerUrl = () => {
    const selectedUrl = getSelectedServerUrl()
    if (selectedUrl) {
      return selectedUrl.replace(/^https?:\/\//, '')
    }
    if (project?.servers && project.servers.length > 0) {
      return project.servers[0].url.replace(/^https?:\/\//, '')
    }
    return 'localhost:50051'
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
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockResponse = {
        success: true,
        data: {
          id: "123",
          name: "Sample Response",
          timestamp: new Date().toISOString(),
          service: serviceName,
          method: methodName
        },
        metadata: {
          "grpc-status": "0",
          "grpc-message": "OK"
        }
      }
      
      setResponse(JSON.stringify(mockResponse, null, 2))
      setResponseTime(Date.now() - startTime)
      setResponseStatus("OK")
    } catch (error) {
      setResponse(JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        type: "GRPCError"
      }, null, 2))
      setResponseStatus("ERROR")
    } finally {
      setIsLoading(false)
    }
  }

  const addMetadata = () => {
    setMetadata([...metadata, { key: '', value: '', enabled: true }])
  }

  const updateMetadata = (index: number, field: 'key' | 'value' | 'enabled' | 'description', value: string | boolean) => {
    const newMetadata = [...metadata]
    newMetadata[index] = { ...newMetadata[index], [field]: value }
    setMetadata(newMetadata)
  }

  const removeMetadata = (index: number) => {
    setMetadata(metadata.filter((_, i) => i !== index))
  }

  const RequestContent = (
    <RequestSection>
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-100 space-y-3">
          <div>
            <label className="text-[11px] font-medium text-gray-500 uppercase mb-1 block">Service</label>
            <input
              type="text"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              placeholder="UserService"
              className="w-full px-3 py-1.5 text-[12px] font-mono border border-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF]"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-gray-500 uppercase mb-1 block">Method</label>
            <input
              type="text"
              value={methodName}
              onChange={(e) => setMethodName(e.target.value)}
              placeholder="GetUser"
              className="w-full px-3 py-1.5 text-[12px] font-mono border border-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF]"
            />
          </div>
        </div>
        <div className="flex-1 p-4">
          <label className="text-[11px] font-medium text-gray-500 uppercase mb-2 block">Request Body</label>
          <VariableInput
            value={requestBody}
            onChange={setRequestBody}
            placeholder='{\n  "userId": "123"\n}'
            variables={variables}
            multiline
            className="w-full h-[calc(100%-24px)] p-3 font-mono text-[12px] resize-none border border-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF] bg-gray-50 focus:bg-white"
          />
        </div>
      </div>
    </RequestSection>
  )

  const ProtoContent = (
    <RequestSection>
      <div className="h-full flex flex-col p-4">
        <div className="mb-3 flex items-center justify-between">
          <label className="text-[12px] font-medium text-gray-700">Proto Definition</label>
          <DetailButton
            onClick={() => {}}
            size="sm"
            variant="secondary"
          >
            <Upload size={12} />
            Upload Proto
          </DetailButton>
        </div>
        <textarea
          value={protoFile}
          onChange={(e) => setProtoFile(e.target.value)}
          placeholder={`syntax = "proto3";

service UserService {
  rpc GetUser (GetUserRequest) returns (User);
}

message GetUserRequest {
  string user_id = 1;
}

message User {
  string id = 1;
  string name = 2;
  string email = 3;
}`}
          className="flex-1 p-3 font-mono text-[12px] resize-none border border-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF] bg-gray-50 focus:bg-white"
        />
      </div>
    </RequestSection>
  )

  const MetadataContent = (
    <RequestSection>
      <KeyValueEditor
        items={metadata}
        onAdd={addMetadata}
        onUpdate={updateMetadata}
        onRemove={removeMetadata}
        addLabel="+ Add Metadata"
        keyPlaceholder="Metadata key"
        valuePlaceholder="Value"
        isReadOnly={isReadOnly}
      />
    </RequestSection>
  )

  const requestTabs = [
    {
      id: 'request',
      label: 'Request',
      content: RequestContent
    },
    {
      id: 'proto',
      label: 'Proto',
      content: ProtoContent
    },
    {
      id: 'metadata',
      label: 'Metadata',
      content: MetadataContent
    }
  ]

  return (
    <UnifiedProtocolDetail
      protocol={<ProtocolBadge protocol="gRPC" />}
      url={
        <VariableInput
          value={serverUrl}
          onChange={setServerUrl}
          variables={variables}
          placeholder="localhost:50051"
          className="w-full px-3 py-1.5 text-[13px] font-mono border border-gray-100 rounded bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF]"
          isReadOnly={isReadOnly}
        />
      }
      headerActions={
        <>
          <Server size={14} className="text-gray-400" />
          <DetailButton
            onClick={handleExecute}
            disabled={isLoading || !serviceName || !methodName || isReadOnly}
          >
            <Play size={12} />
            {isLoading ? 'Calling...' : 'Call'}
          </DetailButton>
        </>
      }
      requestTabs={requestTabs}
      activeRequestTab={activeTab}
      onRequestTabChange={(id) => setActiveTab(id as any)}
      responseStatus={
        responseStatus ? (
          <span className={`text-[12px] font-medium ${
            responseStatus === 'OK' ? 'text-green-600' : 'text-red-600'
          }`}>
            {responseStatus}
          </span>
        ) : undefined
      }
      responseTime={responseTime ?? undefined}
      responseContent={
        <ResponseSection>
          <pre className="text-[12px] font-mono text-gray-600 whitespace-pre-wrap">
            {response || 'Call method to see response'}
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