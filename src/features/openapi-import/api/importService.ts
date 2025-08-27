interface OpenAPIOperation {
  summary?: string
  description?: string
  operationId?: string
  tags?: string[]
  parameters?: any[]
  requestBody?: any
  responses?: any
}

interface OpenAPIPath {
  [method: string]: OpenAPIOperation
}

interface OpenAPISpec {
  openapi?: string
  swagger?: string
  info: {
    title: string
    version: string
    description?: string
  }
  servers?: Array<{
    url: string
    description?: string
  }>
  paths: {
    [path: string]: OpenAPIPath
  }
  components?: {
    schemas?: any
  }
}

interface ImportedEndpoint {
  name: string
  description?: string
  method: string
  path: string
  folderId?: string
  parameters?: Array<{
    name: string
    location: 'QUERY' | 'PATH' | 'HEADER' | 'COOKIE'
    required: boolean
    description?: string
    type?: string
    example?: string
  }>
  headers?: Array<{
    key: string
    value: string
    description?: string
  }>
  body?: {
    contentType: string
    example?: string
    schema?: any
  }
  responses?: Array<{
    statusCode: number
    description?: string
    contentType?: string
    example?: string
  }>
}

interface ImportedFolder {
  name: string
  description?: string
  endpoints: ImportedEndpoint[]
}

export class OpenAPIImportService {
  static parseOpenAPI(spec: OpenAPISpec): {
    folders: ImportedFolder[]
    uncategorizedEndpoints: ImportedEndpoint[]
  } {
    const folders: Map<string, ImportedFolder> = new Map()
    const uncategorizedEndpoints: ImportedEndpoint[] = []

    for (const [pathKey, pathValue] of Object.entries(spec.paths)) {
      for (const [method, operation] of Object.entries(pathValue)) {
        if (!['get', 'post', 'put', 'delete', 'patch', 'head', 'options'].includes(method.toLowerCase())) {
          continue
        }

        const endpoint = this.convertOperationToEndpoint(
          pathKey,
          method.toUpperCase(),
          operation,
          spec
        )

        const tags = operation.tags || []
        if (tags.length > 0) {
          const folderName = tags[0]
          if (!folders.has(folderName)) {
            folders.set(folderName, {
              name: folderName,
              description: `Endpoints from ${folderName} tag`,
              endpoints: []
            })
          }
          folders.get(folderName)!.endpoints.push(endpoint)
        } else {
          uncategorizedEndpoints.push(endpoint)
        }
      }
    }

    return {
      folders: Array.from(folders.values()),
      uncategorizedEndpoints
    }
  }

  private static convertOperationToEndpoint(
    path: string,
    method: string,
    operation: OpenAPIOperation,
    spec: OpenAPISpec
  ): ImportedEndpoint {
    const endpoint: ImportedEndpoint = {
      name: operation.summary || operation.operationId || `${method} ${path}`,
      description: operation.description,
      method,
      path,
      parameters: [],
      headers: [],
      responses: []
    }

    if (operation.parameters) {
      endpoint.parameters = operation.parameters.map((param: any) => ({
        name: param.name,
        location: param.in?.toUpperCase() as any || 'QUERY',
        required: param.required || false,
        description: param.description,
        type: param.schema?.type || 'string',
        example: param.example || param.schema?.example
      }))
    }

    if (operation.requestBody) {
      const content = operation.requestBody.content
      if (content) {
        const contentType = Object.keys(content)[0]
        const schema = content[contentType]?.schema
        
        endpoint.body = {
          contentType,
          schema,
          example: this.generateExampleFromSchema(schema, spec.components?.schemas)
        }
      }
    }

    if (operation.responses) {
      endpoint.responses = Object.entries(operation.responses).map(([statusCode, response]: [string, any]) => ({
        statusCode: parseInt(statusCode),
        description: response.description,
        contentType: response.content ? Object.keys(response.content)[0] : undefined,
        example: response.content ? this.generateExampleFromSchema(
          response.content[Object.keys(response.content)[0]]?.schema,
          spec.components?.schemas
        ) : undefined
      }))
    }

    return endpoint
  }

