export interface Schema {
  id: string
  name: string
  description?: string
  projectId: string
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'enum'
  properties?: Record<string, SchemaProperty>
  required?: string[]
  items?: SchemaProperty
  enum?: any[]
  createdAt: Date
  updatedAt: Date
}

export interface SchemaProperty {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'enum' | 'ref'
  description?: string
  properties?: Record<string, SchemaProperty>
  required?: string[]
  items?: SchemaProperty
  enum?: any[]
  example?: any
  default?: any
  $ref?: string
}

export interface CreateSchemaData {
  name: string
  description?: string
  type: Schema['type']
  properties?: Record<string, SchemaProperty>
  required?: string[]
  items?: SchemaProperty
  enum?: any[]
}

export interface UpdateSchemaData extends Partial<CreateSchemaData> {}