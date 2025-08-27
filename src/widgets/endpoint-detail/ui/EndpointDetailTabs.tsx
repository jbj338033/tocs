'use client'

import { ReactNode } from 'react'

interface Tab {
  id: string
  label: string
  content: ReactNode
  badge?: ReactNode
}

interface EndpointDetailTabsProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  variant?: 'default' | 'compact'
}

export function EndpointDetailTabs({
  tabs,
  activeTab,
  onTabChange,
  variant = 'default'
}: EndpointDetailTabsProps) {
  const paddingClass = variant === 'compact' ? 'px-3' : 'px-4'
  const heightClass = variant === 'compact' ? 'py-1.5' : 'py-2'
  
  return (
    <div className="h-full flex flex-col">
      <div className={`flex items-center gap-6 ${paddingClass} border-b border-gray-100 bg-white flex-shrink-0`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              ${heightClass} text-[12px] font-medium relative flex items-center gap-1.5 transition-colors
              ${activeTab === tab.id 
                ? 'text-gray-900' 
                : 'text-gray-500 hover:text-gray-700'
              }
            `}
          >
            {tab.label}
            {tab.badge}
            {activeTab === tab.id && (
              <div className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-[#0064FF]" />
            )}
          </button>
        ))}
      </div>
      
      <div className="flex-1 min-h-0 overflow-hidden">
        {tabs.find(tab => tab.id === activeTab)?.content}
      </div>
    </div>
  )
}