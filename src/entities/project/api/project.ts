import { Project, CreateProjectData } from "../model/types"

export class ProjectApi {
  static async getProjects(): Promise<Project[]> {
    const res = await fetch("/api/projects", {
      credentials: 'include'
    })
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
      console.error("Failed to fetch projects:", error)
      throw new Error(error.error || `Failed to fetch projects: ${res.status}`)
    }
    
    return res.json()
  }

  static async getProject(id: string): Promise<Project> {
    const res = await fetch(`/api/projects/${id}`, {
      credentials: 'include'
    })
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
      console.error("Failed to fetch project:", error)
      throw new Error(error.error || `Failed to fetch project: ${res.status}`)
    }
    
    return res.json()
  }

  static async createProject(data: CreateProjectData): Promise<Project> {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: 'include'
    })
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
      console.error("Failed to create project:", error)
      throw new Error(error.error || `Failed to create project: ${res.status}`)
    }
    
    return res.json()
  }

  static async updateProject(id: string, data: Partial<CreateProjectData>): Promise<Project> {
    const res = await fetch(`/api/projects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: 'include'
    })
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
      console.error("Failed to update project:", error)
      throw new Error(error.error || `Failed to update project: ${res.status}`)
    }
    
    return res.json()
  }

  static async deleteProject(id: string): Promise<void> {
    const res = await fetch(`/api/projects/${id}`, {
      method: "DELETE",
      credentials: 'include'
    })
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
      console.error("Failed to delete project:", error)
      throw new Error(error.error || `Failed to delete project: ${res.status}`)
    }
  }
}