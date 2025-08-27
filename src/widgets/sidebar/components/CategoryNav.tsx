"use client"

import { 
  Settings,
  Folder as FolderIcon, 
  Variables as VariablesIcon, 
  History as HistoryIcon, 
  Members as MembersIcon, 
  Share as ShareIcon 
} from "@/shared/ui/icons"
import { CategoryType, SidebarCategory } from "../types"

interface CategoryNavProps {
  selectedCategory: CategoryType
  onCategorySelect: (category: CategoryType) => void
  onShareClick: () => void
}

const categories: SidebarCategory[] = [
  { key: "apis", label: "APIs", icon: <FolderIcon size={18} /> },
  { key: "variables", label: "Variables", icon: <VariablesIcon size={18} /> },
  { key: "history", label: "History", icon: <HistoryIcon size={18} /> },
  { key: "settings", label: "Settings", icon: <Settings size={18} /> },
  { key: "members", label: "Members", icon: <MembersIcon size={18} /> }
]

export function CategoryNav({ selectedCategory, onCategorySelect, onShareClick }: CategoryNavProps) {
  return (
    <div className="w-[90px] bg-gray-50 flex flex-col">
      <div className="flex-1">
        {categories.map((category) => (
          <button
            key={category.key}
            onClick={() => onCategorySelect(category.key)}
            className={`w-full flex flex-col items-center gap-1 py-4 px-2 transition-colors ${
              selectedCategory === category.key
                ? "text-[#0064FF] bg-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {category.icon}
            <span className="text-[10px] font-medium">{category.label}</span>
          </button>
        ))}
      </div>
      <div className="border-t border-gray-200 space-y-1 py-2">
        <button
          onClick={onShareClick}
          className="w-full flex flex-col items-center gap-1 py-3 px-2 text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <ShareIcon size={18} />
          <span className="text-[10px] font-medium">Share</span>
        </button>
      </div>
    </div>
  )
}