  private static generateExampleFromSchema(schema: any, components?: any): string | undefined {
    if (!schema) return undefined

    try {
      const example = this.generateExample(schema, components, new Set())
      return JSON.stringify(example, null, 2)
    } catch {
      return undefined
    }
  }

  private static generateExample(schema: any, components?: any, visited = new Set()): any {
    if (!schema) return null

    if (schema.$ref) {
      const refPath = schema.$ref.replace('#/components/schemas/', '')
      if (visited.has(refPath) || !components?.[refPath]) {
        return {}
      }
      visited.add(refPath)
      return this.generateExample(components[refPath], components, visited)
    }

    if (schema.example !== undefined) {
      return schema.example
    }

    switch (schema.type) {
      case 'string':
        return schema.enum ? schema.enum[0] : 'string'
      case 'number':
      case 'integer':
        return schema.enum ? schema.enum[0] : 0
      case 'boolean':
        return true
      case 'array':
        return schema.items ? [this.generateExample(schema.items, components, visited)] : []
      case 'object':
        const obj: any = {}
        if (schema.properties) {
          Object.entries(schema.properties).forEach(([key, prop]: [string, any]) => {
            obj[key] = this.generateExample(prop, components, visited)
          })
        }
        return obj
      default:
        return null
    }
  }

  static async importToProject(
    projectId: string,
    folders: ImportedFolder[],
    uncategorizedEndpoints: ImportedEndpoint[]
  ): Promise<void> {
    const importPromises: Promise<any>[] = []

    for (const folder of folders) {
      const folderPromise = fetch(`/api/projects/${projectId}/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: folder.name,
          description: folder.description
        })
      })
      .then(res => res.json())
      .then(createdFolder => {
        const endpointPromises = folder.endpoints.map(endpoint =>
          this.createEndpoint(projectId, { ...endpoint, folderId: createdFolder.id })
        )
        return Promise.all(endpointPromises)
      })

      importPromises.push(folderPromise)
    }

    for (const endpoint of uncategorizedEndpoints) {
      importPromises.push(this.createEndpoint(projectId, endpoint))
    }

    await Promise.all(importPromises)
  }

  private static async createEndpoint(projectId: string, endpoint: ImportedEndpoint): Promise<any> {
    const endpointResponse = await fetch(`/api/projects/${projectId}/endpoints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name: endpoint.name,
        description: endpoint.description,
        method: endpoint.method,
        path: endpoint.path,
        folderId: endpoint.folderId
      })
    })

    if (!endpointResponse.ok) {
      throw new Error(`Failed to create endpoint: ${endpoint.name}`)
    }

    const createdEndpoint = await endpointResponse.json()

    const additionalPromises: Promise<any>[] = []

    if (endpoint.parameters && endpoint.parameters.length > 0) {
      const parametersPromise = Promise.all(
        endpoint.parameters.map(param =>
          fetch(`/api/endpoints/${createdEndpoint.id}/parameters`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(param)
          })
        )
      )
      additionalPromises.push(parametersPromise)
    }

    if (endpoint.headers && endpoint.headers.length > 0) {
      const headersPromise = Promise.all(
        endpoint.headers.map(header =>
          fetch(`/api/endpoints/${createdEndpoint.id}/headers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(header)
          })
        )
      )
      additionalPromises.push(headersPromise)
    }

    if (endpoint.body) {
      const bodyPromise = fetch(`/api/endpoints/${createdEndpoint.id}/body`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(endpoint.body)
      })
      additionalPromises.push(bodyPromise)
    }

    if (endpoint.responses && endpoint.responses.length > 0) {
      const responsesPromise = Promise.all(
        endpoint.responses.map(response =>
          fetch(`/api/endpoints/${createdEndpoint.id}/responses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(response)
          })
        )
      )
      additionalPromises.push(responsesPromise)
    }

    await Promise.all(additionalPromises)
    return createdEndpoint
  }
}