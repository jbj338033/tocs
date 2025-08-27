export class VariableApi {
  static async getVariables(projectId: string) {
    const response = await fetch(`/api/projects/${projectId}/variables`, {
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error(`Failed to get variables: ${response.statusText}`)
    }

    return response.json()
  }

  static async createVariable(projectId: string, data: { key: string; value: string }) {
    const response = await fetch(`/api/projects/${projectId}/variables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error(`Failed to create variable: ${response.statusText}`)
    }

    return response.json()
  }

  static async updateVariable(projectId: string, variableId: string, data: { key?: string; value?: string }) {
    const response = await fetch(`/api/projects/${projectId}/variables/${variableId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error(`Failed to update variable: ${response.statusText}`)
    }

    return response.json()
  }

  static async deleteVariable(projectId: string, variableId: string) {
    const response = await fetch(`/api/projects/${projectId}/variables/${variableId}`, {
      method: 'DELETE',
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error(`Failed to delete variable: ${response.statusText}`)
    }

    return response.json()
  }
}