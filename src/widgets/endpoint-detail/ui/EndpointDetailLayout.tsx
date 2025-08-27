'use client'

import { ReactNode } from 'react'

interface EndpointDetailLayoutProps {
  header: ReactNode
  sidebar?: ReactNode
  main: ReactNode
  footer?: ReactNode
  fullWidth?: boolean
}

export function EndpointDetailLayout({
  header,
  sidebar,
  main,
  footer,
  fullWidth = true
}: EndpointDetailLayoutProps) {
  return (
    <div className="h-full w-full flex flex-col bg-white">
      <div className="flex-shrink-0 border-b border-gray-100">
        {header}
      </div>
      
      <div className="flex-1 flex min-h-0 w-full">
        {sidebar && (
          <div className="w-[240px] flex-shrink-0 border-r border-gray-100 overflow-y-auto">
            {sidebar}
          </div>
        )}
        
        <div className="flex-1 flex min-w-0">
          {main}
        </div>
      </div>
      
      {footer && (
        <div className="flex-shrink-0 border-t border-gray-100">
          {footer}
        </div>
      )}
    </div>
  )
}