export class HistoryApi {
  static async getProjectHistories(projectId: string) {
    const response = await fetch(`/api/projects/${projectId}/histories`, {
      method: 'GET',
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error(`Failed to get project histories: ${response.statusText}`)
    }

    return response.json()
  }
  static async createHistory(projectId: string, endpointId: string, data: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    params?: Record<string, string>;
    body?: string;
    variables?: Record<string, string>;
    status: number;
    statusText: string;
    responseTime: number;
    responseSize: number;
    responseHeaders?: Record<string, string>;
    responseBody?: string;
  }) {
    const response = await fetch(`/api/projects/${projectId}/endpoints/${endpointId}/histories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error(`Failed to create history: ${response.statusText}`)
    }

    return response.json()
  }

  static async getHistories(projectId: string, endpointId: string) {
    const response = await fetch(`/api/projects/${projectId}/endpoints/${endpointId}/histories`, {
      method: 'GET',
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error(`Failed to get histories: ${response.statusText}`)
    }

    return response.json()
  }
}