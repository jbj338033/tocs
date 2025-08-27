"use client"

import { ChevronRight, Folder, File } from "@/shared/ui/icons"

interface BreadcrumbItem {
  id: string
  name: string
  type: 'project' | 'folder' | 'endpoint'
  parentId?: string | null
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  onItemClick?: (item: BreadcrumbItem) => void
  className?: string
}

export function Breadcrumb({ items, onItemClick, className = "" }: BreadcrumbProps) {
  if (items.length === 0) return null

  const getIcon = (type: string) => {
    switch (type) {
      case 'folder':
        return <Folder size={14} className="text-gray-500" />
      case 'endpoint':
        return <File size={14} className="text-gray-500" />
      default:
        return null
    }
  }

  return (
    <nav className={`flex items-center space-x-1 text-sm ${className}`}>
      <span className="text-gray-400">~/</span>
      
      {items.map((item, index) => (
        <div key={item.id} className="flex items-center">
          {index > 0 && (
            <ChevronRight size={12} className="text-gray-400 mx-1" />
          )}
          
          <button
            onClick={() => onItemClick?.(item)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
              index === items.length - 1
                ? 'text-gray-900 font-medium cursor-default'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            disabled={index === items.length - 1}
          >
            {getIcon(item.type)}
            <span className="truncate max-w-[150px]">{item.name}</span>
          </button>
        </div>
      ))}
    </nav>
  )
}


export function buildFolderBreadcrumb(
  folder: any,
  folders: any[],
  projectName: string
): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [
    {
      id: 'root',
      name: projectName,
      type: 'project'
    }
  ]

  if (!folder) return items

  
  const path: any[] = []
  let current = folder
  
  
  while (current) {
    path.unshift(current)
    current = current.parentId ? 
      folders.find(f => f.id === current.parentId) : null
  }

  
  path.forEach(fld => {
    items.push({
      id: fld.id,
      name: fld.name,
      type: 'folder',
      parentId: fld.parentId
    })
  })

  return items
}


export function buildEndpointBreadcrumb(
  endpoint: any,
  folders: any[],
  projectName: string
): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = []
  
  if (endpoint.folderId) {
    const folder = folders.find(f => f.id === endpoint.folderId)
    if (folder) {
      
      items.push(...buildFolderBreadcrumb(folder, folders, projectName))
    }
  } else {
    
    items.push({
      id: 'root',
      name: projectName,
      type: 'project'
    })
  }

  
  items.push({
    id: endpoint.id,
    name: endpoint.name,
    type: 'endpoint'
  })

  return items
}