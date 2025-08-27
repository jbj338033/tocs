'use client'

import { ReactNode } from 'react'

interface EndpointDetailHeaderProps {
  protocol: ReactNode
  url: ReactNode
  actions?: ReactNode
  compact?: boolean
}

export function EndpointDetailHeader({
  protocol,
  url,
  actions,
  compact = false
}: EndpointDetailHeaderProps) {
  return (
    <div className={`flex items-center gap-3 ${compact ? 'px-3 py-2' : 'px-4 py-3'}`}>
      <div className="flex-shrink-0">
        {protocol}
      </div>
      
      <div className="flex-1 min-w-0">
        {url}
      </div>
      
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  )
}