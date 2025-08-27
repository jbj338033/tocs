export type CategoryType = "apis" | "variables" | "history" | "settings" | "members"

export interface SidebarCategory {
  key: CategoryType
  label: string
  icon: React.ReactNode
}

export interface SidebarProps {
  projects: any[]
  currentProjectId?: string
  activeEndpointId?: string
  onProjectSelect: (projectId: string) => void
  onCreateProject: () => void
  onEndpointSelect?: (endpointId: string) => void
  onCreateEndpoint?: (endpoint: any) => void
  user?: { name?: string | null; email?: string | null; image?: string | null }
}