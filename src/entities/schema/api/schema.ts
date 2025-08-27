import { Schema, CreateSchemaData, UpdateSchemaData } from "../model/types"

export class SchemaApi {
  static async getSchemas(projectId: string): Promise<Schema[]> {
    const res = await fetch(`/api/projects/${projectId}/schemas`, {
      credentials: 'include'
    })
    if (!res.ok) throw new Error("Failed to fetch schemas")
    return res.json()
  }

  static async getSchema(projectId: string, schemaId: string): Promise<Schema> {
    const res = await fetch(`/api/projects/${projectId}/schemas/${schemaId}`, {
      credentials: 'include'
    })
    if (!res.ok) throw new Error("Failed to fetch schema")
    return res.json()
  }

  static async createSchema(projectId: string, data: CreateSchemaData): Promise<Schema> {
    const res = await fetch(`/api/projects/${projectId}/schemas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error("Failed to create schema")
    return res.json()
  }

  static async updateSchema(projectId: string, schemaId: string, data: UpdateSchemaData): Promise<Schema> {
    const res = await fetch(`/api/projects/${projectId}/schemas/${schemaId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error("Failed to update schema")
    return res.json()
  }

  static async deleteSchema(projectId: string, schemaId: string): Promise<void> {
    const res = await fetch(`/api/projects/${projectId}/schemas/${schemaId}`, {
      method: 'DELETE',
      credentials: 'include'
    })
    if (!res.ok) throw new Error("Failed to delete schema")
  }
}