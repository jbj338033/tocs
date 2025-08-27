"use client"

import { useState, useEffect } from "react"

import { Endpoint, EndpointApi } from "@/entities/folder"
import { Variable, VariableApi } from "@/entities/variable"
import { ProjectApi } from "@/entities/project"

import { Button } from "@/shared/ui/components"
import { HTTPEndpointDetail } from "./HTTPEndpointDetail"
import { GraphQLEndpointDetail } from "./GraphQLEndpointDetail"
import { WebSocketEndpointDetail } from "./WebSocketEndpointDetail"
import { SocketIOEndpointDetail } from "./SocketIOEndpointDetail"
import { GRPCEndpointDetail } from "./GRPCEndpointDetail"

interface EndpointDetailProps {
  projectId: string
  endpointId: string
  onClose?: () => void
}


export function EndpointDetail({ projectId, endpointId, onClose }: EndpointDetailProps) {
  const [endpoint, setEndpoint] = useState<Endpoint | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [variables, setVariables] = useState<Variable[]>([])
  const [project, setProject] = useState<any>(null)

  useEffect(() => {
    loadEndpoint()
  }, [endpointId])

  const loadEndpoint = async () => {
    try {
      setIsLoading(true)
      
      const data = await EndpointApi.getEndpoint(projectId, endpointId)
      setEndpoint(data)
      const projectData = await ProjectApi.getProject(projectId)
      setProject(projectData)
      const variablesData = await VariableApi.getVariables(projectId)
      setVariables(variablesData)
      
    } catch (error) {
      console.error("Failed to load endpoint:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading endpoint...</p>
        </div>
      </div>
    )
  }

  if (!endpoint) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900 mb-2">Endpoint not found</p>
          <Button onClick={onClose} variant="ghost">Go back</Button>
        </div>
      </div>
    )
  }

  if (endpoint.type === 'GRAPHQL') {
    return <GraphQLEndpointDetail projectId={projectId} endpoint={endpoint} variables={variables} project={project} />
  }

  if (endpoint.type === 'WEBSOCKET') {
    return <WebSocketEndpointDetail projectId={projectId} endpoint={endpoint} variables={variables} project={project} />
  }

  if (endpoint.type === 'SOCKETIO') {
    return <SocketIOEndpointDetail projectId={projectId} endpoint={endpoint} variables={variables} project={project} />
  }

  if (endpoint.type === 'GRPC') {
    return <GRPCEndpointDetail projectId={projectId} endpoint={endpoint} variables={variables} project={project} />
  }

  // Default to HTTP for REST endpoints
  return <HTTPEndpointDetail projectId={projectId} endpoint={endpoint} variables={variables} project={project} />
}