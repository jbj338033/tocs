export interface Folder {
  id: string
  name: string
  description: string | null
  projectId: string
  parentId: string | null
  order: number
  createdAt: Date
  updatedAt: Date
  parent?: Folder
  children: Folder[]
  endpoints: Endpoint[]
}

export interface Endpoint {
  id: string
  name: string
  description: string | null
  type: EndpointType
  method: HttpMethod | null
  path: string
  projectId: string
  folderId: string | null
  order: number
  query?: string
  variables?: any
  wsUrl?: string
  wsProtocol?: string
  protoFile?: string
  serviceName?: string
  methodName?: string
  createdAt: Date
  updatedAt: Date
  headers: EndpointHeader[]
  parameters: EndpointParameter[]
  body?: EndpointBody
  responses: EndpointResponse[]
}

export interface EndpointHeader {
  id: string
  endpointId: string
  key: string
  value: string | null
  description: string | null
  required: boolean
}

export interface EndpointParameter {
  id: string
  endpointId: string
  name: string
  type: ParameterType
  location: ParameterLocation
  description: string | null
  required: boolean
  defaultValue: string | null
  example: string | null
}

export interface EndpointBody {
  id: string
  endpointId: string
  contentType: string
  schema: string | null
  example: string | null
  description: string | null
}

export interface EndpointResponse {
  id: string
  endpointId: string
  statusCode: number
  description: string | null
  contentType: string | null
  schema: string | null
  example: string | null
}

export enum HttpMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
  PATCH = "PATCH",
  HEAD = "HEAD",
  OPTIONS = "OPTIONS"
}

export enum EndpointType {
  HTTP = "HTTP",
  GRAPHQL = "GRAPHQL",
  WEBSOCKET = "WEBSOCKET",
  SOCKETIO = "SOCKETIO",
  GRPC = "GRPC",
  STOMP = "STOMP",
  MQTT = "MQTT",
  SSE = "SSE",
  OVERVIEW = "OVERVIEW"
}

export enum ParameterType {
  STRING = "STRING",
  INTEGER = "INTEGER",
  NUMBER = "NUMBER",
  BOOLEAN = "BOOLEAN",
  ARRAY = "ARRAY",
  OBJECT = "OBJECT"
}

export enum ParameterLocation {
  QUERY = "QUERY",
  PATH = "PATH",
  HEADER = "HEADER",
  COOKIE = "COOKIE"
}

export interface CreateFolderData {
  name: string
  description?: string
  parentId?: string
}

export interface CreateEndpointData {
  name: string
  description?: string
  type?: EndpointType
  method: HttpMethod
  path: string
  folderId?: string
  order?: number
}