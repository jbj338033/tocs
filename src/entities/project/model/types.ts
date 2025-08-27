export interface Project {
  id: string
  name: string
  description: string | null
  slug: string
  isPublic: boolean
  servers?: Server[]
  createdAt: Date
  updatedAt: Date
  members: ProjectMember[]
}

export interface Server {
  name: string
  url: string
  description?: string
}

export interface ProjectMember {
  id: string
  userId: string
  projectId: string
  role: MemberRole
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
  createdAt: Date
}

export enum MemberRole {
  OWNER = "OWNER",
  EDITOR = "EDITOR",
  VIEWER = "VIEWER"
}

export interface CreateProjectData {
  name: string
  description?: string
  isPublic?: boolean
  servers?: Server[]
}