import { Endpoint, CreateEndpointData } from "../model/types"

export class EndpointApi {
  static async getEndpoints(projectId: string): Promise<Endpoint[]> {
    const res = await fetch(`/api/projects/${projectId}/endpoints`, {
      credentials: 'include'
    })
    if (!res.ok) throw new Error("Failed to fetch endpoints")
    return res.json()
  }

  static async getEndpoint(projectId: string, endpointId: string): Promise<Endpoint> {
    const res = await fetch(`/api/projects/${projectId}/endpoints/${endpointId}`, {
      credentials: 'include'
    })
    if (!res.ok) throw new Error("Failed to fetch endpoint")
    return res.json()
  }

  static async createEndpoint(projectId: string, data: CreateEndpointData): Promise<Endpoint> {
    const res = await fetch(`/api/projects/${projectId}/endpoints`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: 'include'
    })
    if (!res.ok) throw new Error("Failed to create endpoint")
    return res.json()
  }

  static async updateEndpoint(projectId: string, endpointId: string, data: Partial<CreateEndpointData>): Promise<Endpoint> {
    const res = await fetch(`/api/projects/${projectId}/endpoints/${endpointId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: 'include'
    })
    if (!res.ok) throw new Error("Failed to update endpoint")
    return res.json()
  }

  static async deleteEndpoint(projectId: string, endpointId: string): Promise<void> {
    const res = await fetch(`/api/projects/${projectId}/endpoints/${endpointId}`, {
      method: "DELETE",
      credentials: 'include'
    })
    if (!res.ok) throw new Error("Failed to delete endpoint")
  }

  static async updateEndpointParameters(projectId: string, endpointId: string, parameters: any[]): Promise<void> {
    const res = await fetch(`/api/projects/${projectId}/endpoints/${endpointId}/parameters`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parameters }),
      credentials: 'include'
    })
    if (!res.ok) throw new Error("Failed to update parameters")
  }

  static async updateEndpointBody(projectId: string, endpointId: string, body: any): Promise<void> {
    const res = await fetch(`/api/projects/${projectId}/endpoints/${endpointId}/body`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: 'include'
    })
    if (!res.ok) throw new Error("Failed to update body")
  }

  static async updateEndpointResponses(projectId: string, endpointId: string, responses: any[]): Promise<void> {
    const res = await fetch(`/api/projects/${projectId}/endpoints/${endpointId}/responses`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ responses }),
      credentials: 'include'
    })
    if (!res.ok) throw new Error("Failed to update responses")
  }
}