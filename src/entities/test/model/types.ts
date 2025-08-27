export interface History {
  id: string
  endpointId: string
  userId: string
  method: string
  url: string
  headers?: Record<string, any>
  params?: Record<string, any>
  body?: string
  variables?: Record<string, any>
  status: number
  statusText: string
  responseTime: number
  responseSize: number
  responseHeaders?: Record<string, any>
  responseBody?: string
  createdAt: string
  user?: {
    name?: string
    email?: string
  }
  variable?: {
    id: string
    name: string
    color: string
  }
}