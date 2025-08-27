import { Folder, CreateFolderData } from "../model/types"

export class FolderApi {
  static async getFolders(projectId: string): Promise<Folder[]> {
    const res = await fetch(`/api/projects/${projectId}/folders`, {
      credentials: 'include'
    })
    if (!res.ok) throw new Error("Failed to fetch folders")
    return res.json()
  }

  static async createFolder(projectId: string, data: CreateFolderData): Promise<Folder> {
    const res = await fetch(`/api/projects/${projectId}/folders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: 'include'
    })
    if (!res.ok) throw new Error("Failed to create folder")
    return res.json()
  }

  static async updateFolder(folderId: string, data: Partial<CreateFolderData>): Promise<Folder> {
    const res = await fetch(`/api/folders/${folderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: 'include'
    })
    if (!res.ok) throw new Error("Failed to update folder")
    return res.json()
  }

  static async deleteFolder(folderId: string): Promise<void> {
    const res = await fetch(`/api/folders/${folderId}`, {
      method: "DELETE",
      credentials: 'include'
    })
    if (!res.ok) throw new Error("Failed to delete folder")
  }
}